// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const dotenv = require('dotenv');

// Load environment variables
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const mediaRoutes = require('./routes/media');
const userRoutes = require('./routes/users');
const comparisonsRoutes = require('./routes/comparisons');
const watchmodeRoutes = require('./routes/watchmode-routes');
const watchmodeIntegration = require('./services/watchmode-integration');

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
//TODO fix this
const MONGODB_URI = process.env.MONGODB_URI
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comparisons', comparisonsRoutes);
app.use('/api/watchmode', watchmodeRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Media Ranking API is running');
});

// Schedule tasks to keep data fresh
// Update new releases every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily sync of new releases');
  try {
    const result = await watchmodeIntegration.syncNewReleases(7); // Sync last 7 days
    console.log('New releases sync completed:', result);
  } catch (error) {
    console.error('New releases sync failed:', error);
  }
});

// Update all media platforms once a week on Sunday at 2am
cron.schedule('0 2 * * 0', async () => {
  console.log('Running weekly update of all media platforms');
  try {
    const result = await watchmodeIntegration.updateAllMediaPlatforms();
    console.log('Platform update completed:', result);
  } catch (error) {
    console.error('Platform update failed:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
