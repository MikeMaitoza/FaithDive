// Favorites Feature Automated Test Suite
// Run this in the browser console: copy(await fetch('/test-favorites.js').then(r => r.text())); eval(paste)
// Or just copy-paste this entire file into the console

console.log('🧪 Starting Favorites Feature Tests...\n');
console.log('Testing at:', new Date().toISOString());
console.log('URL:', window.location.href);
console.log('---\n');

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function test(name, fn) {
  try {
    const result = fn();
    console.log(`✅ PASS: ${name}`);
    testsPassed++;
    results.push({ name, status: 'PASS', result });
    return result;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.error(error.message);
    testsFailed++;
    results.push({ name, status: 'FAIL', error: error.message });
    return null;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('=== MODULE LOADING TESTS ===\n');

test('Favorites module is loaded', () => {
  assert(window.favorites, 'favorites not found on window');
  assert(typeof window.favorites.getAll === 'function', 'getAll method not found');
  assert(typeof window.favorites.create === 'function', 'create method not found');
  assert(typeof window.favorites.delete === 'function', 'delete method not found');
  assert(typeof window.favorites.isFavorite === 'function', 'isFavorite method not found');
  return 'All methods available';
});

test('Database module is loaded', () => {
  assert(window.db, 'db not found on window');
  assert(typeof window.db.run === 'function', 'db.run method not found');
  assert(typeof window.db.all === 'function', 'db.all method not found');
  assert(typeof window.db.get === 'function', 'db.get method not found');
  return 'Database module ready';
});

console.log('\n=== DATABASE SCHEMA TESTS ===\n');

test('Favorites table exists in database', () => {
  const tableInfo = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='favorites'");
  assert(tableInfo.length > 0 && tableInfo[0].values.length > 0, 'favorites table does not exist');
  return 'Table exists';
});

test('Favorites table has correct columns', () => {
  const tableInfo = db.exec("PRAGMA table_info(favorites)");
  assert(tableInfo.length > 0, 'Could not get table info');

  const columns = tableInfo[0].values.map(row => row[1]);
  const required = ['id', 'reference', 'verse_text', 'translation', 'created_at'];

  required.forEach(col => {
    assert(columns.includes(col), `Missing required column: ${col}`);
  });

  return `Columns: ${columns.join(', ')}`;
});

test('Favorites table has unique constraint', () => {
  const indexes = db.exec("PRAGMA index_list(favorites)");
  // Note: SQLite creates an internal index for UNIQUE constraints
  // We'll test this functionally by trying to create duplicates
  return 'Will be tested functionally';
});

console.log('\n=== CRUD OPERATION TESTS ===\n');

// Clean up any existing test data
try {
  const existing = db.all("SELECT id FROM favorites WHERE reference LIKE 'TEST_%'");
  existing.forEach(row => {
    db.run('DELETE FROM favorites WHERE id = ?', [row.id]);
  });
} catch (e) {
  console.log('Note: No cleanup needed');
}

test('Create favorite - basic', () => {
  const result = favorites.create('TEST_1:1', 'This is test verse one', 'de4e12af7f28f599-02');
  assert(result.success === true, `Create failed: ${result.message}`);
  assert(result.message === 'Added to favorites successfully', 'Wrong success message');
  return result.message;
});

test('Create favorite - validation (missing parameters)', () => {
  const result = favorites.create('', '', '');
  assert(result.success === false, 'Should fail with empty parameters');
  assert(result.message === 'Missing required parameters', 'Wrong error message');
  return 'Validation works';
});

test('Retrieve favorites with getAll()', () => {
  const all = favorites.getAll();
  assert(Array.isArray(all), 'getAll did not return array');
  assert(all.length >= 1, 'Should have at least 1 favorite (the test one)');

  const testFav = all.find(f => f.reference === 'TEST_1:1');
  assert(testFav, 'Test favorite not found in results');
  assert(testFav.verse_text === 'This is test verse one', 'Verse text incorrect');
  assert(testFav.translation === 'de4e12af7f28f599-02', 'Translation incorrect');

  return `Found ${all.length} favorites`;
});

test('Retrieve favorites with sorting', () => {
  // Create another test favorite to test sorting
  favorites.create('TEST_2:2', 'This is test verse two', 'de4e12af7f28f599-01');

  const byDateDesc = favorites.getAll('created_at', 'DESC');
  const byDateAsc = favorites.getAll('created_at', 'ASC');

  assert(byDateDesc.length === byDateAsc.length, 'Different lengths for different sorts');
  // Most recent should be first in DESC
  const testFavs = byDateDesc.filter(f => f.reference.startsWith('TEST_'));
  assert(testFavs.length >= 2, 'Should have at least 2 test favorites');

  return `Sorting works, ${testFavs.length} test items`;
});

test('Get favorite by ID', () => {
  const all = favorites.getAll();
  const first = all[0];
  const retrieved = favorites.getById(first.id);

  assert(retrieved !== null, 'getById returned null for valid ID');
  assert(retrieved.id === first.id, 'Retrieved wrong favorite');
  assert(retrieved.reference === first.reference, 'Reference mismatch');

  return `Retrieved favorite ID ${first.id}`;
});

test('Check isFavorite()', () => {
  const isFav = favorites.isFavorite('TEST_1:1', 'de4e12af7f28f599-02');
  assert(isFav === true, 'isFavorite returned false for existing favorite');

  const isNotFav = favorites.isFavorite('TEST_999:999', 'fake-translation');
  assert(isNotFav === false, 'isFavorite returned true for non-existent favorite');

  return 'isFavorite detection works';
});

console.log('\n=== DUPLICATE PREVENTION TESTS ===\n');

test('Prevent duplicate favorites', () => {
  const result = favorites.create('TEST_1:1', 'This is test verse one', 'de4e12af7f28f599-02');
  assert(result.success === false, 'Duplicate was allowed');
  assert(result.isDuplicate === true, 'isDuplicate flag not set');
  assert(result.message === 'This verse is already in your favorites', 'Wrong duplicate message');

  return 'Duplicates prevented';
});

test('Same verse, different translation allowed', () => {
  const result = favorites.create('TEST_1:1', 'This is the same verse in ASV', 'de4e12af7f28f599-01');
  assert(result.success === true, `Should allow same verse in different translation: ${result.message}`);

  const kjvExists = favorites.isFavorite('TEST_1:1', 'de4e12af7f28f599-02');
  const asvExists = favorites.isFavorite('TEST_1:1', 'de4e12af7f28f599-01');

  assert(kjvExists === true, 'KJV version should exist');
  assert(asvExists === true, 'ASV version should exist');

  return 'Same verse, different translations work';
});

console.log('\n=== DELETE OPERATION TESTS ===\n');

test('Delete favorite - basic', () => {
  const all = favorites.getAll();
  const testFav = all.find(f => f.reference === 'TEST_2:2');
  assert(testFav, 'Test favorite for deletion not found');

  const result = favorites.delete(testFav.id);
  assert(result.success === true, `Delete failed: ${result.message}`);

  const stillExists = favorites.getById(testFav.id);
  assert(stillExists === null, 'Favorite still exists after deletion');

  return `Deleted favorite ID ${testFav.id}`;
});

test('Delete favorite - validation (invalid ID)', () => {
  const result = favorites.delete('not-a-number');
  assert(result.success === false, 'Should fail with invalid ID type');
  return 'ID validation works';
});

test('Delete favorite - not found', () => {
  const result = favorites.delete(999999);
  assert(result.success === false, 'Should fail for non-existent ID');
  assert(result.message === 'Favorite not found', 'Wrong error message');
  return 'Not found handling works';
});

console.log('\n=== HELPER METHOD TESTS ===\n');

test('Get favorite count', () => {
  const count = favorites.getCount();
  assert(typeof count === 'number', 'getCount did not return number');
  assert(count >= 0, 'Count should not be negative');

  const all = favorites.getAll();
  assert(count === all.length, `Count mismatch: getCount()=${count}, getAll().length=${all.length}`);

  return `Count: ${count}`;
});

test('Format date - Today', () => {
  const today = new Date().toISOString();
  const formatted = favorites.formatDate(today);
  assert(formatted === 'Today', `Expected "Today", got "${formatted}"`);
  return 'Today formatting works';
});

test('Format date - Yesterday', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const formatted = favorites.formatDate(yesterday.toISOString());
  assert(formatted === 'Yesterday', `Expected "Yesterday", got "${formatted}"`);
  return 'Yesterday formatting works';
});

test('Format date - Days ago', () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const formatted = favorites.formatDate(threeDaysAgo.toISOString());
  assert(formatted === '3 days ago', `Expected "3 days ago", got "${formatted}"`);
  return 'Days ago formatting works';
});

test('Format date - Older dates', () => {
  const oldDate = new Date('2025-01-01T00:00:00Z');
  const formatted = favorites.formatDate(oldDate.toISOString());
  assert(formatted.includes('Jan'), `Expected month name, got "${formatted}"`);
  return `Older date formatting: ${formatted}`;
});

test('Get translation display name - Known translations', () => {
  const kjv = favorites.getTranslationDisplayName('de4e12af7f28f599-02');
  assert(kjv === 'KJV', `Expected "KJV", got "${kjv}"`);

  const asv = favorites.getTranslationDisplayName('de4e12af7f28f599-01');
  assert(asv === 'ASV', `Expected "ASV", got "${asv}"`);

  const web = favorites.getTranslationDisplayName('9879dbb7cfe39e4d-01');
  assert(web === 'WEB', `Expected "WEB", got "${web}"`);

  return 'Known translations mapped correctly';
});

test('Get translation display name - Unknown translation', () => {
  const unknown = favorites.getTranslationDisplayName('unknown-translation-id-12345');
  assert(unknown.length === 8, `Expected 8 chars, got ${unknown.length}`);
  assert(unknown === 'unknown-', `Expected "unknown-", got "${unknown}"`);
  return 'Unknown translation fallback works';
});

console.log('\n=== CLEANUP TEST DATA ===\n');

test('Clean up test favorites', () => {
  const testFavs = db.all("SELECT id FROM favorites WHERE reference LIKE 'TEST_%'");
  testFavs.forEach(row => {
    db.run('DELETE FROM favorites WHERE id = ?', [row.id]);
  });

  const remaining = db.all("SELECT id FROM favorites WHERE reference LIKE 'TEST_%'");
  assert(remaining.length === 0, 'Test data not fully cleaned up');

  return `Cleaned up ${testFavs.length} test favorites`;
});

console.log('\n=== TEST SUMMARY ===\n');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 ALL AUTOMATED TESTS PASSED! 🎉\n');
  console.log('✅ Favorites module is working correctly');
  console.log('✅ Database schema is correct');
  console.log('✅ CRUD operations work as expected');
  console.log('✅ Duplicate prevention is working');
  console.log('✅ Helper methods are functional');
  console.log('\n⏭️  Next: Perform manual UI tests (see TESTING_VERIFICATION.md)');
} else {
  console.log('\n⚠️  SOME TESTS FAILED\n');
  console.log('Review the errors above and fix the issues.');
  console.log('Failed tests:');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  ❌ ${r.name}: ${r.error}`);
  });
}

console.log('\n=== DETAILED RESULTS ===\n');
console.table(results);

// Return results for programmatic access
window.favoritesTestResults = {
  passed: testsPassed,
  failed: testsFailed,
  total: testsPassed + testsFailed,
  successRate: ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1),
  results: results,
  timestamp: new Date().toISOString()
};

console.log('\nResults stored in: window.favoritesTestResults');
