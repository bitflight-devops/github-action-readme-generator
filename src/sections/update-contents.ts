/**
 * This TypeScript code exports a function named 'updateContents' which generates
 * a table of contents from the README.md headers.
 * @param {ReadmeSection} sectionToken - The sectionToken representing the section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';

/**
 * Converts a header text to a GitHub-compatible anchor link.
 * @param {string} text - The header text to convert.
 * @returns {string} The anchor link.
 */
function headerToAnchor(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replaceAll(/\s+/g, '-') // Replace spaces with hyphens
    .replaceAll(/-+/g, '-') // Collapse multiple hyphens
    .replaceAll(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extracts headers from markdown content, excluding those in code blocks.
 * @param {string} content - The markdown content.
 * @returns {Array<{level: number, text: string}>} Array of header objects.
 */
function extractHeaders(content: string): { level: number; text: string }[] {
  const headers: { level: number; text: string }[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    // Track code block state
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip if inside code block
    if (inCodeBlock) {
      continue;
    }

    // Match markdown headers (## Header)
    const headerMatch = /^(#{2,6})\s+(.+)$/.exec(line);
    if (headerMatch) {
      const level = headerMatch[1].length;
      let text = headerMatch[2].trim();

      // Remove inline images and other markdown formatting from header text
      text = text.replaceAll(/<img[^>]*>/g, '').trim();
      // Remove markdown links but keep the text
      text = text.replaceAll(/\[([^\]]+)]\([^)]+\)/g, '$1');

      if (text) {
        headers.push({ level, text });
      }
    }
  }

  return headers;
}

export default function updateContents(
  sectionToken: ReadmeSection,
  inputs: Inputs,
): Record<string, string> {
  const log = new LogTask(sectionToken);
  log.start();

  const content: string[] = [];
  const readmeContent = inputs.readmeEditor.getReadmeContent();

  // Extract headers from README
  const headers = extractHeaders(readmeContent);

  // Filter out the title (h1) and contents section itself
  const tocHeaders = headers.filter(
    (h) => h.level >= 2 && !h.text.toLowerCase().includes('contents'),
  );

  if (tocHeaders.length === 0) {
    log.info('No headers found for table of contents');
  } else {
    log.info(`Generating table of contents with ${tocHeaders.length} entries`);

    // Find minimum header level for proper indentation
    const minLevel = Math.min(...tocHeaders.map((h) => h.level));

    // Track anchor occurrences to disambiguate duplicates like GitHub does
    const anchorCounts = new Map<string, number>();

    // Generate TOC entries
    content.push('## Table of Contents', '');

    for (const header of tocHeaders) {
      const indent = '  '.repeat(header.level - minLevel);
      const baseAnchor = headerToAnchor(header.text);

      // Track occurrences and compute unique anchor
      const count = anchorCounts.get(baseAnchor) ?? 0;
      anchorCounts.set(baseAnchor, count + 1);

      // First occurrence uses base anchor, subsequent ones get -1, -2, etc.
      const anchor = count === 0 ? baseAnchor : `${baseAnchor}-${count}`;

      content.push(`${indent}- [${header.text}](#${anchor})`);
    }
  }

  inputs.readmeEditor.updateSection(sectionToken, content);
  log.success();

  const ret: Record<string, string> = {};
  ret[sectionToken] = content.join('\n');
  return ret;
}
