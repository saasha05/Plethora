// routes/comparisons.js
const express = require('express');
const router = express.Router();
const Comparison = require('../models/Comparison');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const rankingService = require('../services/ranking');

// Submit a comparison
router.post('/', authMiddleware.authenticate, async (req, res) => {
  try {
    const { winner, loser } = req.body;
    
    if (!winner || !loser) {
      return res.status(400).json({ error: 'Winner and loser IDs are required' });
    }
    
    // Create the comparison
    const newComparison = new Comparison({
      userId: req.userId,
      winner,
      loser
    });
    
    await newComparison.save();
    
    // Update rankings based on new comparison
    await rankingService.updateRankings(req.userId);
    
    res.status(201).json(newComparison);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get comparison history for a user
router.get('/history', authMiddleware.authenticate, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const totalCount = await Comparison.countDocuments({ userId: req.userId });
    
    const comparisons = await Comparison.find({ userId: req.userId })
      .populate('winner')
      .populate('loser')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      results: comparisons,
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

// Delete a comparison (and update rankings)
router.delete('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const comparison = await Comparison.findById(req.params.id);
    
    if (!comparison) {
      return res.status(404).json({ error: 'Comparison not found' });
    }
    
    // Only allow users to delete their own comparisons
    if (comparison.userId.toString() !== req.userId && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await comparison.remove();
    
    // Update rankings
    await rankingService.updateRankings(req.userId);
    
    res.json({ message: 'Comparison deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
