/**
 * Returns the working directory path based on the environment variables.
 * The order of preference is GITHUB_WORKSPACE, INIT_CWD, and then the current working directory.
 * @returns The working directory path.
 */
export default function workingDirectory(): string;
