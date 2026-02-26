const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', '..', 'public');
const swContent = fs.readFileSync(path.join(publicDir, 'sw.js'), 'utf-8');
const appContent = fs.readFileSync(path.join(publicDir, 'js', 'app.js'), 'utf-8');
const htmlContent = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');

describe('Service worker consistency', () => {
  test('cache version in sw.js matches index.html cache-busting param', () => {
    const swVersionMatch = swContent.match(/CACHE_VERSION\s*=\s*'([^']+)'/);
    expect(swVersionMatch).not.toBeNull();
    const swVersion = swVersionMatch[1];

    // index.html uses ?v=X.Y.Z on style.css
    const htmlVersionMatch = htmlContent.match(/style\.css\?v=([^"']+)/);
    expect(htmlVersionMatch).not.toBeNull();
    const htmlVersion = htmlVersionMatch[1];

    expect(swVersion).toBe(htmlVersion);
  });

  test('STATIC_ASSETS includes all JS files in public/js/', () => {
    const jsFiles = fs.readdirSync(path.join(publicDir, 'js'))
      .filter(f => f.endsWith('.js'));

    jsFiles.forEach(file => {
      expect(swContent).toContain(`/js/${file}`);
    });
  });

  test('STATIC_ASSETS includes all CSS files in public/css/', () => {
    const cssFiles = fs.readdirSync(path.join(publicDir, 'css'))
      .filter(f => f.endsWith('.css'));

    cssFiles.forEach(file => {
      expect(swContent).toContain(`/css/${file}`);
    });
  });

  test('registers install event handler', () => {
    expect(swContent).toMatch(/self\.addEventListener\(\s*['"]install['"]/);
  });

  test('registers activate event handler', () => {
    expect(swContent).toMatch(/self\.addEventListener\(\s*['"]activate['"]/);
  });

  test('registers fetch event handler', () => {
    expect(swContent).toMatch(/self\.addEventListener\(\s*['"]fetch['"]/);
  });

  test('registers message event handler', () => {
    expect(swContent).toMatch(/self\.addEventListener\(\s*['"]message['"]/);
  });

  test('excludes API requests from caching', () => {
    expect(swContent).toContain("/api/");
  });
});

describe('App module consistency', () => {
  test('app.js imports all JS modules listed in STATIC_ASSETS', () => {
    // Extract JS file paths from sw.js STATIC_ASSETS (excluding app.js itself)
    const assetMatches = swContent.match(/\/js\/\w+\.js/g) || [];
    const moduleFiles = assetMatches
      .map(p => p.replace('/js/', ''))
      .filter(f => f !== 'app.js');

    moduleFiles.forEach(file => {
      const moduleName = file.replace('.js', '');
      expect(appContent).toContain(`./${moduleName}.js`);
    });
  });

  test('loadPage handles all four navigation pages', () => {
    const expectedPages = ['search', 'journal', 'favorites', 'more'];

    expectedPages.forEach(page => {
      expect(appContent).toContain(`case '${page}'`);
    });
  });

  test('service worker registration path matches actual file', () => {
    expect(appContent).toContain("register('/sw.js')");
    const swExists = fs.existsSync(path.join(publicDir, 'sw.js'));
    expect(swExists).toBe(true);
  });
});

describe('Version consistency across all cache-busting params', () => {
  const swVersionMatch = swContent.match(/CACHE_VERSION\s*=\s*'([^']+)'/);
  const swVersion = swVersionMatch ? swVersionMatch[1] : null;

  test('all ?v= params in index.html match CACHE_VERSION', () => {
    expect(swVersion).not.toBeNull();
    const versionParams = htmlContent.match(/\?v=([^"'\s]+)/g) || [];
    expect(versionParams.length).toBeGreaterThan(0);

    versionParams.forEach(param => {
      const version = param.replace('?v=', '');
      expect(version).toBe(swVersion);
    });
  });

  test('index.html has cache-busting params on all local script tags', () => {
    const localScripts = htmlContent.match(/src="\/js\/[^"]+"/g) || [];
    localScripts.forEach(src => {
      expect(src).toMatch(/\?v=/);
    });
  });

  test('index.html has cache-busting params on all local stylesheet links', () => {
    const localStyles = htmlContent.match(/href="\/css\/[^"]+"/g) || [];
    localStyles.forEach(href => {
      expect(href).toMatch(/\?v=/);
    });
  });
});

describe('Service worker update notification', () => {
  const cssContent = fs.readFileSync(path.join(publicDir, 'css', 'style.css'), 'utf-8');

  test('app.js listens for updatefound on registration', () => {
    expect(appContent).toMatch(/addEventListener\(\s*['"]updatefound['"]/);
  });

  test('app.js listens for statechange on installing worker', () => {
    expect(appContent).toMatch(/addEventListener\(\s*['"]statechange['"]/);
  });

  test('app.js creates update-banner element', () => {
    expect(appContent).toContain('update-banner');
  });

  test('style.css has update-banner styles', () => {
    expect(cssContent).toContain('.update-banner');
  });
});
