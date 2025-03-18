// src/components/ranking/RankingsList.js
import React, { useState, useEffect } from 'react';
import { ranking } from '../../services/api';

const RankingsList = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('');
  const [categoryRankings, setCategoryRankings] = useState({});

  useEffect(() => {
    fetchRankings();
  }, []);

  useEffect(() => {
    if (category) {
      fetchCategoryRankings(category);
    }
  }, [category]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ranking.getRankings();
      setRankings(response.data);
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
      setError('Failed to load your rankings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryRankings = async (categoryName) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ranking.getRankingsByCategory(categoryName);
      setCategoryRankings(response.data);
    } catch (err) {
      console.error(`Failed to fetch ${categoryName} rankings:`, err);
      setError(`Failed to load ${categoryName} rankings. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  if (loading && !rankings.length) {
    return <div className="loading">Loading rankings...</div>;
  }

  if (error && !rankings.length) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchRankings}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="rankings-container">
      <h2>Your Media Rankings</h2>
      
      <div className="category-selector">
        <label htmlFor="category">Filter by category:</label>
        <select id="category" value={category} onChange={handleCategoryChange}>
          <option value="">Overall Ranking</option>
          <option value="genre">Genre</option>
          <option value="platform">Platform</option>
          <option value="type">Media Type</option>
          <option value="language">Language</option>
          <option value="length">Length</option>
          <option value="rating">IMDB Rating</option>
        </select>
      </div>
      
      {category ? (
        <div className="category-rankings">
          {loading ? (
            <div className="loading">Loading {category} rankings...</div>
          ) : (
            <>
              {Object.keys(categoryRankings).length === 0 ? (
                <p>No rankings available for this category.</p>
              ) : (
                Object.entries(categoryRankings).map(([categoryValue, items]) => (
                  <div key={categoryValue} className="category-section">
                    <h3>{categoryValue}</h3>
                    <table className="rankings-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Year</th>
                          <th>Rating</th>
                          <th>Watched On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.media._id}>
                            <td>{item.rank}</td>
                            <td>{item.media.title}</td>
                            <td>{item.media.type === 'movie' ? 'Movie' : 'TV Show'}</td>
                            <td>{item.media.releaseYear}</td>
                            <td>{item.media.imdbRating || 'N/A'}</td>
                            <td>{item.watchedOn}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      ) : (
        <div className="overall-rankings">
          {rankings.length === 0 ? (
            <p>You haven't ranked any media yet. Start comparing to build your rankings!</p>
          ) : (
            <table className="rankings-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Year</th>
                  <th>Rating</th>
                  <th>Watched On</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((item) => (
                  <tr key={item.mediaId._id}>
                    <td>{item.rank}</td>
                    <td>{item.mediaId.title}</td>
                    <td>{item.mediaId.type === 'movie' ? 'Movie' : 'TV Show'}</td>
                    <td>{item.mediaId.releaseYear}</td>
                    <td>{item.mediaId.imdbRating || 'N/A'}</td>
                    <td>{item.watchedOn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default RankingsList;
