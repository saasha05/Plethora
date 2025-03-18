// services/ranking.js
const User = require('../models/User');
const Media = require('../models/media');
const Comparison = require('../models/Comparison');

/**
 * Update rankings based on all pairwise comparisons for a user
 */
async function updateRankings(userId) {
  // Get all comparisons for the user
  const comparisons = await Comparison.find({ userId });
  
  // Count wins for each media
  const wins = {};
  const losses = {};
  const mediaSet = new Set();
  
  comparisons.forEach(comp => {
    const winnerId = comp.winner.toString();
    const loserId = comp.loser.toString();
    
    mediaSet.add(winnerId);
    mediaSet.add(loserId);
    
    if (!wins[winnerId]) wins[winnerId] = 0;
    if (!losses[winnerId]) losses[winnerId] = 0;
    if (!wins[loserId]) wins[loserId] = 0;
    if (!losses[loserId]) losses[loserId] = 0;
    
    wins[winnerId]++;
    losses[loserId]++;
  });
  
  // Calculate win percentage
  const mediaArray = Array.from(mediaSet);
  const rankings = mediaArray.map(id => {
    const totalComparisons = (wins[id] || 0) + (losses[id] || 0);
    const winPercentage = totalComparisons > 0 ? 
      (wins[id] || 0) / totalComparisons : 0;
    return { mediaId: id, winPercentage };
  });
  
  // Sort by win percentage (descending)
  rankings.sort((a, b) => b.winPercentage - a.winPercentage);
  
  // Update user's rankings
  const user = await User.findById(userId);
  
  if (!user) return;
  
  // For each media in the ranking, update its rank
  for (let i = 0; i < rankings.length; i++) {
    const mediaId = rankings[i].mediaId;
    const index = user.rankings.findIndex(r => 
      r.mediaId.toString() === mediaId
    );
    
    if (index !== -1) {
      user.rankings[index].rank = i + 1;
    }
  }
  
  await user.save();
  return rankings;
}

/**
 * Find the next comparison pair for a user
 */
async function findNextComparisonPair(userId, watchedMediaIds) {
  // Get all previous comparisons for the user
  const comparisons = await Comparison.find({ userId });
  
  // Create all possible pairs
  const pairs = [];
  for (let i = 0; i < watchedMediaIds.length; i++) {
    for (let j = i + 1; j < watchedMediaIds.length; j++) {
      const id1 = watchedMediaIds[i];
      const id2 = watchedMediaIds[j];
      
      // Count how many times this pair has been compared
      const count = comparisons.filter(c => 
        (c.winner.equals(id1) && c.loser.equals(id2)) || 
        (c.winner.equals(id2) && c.loser.equals(id1))
      ).length;
      
      pairs.push({ id1, id2, count });
    }
  }
  
  // Sort by count and take the first pair
  pairs.sort((a, b) => a.count - b.count);
  
  if (pairs.length === 0) {
    return null;
  }
  
  const pair = pairs[0];
  
  // Get media details
  const item1 = await Media.findById(pair.id1);
  const item2 = await Media.findById(pair.id2);
  
  if (!item1 || !item2) {
    return null;
  }
  
  return { item1, item2 };
}

/**
 * Group rankings by category
 */
function groupRankingsByCategory(rankings, category) {
  const result = {};
  
  for (const ranking of rankings) {
    if (!ranking.mediaId) continue;
    
    let categoryValues;
    
    switch(category) {
      case 'genre':
        categoryValues = ranking.mediaId.genres || [];
        break;
      case 'platform':
        categoryValues = [ranking.watchedOn];
        break;
      case 'language':
        categoryValues = ranking.mediaId.languages || [];
        break;
      case 'type':
        categoryValues = [ranking.mediaId.type];
        break;
      case 'length':
        // Categorize length
        const length = ranking.mediaId.length;
        if (ranking.mediaId.type === 'movie') {
          if (length < 90) categoryValues = ['Short (<90 min)'];
          else if (length < 120) categoryValues = ['Medium (90-120 min)'];
          else categoryValues = ['Long (>120 min)'];
        } else {
          if (length < 10) categoryValues = ['Short (<10 episodes)'];
          else if (length < 50) categoryValues = ['Medium (10-50 episodes)'];
          else categoryValues = ['Long (>50 episodes)'];
        }
        break;
      case 'rating':
        // Categorize IMDb rating
        const rating = ranking.mediaId.imdbRating;
        if (!rating) categoryValues = ['Unrated'];
        else if (rating < 5) categoryValues = ['Below Average (<5)'];
        else if (rating < 7) categoryValues = ['Average (5-7)'];
        else if (rating < 8) categoryValues = ['Good (7-8)'];
        else categoryValues = ['Excellent (8+)'];
        break;
      default:
        categoryValues = ['Unknown'];
    }
    
    // Add to each category it belongs to
    for (const value of categoryValues) {
      if (!result[value]) {
        result[value] = [];
      }
      result[value].push({
        rank: ranking.rank,
        media: ranking.mediaId,
        watchedOn: ranking.watchedOn
      });
    }
  }
  
  // Sort items within each category
  for (const key in result) {
    result[key].sort((a, b) => a.rank - b.rank);
  }
  
  return result;
}

/**
 * Generate subscription recommendations
 */
async function generateSubscriptionRecommendations(userId) {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get all media ranked by user
  const userRankings = await User.findById(userId)
    .populate('rankings.mediaId')
    .select('rankings');
  
  // Count media per platform
  const platformCounts = {};
  const platformMediaIds = {};
  
  userRankings.rankings.forEach(ranking => {
    if (!ranking.mediaId) return;
    
    const platforms = ranking.mediaId.platforms || [];
    
    platforms.forEach(platform => {
      if (!platformCounts[platform]) {
        platformCounts[platform] = 0;
        platformMediaIds[platform] = new Set();
      }
      platformCounts[platform]++;
      platformMediaIds[platform].add(ranking.mediaId._id.toString());
    });
  });
  
  // Find optimal combination (greedy approach)
  const allPlatforms = Object.keys(platformCounts);
  const selectedPlatforms = [];
  let coveredMediaIds = new Set();
  
  while (true) {
    let bestPlatform = null;
    let bestNewCoverage = 0;
    
    for (const platform of allPlatforms) {
      if (selectedPlatforms.includes(platform)) continue;
      
      const platformMediaSet = platformMediaIds[platform];
      let newCoverage = 0;
      
      for (const mediaId of platformMediaSet) {
        if (!coveredMediaIds.has(mediaId)) {
          newCoverage++;
        }
      }
      
      if (newCoverage > bestNewCoverage) {
        bestNewCoverage = newCoverage;
        bestPlatform = platform;
      }
    }
    
    // Stop if no more coverage can be added
    if (bestNewCoverage === 0) break;
    
    // Add the best platform
    selectedPlatforms.push(bestPlatform);
    
    // Update covered media
    for (const mediaId of platformMediaIds[bestPlatform]) {
      coveredMediaIds.add(mediaId);
    }
  }
  
  // Calculate coverage percentages
  const totalMedia = userRankings.rankings.length;
  const recommendations = selectedPlatforms.map(platform => {
    const coverage = (platformCounts[platform] / totalMedia) * 100;
    return {
      platform,
      mediaCount: platformCounts[platform],
      coveragePercentage: Math.round(coverage * 10) / 10
    };
  });
  
  // Calculate current coverage
  const currentPlatforms = user.subscriptions || [];
  let currentCoveredCount = 0;
  const currentCoveredMediaIds = new Set();
  
  currentPlatforms.forEach(platform => {
    if (platformMediaIds[platform]) {
      platformMediaIds[platform].forEach(mediaId => {
        if (!currentCoveredMediaIds.has(mediaId)) {
          currentCoveredMediaIds.add(mediaId);
          currentCoveredCount++;
        }
      });
    }
  });
  
  const currentCoveragePercentage = 
    totalMedia > 0 ? (currentCoveredCount / totalMedia) * 100 : 0;
  
  const optimalCoveragePercentage = 
    totalMedia > 0 ? (coveredMediaIds.size / totalMedia) * 100 : 0;
  
  return {
    currentSubscriptions: currentPlatforms,
    currentCoverage: Math.round(currentCoveragePercentage * 10) / 10,
    recommendedSubscriptions: selectedPlatforms,
    optimalCoverage: Math.round(optimalCoveragePercentage * 10) / 10,
    platformDetails: recommendations
  };
}

module.exports = {
  updateRankings,
  findNextComparisonPair,
  groupRankingsByCategory,
  generateSubscriptionRecommendations
};
