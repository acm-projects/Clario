// Runs only in the execution sandbox. Never forward private stack traces.
const write = process.stdout.write.bind(process.stdout);
console.log = console.error = console.warn = () => {};
// Broken detached delivery tasks must not bypass the remaining behavioral checks.
process.on('unhandledRejection', () => {});
(async () => {
  const tests = require('./_clario_tests.js');
  const rows = [];
  for (const name of Object.keys(tests).sort()) {
    let passed = false;
    try { await tests[name](); passed = true; } catch (_) {}
    rows.push({name, passed});
  }
  write('__CLARIO_REPO_RESULTS__' + JSON.stringify(rows));
})().catch(() => { process.exitCode = 1; });
