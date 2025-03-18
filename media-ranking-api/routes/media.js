// routes/media.js
const express = require('express');
const router = express.Router();
const Media = require('../models/media');
const authMiddleware = require('../middleware/auth');

// Get all media with optional filters
router.get('/', async (req, res) => {
  try {
    const { type, genre, platform, search, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (genre) {
      query.genres = { $in: [genre] };
    }
    
    if (platform) {
      query.platforms = { $in: [platform] };
    }
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    const totalCount = await Media.countDocuments(query);
    const media = await Media.find(query)
      .sort({ title: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      results: media,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get media by ID
router.get('/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new media (protected)
router.post('/', authMiddleware.authenticate, async (req, res) => {
  try {
    const newMedia = new Media(req.body);
    await newMedia.save();
    
    res.status(201).json(newMedia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update media (protected)
router.put('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const media = await Media.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    res.json(media);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete media (admin only)
router.delete('/:id', authMiddleware.adminOnly, async (req, res) => {
  try {
    const media = await Media.findByIdAndDelete(req.params.id);
    
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    res.json({ message: 'Media deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
