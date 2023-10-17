export function workingDirectory() {
    return process.env.GITHUB_WORKSPACE ?? process.env.INIT_CWD ?? process.cwd();
}
export default workingDirectory;
//# sourceMappingURL=working-directory.js.map