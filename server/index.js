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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Faith Dive API' });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

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

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`✅ Faith Dive server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${config.nodeEnv}`);
});

module.exports = app;
