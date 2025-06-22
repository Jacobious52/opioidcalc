const fs = require('fs');
const vm = require('vm');

// Minimal DOM shim for script.js
global.document = { addEventListener: () => {} };

const ctx = vm.createContext(global);

// Load main calculator logic
vm.runInContext(fs.readFileSync(require.resolve('../assets/script.js'), 'utf8'), ctx);
// Load tests and expose runCalculationTests
vm.runInContext(
  fs.readFileSync(require.resolve('./calculation_tests.js'), 'utf8') +
    '\nthis.runCalculationTests = runCalculationTests;',
  ctx
);

const results = ctx.runCalculationTests();
let failed = 0;
results.forEach(r => {
  console.log(`${r.name}: ${r.success ? 'PASS' : 'FAIL'} - ${r.details}`);
  if (!r.success) failed++;
});
if (failed > 0) {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll tests passed.');
}
