/**
 * `src/prettier.ts` formats through `prettier/standalone` plus an explicit plugin
 * list, rather than the `prettier` package root which resolves its plugins lazily.
 *
 * The list is deliberately narrow: `markdown` and `yaml`, the two languages a
 * GitHub Action's README is known in advance to hold. So the property under test
 * is two-sided, and both sides matter:
 *
 * - a fence in a bundled language matches the package root byte-for-byte
 * - a fence in any other language comes back **unchanged**
 *
 * The second is the side worth asserting deliberately: it makes adding a plugin
 * impossible to do silently, because every tag that plugin starts reformatting
 * fails here, so the binary cost is a decision taken each time rather than a
 * side effect.
 */
import { format as formatViaPackageRoot, getSupportInfo } from 'prettier';
import { describe, expect, it, vi } from 'vite-plus/test';

import LogTask from '../src/logtask/index.js';
import { formatMarkdown, plugins, wrapDescription } from '../src/prettier.js';

/** The same options `formatMarkdown` uses, minus the plugin wiring. */
const markdownOptions = {
  semi: false,
  parser: 'markdown',
  embeddedLanguageFormatting: 'auto',
} as const;

/**
 * Bodies probed against each fence tag. The generic five prove a tag reaches
 * *a* parser. The Angular one proves it reaches the *right* one: markup with no
 * framework syntax is printed identically by `html` and `angular`, so a fence
 * routed to the wrong plugin still matched the root and the gap stayed
 * invisible. Only `*ngIf` / `{{ }}` separates them.
 */
const FENCE_BODIES = [
  'const a=1',
  'a{b:c}',
  '<div   x="1">y</div>',
  'a:    1',
  '{"a":1,  "b":2}',
  '<div *ngIf="a&&b">{{c+d}}</div>',
];

/**
 * The parsers the bundled plugins provide, read off the plugins themselves.
 * `markdown` provides `mdx` as well as `markdown`, which a hand-written set
 * misfiled — so it is derived, never restated.
 */
const BUNDLED_PARSERS = new Set(
  plugins.flatMap((plugin) => Object.keys((plugin as { parsers?: object }).parsers ?? {})),
);

/** Every spelling of a fence tag a language answers to. */
function tagsOf(language: { name?: string; aliases?: string[]; extensions?: string[] }): string[] {
  const tags: string[] = [];
  if (language.name) tags.push(language.name.toLowerCase().replaceAll(' ', ''));
  tags.push(...(language.aliases ?? []));
  tags.push(...(language.extensions ?? []).map((extension) => extension.replace(/^\./, '')));
  return tags;
}

/**
 * Every fence tag prettier recognises — language names, aliases and extensions —
 * narrowed to the ones the package root actually reformats, then split by
 * whether this tool bundles a plugin for it. Generated rather than listed so a
 * prettier release adding a language lands on one side or the other without
 * anyone remembering to add a case.
 */
const { bundled, unbundled } = await (async (): Promise<{
  bundled: string[];
  unbundled: string[];
}> => {
  // Derived, not listed: `markdown` and `yaml` answer to far more spellings
  // than the obvious ones (`mdx`, `ronn`, `workbook`, `yml.mysql` …), and a
  // hand-written set silently misfiles every one it forgets.
  const tags = new Set<string>();
  const bundledTags = new Set<string>();
  for (const language of (await getSupportInfo()).languages) {
    const isBundled = (language.parsers ?? []).some((parser) => BUNDLED_PARSERS.has(parser));
    for (const tag of tagsOf(language)) {
      tags.add(tag);
      if (isBundled) bundledTags.add(tag);
    }
  }

  const bundled: string[] = [];
  const unbundled: string[] = [];
  for (const tag of [...tags].sort()) {
    for (const body of FENCE_BODIES) {
      const source = `\`\`\`${tag}\n${body}\n\`\`\`\n`;
      try {
        if ((await formatViaPackageRoot(source, markdownOptions)) !== source) {
          (bundledTags.has(tag) ? bundled : unbundled).push(tag);
          break;
        }
      } catch {
        // tag/body pairing the root cannot parse; try the next body
      }
    }
  }
  return { bundled, unbundled };
})();

describe('prettier', () => {
  describe('formatMarkdown', () => {
    // Pins the decision, because nothing else does. Both sweeps below derive
    // their split from `plugins`, so they follow a change to it rather than
    // catching one. This is the assertion that fails when a plugin is added or
    // dropped, making the binary cost a deliberate choice each time.
    //
    // `mdx` and `remark` ride along with `markdown`: one plugin, three parsers.
    it('bundles exactly the parsers an action README is known to need', () => {
      expect([...BUNDLED_PARSERS].sort()).toEqual(['markdown', 'mdx', 'remark', 'yaml']);
    });

    it('pads GFM table columns to a common width', async () => {
      const unaligned = [
        '| **Input** | **Description** |',
        '|---|---|',
        '| a | a longer cell |',
      ].join('\n');

      const result = await formatMarkdown(`${unaligned}\n`);

      expect(result).toBe(
        [
          '| **Input** | **Description** |',
          '| --------- | --------------- |',
          '| a         | a longer cell   |',
          '',
        ].join('\n'),
      );
    });

    it('normalises bullets, emphasis and blank runs', async () => {
      const result = await formatMarkdown('* a\n* b\n\n\n\n__bold__\n');

      expect(result).toBe('- a\n- b\n\n**bold**\n');
    });

    // yaml is bundled, json is not: the yaml fence is normalised and the json
    // fence comes back exactly as the author wrote it.
    it('formats an embedded yaml fence and leaves json alone', async () => {
      const result = await formatMarkdown(
        '```json\n{"a":1,   "b":2}\n```\n\n```yaml\na:    1\n```\n',
      );

      expect(result).toBe('```json\n{"a":1,   "b":2}\n```\n\n```yaml\na: 1\n```\n');
    });

    it.each([
      ['table', '| a | bbbb |\n|---|---|\n| c | d |\n'],
      ['prose and lists', '# Title\n\n* one\n* two\n\n__bold__ and _em_\n'],
    ])('matches the prettier package root for %s', async (_name, source) => {
      expect(await formatMarkdown(source)).toBe(
        await formatViaPackageRoot(source, markdownOptions),
      );
    });

    // Side one: a fence whose parser we bundle comes back either exactly as the
    // package root prints it, or exactly as written — never a third form.
    //
    // The disjunction is not slack, it is `mdx`: the markdown plugin parses an
    // mdx fence, but JSX nested inside it reaches plugins we do not bundle, so
    // `<div   x="1">y</div>` stays as typed while `a:    1` normalises. Asserting
    // one of the two ends still catches the failure that matters — formatted,
    // but differently from prettier.
    //
    // Every body the root reformats is asserted, not just the first. Stopping at
    // the first is what let an earlier plugin gap through, since a tag's earliest
    // reformattable body can be one that two different plugins print identically.
    it.each(bundled.map((tag) => [tag] as const))(
      'prints a %s fence as the package root does, or leaves it as written',
      async (tag) => {
        for (const body of FENCE_BODIES) {
          const source = `\`\`\`${tag}\n${body}\n\`\`\`\n`;
          let expected: string;
          try {
            expected = await formatViaPackageRoot(source, markdownOptions);
          } catch {
            continue;
          }
          if (expected === source) continue;

          expect([expected, source]).toContain(await formatMarkdown(source));
        }
      },
    );

    // And the language the bundle exists for holds full parity, with no
    // disjunction: an action README is mostly workflow yaml.
    it.each([
      ['yaml', '```yaml\na:    1\nb:  [1,2]\n```\n'],
      ['yml', '```yml\na:    1\n```\n'],
    ])('matches the package root exactly for a %s fence', async (_name, source) => {
      expect(await formatMarkdown(source)).toBe(
        await formatViaPackageRoot(source, markdownOptions),
      );
    });

    // Side two: a language this tool does not bundle comes back exactly as
    // written, even though the package root would reformat it. A fence in
    // someone's action README is their prose.
    //
    // This sweep does not by itself catch a plugin being added — it derives its
    // split from `plugins`, so a new plugin moves its tags to the bundled side
    // and the assertion simply stops running for them. The parser-set assertion
    // above is what fails in that case. (Checked: adding babel and estree failed
    // only the pinned set and the json case, not this sweep.)
    it.each(unbundled.map((tag) => [tag] as const))('leaves a %s fence as written', async (tag) => {
      for (const body of FENCE_BODIES) {
        const source = `\`\`\`${tag}\n${body}\n\`\`\`\n`;
        try {
          if ((await formatViaPackageRoot(source, markdownOptions)) === source) continue;
        } catch {
          continue;
        }

        expect(await formatMarkdown(source)).toBe(source);
      }
    });

    // Tags prettier leaves alone anyway must also stay alone.
    it.each([
      ['sh', '```sh\necho   hi\n```\n'],
      ['no language', '```\nplain   text\n```\n'],
    ])('leaves a %s fence untouched, as the package root does', async (_name, source) => {
      expect(await formatMarkdown(source)).toBe(
        await formatViaPackageRoot(source, markdownOptions),
      );
    });

    it('passes filepath through when provided', async () => {
      const source = '* a\n';

      expect(await formatMarkdown(source, 'README.md')).toBe(
        await formatViaPackageRoot(source, { ...markdownOptions, filepath: 'README.md' }),
      );
    });
  });

  describe('wrapDescription', () => {
    it('wraps prose at 80 columns and prefixes each line', async () => {
      const description =
        'Description: The absolute or relative path to the `action.yml` file to read in from.';

      const result = await wrapDescription(description, ['line 1', 'line 2']);

      expect(result).toEqual([
        'line 1',
        'line 2',
        '    # Description: The absolute or relative path to the `action.yml` file to read in',
        '    # from.',
        '    # ',
      ]);
    });

    it('honours a custom prefix', async () => {
      const result = await wrapDescription('short text', [], '  # ');

      expect(result).toEqual(['  # short text', '  # ']);
    });

    it('preserves block structure rather than reflowing it into the paragraph', async () => {
      const result = await wrapDescription('Intro text.\n\n- one\n- two\n', [], '');

      expect(result).toEqual(['Intro text.', '', '- one', '- two', '']);
    });

    it('matches the prettier package root', async () => {
      const description =
        'Description: Options:\n\n- `git-tag` - Latest git tag\n- `git-sha` - Commit SHA\n';

      const expected = await formatViaPackageRoot(description, {
        semi: false,
        parser: 'markdown',
        proseWrap: 'always',
      });

      expect(await wrapDescription(description, [], '')).toEqual(expected.split('\n'));
    });

    it('returns the content array unchanged when the description is undefined', async () => {
      const content = ['line 1', 'line 2'];

      expect(await wrapDescription(undefined, content)).toEqual(['line 1', 'line 2']);
    });

    it('returns an empty array when both description and content are absent', async () => {
      expect(await wrapDescription(undefined, undefined as unknown as string[])).toEqual([]);
    });

    // Prettier's markdown parser accepts malformed markdown — unterminated
    // fences and invalid json/yaml fence bodies all format without throwing —
    // so the catch is only reachable via a non-string value slipping past the
    // type. It swallows the error rather than propagating, which leaves
    // formattedString empty and still appends one bare prefix line.
    //
    // The logger is spied on rather than left to run: LogTask.error emits a
    // `::error::` line, which GitHub Actions turns into an error annotation on
    // an otherwise-passing run.
    it('logs and falls back to a single prefix line when formatting throws', async () => {
      const logged = vi.spyOn(LogTask.prototype, 'error').mockImplementation(() => {});

      try {
        const result = await wrapDescription(42 as unknown as string, ['line 1'], '# ');

        expect(result).toEqual(['line 1', '# ']);
        expect(logged).toHaveBeenCalledOnce();
      } finally {
        logged.mockRestore();
      }
    });
  });
});
