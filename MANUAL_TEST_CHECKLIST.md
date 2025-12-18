# Favorites Feature - Manual Testing Checklist

## Pre-Test Setup
- [x] Dev server running at http://localhost:3000
- [ ] Browser DevTools console open
- [ ] TESTING_VERIFICATION.md reviewed

## Automated Tests
- [ ] Run test-favorites.js in console
- [ ] All automated tests pass (0 failures)
- [ ] No console errors

## Manual UI Tests

### Test 1: Empty State
**Steps:**
1. Open browser DevTools Console
2. Run: `localStorage.clear()`
3. Reload page (F5)
4. Click "Favorites" tab

**Expected:**
- [ ] Shows large "⭐" icon
- [ ] Shows "No favorite verses yet."
- [ ] Shows helpful hint text
- [ ] No errors in console

---

### Test 2: Add Favorite from Reference Search
**Steps:**
1. Click "Search" tab
2. Type: `John 3:16`
3. Click "Search by Reference"
4. Wait for result to appear
5. Click "Add to Favorites" button

**Expected:**
- [ ] Alert shows: "⭐ Added to favorites!"
- [ ] No errors in console

---

### Test 3: Add Favorite from Keyword Search
**Steps:**
1. Click "Search" tab
2. Type: `love`
3. Click "Search by Keyword"
4. Wait for results to appear
5. Click "Add to Favorites" on any result

**Expected:**
- [ ] Alert shows: "⭐ Added to favorites!"
- [ ] No errors in console

---

### Test 4: View Favorites Page
**Steps:**
1. Click "Favorites" tab

**Expected:**
- [ ] Shows count: "2 favorite verses" (or correct number)
- [ ] Each favorite displays:
  - [ ] Reference in gold/accent color
  - [ ] Translation badge (e.g., "KJV")
  - [ ] Full verse text (readable)
  - [ ] Date ("Today")
  - [ ] "🗑️ Remove" button
- [ ] Items sorted by date (newest first)
- [ ] No errors in console

---

### Test 5: Duplicate Prevention
**Steps:**
1. Click "Search" tab
2. Search for "John 3:16" (already added)
3. Click "Add to Favorites" button

**Expected:**
- [ ] Alert shows: "⭐ This verse is already in your favorites!"
- [ ] Favorites count does NOT increase
- [ ] No errors in console

---

### Test 6: Same Verse, Different Translation
**Steps:**
1. Click "More" tab
2. Scroll to Settings section
3. Change "Preferred Translation" to "ASV"
4. Click "Search" tab
5. Search for "John 3:16"
6. Click "Add to Favorites"
7. Click "Favorites" tab

**Expected:**
- [ ] Alert shows: "⭐ Added to favorites!"
- [ ] Favorites page shows TWO entries for John 3:16
- [ ] One shows "KJV" badge
- [ ] One shows "ASV" badge
- [ ] Verse text differs between the two
- [ ] No errors in console

---

### Test 7: Delete Favorite
**Steps:**
1. On Favorites page, click "🗑️ Remove" on any item
2. Confirmation dialog appears
3. Click "OK"

**Expected:**
- [ ] Confirmation dialog asks: "Are you sure you want to remove this verse from your favorites?"
- [ ] After clicking OK, item disappears from list
- [ ] Count updates correctly
- [ ] If last item deleted, empty state appears
- [ ] No errors in console

---

### Test 8: Dark Mode
**Steps:**
1. Add 2-3 favorites if not already present
2. Go to Favorites page
3. Click "More" tab
4. Toggle "Dark Mode" switch
5. Click "Favorites" tab

**Expected in Dark Mode:**
- [ ] Reference text readable (gold color visible)
- [ ] Verse text readable (light color on dark background)
- [ ] Translation badge visible
- [ ] Item borders visible
- [ ] "Remove" button visible
- [ ] Good contrast throughout
- [ ] No white backgrounds bleeding through

**Then:**
6. Toggle Dark Mode OFF
7. Return to Favorites

**Expected in Light Mode:**
- [ ] Reference text readable
- [ ] Verse text readable (dark on light)
- [ ] All elements properly styled
- [ ] No errors in console

---

### Test 9: Offline Functionality
**Steps:**
1. Ensure you have 2-3 favorites
2. Open DevTools > Network tab
3. Select "Offline" from throttling dropdown
4. Click away from Favorites and back to "Search"
5. Click "Favorites" tab

**Expected:**
- [ ] Favorites page loads
- [ ] All verse text displays (not "Loading..." or blank)
- [ ] All data readable
- [ ] Offline banner may appear at top
- [ ] No network errors for favorites data

**Then:**
6. Set Network back to "Online"

---

### Test 10: Data Persistence
**Steps:**
1. Ensure you have 2-3 favorites
2. Note the count and references
3. Reload page (F5 or Ctrl+R)
4. Click "Favorites" tab

**Expected:**
- [ ] All favorites still present
- [ ] Count matches pre-reload
- [ ] All verse text intact
- [ ] No errors in console

---

### Test 11: Export/Import Data
**Steps:**
1. Ensure you have 2-3 favorites
2. Add 1 journal entry (for complete test)
3. Click "More" tab
4. Scroll to "Export Data" button
5. Click "Export Data"
6. Save the JSON file
7. Open the JSON file in a text editor
8. Verify it contains a `favorites` array
9. Back in browser, click "More" tab
10. Scroll to "Import Data" button
11. Run in console: `localStorage.clear()`
12. Reload page
13. Click "More" > "Import Data"
14. Select the JSON file
15. After import completes, click "Favorites" tab

**Expected:**
- [ ] Export downloads a JSON file
- [ ] JSON contains `favorites` array with objects
- [ ] Each favorite has: id, reference, verse_text, translation, created_at
- [ ] After import, Favorites page shows all items
- [ ] Verse text is present and readable
- [ ] Count is correct
- [ ] No errors in console

---

### Test 12: Responsive Design (Mobile)
**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M or click phone icon)
3. Select "iPhone 12 Pro" or similar
4. Navigate to Favorites page

**Expected:**
- [ ] Layout adapts to mobile width
- [ ] All text readable (not cut off)
- [ ] Buttons touchable (not too small)
- [ ] Scrolling works
- [ ] Bottom navigation visible
- [ ] No horizontal scrolling

**Then:**
5. Try "iPad" or tablet size

**Expected:**
- [ ] Layout works on tablet
- [ ] Good use of space

---

## Performance Tests

### Test 13: Performance with Many Favorites
**Steps:**
1. Run in console to create 50 test favorites:
```javascript
for (let i = 1; i <= 50; i++) {
  favorites.create(`TestPerf ${i}:${i}`, `This is test verse number ${i} for performance testing. Lorem ipsum dolor sit amet.`, 'de4e12af7f28f599-02');
}
```
2. Click "Favorites" tab
3. Scroll through the list
4. Click "Remove" on one item
5. Add another favorite from Search

**Expected:**
- [ ] Page loads quickly (< 1 second)
- [ ] Scrolling is smooth
- [ ] Delete is instant
- [ ] Add is instant
- [ ] No lag or freezing

**Cleanup:**
6. Run in console:
```javascript
const testPerf = db.all("SELECT id FROM favorites WHERE reference LIKE 'TestPerf%'");
testPerf.forEach(row => db.run('DELETE FROM favorites WHERE id = ?', [row.id]));
```

---

## Cross-Browser Tests

### Browser: Chrome/Edge
- [ ] All tests above pass
- [ ] No console errors

### Browser: Firefox
- [ ] All tests above pass
- [ ] No console errors

### Browser: Safari (if available)
- [ ] All tests above pass
- [ ] No console errors

---

## Final Checklist

### Functional Requirements
- [ ] ✅ Add favorites from reference search
- [ ] ✅ Add favorites from keyword search
- [ ] ✅ View all favorites
- [ ] ✅ Delete favorites
- [ ] ✅ Duplicate prevention
- [ ] ✅ Same verse in different translations
- [ ] ✅ Verse text stored for offline
- [ ] ✅ Data persists in localStorage
- [ ] ✅ Export/import includes favorites

### UI/UX Requirements
- [ ] ✅ Empty state displays
- [ ] ✅ Favorite items display correctly
- [ ] ✅ Dark mode styling works
- [ ] ✅ Responsive design works
- [ ] ✅ Confirmation dialog for deletion
- [ ] ✅ Success/error alerts work

### Technical Requirements
- [ ] ✅ Database migration works
- [ ] ✅ No console errors
- [ ] ✅ Module properly exported
- [ ] ✅ Follows existing patterns
- [ ] ✅ Offline functionality verified

---

## Issues Found

### Critical
- None

### Minor
- None

### Enhancements
- None

---

## Sign-Off

**Tester:** _________________
**Date:** _________________
**Status:** ☐ PASS  ☐ FAIL  ☐ NEEDS REVIEW
**Notes:**

