require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  bibleApi: {
    key: process.env.BIBLE_API_KEY,
    baseUrl: process.env.BIBLE_API_BASE_URL || 'https://api.scripture.api.bible/v1'
  }
};
