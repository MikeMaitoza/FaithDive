const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', '..', 'public');
const appContent = fs.readFileSync(path.join(publicDir, 'js', 'app.js'), 'utf-8');
const swContent = fs.readFileSync(path.join(publicDir, 'sw.js'), 'utf-8');
const htmlContent = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');

describe('Special character safety', () => {
  test('escapeAttr handles ampersands', () => {
    expect(appContent).toMatch(/\.replace\([^)]*&[^)]*&amp;/);
  });

  test('escapeAttr handles double quotes', () => {
    expect(appContent).toMatch(/\.replace\([^)]*"[^)]*&quot;/);
  });

  test('escapeAttr handles single quotes', () => {
    expect(appContent).toMatch(/\.replace\([^)]*'[^)]*&#39;/);
  });

  test('escapeAttr handles less-than', () => {
    expect(appContent).toMatch(/\.replace\([^)]*<[^)]*&lt;/);
  });

  test('escapeAttr handles greater-than', () => {
    expect(appContent).toMatch(/\.replace\([^)]*>[^)]*&gt;/);
  });

  test('all data-reference attributes use escapeAttr', () => {
    const rawRefPattern = /data-reference="\$\{(?!escapeAttr)/g;
    const rawMatches = appContent.match(rawRefPattern) || [];
    expect(rawMatches).toHaveLength(0);
  });

  test('all data-text attributes use escapeAttr', () => {
    const rawTextPattern = /data-text="\$\{(?!escapeAttr)/g;
    const rawMatches = appContent.match(rawTextPattern) || [];
    expect(rawMatches).toHaveLength(0);
  });
});

describe('Service worker versioned URL handling', () => {
  test('fetch handler uses url.pathname for API exclusion, not url.href', () => {
    expect(swContent).toContain('url.pathname.startsWith');
    expect(swContent).toMatch(/url\.pathname\.startsWith\(\s*['"]\/api\//);
  });

  test('index.html uses cache-busting query params on scripts', () => {
    const scriptTags = htmlContent.match(/<script[^>]+src="\/js\/[^"]+\?v=/g) || [];
    expect(scriptTags.length).toBeGreaterThan(0);
  });

  test('index.html uses cache-busting query params on stylesheets', () => {
    const linkTags = htmlContent.match(/<link[^>]+href="\/css\/[^"]+\?v=/g) || [];
    expect(linkTags.length).toBeGreaterThan(0);
  });
});

describe('Offline fallback', () => {
  test('index.html contains offline banner element', () => {
    expect(htmlContent).toContain('id="offline-banner"');
  });

  test('app.js listens for online event', () => {
    expect(appContent).toMatch(/addEventListener\(\s*['"]online['"]/);
  });

  test('app.js listens for offline event', () => {
    expect(appContent).toMatch(/addEventListener\(\s*['"]offline['"]/);
  });

  test('app.js calls setupOfflineDetection during init', () => {
    expect(appContent).toContain('setupOfflineDetection()');
  });

  test('app.js checks navigator.onLine for initial state', () => {
    expect(appContent).toContain('navigator.onLine');
  });

  test('searchByReference checks online status before API call', () => {
    // Extract the searchByReference function body
    const fnMatch = appContent.match(/async function searchByReference\(\)[\s\S]*?^}/m);
    expect(fnMatch).not.toBeNull();
    expect(fnMatch[0]).toContain('navigator.onLine');
  });

  test('searchByKeyword checks online status before API call', () => {
    const fnMatch = appContent.match(/async function searchByKeyword\(\)[\s\S]*?^}/m);
    expect(fnMatch).not.toBeNull();
    expect(fnMatch[0]).toContain('navigator.onLine');
  });
});

describe('cleanVerseText handles long verses', () => {
  test('cleanVerseText uses stripHtml for HTML removal', () => {
    expect(appContent).toMatch(/function cleanVerseText[\s\S]*?stripHtml/);
  });

  test('cleanVerseText collapses whitespace', () => {
    expect(appContent).toMatch(/cleanVerseText[\s\S]*?\\s\+/);
  });

  test('cleanVerseText removes paragraph markers', () => {
    expect(appContent).toContain('¶');
  });

  test('all data-text values pass through cleanVerseText before escapeAttr', () => {
    const dataTextAssignments = appContent.match(/data-text="\$\{escapeAttr\(([^)]+)\)/g) || [];
    dataTextAssignments.forEach(assignment => {
      expect(assignment).toContain('cleanText');
    });
  });
});

describe('Event delegation and onclick handler safety', () => {
  test('search results use event delegation, not inline onclick', () => {
    // The search result buttons should NOT use onclick
    // They use event delegation via resultsDiv.addEventListener
    expect(appContent).toMatch(/resultsDiv\.addEventListener\(\s*['"]click['"]/);
  });

  test('all inline onclick handlers reference window-assigned functions', () => {
    // Extract all onclick="functionName(...)" from template literals in app.js
    const onclickMatches = appContent.match(/onclick="(\w+)\(/g) || [];
    const calledFunctions = onclickMatches.map(m => m.match(/onclick="(\w+)\(/)[1]);

    // Extract all window.functionName assignments
    const windowAssignments = appContent.match(/window\.(\w+)\s*=/g) || [];
    const windowFunctions = windowAssignments.map(m => m.match(/window\.(\w+)/)[1]);

    calledFunctions.forEach(fn => {
      expect(windowFunctions).toContain(fn);
    });
  });

  test('all onchange handlers reference window-assigned functions', () => {
    const onchangeMatches = appContent.match(/onchange="(\w+)\(/g) || [];
    const calledFunctions = onchangeMatches.map(m => m.match(/onchange="(\w+)\(/)[1]);

    const windowAssignments = appContent.match(/window\.(\w+)\s*=/g) || [];
    const windowFunctions = windowAssignments.map(m => m.match(/window\.(\w+)/)[1]);

    calledFunctions.forEach(fn => {
      expect(windowFunctions).toContain(fn);
    });
  });
});

describe('Responsive design breakpoints', () => {
  const cssContent = fs.readFileSync(path.join(publicDir, 'css', 'style.css'), 'utf-8');

  test('has small phone breakpoint (max-width: 375px)', () => {
    expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*375px\s*\)/);
  });

  test('has tablet/desktop breakpoint (min-width: 768px)', () => {
    expect(cssContent).toMatch(/@media\s*\(\s*min-width:\s*768px\s*\)/);
  });

  test('small phone breakpoint styles search input group', () => {
    expect(cssContent).toContain('.search-input-group');
  });

  test('tablet breakpoint constrains main-content width', () => {
    expect(cssContent).toContain('.main-content');
  });
});
