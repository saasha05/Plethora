import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
const Home = () => {
  const { currentUser } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  
  // Redirect if already logged in
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="home-container">
      {/* Home page content */}
      <div className="home-content">
        <div className="app-info">
          <h1>Media Ranking System</h1>
          <p>Discover your true preferences through pairwise comparisons.</p>
          <ul>
            <li>Rank movies and TV shows you've watched</li>
            <li>Get personalized streaming service recommendations</li>
            <li>View rankings by genre, platform, and more</li>
          </ul>
        </div>
        
        <div className="auth-container">
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${showLogin ? 'active' : ''}`}
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>
            <button 
              className={`auth-tab ${!showLogin ? 'active' : ''}`}
              onClick={() => setShowLogin(false)}
            >
              Sign Up
            </button>
          </div>
          
          <div className="auth-form-container">
            {showLogin ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;