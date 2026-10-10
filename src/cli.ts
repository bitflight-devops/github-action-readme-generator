// The library entry retains its existing import-time execution and rejection behaviour.
// This CLI-only boundary reports a concise diagnostic and a nonzero exit status.
try {
  await import('./index.js');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
