/**
 * Asserts a generated README carries what this tool promises, against a real
 * repository rather than a fixture.
 *
 * `.github/workflows/integration-test.yml` runs the action over third-party
 * repositories. Until this script existed those runs only checked that a
 * `<!-- start` marker, a heading and the string `uses:` were present somewhere
 * in the file — a run that emitted an empty inputs table, dropped half the
 * action's inputs from the usage block, or wrote the wrong description passed
 * all the same.
 *
 * What this asserts, all of it derived from the target's own `action.yml` so a
 * dropped or mangled entry fails here rather than going unnoticed:
 *
 *   1. every declared input reaches the usage block, inside a fenced yaml
 *      `with:` mapping, under a resolved `uses: owner/repo@version` line;
 *   2. every input that declares a default has that default carried into the
 *      usage block as a `# Default:` comment;
 *   3. the inputs table carries a row per input whose description, default and
 *      required flag match `action.yml`;
 *   4. the outputs table carries a row per output whose description matches;
 *   5. the title, description and branding sections are non-empty.
 *
 * Deliberately NOT asserted:
 *
 * - **Table formatting / column padding.** Padding comes from prettier, not
 *   from this tool's own logic, and a third-party README may already be
 *   prettier-formatted by its own tooling. Asserting padding here would
 *   conflate "our formatter ran" with "their file was already formatted", so it
 *   tests nothing about this tool. The `pretty` toggle is covered instead in
 *   `__tests__/integration-readme-contract.test.ts`, against a fixture whose
 *   starting content is known.
 * - **That the README changed at all.** A target whose README is already
 *   up to date should come out byte-identical; a difference is not a success
 *   signal. The workflow asserts idempotency instead — a second run changes
 *   nothing.
 *
 * A section whose markers are absent from the target README is skipped, not
 * failed: third-party repositories choose which sections they opt into.
 *
 * Usage: node scripts/verify-readme-contract.mjs <action.yml> <README.md>
 *
 * Exits non-zero when any check fails, printing each failure as a workflow
 * error annotation.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as markdown from 'prettier/plugins/markdown';
import * as yamlPlugin from 'prettier/plugins/yaml';
import { format } from 'prettier/standalone';
import YAML from 'yaml';

const [actionPath, readmePath] = process.argv.slice(2);

if (!actionPath || !readmePath) {
  console.log('usage: node scripts/verify-readme-contract.mjs <action.yml> <README.md>');
  process.exit(2);
}

const action = YAML.parse(fs.readFileSync(actionPath, 'utf8')) ?? {};
const readme = fs.readFileSync(readmePath, 'utf8');
const configPath = path.resolve('.ghadocs.json');
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};

const failures = [];
const ok = (message) => console.log(`✓ ${message}`);
const skip = (message) => console.log(`::notice::${message}`);
const fail = (message) => {
  failures.push(message);
  console.log(`::error::${message}`);
};

/**
 * Content between a section's start and end markers, or null when absent.
 *
 * Mirrors `startTokenFormat` / `endTokenFormat` in `src/readme-editor.ts`,
 * including the `(^|[^\`\\])` guard, which is what stops a marker quoted inside
 * backticks or escaped with a backslash from being mistaken for a real one. A
 * README that documents the markers themselves carries several such decoys —
 * this repository's own does, both in a fenced example and in the generated
 * inputs table — and matching them reports a real section as empty.
 *
 * The last surviving start marker is paired with the first end marker after it,
 * following the editor's use of `lastIndexOfRegex` for the start token.
 */
const guard = '(^|[^`\\\\])';
const section = (name) => {
  const starts = [...readme.matchAll(new RegExp(`${guard}<!--\\s+start\\s+${name}\\s+-->`, 'g'))];
  if (starts.length === 0) return null;
  const last = starts.at(-1);
  const from = last.index + last[0].length;
  const end = new RegExp(`${guard}<!--\\s+end\\s+${name}\\s+-->`).exec(readme.slice(from));
  return end ? readme.slice(from, from + end.index).trim() : null;
};

/**
 * Reduces a table cell and an `action.yml` value to a comparable form.
 *
 * `src/sections/update-inputs.ts` and `src/helpers.ts` rewrite a description on
 * the way into a cell: newlines become `<br />`, backticks become `<code>`,
 * pipes are backslash-escaped, and the key is wrapped in `<b><code>`. Rather
 * than reproduce that pipeline in reverse, both sides are stripped to their
 * text content and their whitespace collapsed.
 */

/**
 * Removes markup tags, repeating until the string stops changing.
 *
 * A single pass is not enough: removing an inner tag can splice its
 * neighbours into a new one, so `<co<b></b>de>` would survive one pass as
 * `<code>`. Iterating to a fixed point is what makes the result independent of
 * how the input was nested. Comment markers are left alone — `<!--` does not
 * match, and descriptions that quote `<!-- start title -->` have to keep it to
 * compare against action.yml.
 * @param {string} input - Text that may contain markup tags.
 * @returns {string} The text with all tags removed.
 */
const stripTags = (input) => {
  let current = input;
  let previous;
  do {
    previous = current;
    current = current.replaceAll(/<\/?[a-z][a-z0-9]*\s*\/?>/gi, '');
  } while (current !== previous);
  return current;
};

const normalise = (value) =>
  stripTags(String(value ?? '').replaceAll(/<br\s*\/?>/gi, ' '))
    // src/markdowner/index.ts escapes `><!--` to `>\<!--` so a marker quoted
    // inside a table cell is not mistaken for a real section marker.
    .replaceAll('\\<', '<')
    .replaceAll('**', '')
    .replaceAll('`', '')
    .replaceAll(/\s+/g, ' ')
    .trim();

/** Decodes the escaping applied by markdownEscapeTableCell. */
const normaliseTableCell = (value) =>
	normalise(value).replaceAll(/(\\+)\|/g, (_match, slashes) =>
		`${'\\'.repeat(Math.floor(slashes.length / 2))}|`,
	);

/** Applies the same optional Markdown formatting as the generated README. */
const generatedMarkdown = async (value) => {
	const source = String(value ?? '');
	const rendered = config.prettier ?? true
		? await format(source, { parser: 'markdown', embeddedLanguageFormatting: 'auto', plugins: [markdown, yamlPlugin] })
		: source;
	return rendered.replaceAll('\r\n', '\n').trim();
};

const normaliseGeneratedMarkdown = async (value) => normalise(await generatedMarkdown(value));
const normaliseGeneratedTableCell = async (value) => normaliseTableCell(await generatedMarkdown(value));

/**
 * `update-inputs.ts` truncates a description at its first blank line, so only
 * the leading paragraph is guaranteed to reach the table. Comparing on that
 * paragraph holds whether or not the YAML style preserved the blank line.
 */
const firstParagraph = (value) => String(value ?? '').split(/\n[ \t]*\n/)[0];

/** Splits a Markdown table row at pipes preceded by an even backslash count. */
const cells = (row) => {
  const source = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  const result = [];
  let cell = '';
  let backslashes = 0;
  for (const character of source) {
    if (character === '|' && backslashes % 2 === 0) {
      result.push(cell.trim());
      cell = '';
      backslashes = 0;
      continue;
    }
    cell += character;
    backslashes = character === '\\' ? backslashes + 1 : 0;
  }
  result.push(cell.trim());
  return result;
};

const inputs = action.inputs ?? {};
const outputs = action.outputs ?? {};
const inputKeys = Object.keys(inputs);
const outputKeys = Object.keys(outputs);

const usage = section('usage');
if (usage === null) {
  skip('no usage section markers in this README, skipping usage checks');
} else if (usage === '') {
  fail('the usage section is present but empty');
} else {
  // Everything below is checked against ONE parsed step, not against the
  // section as a whole.
  //
  // Searching the whole section only establishes that a fence, a `with:`, a
  // `uses:` and each input name exist *somewhere* in it. A section holding
  // three unrelated snippets — `uses:` in one, the inputs outside any `with:`
  // in another, a bare `with:` in a third — satisfies every one of those
  // independently while being unusable to anyone who copies it. `update-usage.ts`
  // emits exactly one fence, so requiring one is not a new constraint on the
  // generator; it is what makes these checks mean what they say.
  const fences = [...usage.matchAll(/^```ya?ml\n([\s\S]*?)^```/gm)].map((match) => match[1]);

  if (fences.length === 1) {
    ok('the usage block is a single fenced yaml code block');
  } else if (fences.length === 0) {
    fail('the usage block is not a fenced yaml code block');
  } else {
    fail(`the usage block holds ${fences.length} yaml fences, expected exactly one`);
  }

  const fence = fences.length === 1 ? fences[0] : null;

  let step = null;
  if (fence !== null) {
    try {
      const parsed = YAML.parse(fence);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      step =
        candidates.find(
          (entry) => entry !== null && typeof entry === 'object' && 'uses' in entry,
        ) ?? null;
    } catch (error) {
      fail(`the usage block is not parseable yaml: ${error.message}`);
    }
    if (step === null) {
      fail('the usage block carries no step with a `uses:` key');
    }
  }

  // Anchored to the parsed step's own value. Several inputs quote
  // `uses: owner/repo@ref` inside their descriptions, which the generator folds
  // into the usage block as `#` comments — a textual match would accept one of
  // those as proof the version was resolved.
  const uses = step === null ? null : /^(\S+\/\S+)@(\S+)$/.exec(String(step.uses).trim());
  if (uses) {
    ok(`the usage block pins a version: ${uses[1]}@${uses[2]}`);
  } else if (step !== null) {
    fail(`the step's \`uses:\` is not \`owner/repo@version\`: ${JSON.stringify(step.uses)}`);
  }

  const withMapping =
    step !== null && step.with !== null && typeof step.with === 'object' && !Array.isArray(step.with)
      ? step.with
      : null;

  if (step === null) {
    skip('no parsed step, skipping the `with:` and input checks');
  } else if (withMapping === null && inputKeys.length > 0) {
    fail('the usage step declares inputs but carries no `with:` mapping');
  } else {
    const present = new Set(Object.keys(withMapping ?? {}).map((key) => String(key)));
    const declared = new Set(inputKeys);
    const missing = inputKeys.filter((key) => !present.has(key));
    const stale = [...present].filter((key) => !declared.has(key));
    if (missing.length > 0 || stale.length > 0) {
      fail(`the usage step's \`with:\` keys do not match action.yml — missing: ${missing.join(', ') || 'none'}; stale: ${stale.join(', ') || 'none'}`);
    } else {
      ok(`the usage step exactly projects all ${inputKeys.length} action.yml inputs`);
    }
  }

  // Each declared default has to survive into the guide, or a user copying the
  // block loses the information action.yml carried.
  //
  // Matched against the input's OWN comment block rather than the whole usage
  // section. Searching the section would let one `# Default: true` satisfy every
  // input that defaults to true, so a missing comment would pass unnoticed
  // whenever two inputs share a default value.
  // The fence, not the section: a `# Default:` comment sitting in prose or in a
  // second snippet is not something a copier of the step would get.
  const usageLines = (fence ?? '').split('\n');
  const commentBlockFor = (key) => {
    const at = usageLines.findIndex((line) => new RegExp(`^\\s*${key}:`).test(line));
    if (at === -1) return '';
    const block = [];
    for (let index = at - 1; index >= 0; index -= 1) {
      if (!/^\s*#/.test(usageLines[index])) break;
      block.unshift(usageLines[index]);
    }
    return block.join('\n');
  };

  /**
   * The value carried by the input's own `# Default:` comment, or null when it
   * has none. `update-usage.ts` emits it as a single unwrapped line, so the
   * value is the remainder of that line.
   *
   * Read out and compared exactly rather than substring-searched: a declared
   * default of `1` is a prefix of a mangled `10`, so containment accepts the
   * mismatch it exists to catch. Same reasoning as the table cells above — this
   * path was left on `includes` when those moved to equality.
   */
  const usageDefaultFor = (key) => {
    const line = commentBlockFor(key)
      .split('\n')
      .find((candidate) => /^\s*#\s*Default:/.test(candidate));
    return line === undefined ? null : normalise(line.replace(/^\s*#\s*Default:/, ''));
  };

  const defaulted = inputKeys.filter((key) => inputs[key]?.default !== undefined);
  const droppedDefaults = defaulted.filter(
    (key) => usageDefaultFor(key) !== normalise(inputs[key].default),
  );
  if (defaulted.length === 0) {
    skip('no action.yml input declares a default, skipping the usage default check');
  } else if (droppedDefaults.length > 0) {
    fail(`defaults missing from the usage block: ${droppedDefaults.join(', ')}`);
  } else {
    ok(`all ${defaulted.length} declared defaults reach the usage block`);
  }
}

/**
 * A table section that exists must carry one row per declared key, and each
 * row's cells must match `action.yml` — not merely mention the key.
 * @param {string} name - Section name, `inputs` or `outputs`.
 * @param {object} declared - The `action.yml` mapping for that section.
 * @param {Function} expectedCells - Maps a declaration to the cells to check,
 * as `[{ label, expected }]`. A null `expected` means "not asserted".
 */
const tableSection = async (name, declared, expectedCells) => {
  const body = section(name);
  const keys = Object.keys(declared);
  if (body === null) {
    skip(`no ${name} section markers in this README, skipping`);
    return;
  }
  if (keys.length === 0) {
    const tableRows = body.split('\n').filter((line) => line.trim().startsWith('|'));
    const isEmptyTable =
		tableRows.length === 0 ||
		(tableRows.length === 2 && cells(tableRows[1]).every((cell) => /^:?-{3,}:?$/.test(cell)));
    if (isEmptyTable) ok(`the ${name} section has no stale rows`);
    else fail(`action.yml declares no ${name}, but the ${name} section still has data rows`);
    return;
  }
  const rows = body.split('\n').filter((line) => line.trim().startsWith('|'));
  if (rows.length < 3) {
    fail(
      `the ${name} table has ${rows.length} row(s); expected a header, a delimiter and at least one entry`,
    );
    return;
  }

  const rowKeys = rows.slice(2).map((row) => normaliseTableCell(cells(row)[0]));
  const stale = rowKeys.filter((key) => !keys.includes(key));
  const duplicates = rowKeys.filter((key, index) => rowKeys.indexOf(key) !== index);
  if (stale.length > 0 || duplicates.length > 0 || rowKeys.length !== keys.length) {
    fail(`the ${name} table rows do not exactly match action.yml — stale: ${[...new Set(stale)].join(', ') || 'none'}; duplicates: ${[...new Set(duplicates)].join(', ') || 'none'}`);
  }

  let matched = 0;
  for (const key of keys) {
    const row = rows.find((candidate) => normaliseTableCell(cells(candidate)[0]) === key);
    if (!row) {
      fail(`the ${name} table has no row for the declared ${name.slice(0, -1)} \`${key}\``);
      continue;
    }
    const cellValues = cells(row);
    let rowOk = true;
    for (const [index, { label, expected, markdown: isMarkdown }] of expectedCells(declared[key]).entries()) {
      if (expected === null) continue;
      const actual = isMarkdown
		? await normaliseGeneratedTableCell(cellValues[index + 1])
		: normaliseTableCell(cellValues[index + 1]);
      const want = isMarkdown ? await normaliseGeneratedMarkdown(expected) : normalise(expected);
      if (actual !== want) {
        fail(`\`${key}\` ${label} in the ${name} table does not match action.yml — want ${JSON.stringify(want)}, got ${JSON.stringify(actual)}`);
        rowOk = false;
      }
    }
    if (rowOk) matched += 1;
  }
  if (matched === keys.length) {
    ok(`all ${keys.length} ${name} rows match action.yml (description, default, required)`);
  }
};

// Columns per src/sections/update-inputs.ts: Input | Description | Default | Required
await tableSection('inputs', inputs, (declaration) => [
  { label: 'description', expected: firstParagraph(declaration?.description), markdown: true },
  {
    label: 'default',
    // An empty-string default is indistinguishable from no default once it is
    // in a table cell, so it is not asserted. `false` and `0` are.
    expected:
      declaration?.default === undefined || declaration.default === ''
        ? null
        : declaration.default,
  },
  { label: 'required flag', expected: declaration?.required ? 'true' : 'false' },
]);

// Columns per src/sections/update-outputs.ts: Output | Description | Value
await tableSection('outputs', outputs, (declaration) => [
  { label: 'description', expected: firstParagraph(declaration?.description), markdown: true },
]);

/**
 * `src/constants.ts`. `Action.ts` assigns `this.branding` as an object literal
 * whose members fall back to these, so a target that declares no branding still
 * has branding by the time any updater sees it. Duplicated rather than imported
 * because this script is plain `.mjs` run against a checkout of any target.
 */
const DEFAULT_BRAND_ICON = 'activity';
const DEFAULT_BRAND_COLOR = 'blue';

/**
 * The metadata sections, checked against `action.yml` rather than for mere
 * presence. A target whose README already holds generated sections keeps them
 * verbatim if an updater stops running, so "non-empty" passes on stale content
 * — the failure this gate exists to catch.
 *
 * Each section declares how its body is compared, because the three are
 * templated differently:
 *
 * - `title` is `# {brand}{prefix}{name}` — every configurable part precedes the
 *   name, so the name is what the body must END with. Containment accepted a
 *   stale `# Release Action Legacy` for an action since renamed `Release
 *   Action`, which no templating can produce.
 * - `description` is the whole description with paragraph breaks turned into
 *   `<br />`, so it is compared entire. Comparing the first paragraph passed a
 *   section holding only that paragraph — for a multi-paragraph description,
 *   precisely the stale state this gate is for. (`firstParagraph` is still
 *   right for the tables, where `update-inputs.ts` really does truncate.)
 * - `branding` wraps its icon and colour in an `<img>` whose src and width are
 *   configurable, so those two values are matched by containment. They are
 *   never absent: an omitted `branding:` block is projected as the defaults
 *   above, so there is nothing to skip.
 */
const titlePrefix = String(config.title_prefix ?? 'GitHub Action: ');
const titleBranding = config.branding_as_title_prefix ?? true;
const titleImage = titleBranding
	? `<img src="${config.branding_svg_path ?? '.github/ghadocs/branding.svg'}" width="60px" align="center" alt="branding<icon:${action.branding?.icon ?? DEFAULT_BRAND_ICON} color:${action.branding?.color ?? DEFAULT_BRAND_COLOR}>" /> `
	: '';
const expectedTitle = action.name ? `# ${titleImage}${titlePrefix}${action.name}` : null;
const normalisedExpectedTitle = expectedTitle ? await generatedMarkdown(expectedTitle) : null;
const expectedDescription = action.description
	? await normaliseGeneratedMarkdown(
			String(action.description).trim().replaceAll('\r\n', '\n').replaceAll(/ +/g, ' ').replaceAll(' \n', '\n').replaceAll('\n\n', '<br />'),
		)
	: null;

for (const name of ['title', 'description', 'branding']) {
  const body = section(name);
  if (body === null) {
    skip(`no ${name} section markers in this README, skipping`);
    continue;
  }
  // What the tool would project is decided BEFORE the section is judged empty,
  // so a target that declares no `name` or `description` is not failed for a
  // section the generator legitimately leaves alone. `branding` never lands
  // here: its expectations fall back to the defaults, so its list is never
  // empty and an empty branding section is always a failure.
  const hasExpectation = name === 'branding' || (name === 'title' ? expectedTitle : expectedDescription);
  if (!hasExpectation) {
    skip(`action.yml declares no ${name} metadata, so nothing is required in that section`);
    continue;
  }
  if (body === '') {
    fail(`the ${name} section is empty, but action.yml declares ${name} metadata to project`);
    continue;
  }
  const actual = name === 'title' ? await generatedMarkdown(body) : await normaliseGeneratedMarkdown(body);
  let matches;
  if (name === 'title') matches = actual === normalisedExpectedTitle;
  else if (name === 'description') matches = actual === expectedDescription;
  else {
    const match = /<img src="([^"]+)"[^>]*alt="branding<icon:([^ ]+) color:([^>]+)>"/.exec(body);
    matches = match?.[1] === (config.branding_svg_path ?? '.github/ghadocs/branding.svg') && match?.[2] === (action.branding?.icon ?? DEFAULT_BRAND_ICON) && match?.[3] === (action.branding?.color ?? DEFAULT_BRAND_COLOR);
  }
  if (matches) {
    ok(`the ${name} section carries the action's ${name} from action.yml`);
  } else {
    fail(`the ${name} section does not exactly project action.yml; section reads ${JSON.stringify(actual)}`);
  }
}

if (failures.length > 0) {
  console.log(`\n${failures.length} contract check(s) failed`);
  process.exit(1);
}
console.log('\nAll contract checks passed');
