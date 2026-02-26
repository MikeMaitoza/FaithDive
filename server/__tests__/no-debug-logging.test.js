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

  test('database.js contains no console.log statements', () => {
    const content = fs.readFileSync(path.join(publicDir, 'js', 'database.js'), 'utf-8');
    const logStatements = content.match(/console\.log\(/g) || [];
    expect(logStatements).toHaveLength(0);
  });

  test('database.js retains console.error for real failures', () => {
    const content = fs.readFileSync(path.join(publicDir, 'js', 'database.js'), 'utf-8');
    const errorStatements = content.match(/console\.error\(/g) || [];
    expect(errorStatements.length).toBeGreaterThan(0);
  });
});

describe('Production code hygiene', () => {
  const publicDir = path.join(__dirname, '..', '..', 'public');

  test('app.js uses requestAnimationFrame instead of setTimeout for DOM timing', () => {
    const content = fs.readFileSync(path.join(publicDir, 'js', 'app.js'), 'utf-8');
    const setTimeoutCalls = content.match(/setTimeout\s*\(/g) || [];
    expect(setTimeoutCalls).toHaveLength(0);
  });

  test('app.js uses requestAnimationFrame for post-render callbacks', () => {
    const content = fs.readFileSync(path.join(publicDir, 'js', 'app.js'), 'utf-8');
    const rafCalls = content.match(/requestAnimationFrame\s*\(/g) || [];
    expect(rafCalls.length).toBeGreaterThan(0);
  });
});
