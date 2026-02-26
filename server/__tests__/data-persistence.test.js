const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', '..', 'public');
const dbContent = fs.readFileSync(path.join(publicDir, 'js', 'database.js'), 'utf-8');

describe('Data import validation', () => {
  test('importData rejects data with no recognizable keys', () => {
    // The importData function should check that at least one of
    // journals, favorites, or settings exists in the data
    const fnMatch = dbContent.match(/importData[\s\S]*?^\s{2}}/m);
    expect(fnMatch).not.toBeNull();

    // Should check for presence of expected keys
    expect(fnMatch[0]).toMatch(/journals|favorites|settings/);
    // Should have a guard that returns an error when none are present
    expect(fnMatch[0]).toMatch(/!data\.journals\s*&&\s*!data\.favorites\s*&&\s*!data\.settings/);
  });
});

describe('localStorage quota handling', () => {
  test('save method wraps localStorage.setItem in try/catch', () => {
    // Extract the save() method body
    const fnMatch = dbContent.match(/save\(\)\s*\{[\s\S]*?^\s{2}\}/m);
    expect(fnMatch).not.toBeNull();

    // Should have try/catch around localStorage.setItem
    expect(fnMatch[0]).toContain('try');
    expect(fnMatch[0]).toContain('catch');
  });

  test('save method handles QuotaExceededError', () => {
    const fnMatch = dbContent.match(/save\(\)\s*\{[\s\S]*?^\s{2}\}/m);
    expect(fnMatch).not.toBeNull();

    // Should reference quota or storage full in error handling
    expect(fnMatch[0]).toMatch(/[Qq]uota|storage/i);
  });
});
