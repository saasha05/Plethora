import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscription } from '../../services/api';

const RegisterForm = () => {
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    subscriptions: []
  });
  const [platforms, setPlatforms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch available platforms
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await subscription.getPlatforms();
        setPlatforms(response.data.platforms);
      } catch (err) {
        console.error('Failed to fetch platforms:', err);
      }
    };
    fetchPlatforms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubscriptionToggle = (platform) => {
    setUserData((prev) => {
      const subscriptions = [...prev.subscriptions];
      if (subscriptions.includes(platform)) {
        return {
          ...prev,
          subscriptions: subscriptions.filter((sub) => sub !== platform)
        };
      } else {
        return {
          ...prev,
          subscriptions: [...subscriptions, platform]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (userData.password !== userData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await register({
        username: userData.username,
        password: userData.password,
        subscriptions: userData.subscriptions
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-form">
      <h2>Create an Account</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={userData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={userData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Your Streaming Subscriptions</label>
          <div className="subscription-checkboxes">
            {platforms.map((platform) => (
              <div key={platform} className="subscription-option">
                <input
                  type="checkbox"
                  id={`platform-${platform}`}
                  checked={userData.subscriptions.includes(platform)}
                  onChange={() => handleSubscriptionToggle(platform)}
                />
                <label htmlFor={`platform-${platform}`}>{platform}</label>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;