# Media Ranking System

A pairwise comparison system for ranking movies and TV shows across different streaming platforms.

## Features

- **Pairwise Ranking**: Build your personal media rankings through simple A/B comparisons
- **Category-Based Rankings**: View your rankings by genre, platform, language, and more
- **Subscription Optimization**: Get personalized recommendations for which streaming services best match your preferences
- **Media Search**: Easily add content you've watched to your rankings
- **Platform Tracking**: Track which platforms you used to watch each show or movie

## Technical Overview

This project consists of two main parts:

1. **Backend API**: Node.js + Express + MongoDB for data storage and business logic
2. **Frontend Application**: React-based user interface

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- Watchmode API Key (for fetching media data)

### Installation

#### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/media-ranking-system.git
cd media-ranking-system
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Create a `.env` file in the backend directory:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/media-ranking
JWT_SECRET=your_jwt_secret_key
WATCHMODE_API_KEY=your_watchmode_api_key
```

4. Start the backend server:
```bash
npm start
```

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../media-ranking-frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:3000/api
```

4. Start the frontend development server:
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login

### Media
- `GET /api/media` - Get all media
- `GET /api/media/:id` - Get media by ID
- `POST /api/media` - Add new media

### Rankings
- `GET /api/users/me/comparison-pair` - Get pair for comparison
- `POST /api/comparisons` - Submit a comparison
- `GET /api/users/me/rankings` - Get user's media rankings
- `GET /api/users/me/rankings/:category` - Get rankings by category

### Subscriptions
- `GET /api/users/me/subscription-recommendations` - Get subscription recommendations
- `PUT /api/users/me/subscriptions` - Update user subscriptions

### Watchmode Integration
- `GET /api/watchmode/search` - Search for media by title
- `GET /api/watchmode/platforms` - Get list of supported platforms
- `POST /api/watchmode/admin/sync/platform` - Admin route to sync a platform
- `POST /api/watchmode/admin/update/platforms` - Admin route to update all platforms
- `POST /api/watchmode/admin/sync/new-releases` - Admin route to sync new releases

## Architecture

The system uses a pairwise comparison algorithm to generate rankings, which works as follows:

1. The user compares two items at a time, selecting their preference
2. After multiple comparisons, a win/loss ratio is calculated for each item
3. Items are ranked based on this ratio, creating a personalized ranking

This approach has several advantages:
- Simple decisions for the user (just pick A or B)
- Produces more accurate rankings than direct rating systems
- Automatically adjusts as user preferences change
- Works well with small or large content libraries

## Continuous Data Updates

The system includes scheduled jobs to keep media data fresh:
- Daily synchronization of new releases
- Weekly update of platform availability for all content

## License

This project is licensed under the MIT License - see the LICENSE file for details.
