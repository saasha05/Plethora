// src/components/subscription/SubscriptionRecommendations.js
import React, { useState, useEffect } from 'react';
import { subscription } from '../../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const SubscriptionRecommendations = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRecommendations();
    fetchPlatforms();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subscription.getRecommendations();
      setRecommendations(response.data);
      
      // Initialize selected platforms with current subscriptions
      if (response.data.currentSubscriptions) {
        setSelectedPlatforms(response.data.currentSubscriptions);
      }
    } catch (err) {
      console.error('Failed to fetch subscription recommendations:', err);
      setError('Failed to load subscription recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await subscription.getPlatforms();
      setPlatforms(response.data.platforms);
    } catch (err) {
      console.error('Failed to fetch platforms:', err);
    }
  };

  const handlePlatformToggle = (platform) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        return prev.filter((p) => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const handleUpdateSubscriptions = async () => {
    try {
      setUpdating(true);
      await subscription.updateSubscriptions(selectedPlatforms);
      fetchRecommendations(); // Refresh recommendations
    } catch (err) {
      console.error('Failed to update subscriptions:', err);
      setError('Failed to update your subscriptions. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!recommendations || !recommendations.platformDetails) return null;

    const labels = recommendations.platformDetails.map(p => p.platform);
    const data = recommendations.platformDetails.map(p => p.mediaCount);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#C9CBCF',
            '#7BC4C4',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading) {
    return <div className="loading">Loading subscription recommendations...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchRecommendations}>Try Again</button>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="no-recommendations">
        <p>No recommendations available. Start ranking media to get personalized recommendations!</p>
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <div className="subscription-recommendations">
      <h2>Subscription Recommendations</h2>
      
      <div className="recommendation-stats">
        <div className="stat-card">
          <h3>Current Coverage</h3>
          <div className="stat-value">{recommendations.currentCoverage}%</div>
          <p>of your ranked media is available on your current subscriptions</p>
        </div>
        
        <div className="stat-card highlight">
          <h3>Optimal Coverage</h3>
          <div className="stat-value">{recommendations.optimalCoverage}%</div>
          <p>coverage with recommended subscriptions</p>
        </div>
      </div>
      
      <div className="recommendation-details">
        <div className="chart-container">
          <h3>Content Distribution by Platform</h3>
          {chartData && <Pie data={chartData} />}
        </div>
        
        <div className="recommendation-list">
          <h3>Recommended Subscriptions</h3>
          <ul className="platform-list">
            {recommendations.recommendedSubscriptions.map(platform => (
              <li key={platform} className="platform-item recommended">
                {platform} - {recommendations.platformDetails.find(p => p.platform === platform)?.coveragePercentage}% of your content
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="subscription-manager">
        <h3>Manage Your Subscriptions</h3>
        <div className="platform-checkboxes">
          {platforms.map(platform => (
            <div key={platform} className="platform-checkbox">
              <input
                type="checkbox"
                id={`platform-${platform}`}
                checked={selectedPlatforms.includes(platform)}
                onChange={() => handlePlatformToggle(platform)}
              />
              <label htmlFor={`platform-${platform}`}>
                {platform}
                {recommendations.recommendedSubscriptions.includes(platform) && 
                  <span className="recommended-badge">Recommended</span>
                }
              </label>
            </div>
          ))}
        </div>
        
        <button 
          className="update-button"
          onClick={handleUpdateSubscriptions}
          disabled={updating}
        >
          {updating ? 'Updating...' : 'Update Subscriptions'}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionRecommendations;
