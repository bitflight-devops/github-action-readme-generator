/**
 * Returns the working directory path based on the environment variables.
 * The order of preference is GITHUB_WORKSPACE, INIT_CWD, and then the current working directory.
 * @returns The working directory path.
 */
export default function workingDirectory() {
    // Use the GITHUB_WORKSPACE environment variable if available
    const githubWorkspace = process.env.GITHUB_WORKSPACE;
    // Use the INIT_CWD environment variable if available
    const initCwd = process.env.INIT_CWD;
    // If neither GITHUB_WORKSPACE nor INIT_CWD is available, use the current working directory
    return githubWorkspace ?? initCwd ?? process.cwd();
}
//# sourceMappingURL=working-directory.js.map