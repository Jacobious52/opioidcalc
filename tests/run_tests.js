const fs = require('fs');

// Minimal DOM stub so script.js can load without errors
global.document = {
  addEventListener: () => {}
};

const scriptCode = fs.readFileSync(__dirname + '/../assets/script.js', 'utf8');
const testCode = fs.readFileSync(__dirname + '/calculation_tests.js', 'utf8');

// Combine code so runCalculationTests remains in same context
const code = `${scriptCode}\n${testCode}\nrunCalculationTests();`;
const results = eval(code);

results.forEach(r => {
  console.log(`${r.name}: ${r.success ? 'PASS' : 'FAIL'} - ${r.details}`);
});

if (results.some(r => !r.success)) {
  console.error('Some tests failed');
  process.exit(1);
}
