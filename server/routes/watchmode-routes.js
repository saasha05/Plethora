// watchmode-routes.js
const express = require('express');
const router = express.Router();
const watchmode = require('../services/watchmode-integration');
const authMiddleware = require('../middleware/auth'); // Assuming you have auth middleware

// Get list of supported platforms
router.get('/platforms', (req, res) => {
  res.json({
    platforms: Object.values(watchmode.PLATFORM_MAPPING)
  });
});

// Search for media by title
router.get('/search', async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const result = await watchmode.searchAndAddTitle(query, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
// These should be protected with proper admin authentication
router.use('/admin', authMiddleware.adminOnly);

// Sync all titles from a specific platform
router.post('/admin/sync/platform', async (req, res) => {
  try {
    const { platform, limit } = req.body;
    
    if (!platform) {
      return res.status(400).json({ error: 'Platform name is required' });
    }
    
    // This is a long-running operation, so we start it async
    // and return immediately with a status message
    res.json({ message: `Syncing ${platform} titles started. This may take a while.` });
    
    // Run the sync process asynchronously
    watchmode.syncPlatformTitles(platform, limit)
      .then(stats => {
        console.log(`Sync completed for ${platform}:`, stats);
      })
      .catch(error => {
        console.error(`Sync failed for ${platform}:`, error);
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update platforms for all existing media
router.post('/admin/update/platforms', async (req, res) => {
  try {
    // This is a long-running operation, so we start it async
    // and return immediately with a status message
    res.json({ message: 'Platform update started. This may take a while.' });
    
    // Run the update process asynchronously
    watchmode.updateAllMediaPlatforms()
      .then(result => {
        console.log('Platform update completed:', result);
      })
      .catch(error => {
        console.error('Platform update failed:', error);
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync new releases
router.post('/admin/sync/new-releases', async (req, res) => {
  try {
    const { days } = req.body;
    
    // This is a long-running operation, so we start it async
    // and return immediately with a status message
    res.json({ 
      message: `Syncing new releases from the last ${days || 30} days started. This may take a while.` 
    });
    
    // Run the sync process asynchronously
    watchmode.syncNewReleases(days)
      .then(stats => {
        console.log('New releases sync completed:', stats);
      })
      .catch(error => {
        console.error('New releases sync failed:', error);
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
