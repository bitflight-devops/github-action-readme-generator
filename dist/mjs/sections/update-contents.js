import LogTask from '../logtask/index.js';
/**
 * Converts a header text to a GitHub-compatible anchor link.
 * @param {string} text - The header text to convert.
 * @returns {string} The anchor link.
 */
function headerToAnchor(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Collapse multiple hyphens
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
/**
 * Extracts headers from markdown content, excluding those in code blocks.
 * @param {string} content - The markdown content.
 * @returns {Array<{level: number, text: string}>} Array of header objects.
 */
function extractHeaders(content) {
    const headers = [];
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
            text = text.replace(/<img[^>]*>/g, '').trim();
            // Remove markdown links but keep the text
            text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
            if (text) {
                headers.push({ level, text });
            }
        }
    }
    return headers;
}
export default function updateContents(sectionToken, inputs) {
    const log = new LogTask(sectionToken);
    log.start();
    const content = [];
    const readmeContent = inputs.readmeEditor.getReadmeContent();
    // Extract headers from README
    const headers = extractHeaders(readmeContent);
    // Filter out the title (h1) and contents section itself
    const tocHeaders = headers.filter((h) => h.level >= 2 && !h.text.toLowerCase().includes('contents'));
    if (tocHeaders.length === 0) {
        log.info('No headers found for table of contents');
        const ret = {};
        ret[sectionToken] = '';
        return ret;
    }
    log.info(`Generating table of contents with ${tocHeaders.length} entries`);
    // Find minimum header level for proper indentation
    const minLevel = Math.min(...tocHeaders.map((h) => h.level));
    // Generate TOC entries
    content.push('## Table of Contents');
    content.push('');
    for (const header of tocHeaders) {
        const indent = '  '.repeat(header.level - minLevel);
        const anchor = headerToAnchor(header.text);
        content.push(`${indent}- [${header.text}](#${anchor})`);
    }
    inputs.readmeEditor.updateSection(sectionToken, content);
    log.success();
    const ret = {};
    ret[sectionToken] = content.join('\n');
    return ret;
}
//# sourceMappingURL=update-contents.js.map