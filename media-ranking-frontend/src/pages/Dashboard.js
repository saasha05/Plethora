// src/pages/Dashboard.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ComparisonCard from '../components/ranking/ComparisonCard';
import RankingsList from '../components/ranking/RankingsList';
import SubscriptionRecommendations from '../components/subscription/SubscriptionRecommendations';
import MediaSearch from '../components/media/MediaSearch';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('compare');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMediaAdded = () => {
    // Trigger a refresh of the comparison component
    setRefreshKey(prev => prev + 1);
  };

  const handleComparisonComplete = () => {
    // Trigger a refresh of the rankings
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Media Ranking Dashboard</h1>
        <p>Welcome, {currentUser?.username}!</p>
      </header>
      
      <nav className="dashboard-nav">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            Compare
          </button>
          <button 
            className={`tab ${activeTab === 'rankings' ? 'active' : ''}`}
            onClick={() => setActiveTab('rankings')}
          >
            Rankings
          </button>
          <button 
            className={`tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            Subscriptions
          </button>
          <button 
            className={`tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Content
          </button>
        </div>
      </nav>
      
      <main className="dashboard-content">
        {activeTab === 'compare' && (
          <div className="tab-content">
            <ComparisonCard key={refreshKey} onComplete={handleComparisonComplete} />
          </div>
        )}
        
        {activeTab === 'rankings' && (
          <div className="tab-content">
            <RankingsList key={refreshKey} />
          </div>
        )}
        
        {activeTab === 'subscriptions' && (
          <div className="tab-content">
            <SubscriptionRecommendations key={refreshKey} />
          </div>
        )}
        
        {activeTab === 'add' && (
          <div className="tab-content">
            <MediaSearch onMediaAdded={handleMediaAdded} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
