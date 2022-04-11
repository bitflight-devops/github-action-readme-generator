export function workingDirectory(): string {
  return process.env.GITHUB_WORKSPACE ?? process.env.INIT_CWD ?? process.cwd();
}
export default workingDirectory;
