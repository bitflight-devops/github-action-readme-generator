/**
 * Asserts a generated README carries what this tool promises, against a real
 * repository rather than a fixture.
 *
 * `.github/workflows/integration-test.yml` runs the action over third-party
 * repositories. These checks validate the exact generated projection against
 * the target's own `action.yml`:
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
 * A section whose markers were absent before generation is skipped: third-party
 * repositories choose which sections they opt into. Every original marker pair
 * must remain present after generation.
 *
 * Usage: node scripts/verify-readme-contract.mjs <action.yml> <README.md> [original-README.md]
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

const [actionPath, readmePath, originalReadmePath] = process.argv.slice(2);

if (!actionPath || !readmePath) {
  console.log(
    'usage: node scripts/verify-readme-contract.mjs <action.yml> <README.md> [original-README.md]',
  );
  process.exit(2);
}

const action = YAML.parse(fs.readFileSync(actionPath, 'utf8')) ?? {};
const readme = fs.readFileSync(readmePath, 'utf8');
const originalReadme = originalReadmePath ? fs.readFileSync(originalReadmePath, 'utf8') : null;
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
const sectionFrom = (source, name) => {
  const starts = [...source.matchAll(new RegExp(`${guard}<!--\\s+start\\s+${name}\\s+-->`, 'g'))];
  if (starts.length === 0) return null;
  const last = starts.at(-1);
  const from = last.index + last[0].length;
  const ends = [
    ...source.slice(from).matchAll(new RegExp(`${guard}<!--\\s+end\\s+${name}\\s+-->`, 'g')),
  ];
  const end = ends.at(-1);
  return end ? source.slice(from, from + end.index).trim() : null;
};

const section = (name) => sectionFrom(readme, name);

if (originalReadme !== null) {
  const generatedSections = [
    'title',
    'branding',
    'description',
    'usage',
    'inputs',
    'outputs',
    'contents',
    'badges',
  ];
  for (const name of generatedSections) {
    if (sectionFrom(originalReadme, name) !== null && section(name) === null) {
      fail(`the generated README removed the original ${name} section marker pair`);
    }
  }
}

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

/** Applies the same transforms as markdowner's table-cell projection. */
const generatedTableCell = async (value) =>
	generatedMarkdown(
		String(value ?? '')
			.trim()
			.replaceAll('\n', '<br />')
			.replaceAll(/\\+(?=\|)/g, (slashes) => slashes.repeat(2))
			.replaceAll('|', '\\|')
			.replaceAll(/`([^`]*)`/g, '<code>$1</code>')
			.replaceAll('><!--', '>\\<!--'),
	);

/**
 * `update-inputs.ts` truncates a description at its first blank line, so only
 * the leading paragraph is guaranteed to reach the table. Comparing on that
 * paragraph holds whether or not the YAML style preserved the blank line. The
 * trim-before-split order mirrors both table updaters.
 */
const firstParagraph = (value) => String(value ?? '').trim().split('\n\n')[0];

/** Mirrors `rowHeader` in `src/helpers.ts`. */
const generatedRowHeader = (value) => {
  const source = String(value ?? '');
  if (!source) return '';
  const text = source
    .replaceAll(/\*\*(.*?)\*\*/g, '$1')
    .replaceAll(/\*(.*?)\*/g, '$1')
    .replaceAll(/~~(.*?)~~/g, '$1')
    .trim();
  return `<b><code>${text}</code></b>`;
};

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
      if (!Array.isArray(parsed) || parsed.length !== 1) {
        fail('the usage block must contain exactly one generated step');
      } else {
        const candidate = parsed[0];
        step =
          candidate !== null && typeof candidate === 'object' && 'uses' in candidate
            ? candidate
            : null;
      }
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

    // Generated usage is a copyable template; every declared input value is
    // exactly the empty string.
    const valued = Object.entries(withMapping ?? {}).filter(([, value]) => value !== '');
    if (valued.length > 0) {
      fail(`the usage step carries values the generator does not emit — ${valued.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')}`);
    } else if (inputKeys.length > 0) {
      ok('every usage value is the empty placeholder the generator emits');
    }
  }

  // Compare each input's complete generated comment block in its own step.
  // Section-wide containment lets one description/default satisfy another,
  // while checking defaults only when currently declared admits stale comments
  // after a declaration is removed.
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

  const commentBodies = (block) =>
    block
      .split('\n')
      .map((line) => line.replace(/^\s*# ?/, ''))
      .join('\n');

  const generatedUsageComments = async (declaration) => {
    const formatted = await format(`Description: ${declaration?.description}`, {
      semi: false,
      parser: 'markdown',
      proseWrap: 'always',
      plugins: [markdown, yamlPlugin],
    });
    const lines = formatted.split('\n');
    if (declaration?.default !== undefined) {
      const defaultLine = `Default: ${declaration.default}`;
      lines.push(config.prettier ?? true ? defaultLine.trimEnd() : defaultLine);
    }
    return lines.join('\n');
  };

  const staleUsageComments = [];
  for (const key of inputKeys) {
    if (commentBodies(commentBlockFor(key)) !== (await generatedUsageComments(inputs[key]))) {
      staleUsageComments.push(key);
    }
  }
  if (staleUsageComments.length > 0) {
    fail(`usage comments do not exactly project action.yml: ${staleUsageComments.join(', ')}`);
  } else {
    ok(`all ${inputKeys.length} input descriptions and defaults reach the usage block`);
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
  const expectedHeaders =
    name === 'inputs'
      ? ['**Input**', '**Description**', '**Default**', '**Required**']
      : ['**Output**', '**Description**', '**Value**'];
  if (body === null) {
    skip(`no ${name} section markers in this README, skipping`);
    return;
  }
  const tableRows = body.split('\n').filter((line) => line.trim().startsWith('|'));
  if (tableRows.length > 0) {
    const header = cells(tableRows[0]);
    const delimiter = tableRows.length > 1 ? cells(tableRows[1]) : [];
    const columnCount = expectedHeaders.length;
    const validHeader =
      header.length === columnCount && header.every((cell, index) => cell === expectedHeaders[index]);
    const validDelimiter =
      delimiter.length === columnCount && delimiter.every((cell) => /^-{3,}$/.test(cell));
    const validRowWidths = tableRows.slice(2).every((row) => cells(row).length === columnCount);
    if (!validHeader || !validDelimiter || !validRowWidths) {
      fail(`the ${name} table structure does not match the generated ${columnCount}-column header and delimiter`);
      return;
    }
  }
  if (keys.length === 0) {
    const isEmptyTable =
		tableRows.length === 0 ||
		(tableRows.length === 2 && cells(tableRows[1]).every((cell) => /^-{3,}$/.test(cell)));
    if (isEmptyTable) ok(`the ${name} section has no stale rows`);
    else fail(`action.yml declares no ${name}, but the ${name} section still has data rows`);
    return;
  }
  const rows = tableRows;
  if (rows.length < 3) {
    fail(
      `the ${name} table has ${rows.length} row(s); expected a header, a delimiter and at least one entry`,
    );
    return;
  }

  // Data rows only. A target may declare an input named `Input` or an output
  // named `Output`, and the header's `**Input**` normalises to exactly that —
  // so searching the whole table matches the header first and compares its
  // labels against the declaration, failing a correct README.
  const dataRows = rows.slice(2);
  const rowKeys = dataRows.map((row) => normaliseTableCell(cells(row)[0]));
  const stale = rowKeys.filter((key) => !keys.includes(key));
  const duplicates = rowKeys.filter((key, index) => rowKeys.indexOf(key) !== index);
  const inDeclarationOrder = rowKeys.length === keys.length && rowKeys.every((key, index) => key === keys[index]);
  if (stale.length > 0 || duplicates.length > 0 || !inDeclarationOrder) {
    fail(`the ${name} table rows do not exactly match action.yml — stale: ${[...new Set(stale)].join(', ') || 'none'}; duplicates: ${[...new Set(duplicates)].join(', ') || 'none'}; order: ${inDeclarationOrder ? 'correct' : `want ${keys.join(', ')}, got ${rowKeys.join(', ')}`}`);
  }

  let matched = 0;
  for (const key of keys) {
    const row = dataRows.find((candidate) => normaliseTableCell(cells(candidate)[0]) === key);
    if (!row) {
      fail(`the ${name} table has no row for the declared ${name.slice(0, -1)} \`${key}\``);
      continue;
    }
    const cellValues = cells(row);
    let rowOk = true;
    // The first column is generator-owned `rowHeader` markup; compare its
    // complete projection.
    const wantHeader = await generatedTableCell(generatedRowHeader(key));
    if ((await generatedMarkdown(cellValues[0])) !== wantHeader) {
      fail(`\`${key}\` is not wrapped as the generator writes it in the ${name} table — want ${JSON.stringify(wantHeader)}, got ${JSON.stringify(cellValues[0])}`);
      rowOk = false;
    }
    for (const [index, { label, expected, markdown: isMarkdown, code }] of expectedCells(declared[key]).entries()) {
      if (expected === null && !code) continue;
      const actual = isMarkdown || code
		? await generatedMarkdown(cellValues[index + 1])
		: normaliseTableCell(cellValues[index + 1]);
      const want = isMarkdown
		? await generatedTableCell(expected)
		: code === 'markdown'
			? await generatedTableCell(expected === null || expected === '' ? '' : `\`${expected}\``)
			: code === 'html'
				? await generatedTableCell(
						expected === null || expected === '' ? '' : `<code>${expected}</code>`,
					)
			: normalise(expected);
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
    expected: declaration?.default === undefined || declaration.default === '' ? '' : declaration.default,
    code: 'html',
  },
  // The generator emits the flag emphasised — `update-inputs.ts` writes
  // `**true**` and `__false__` — so compare against that form through the same
  // formatter the README went through. Comparing the bare word instead means
  // reading it back through `normalise`, which strips `**` but not `__`: with
  // `pretty` on prettier rewrites `__false__` to `**false**` and it matches by
  // luck, and with `pretty` off the marker survives and the gate fails a
  // correctly generated README. Matching the emphasised form also catches a
  // flag that lost its markers, which the bare word could not.
  {
    label: 'required flag',
    expected: declaration?.required ? '**true**' : '__false__',
    markdown: true,
  },
]);

// Columns per src/sections/update-outputs.ts: Output | Description | Value
await tableSection('outputs', outputs, (declaration) => [
  { label: 'description', expected: firstParagraph(declaration?.description), markdown: true },
  { label: 'value', expected: declaration?.value ?? '', code: 'markdown' },
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
 * - `branding` is one `<img>` tag with no free parts: `updateBranding` fixes
 *   the width at `15%` and the alignment at `center`, and only the `src` comes
 *   from config. So it is compared whole. Pinning just src, icon and colour
 *   passes a section whose width or alignment has been mangled — the same
 *   stale-projection state the gate exists to catch. Branding is never absent:
 *   an omitted `branding:` block is projected as the defaults above, so there
 *   is nothing to skip.
 */
/** `generateImgMarkup` in src/sections/update-branding.ts, verbatim. */
const brandingImage = (width) =>
	`<img src="${config.branding_svg_path ?? '.github/ghadocs/branding.svg'}" width="${width}" align="center" alt="branding<icon:${action.branding?.icon ?? DEFAULT_BRAND_ICON} color:${action.branding?.color ?? DEFAULT_BRAND_COLOR}>" />`;

const titlePrefix = String(config.title_prefix ?? 'GitHub Action: ');
const titleBranding = config.branding_as_title_prefix ?? true;
// The widths are the two literals their callers pass: `update-title.ts` asks
// for `60px`, `update-branding.ts` for `15%`.
const titleImage = titleBranding ? `${brandingImage('60px')} ` : '';
const expectedBranding = await generatedMarkdown(brandingImage('15%'));
const expectedTitle = action.name ? `# ${titleImage}${titlePrefix}${action.name}` : null;
const normalisedExpectedTitle = expectedTitle ? await generatedMarkdown(expectedTitle) : null;
const expectedDescription = action.description
	? await generatedMarkdown(
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
  const actual = await generatedMarkdown(body);
  let matches;
  if (name === 'title') matches = actual === normalisedExpectedTitle;
  else if (name === 'description') matches = actual === expectedDescription;
  else matches = actual === expectedBranding;
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
