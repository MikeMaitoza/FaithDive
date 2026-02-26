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
