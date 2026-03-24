import { execSync } from 'node:child_process';
import { accessSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import LogTask from './logtask/index.js';
import { unicodeWordMatch } from './unicode-word-match.js';
import { notEmpty } from './util.js';
/**
 * Returns the input value if it is not empty, otherwise returns undefined.
 * @param value - The input value to check.
 * @returns The input value if it is not empty, otherwise undefined.
 */
export function undefinedOnEmpty(value) {
    if (!value || value === '') {
        return undefined;
    }
    return value;
}
/**
 * Returns the basename of the given path.
 * @param pathStr - The path to extract the basename from.
 * @returns The basename of the path.
 */
export function basename(pathStr) {
    if (!pathStr) {
        return undefined;
    }
    const log = new LogTask('basename');
    const result = path.basename(pathStr);
    log.debug(`Basename passed ${pathStr} and returns ${result}`);
    return result;
}
/**
 * Removes the "refs/heads/" or "refs/tags/" prefix from the given path.
 *
 * @param pathStr - The path to remove the prefix from
 * @returns The path without the prefix, or null if path is empty
 */
export function stripRefs(pathStr) {
    if (!pathStr) {
        return null;
    }
    const log = new LogTask('stripRefs');
    const result = pathStr.replace('refs/heads/', '').replace('refs/tags/', '');
    log.debug(`stripRefs passed ${pathStr} and returns ${result}`);
    return result;
}
/**
 * Converts the given text to title case.
 * @param text - The text to convert.
 * @returns The text converted to title case.
 * @throws {TypeError} If the input is not a string.
 */
export function titlecase(text) {
    if (!text) {
        return undefined;
    }
    if (typeof text !== 'string') {
        throw new TypeError(`Invalid argument type provided to titlecase(): ${typeof text}`);
    }
    return text.replaceAll(unicodeWordMatch, (txt) => txt[0] ? txt[0].toUpperCase() + txt.slice(1).toLowerCase() : txt);
}
/**
 * Parses the given text and converts it to title case, replacing underscores and dashes with spaces.
 * @param text - The text to parse and convert.
 * @returns The parsed text converted to title case.
 */
export function prefixParser(text) {
    if (!text) {
        return undefined;
    }
    if (typeof text !== 'string') {
        throw new TypeError(`Invalid argument type provided to prefixParser(): ${typeof text}`);
    }
    return titlecase(text.replace(/[_-]+/, ' '));
}
/**
 * Wraps the given text into multiple lines with a maximum width of 80 characters.
 * @param text - The text to wrap.
 * @param content - The array to store the wrapped lines.
 * @param prepend - The string to prepend to each wrapped line.
 * @returns The array of wrapped lines.
 */
export function wrapText(text, content, prepend = '') {
    // Constrain the width of the description
    if (!text) {
        return content;
    }
    const width = 80;
    let description = text
        .trim()
        .replaceAll('\r\n', '\n') // Convert CR to LF
        .replaceAll(/ +/g, ' ') //    Squash consecutive spaces
        .replaceAll(' \n', '\n'); //  Squash space followed by newline
    while (description) {
        // Longer than width? Find a space to break apart
        let segment;
        if (description.length > width) {
            segment = description.slice(0, Math.max(0, width + 1));
            while (!segment.endsWith(' ') && !segment.endsWith('\n') && segment) {
                segment = segment.slice(0, Math.max(0, segment.length - 1));
            }
            // Trimmed too much?
            if (segment.length < width * 0.67) {
                segment = description;
            }
        }
        else {
            segment = description;
        }
        // Check for newline
        const newlineIndex = segment.indexOf('\n');
        if (newlineIndex >= 0) {
            segment = segment.slice(0, Math.max(0, newlineIndex + 1));
        }
        content.push(`${prepend}${segment}`.trimEnd());
        // Remaining
        description = description.slice(segment.length);
    }
    return content;
}
export function readFile(filename) {
    try {
        return readFileSync(filename, 'utf8');
    }
    catch (error) {
        throw new Error(`Cannot read file ${filename}: ${error}`);
    }
}
export function repoObjFromRepoName(repository, log, from) {
    if (notEmpty(repository)) {
        const [owner, repo] = repository.split('/');
        if (owner && repo) {
            log.debug(`repoObjFromRepoName using ${from} and returns ${JSON.stringify({ owner, repo })}`);
            return { owner, repo };
        }
    }
    return undefined;
}
// Pattern to match GitHub remote URLs in .git/config
// Handles both HTTPS (github.com/) and SSH (github.com:) formats
// Captures the repo name with or without .git suffix - suffix is stripped in code
export const remoteGitUrlPattern = /url\s*=\s*.*github\.com[/:](?<owner>[^/\s]+)\/(?<repo>[^\s]+)/;
/**
 * Finds the repository information from the input, context, environment variables, or git configuration.
 * @param inputRepo - The input repository string.
 * @param context - The GitHub context object.
 * @param baseDir - Optional base directory to look for .git/config (defaults to CWD).
 * @returns The repository information (owner and repo) or null if not found.
 */
export function repositoryFinder(inputRepo, context, baseDir) {
    const log = new LogTask('repositoryFinder');
    /**
     * Attempt to get git user and repo from input
     */
    const repoObj = repoObjFromRepoName(inputRepo, log, 'inputRepo');
    if (repoObj) {
        return repoObj;
    }
    /**
     * When baseDir is provided, prioritize .git/config from that directory
     * This is critical for external repos where GITHUB_REPOSITORY points to
     * the workflow repo, not the target repo being documented
     */
    if (baseDir) {
        try {
            const gitConfigPath = path.join(baseDir, '.git', 'config');
            const fileContent = readFile(gitConfigPath);
            log.debug(`Reading git config from: ${gitConfigPath}`);
            const results = remoteGitUrlPattern.exec(fileContent);
            if (results?.groups?.owner && results?.groups?.repo) {
                // Strip .git suffix if present (actions/checkout may or may not include it)
                const repo = results.groups.repo.replace(/\.git$/, '');
                log.debug(`repositoryFinder using '${gitConfigPath}' and returns ${JSON.stringify({ owner: results.groups.owner, repo })}`);
                return {
                    owner: results.groups.owner,
                    repo,
                };
            }
            else {
                log.debug(`No remote URL found in ${gitConfigPath}`);
            }
        }
        catch (error) {
            log.debug(`Couldn't read .git/config from baseDir ${baseDir}: ${error}`);
            // Fall through to other methods
        }
    }
    /**
     * Attempt to get git user and repo from GitHub context,
     * which includes checking for GITHUB_REPOSITORY environment variable
     */
    if (context) {
        try {
            const result = { ...context.repo };
            if (result.owner && result.repo) {
                log.debug(`repositoryFinder using GitHub context and returns ${JSON.stringify(result)}`);
                return result;
            }
        }
        catch (error) {
            log.debug(`repositoryFinder using GitHub context gives error ${JSON.stringify(error)}`);
        }
    }
    /**
     * Fallback: Try to parse GITHUB_REPOSITORY environment variable directly
     * This handles cases where the Context class doesn't pick up the value
     */
    const githubRepo = process.env.GITHUB_REPOSITORY;
    if (githubRepo) {
        const repoFromEnv = repoObjFromRepoName(githubRepo, log, 'GITHUB_REPOSITORY env');
        if (repoFromEnv) {
            return repoFromEnv;
        }
    }
    /**
     * Last resort: Attempt to get git user and repo from .git/config in CWD
     */
    try {
        const fileContent = readFile('.git/config');
        log.debug('Reading git config from: .git/config');
        const results = remoteGitUrlPattern.exec(fileContent);
        if (results?.groups?.owner && results?.groups?.repo) {
            // Strip .git suffix if present
            const repo = results.groups.repo.replace(/\.git$/, '');
            log.debug(`repositoryFinder using '.git/config' and returns ${JSON.stringify({ owner: results.groups.owner, repo })}`);
            return {
                owner: results.groups.owner,
                repo,
            };
        }
        else {
            log.debug('No remote URL found in .git/config');
        }
    }
    catch (error) {
        // can't find it
        log.error(`Couldn't retrieve owner or repo in .git/config file: ${error}`);
    }
    throw new Error('No owner or repo found');
}
/**
 * Returns the default branch of the git repository.
 * @returns The default branch.
 */
/**
 * Gets the default branch for the Git repository.
 *
 * @returns The name of the default branch.
 */
export function getDefaultGitBranch() {
    let result;
    try {
        // Run git command to get default branch
        result = execSync('git symbolic-ref HEAD | sed s@^refs/heads/@@');
    }
    catch (error) {
        // If command fails, try alternative for MacOS
        if (error) {
            try {
                result = execSync("git remote set-head origin -a;git remote show origin | head 50 sed -n 's/^.*default branch \\(.*\\)/\\1/p'");
            }
            catch {
                result = execSync("git remote set-head origin -a;git remote show origin | sed -n 's/^s*HEAD branch: \\(.*\\)/\\1/p'");
            }
        }
    }
    return result?.toString().trim() ?? '';
}
/**
 * Formats the given value as a column header.
 * @param value - The value to format.
 * @returns The formatted column header.
 */
export function columnHeader(value) {
    if (!value) {
        return '';
    }
    let text = value.replaceAll(/\*\*(.*?)\*\*/g, '$1');
    // Remove italic formatting: *italic*
    text = text.replaceAll(/\*(.*?)\*/g, '$1');
    // Remove strikethrough formatting: ~~strikethrough~~
    text = text.replaceAll(/~~(.*?)~~/g, '$1');
    const normalisedHeader = titlecase(text.trim());
    if (normalisedHeader) {
        return `${normalisedHeader}`;
    }
    return '';
}
/**
 * Formats the given value as a row header in HTML.
 *
 * Removes formatting from the string and converts it to bold code style.
 *
 * @param value - The string to format as a header
 * @returns The formatted row header string wrapped in bold and code tags
 */
export function rowHeader(value) {
    if (!value) {
        return '';
    }
    let text = value;
    // Remove bold formatting
    text = text.replaceAll(/\*\*(.*?)\*\*/g, '$1');
    // Remove italic formatting: *italic*
    text = text.replaceAll(/\*(.*?)\*/g, '$1');
    // Remove strikethrough formatting: ~~strikethrough~~
    text = text.replaceAll(/~~(.*?)~~/g, '$1');
    // Normalize spacing
    text = text.trim();
    // Add bold and code formatting
    return `<b><code>${text}</code></b>`;
}
/**
 * Gets the version from git tags.
 */
function getVersionFromGitTag(actionDir, log) {
    try {
        const gitVersion = execSync('git describe --tags --abbrev=0 2>/dev/null || git tag -l "v*" --sort=-v:refname | head -1', {
            cwd: actionDir,
            encoding: 'utf8',
        }).trim();
        if (gitVersion) {
            // Remove 'v' prefix if present for consistency, we'll add it back with the configured prefix
            const version = gitVersion.replace(/^v/, '');
            log.debug(`version from git tags: ${version}`);
            return version;
        }
    }
    catch {
        log.debug(`Could not get version from git tags in ${actionDir}`);
    }
    return undefined;
}
/**
 * Gets the current git branch name.
 */
function getVersionFromGitBranch(actionDir, log) {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', {
            cwd: actionDir,
            encoding: 'utf8',
        }).trim();
        if (branch && branch !== 'HEAD') {
            log.debug(`version from git branch: ${branch}`);
            return branch;
        }
    }
    catch {
        log.debug(`Could not get branch name in ${actionDir}`);
    }
    return undefined;
}
/**
 * Gets the current git commit SHA (short form).
 */
function getVersionFromGitSha(actionDir, log) {
    try {
        const sha = execSync('git rev-parse --short HEAD', {
            cwd: actionDir,
            encoding: 'utf8',
        }).trim();
        if (sha) {
            log.debug(`version from git sha: ${sha}`);
            return sha;
        }
    }
    catch {
        log.debug(`Could not get commit SHA in ${actionDir}`);
    }
    return undefined;
}
/**
 * Gets the version from package.json.
 */
function getVersionFromPackageJson(actionDir, log) {
    const packageJsonPath = path.join(actionDir, 'package.json');
    log.debug(`Looking for package.json at: ${packageJsonPath}`);
    try {
        accessSync(packageJsonPath);
        const packageData = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const version = packageData.version;
        log.debug(`version from package.json: ${version ?? 'not found'}`);
        return version;
    }
    catch {
        log.debug(`package.json not found at ${packageJsonPath}`);
    }
    return undefined;
}
/**
 * Detects the version string from the configured version source.
 * Returns undefined if detection fails for the given source.
 */
function detectVersionFromSource(versionSource, actionDir, log) {
    switch (versionSource) {
        case 'git-branch':
            return getVersionFromGitBranch(actionDir, log);
        case 'git-sha':
            return getVersionFromGitSha(actionDir, log);
        case 'package-json':
            return getVersionFromPackageJson(actionDir, log);
        default:
            // For git-tag (default), use the legacy fallback behavior
            return (getVersionFromGitTag(actionDir, log) ??
                getVersionFromPackageJson(actionDir, log) ??
                (() => {
                    const envVersion = process.env.npm_package_version;
                    log.debug(`Falling back to env:npm_package_version: ${envVersion ?? 'not found'}`);
                    return envVersion;
                })());
    }
}
export function getCurrentVersionString(inputs) {
    let versionString = '';
    const log = new LogTask('getCurrentVersionString');
    // Default to enabled if not explicitly set (matches action.yml default of "true")
    const versioningEnabled = inputs.config.get('versioning:enabled');
    const isVersioningEnabled = versioningEnabled === undefined || versioningEnabled === true || versioningEnabled === 'true';
    if (isVersioningEnabled) {
        log.debug('version string in generated example is enabled');
        const override = inputs.config.get('versioning:override');
        const versionSource = inputs.config.get('versioning:source') ?? 'git-tag';
        const actionDir = path.dirname(inputs.action.path);
        log.debug(`version source: ${versionSource}`);
        let detectedVersion;
        // If override is set and we're in explicit mode, use it directly
        if (versionSource === 'explicit') {
            detectedVersion = override?.length > 0 ? override : '0.0.0';
            log.debug(`explicit mode: using ${detectedVersion}`);
        }
        else {
            detectedVersion = detectVersionFromSource(versionSource, actionDir, log);
            // Override takes precedence if set (except for explicit mode which is handled above)
            if (override?.length > 0) {
                detectedVersion = override;
                log.debug(`using version override: ${detectedVersion}`);
            }
        }
        versionString = detectedVersion ?? '0.0.0';
        // Get prefix, defaulting to 'v' if not set
        // For git-branch and git-sha, we typically don't want a prefix
        const prefix = inputs.config.get('versioning:prefix') ?? 'v';
        const shouldApplyPrefix = versionSource !== 'git-branch' && versionSource !== 'git-sha';
        if (shouldApplyPrefix && versionString && !versionString.startsWith(prefix)) {
            versionString = `${prefix}${versionString}`;
        }
    }
    else {
        versionString = inputs.config.get('versioning:branch');
    }
    log.debug(`version to use in generated example is ${versionString}`);
    return versionString;
}
export function indexOfRegex(str, providedRegex) {
    const regex = providedRegex.global
        ? providedRegex
        : new RegExp(providedRegex.source, `${providedRegex.flags}g`);
    let index = -1;
    let match = regex.exec(str);
    while (match) {
        index = match.index;
        match = regex.exec(str);
    }
    return index;
}
export function lastIndexOfRegex(str, providedRegex) {
    const regex = providedRegex.global
        ? providedRegex
        : new RegExp(providedRegex.source, `${providedRegex.flags}g`);
    let index = -1;
    let match = regex.exec(str);
    while (match) {
        index = match.index + match[0].length;
        match = regex.exec(str);
    }
    return index;
}
export function isObject(value) {
    const type = typeof value;
    return type === 'object' && !!value;
}
//# sourceMappingURL=helpers.js.map