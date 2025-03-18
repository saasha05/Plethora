// src/components/media/MediaSearch.js
import React, { useState } from 'react';
import { media } from '../../services/api';

const MediaSearch = ({ onMediaAdded }) => {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState({});
  const [addingMedia, setAddingMedia] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query || query.length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSearchResults([]);
      
      const response = await media.search(query, mediaType);
      
      if (response.data.success && response.data.media) {
        // Single result returned and added to database
        setSearchResults([response.data.media]);
      } else if (response.data.results) {
        // Multiple results returned
        setSearchResults(response.data.results);
      } else {
        setError('No results found. Try a different search term.');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
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

  const handleAddToWatched = async (mediaId) => {
    if (!selectedPlatform[mediaId]) {
      setError(`Please select which platform you watched this on.`);
      return;
    }
    
    try {
      setAddingMedia(prev => ({ ...prev, [mediaId]: true }));
      await media.addToWatched(mediaId, selectedPlatform[mediaId]);
      
      if (onMediaAdded) {
        onMediaAdded();
      }
      
      // Remove from results to show it was added
      setSearchResults(prev => prev.filter(item => item._id !== mediaId));
    } catch (err) {
      console.error('Failed to add media to watched:', err);
      setError('Failed to add to your watched list. Please try again.');
    } finally {
      setAddingMedia(prev => ({ ...prev, [mediaId]: false }));
    }
  };

  return (
    <div className="media-search">
      <h2>Add Content You've Watched</h2>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a movie or TV show"
          className="search-input"
        />
        
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
          className="type-select"
        >
          <option value="">All Types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
        
        <button type="submit" disabled={loading} className="search-button">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="search-results">
        {searchResults.length > 0 ? (
          <div className="results-list">
            {searchResults.map((item) => (
              <div key={item._id} className="media-result-card">
                <div className="media-info">
                  <h3>{item.title} ({item.releaseYear})</h3>
                  <div className="media-details">
                    <p>Type: {item.type === 'movie' ? 'Movie' : 'TV Show'}</p>
                    <p>Genres: {(item.genres || []).join(', ')}</p>
                    <p>IMDB: {item.imdbRating || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="media-actions">
                  <div className="platform-select">
                    <label htmlFor={`platform-${item._id}`}>Watched on:</label>
                    <select 
                      id={`platform-${item._id}`}
                      value={selectedPlatform[item._id] || ''}
                      onChange={(e) => handlePlatformChange(item._id, e.target.value)}
                    >
                      <option value="">Select platform</option>
                      {(item.platforms || []).map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={() => handleAddToWatched(item._id)}
                    disabled={addingMedia[item._id] || !selectedPlatform[item._id]}
                    className="add-button"
                  >
                    {addingMedia[item._id] ? 'Adding...' : 'Add to Watched'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && <p className="no-results">Search for media to add to your watched list.</p>
        )}
      </div>
    </div>
  );
};

export default MediaSearch;
