// Faith Dive - Main Application

import db from './database.js';
import bibleSearch from './bibleSearch.js';
import journal from './journal.js';
import theme from './theme.js';

console.log('Faith Dive App Loading...');

// Initialize database
async function initApp() {
  try {
    await db.init();
    console.log('✅ Database initialized');

    // Initialize theme
    theme.init();
    console.log('✅ Theme initialized');

    setupNavigation();
    setupOfflineDetection();

    // Load the default page (search)
    loadSearchPage();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('main-content').innerHTML =
      '<div class="card" style="background-color: #FFEBEE; color: #C62828;">Failed to load app. Please refresh.</div>';
  }
}

// Navigation handler
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const page = button.dataset.page;
      loadPage(page);
    });
  });
}

// Load search page
function loadSearchPage() {
  const mainContent = document.getElementById('main-content');

  mainContent.innerHTML = `
    <div class="card">
      <h2>Bible Search</h2>

      <!-- Search Mode Toggle -->
      <div class="search-mode-toggle">
        <button class="btn-toggle active" data-mode="reference">Reference</button>
        <button class="btn-toggle" data-mode="keyword">Keyword</button>
      </div>

      <!-- Reference Search -->
      <div id="reference-search" class="search-section">
        <div class="search-input-group">
          <input
            type="text"
            id="reference-input"
            class="search-input"
            placeholder="e.g., John 3:16 or Genesis 1:1-3"
          />
          <button class="btn-primary" id="reference-search-btn">Search</button>
        </div>
        <p class="search-help">Enter a Bible reference like "John 3:16" or "Psalm 23"</p>
      </div>

      <!-- Keyword Search -->
      <div id="keyword-search" class="search-section hidden">
        <div class="search-input-group">
          <input
            type="text"
            id="keyword-input"
            class="search-input"
            placeholder="e.g., love, faith, hope"
          />
          <button class="btn-primary" id="keyword-search-btn">Search</button>
        </div>
        <p class="search-help">Search for verses containing specific words</p>
      </div>

      <!-- Search Results -->
      <div id="search-results"></div>
    </div>
  `;

  setupSearchEventListeners();
}

// Setup search event listeners
function setupSearchEventListeners() {
  // Mode toggle
  const toggleBtns = document.querySelectorAll('.btn-toggle');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.dataset.mode;
      if (mode === 'reference') {
        document.getElementById('reference-search').classList.remove('hidden');
        document.getElementById('keyword-search').classList.add('hidden');
      } else {
        document.getElementById('reference-search').classList.add('hidden');
        document.getElementById('keyword-search').classList.remove('hidden');
      }
    });
  });

  // Reference search
  const refInput = document.getElementById('reference-input');
  const refBtn = document.getElementById('reference-search-btn');

  refBtn.addEventListener('click', () => searchByReference());
  refInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchByReference();
  });

  // Keyword search
  const keyInput = document.getElementById('keyword-input');
  const keyBtn = document.getElementById('keyword-search-btn');

  keyBtn.addEventListener('click', () => searchByKeyword());
  keyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchByKeyword();
  });
}

// Search by reference
async function searchByReference() {
  const input = document.getElementById('reference-input');
  const resultsDiv = document.getElementById('search-results');
  const reference = input.value.trim();

  if (!reference) {
    resultsDiv.innerHTML = '<p class="error-message">Please enter a Bible reference</p>';
    return;
  }

  resultsDiv.innerHTML = '<p class="loading">Searching...</p>';

  try {
    const result = await bibleSearch.searchByReference(reference);

    if (!result || !result.text) {
      resultsDiv.innerHTML = '<p class="error-message">Verse not found. Please check your reference.</p>';
      return;
    }

    resultsDiv.innerHTML = `
      <div class="verse-result">
        <h3 class="verse-reference">${result.reference}</h3>
        <div class="verse-text">${result.text}</div>
        <div class="verse-actions">
          <button class="btn-action" onclick="addToJournal('${escapeHtml(result.reference)}', '${escapeHtml(result.text)}')">
            📖 Add to Journal
          </button>
          <button class="btn-action" onclick="addToFavorites('${escapeHtml(result.reference)}')">
            ⭐ Add to Favorites
          </button>
        </div>
      </div>
    `;
  } catch (error) {
    resultsDiv.innerHTML = `<p class="error-message">${error.message}</p>`;
  }
}

// Search by keyword
async function searchByKeyword() {
  const input = document.getElementById('keyword-input');
  const resultsDiv = document.getElementById('search-results');
  const query = input.value.trim();

  if (!query) {
    resultsDiv.innerHTML = '<p class="error-message">Please enter a search term</p>';
    return;
  }

  resultsDiv.innerHTML = '<p class="loading">Searching...</p>';

  try {
    const results = await bibleSearch.searchByKeyword(query);

    if (!results || !results.verses || results.verses.length === 0) {
      resultsDiv.innerHTML = '<p class="error-message">No verses found.</p>';
      return;
    }

    let html = '<div class="search-results-list">';
    html += `<p class="results-count">Found ${results.total || results.verses.length} verse(s)</p>`;

    results.verses.forEach(verse => {
      html += `
        <div class="verse-result">
          <h3 class="verse-reference">${verse.reference}</h3>
          <div class="verse-text">${verse.text}</div>
          <div class="verse-actions">
            <button class="btn-action" onclick="addToJournal('${escapeHtml(verse.reference)}', '${escapeHtml(verse.text)}')">
              📖 Add to Journal
            </button>
            <button class="btn-action" onclick="addToFavorites('${escapeHtml(verse.reference)}')">
              ⭐ Add to Favorites
            </button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    resultsDiv.innerHTML = html;
  } catch (error) {
    resultsDiv.innerHTML = `<p class="error-message">${error.message}</p>`;
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load journal page
function loadJournalPage() {
  const mainContent = document.getElementById('main-content');
  const entries = journal.getAll();
  const entryCount = journal.getCount();

  mainContent.innerHTML = `
    <div class="card">
      <div class="journal-header">
        <h2>My Journal</h2>
        <button class="btn-primary" onclick="showJournalEntryModal()">
          ➕ New Entry
        </button>
      </div>

      ${entryCount === 0 ? `
        <div class="empty-state">
          <p>📖</p>
          <p>No journal entries yet.</p>
          <p class="empty-state-hint">
            Search for a Bible verse and click "Add to Journal" to create your first entry.
          </p>
        </div>
      ` : `
        <div class="journal-entries">
          ${entries.map(entry => `
            <div class="journal-entry" data-id="${entry.id}">
              <div class="journal-entry-header">
                <h3 class="journal-reference">${escapeHtml(entry.reference)}</h3>
                <span class="journal-date">${journal.formatDate(entry.timestamp)}</span>
              </div>
              <div class="journal-verse">${escapeHtml(entry.verse_text)}</div>
              <div class="journal-notes">${escapeHtml(entry.notes)}</div>
              <div class="journal-actions">
                <button class="btn-action-small" onclick="editJournalEntry(${entry.id})">
                  ✏️ Edit
                </button>
                <button class="btn-action-small btn-delete" onclick="deleteJournalEntry(${entry.id})">
                  🗑️ Delete
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Journal Entry Modal -->
    <div id="journal-modal" class="modal hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-title">New Journal Entry</h3>
          <button class="btn-close" onclick="closeJournalModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="entry-reference">Bible Reference</label>
            <input
              type="text"
              id="entry-reference"
              class="form-input"
              placeholder="e.g., John 3:16"
              required
            />
          </div>
          <div class="form-group">
            <label for="entry-verse">Verse Text</label>
            <textarea
              id="entry-verse"
              class="form-textarea"
              rows="4"
              placeholder="Enter the verse text..."
              required
            ></textarea>
          </div>
          <div class="form-group">
            <label for="entry-notes">My Notes</label>
            <textarea
              id="entry-notes"
              class="form-textarea"
              rows="6"
              placeholder="Write your thoughts, reflections, and insights..."
              required
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="closeJournalModal()">Cancel</button>
          <button class="btn-primary" onclick="saveJournalEntry()">Save Entry</button>
        </div>
      </div>
    </div>
  `;
}

// Show journal entry modal
window.showJournalEntryModal = function(reference = '', verseText = '', notes = '', entryId = null) {
  const modal = document.getElementById('journal-modal');
  const modalTitle = document.getElementById('modal-title');
  const refInput = document.getElementById('entry-reference');
  const verseInput = document.getElementById('entry-verse');
  const notesInput = document.getElementById('entry-notes');

  // Set title based on whether we're editing or creating
  modalTitle.textContent = entryId ? 'Edit Journal Entry' : 'New Journal Entry';

  // Pre-fill fields
  refInput.value = reference;
  verseInput.value = verseText;
  notesInput.value = notes;

  // Store entry ID if editing
  modal.dataset.entryId = entryId || '';

  // Show modal
  modal.classList.remove('hidden');

  // Focus on notes field if reference and verse are provided
  if (reference && verseText) {
    notesInput.focus();
  } else {
    refInput.focus();
  }
};

// Close journal modal
window.closeJournalModal = function() {
  const modal = document.getElementById('journal-modal');
  modal.classList.add('hidden');
  modal.dataset.entryId = '';
};

// Save journal entry
window.saveJournalEntry = function() {
  const modal = document.getElementById('journal-modal');
  const entryId = modal.dataset.entryId;
  const reference = document.getElementById('entry-reference').value.trim();
  const verseText = document.getElementById('entry-verse').value.trim();
  const notes = document.getElementById('entry-notes').value.trim();

  // Validation
  if (!reference || !verseText || !notes) {
    alert('Please fill in all fields');
    return;
  }

  try {
    if (entryId) {
      // Update existing entry
      journal.update(parseInt(entryId), reference, verseText, notes);
    } else {
      // Create new entry
      journal.create(reference, verseText, notes);
    }

    // Close modal and reload journal page
    closeJournalModal();
    loadJournalPage();
  } catch (error) {
    console.error('Error saving journal entry:', error);
    alert('Failed to save journal entry. Please try again.');
  }
};

// Edit journal entry
window.editJournalEntry = function(id) {
  const entry = journal.getById(id);

  if (entry) {
    showJournalEntryModal(entry.reference, entry.verse_text, entry.notes, id);
  }
};

// Delete journal entry
window.deleteJournalEntry = function(id) {
  if (confirm('Are you sure you want to delete this journal entry?')) {
    try {
      journal.delete(id);
      loadJournalPage();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      alert('Failed to delete journal entry. Please try again.');
    }
  }
};

// Add to journal (global function for onclick)
window.addToJournal = function(reference, verseText) {
  // Switch to journal tab
  const journalBtn = document.querySelector('[data-page="journal"]');
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(btn => btn.classList.remove('active'));
  journalBtn.classList.add('active');

  // Load journal page and open modal with pre-filled data
  loadJournalPage();

  // Small delay to ensure modal is rendered
  setTimeout(() => {
    showJournalEntryModal(reference, verseText, '');
  }, 100);
};

// Load more/settings page
function loadMorePage() {
  const mainContent = document.getElementById('main-content');
  const currentTheme = theme.getTheme();
  const journalCount = journal.getCount();

  mainContent.innerHTML = `
    <div class="card">
      <h2>Settings</h2>

      <!-- Theme Toggle -->
      <div class="settings-section">
        <div class="settings-item">
          <div class="settings-info">
            <h3 class="settings-title">🌙 Dark Mode</h3>
            <p class="settings-description">Toggle between light and dark theme</p>
          </div>
          <label class="theme-toggle">
            <input
              type="checkbox"
              id="theme-checkbox"
              ${currentTheme === 'dark' ? 'checked' : ''}
              onchange="toggleTheme()"
            />
            <span class="theme-slider"></span>
          </label>
        </div>
      </div>

      <!-- App Info -->
      <div class="settings-section">
        <h3 class="settings-section-title">App Information</h3>

        <div class="settings-item">
          <div class="settings-info">
            <h3 class="settings-title">📊 Journal Entries</h3>
            <p class="settings-description">${journalCount} ${journalCount === 1 ? 'entry' : 'entries'} saved</p>
          </div>
        </div>

        <div class="settings-item">
          <div class="settings-info">
            <h3 class="settings-title">📖 Bible Translation</h3>
            <p class="settings-description">King James Version (KJV)</p>
          </div>
        </div>
      </div>

      <!-- Data Management -->
      <div class="settings-section">
        <h3 class="settings-section-title">Data Management</h3>

        <button class="settings-button" onclick="exportData()">
          📤 Export All Data
        </button>

        <button class="settings-button" onclick="importData()">
          📥 Import Data
        </button>
      </div>

      <!-- About -->
      <div class="settings-section">
        <h3 class="settings-section-title">About</h3>
        <div class="about-text">
          <p><strong>Faith Dive</strong> - Bible Journaling App</p>
          <p>Version 1.0.0</p>
          <p>Your personal Bible study companion with local storage for complete privacy.</p>
        </div>
      </div>
    </div>
  `;
}

// Toggle theme
window.toggleTheme = function() {
  const newTheme = theme.toggle();
  console.log(`Theme switched to: ${newTheme}`);
};

// Export data
window.exportData = function() {
  try {
    const data = db.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `faithdive-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('✅ Data exported successfully!');
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('❌ Failed to export data. Please try again.');
  }
};

// Import data
window.importData = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (confirm('⚠️ This will replace all existing data. Continue?')) {
          db.importData(data, true);
          alert('✅ Data imported successfully!');
          loadMorePage(); // Reload to show updated stats
        }
      } catch (error) {
        console.error('Error importing data:', error);
        alert('❌ Invalid file format. Please select a valid Faith Dive backup file.');
      }
    };

    reader.readAsText(file);
  };

  input.click();
};

// Add to favorites (global function for onclick)
window.addToFavorites = function(reference) {
  // TODO: Implement favorites
  alert(`Adding "${reference}" to favorites (feature coming soon)`);
};

// Page loading
function loadPage(pageName) {
  const mainContent = document.getElementById('main-content');

  switch(pageName) {
    case 'search':
      loadSearchPage();
      break;
    case 'journal':
      loadJournalPage();
      break;
    case 'favorites':
      mainContent.innerHTML = `
        <div class="card">
          <h2>Favorites</h2>
          <p>Your favorite verses will appear here...</p>
        </div>
      `;
      break;
    case 'more':
      loadMorePage();
      break;
  }
}

// Offline detection
function setupOfflineDetection() {
  const banner = document.getElementById('offline-banner');

  window.addEventListener('online', () => banner.classList.add('hidden'));
  window.addEventListener('offline', () => banner.classList.remove('hidden'));

  // Check current status
  if (!navigator.onLine) {
    banner.classList.remove('hidden');
  }
}

// Start app
initApp();
