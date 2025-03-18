// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Media = require('../models/media');
const Comparison = require('../models/Comparison');
const authMiddleware = require('../middleware/auth');
const rankingService = require('../services/ranking');

// Middleware to replace "me" with the actual user ID
router.param('userId', (req, res, next, id) => {
  if (id === 'me' && req.userId) {
    req.params.userId = req.userId;
  }
  next();
});

// Get user profile by ID
router.get('/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Only allow users to view their own profile unless they're an admin
    if (req.params.userId !== req.userId && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user subscriptions
router.put('/:userId/subscriptions', authMiddleware.authenticate, async (req, res) => {
  try {
    // Only allow users to update their own subscriptions
    if (req.params.userId !== req.userId && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { subscriptions } = req.body;
    
    if (!Array.isArray(subscriptions)) {
      return res.status(400).json({ error: 'Subscriptions must be an array' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { subscriptions },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's watched media with rankings
router.get('/:userId/rankings', authMiddleware.authenticate, async (req, res) => {
  try {
    // Only allow users to view their own rankings
    if (req.params.userId !== req.userId && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const user = await User.findById(req.params.userId)
      .populate('rankings.mediaId')
      .select('rankings');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Sort rankings by rank
    const sortedRankings = [...user.rankings].sort((a, b) => a.rank - b.rank);
    
    res.json(sortedRankings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's rankings by category
router.get('/:userId/rankings/:category', authMiddleware.authenticate, async (req, res) => {
  try {
    // Only allow users to view their own rankings
    if (req.params.userId !== req.userId && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { category } = req.params;
    const validCategories = ['genre', 'platform', 'type', 'language', 'length', 'rating'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const user = await User.findById(req.params.userId)
      .populate('rankings.mediaId')
      .select('rankings');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Group and process rankings by category
    const categoryRankings = rankingService.groupRankingsByCategory(user.rankings, category);
    
    res.json(categoryRankings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pair for comparison
router.get('/:userId/comparison-pair', authMiddleware.authenticate, async (req, res) => {
  try {
    // Only allow users to get their own comparison pairs
    if (req.params.userId !== req.userId && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get the user's watched media
    const watchedMediaIds = user.rankings.map(r => r.mediaId);
    
    if (watchedMediaIds.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 watched items to compare' });
    }
    
    // Find the comparison pair with fewest comparisons
    const pair = await rankingService.findNextComparisonPair(req.params.userId, watchedMediaIds);
    
    if (!pair) {
      return res.status(404).json({ error: 'No valid comparison pair found' });
    }
    
    res.json(pair);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add media to watched list
router.post('/:userId/watched', authMiddleware.authenticate, async (req, res) => {
  try {
    // Only allow users to update their own watched list
    if (req.params.userId !== req.userId && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { mediaId, watchedOn } = req.body;
    
    if (!mediaId) {
      return res.status(400).json({ error: 'Media ID is required' });
    }
    
    // Verify the media exists
    const mediaExists = await Media.exists({ _id: mediaId });
    if (!mediaExists) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already in rankings
    const existingIndex = user.rankings.findIndex(r => 
      r.mediaId.toString() === mediaId
    );
    
    if (existingIndex !== -1) {
      // Update platform if needed
      if (user.rankings[existingIndex].watchedOn !== watchedOn) {
        user.rankings[existingIndex].watchedOn = watchedOn;
        await user.save();
      }
      return res.json(user.rankings[existingIndex]);
    }
    
    // Add to rankings at the end
    const newRank = user.rankings.length > 0 ? 
      Math.max(...user.rankings.map(r => r.rank)) + 1 : 1;
    
    user.rankings.push({
      mediaId,
      rank: newRank,
      watchedOn
    });
    
    await user.save();
    res.status(201).json(user.rankings[user.rankings.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get subscription recommendations
router.get('/:userId/subscription-recommendations', authMiddleware.authenticate, async (req, res) => {
  try {
    // Only allow users to get their own recommendations
    if (req.params.userId !== req.userId && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate subscription recommendations
    const recommendations = await rankingService.generateSubscriptionRecommendations(req.params.userId);
    
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
