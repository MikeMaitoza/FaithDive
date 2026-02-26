const fs = require('fs');
const path = require('path');

describe('Production logging hygiene', () => {
  const publicDir = path.join(__dirname, '..', '..', 'public');

  test('sw.js contains no console.log statements', () => {
    const content = fs.readFileSync(path.join(publicDir, 'sw.js'), 'utf-8');
    const logStatements = content.match(/console\.log\(/g) || [];
    expect(logStatements).toHaveLength(0);
  });

  test('app.js contains no console.log statements', () => {
    const content = fs.readFileSync(path.join(publicDir, 'js', 'app.js'), 'utf-8');
    const logStatements = content.match(/console\.log\(/g) || [];
    expect(logStatements).toHaveLength(0);
  });

  test('sw.js retains console.error for real failures', () => {
    const content = fs.readFileSync(path.join(publicDir, 'sw.js'), 'utf-8');
    const errorStatements = content.match(/console\.error\(/g) || [];
    expect(errorStatements.length).toBeGreaterThan(0);
  });

  test('app.js retains console.error for real failures', () => {
    const content = fs.readFileSync(path.join(publicDir, 'js', 'app.js'), 'utf-8');
    const errorStatements = content.match(/console\.error\(/g) || [];
    expect(errorStatements.length).toBeGreaterThan(0);
  });
});
