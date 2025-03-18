// src/components/ranking/ComparisonCard.js
import React, { useState, useEffect } from 'react';
import { ranking, media } from '../../services/api';

const ComparisonCard = ({ onComplete }) => {
  const [pair, setPair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState({});
  const [platformOptions, setPlatformOptions] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch comparison pair
  useEffect(() => {
    fetchComparisonPair();
  }, []);

  const fetchComparisonPair = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ranking.getComparisonPair();
      setPair(response.data);
      
      // Initialize platform selection options
      const options = {};
      if (response.data.item1 && response.data.item1.platforms) {
        options[response.data.item1._id] = response.data.item1.platforms;
      }
      if (response.data.item2 && response.data.item2.platforms) {
        options[response.data.item2._id] = response.data.item2.platforms;
      }
      setPlatformOptions(options);
    } catch (err) {
      console.error('Failed to fetch comparison pair:', err);
      setError('No more items to compare or an error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformChange = (mediaId, platform) => {
    setSelectedPlatform(prev => ({
      ...prev,
      [mediaId]: platform
    }));
  };

  const handleSelect = async (winnerId, loserId) => {
    if (!selectedPlatform[winnerId]) {
      setError(`Please select which platform you watched the winner on.`);
      return;
    }

    try {
      setSubmitting(true);
      // First record where the user watched each item
      await media.addToWatched(winnerId, selectedPlatform[winnerId]);
      if (selectedPlatform[loserId]) {
        await media.addToWatched(loserId, selectedPlatform[loserId]);
      }
      
      // Then submit the comparison
      await ranking.submitComparison(winnerId, loserId);
      
      if (onComplete) {
        onComplete();
      }
      
      // Get the next pair
      fetchComparisonPair();
    } catch (err) {
      console.error('Failed to submit comparison:', err);
      setError('Failed to submit your comparison. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading comparison...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchComparisonPair}>Try Again</button>
      </div>
    );
  }

  if (!pair || !pair.item1 || !pair.item2) {
    return (
      <div className="no-items">
        <p>No more items to compare! Add more content to your watched list.</p>
      </div>
    );
  }

  const { item1, item2 } = pair;

  return (
    <div className="comparison-card">
      <h2>Which did you enjoy more?</h2>
      
      <div className="comparison-options">
        <div className="comparison-item">
          <div className="media-card">
            <h3>{item1.title} ({item1.releaseYear})</h3>
            <div className="media-details">
              <p>Type: {item1.type === 'movie' ? 'Movie' : 'TV Show'}</p>
              <p>Genres: {(item1.genres || []).join(', ')}</p>
              <p>IMDB: {item1.imdbRating || 'N/A'}</p>
            </div>
            
            <div className="platform-select">
              <label htmlFor={`platform-${item1._id}`}>Watched on:</label>
              <select 
                id={`platform-${item1._id}`}
                value={selectedPlatform[item1._id] || ''}
                onChange={(e) => handlePlatformChange(item1._id, e.target.value)}
              >
                <option value="">Select platform</option>
                {(platformOptions[item1._id] || []).map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
            
            <button 
              className="select-button"
              disabled={submitting || !selectedPlatform[item1._id]}
              onClick={() => handleSelect(item1._id, item2._id)}
            >
              I preferred this one
            </button>
          </div>
        </div>
        
        <div className="comparison-versus">VS</div>
        
        <div className="comparison-item">
          <div className="media-card">
            <h3>{item2.title} ({item2.releaseYear})</h3>
            <div className="media-details">
              <p>Type: {item2.type === 'movie' ? 'Movie' : 'TV Show'}</p>
              <p>Genres: {(item2.genres || []).join(', ')}</p>
              <p>IMDB: {item2.imdbRating || 'N/A'}</p>
            </div>
            
            <div className="platform-select">
              <label htmlFor={`platform-${item2._id}`}>Watched on:</label>
              <select 
                id={`platform-${item2._id}`}
                value={selectedPlatform[item2._id] || ''}
                onChange={(e) => handlePlatformChange(item2._id, e.target.value)}
              >
                <option value="">Select platform</option>
                {(platformOptions[item2._id] || []).map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
            
            <button 
              className="select-button"
              disabled={submitting || !selectedPlatform[item2._id]}
              onClick={() => handleSelect(item2._id, item1._id)}
            >
              I preferred this one
            </button>
          </div>
        </div>
      </div>
      
      <div className="comparison-skip">
        <button 
          onClick={fetchComparisonPair}
          disabled={submitting}
        >
          Skip this comparison
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ComparisonCard;
