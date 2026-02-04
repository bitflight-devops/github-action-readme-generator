import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReadmeSection } from '../src/constants.js';
import type Inputs from '../src/inputs.js';
import updateContents from '../src/sections/update-contents.js';

vi.mock('../src/logtask/index.js');

describe('updateContents', () => {
  let mockInputs: Inputs;
  let mockUpdateSection: ReturnType<typeof vi.fn>;
  const sectionToken: ReadmeSection = 'contents';

  beforeEach(() => {
    mockUpdateSection = vi.fn();
    mockInputs = {
      readmeEditor: {
        getReadmeContent: vi.fn(),
        updateSection: mockUpdateSection,
      },
    } as unknown as Inputs;
  });

  describe('basic TOC generation', () => {
    it('should generate TOC for simple headers', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
# Title

## Introduction

Some content here.

## Getting Started

More content.

## Conclusion
`);

      const result = updateContents(sectionToken, mockInputs);

      expect(result[sectionToken]).toContain('## Table of Contents');
      expect(result[sectionToken]).toContain('- [Introduction](#introduction)');
      expect(result[sectionToken]).toContain('- [Getting Started](#getting-started)');
      expect(result[sectionToken]).toContain('- [Conclusion](#conclusion)');
      expect(mockUpdateSection).toHaveBeenCalled();
    });

    it('should handle headers with special characters', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
## Hello, World!

## What's New?

## C++ Guide
`);

      const result = updateContents(sectionToken, mockInputs);

      expect(result[sectionToken]).toContain('- [Hello, World!](#hello-world)');
      expect(result[sectionToken]).toContain("- [What's New?](#whats-new)");
      expect(result[sectionToken]).toContain('- [C++ Guide](#c-guide)');
    });
  });

  describe('empty TOC handling', () => {
    it('should return empty content when no headers found', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
# Just a Title

Some content without any h2-h6 headers.
`);

      const result = updateContents(sectionToken, mockInputs);

      expect(result[sectionToken]).toBe('');
      expect(mockUpdateSection).toHaveBeenCalledWith(sectionToken, []);
    });

    it('should return empty content when README is empty', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue('');

      const result = updateContents(sectionToken, mockInputs);

      expect(result[sectionToken]).toBe('');
      expect(mockUpdateSection).toHaveBeenCalledWith(sectionToken, []);
    });

    it('should exclude "Contents" headers from TOC entries', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
## Table of Contents

## Introduction
`);

      const result = updateContents(sectionToken, mockInputs);

      // The TOC should not have an entry for the "Table of Contents" section itself
      const lines = result[sectionToken].split('\n');
      const tocEntries = lines.filter((l) => l.startsWith('-'));
      expect(tocEntries).toHaveLength(1);
      expect(tocEntries[0]).toContain('Introduction');
      expect(result[sectionToken]).toContain('- [Introduction](#introduction)');
    });
  });

  describe('duplicate anchor disambiguation', () => {
    it('should append numeric suffix for duplicate headers', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
## Features

First features section.

## Features

Second features section.

## Features

Third features section.
`);

      const result = updateContents(sectionToken, mockInputs);

      expect(result[sectionToken]).toContain('- [Features](#features)');
      expect(result[sectionToken]).toContain('- [Features](#features-1)');
      expect(result[sectionToken]).toContain('- [Features](#features-2)');
    });

    it('should handle multiple different duplicates correctly', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
## Usage

## Example

## Usage

## Example

## Notes
`);

      const result = updateContents(sectionToken, mockInputs);

      const lines = result[sectionToken].split('\n');
      expect(lines).toContain('- [Usage](#usage)');
      expect(lines).toContain('- [Example](#example)');
      expect(lines).toContain('- [Usage](#usage-1)');
      expect(lines).toContain('- [Example](#example-1)');
      expect(lines).toContain('- [Notes](#notes)');
    });

    it('should handle headers that differ only by case as duplicates', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
## Setup

## SETUP

## setup
`);

      const result = updateContents(sectionToken, mockInputs);

      expect(result[sectionToken]).toContain('- [Setup](#setup)');
      expect(result[sectionToken]).toContain('- [SETUP](#setup-1)');
      expect(result[sectionToken]).toContain('- [setup](#setup-2)');
    });
  });

  describe('code block handling', () => {
    it('should ignore headers inside code blocks', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
## Real Header

\`\`\`markdown
## Fake Header in Code
\`\`\`

## Another Real Header
`);

      const result = updateContents(sectionToken, mockInputs);

      expect(result[sectionToken]).toContain('- [Real Header](#real-header)');
      expect(result[sectionToken]).toContain('- [Another Real Header](#another-real-header)');
      expect(result[sectionToken]).not.toContain('Fake Header');
    });

    it('should handle nested code blocks correctly', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
## Before Code

\`\`\`bash
echo "test"
\`\`\`

## After Code
`);

      const result = updateContents(sectionToken, mockInputs);

      const lines = result[sectionToken].split('\n').filter((l) => l.startsWith('-'));
      expect(lines).toHaveLength(2);
    });
  });

  describe('nested headers and indentation', () => {
    it('should indent nested headers correctly', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
## Main Section

### Subsection

#### Sub-subsection

### Another Subsection
`);

      const result = updateContents(sectionToken, mockInputs);

      expect(result[sectionToken]).toContain('- [Main Section](#main-section)');
      expect(result[sectionToken]).toContain('  - [Subsection](#subsection)');
      expect(result[sectionToken]).toContain('    - [Sub-subsection](#sub-subsection)');
      expect(result[sectionToken]).toContain('  - [Another Subsection](#another-subsection)');
    });

    it('should calculate indentation from minimum level', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
### Only h3 Headers

### Another h3

#### An h4 Header
`);

      const result = updateContents(sectionToken, mockInputs);

      // h3 should be at root level (no indent) since it's the minimum
      expect(result[sectionToken]).toContain('- [Only h3 Headers](#only-h3-headers)');
      expect(result[sectionToken]).toContain('- [Another h3](#another-h3)');
      expect(result[sectionToken]).toContain('  - [An h4 Header](#an-h4-header)');
    });
  });

  describe('markdown formatting in headers', () => {
    it('should remove inline images from header text', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
## Features <img src="icon.png" alt="icon">
`);

      const result = updateContents(sectionToken, mockInputs);

      expect(result[sectionToken]).toContain('- [Features](#features)');
    });

    it('should extract text from markdown links in headers', () => {
      vi.mocked(mockInputs.readmeEditor.getReadmeContent).mockReturnValue(`
## [Installation Guide](https://example.com)
`);

      const result = updateContents(sectionToken, mockInputs);

      expect(result[sectionToken]).toContain('- [Installation Guide](#installation-guide)');
    });
  });
});
