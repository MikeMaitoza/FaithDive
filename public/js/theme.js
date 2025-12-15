// Theme Module - Manage light/dark mode

class Theme {
  constructor() {
    this.currentTheme = 'light';
  }

  /**
   * Initialize theme from saved settings
   */
  init() {
    const savedTheme = this.getSavedTheme();
    this.setTheme(savedTheme);
  }

  /**
   * Get saved theme from database
   */
  getSavedTheme() {
    const setting = db.get('SELECT value FROM settings WHERE key = ?', ['theme']);
    return setting && setting.value === 'dark' ? 'dark' : 'light';
  }

  /**
   * Set theme (light or dark)
   */
  setTheme(theme) {
    this.currentTheme = theme;

    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Save to database
    this.saveTheme(theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1A1410' : '#D4AF37');
    }
  }

  /**
   * Toggle between light and dark mode
   */
  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Save theme preference to database
   */
  saveTheme(theme) {
    db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['theme', theme]
    );
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode() {
    return this.currentTheme === 'dark';
  }
}

// Create and export global instance
window.theme = new Theme();

export default window.theme;
