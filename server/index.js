const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const config = require('./config');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // We'll configure this properly later
}));

// Compression
app.use(compression());

// CORS
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const bibleRouter = require('./routes/bible');
app.use('/api/bible', bibleRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Faith Dive API' });
});

// Serve static files with cache control
// JS and CSS files: no-cache (rely on service worker + version params)
// Other assets: cache for 1 hour
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      // No cache for JS/CSS - always check for updates
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (filePath.endsWith('.html')) {
      // No cache for HTML
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      // Cache other assets (images, fonts, etc.) for 1 hour
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Catch-all route for SPA - serves frontend for non-API routes
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server only when run directly (not when imported for tests)
if (require.main === module) {
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`✅ Faith Dive server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${config.nodeEnv}`);
  });
}

module.exports = app;
