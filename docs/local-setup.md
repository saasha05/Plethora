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
1. Download all dependencies
```shell
make all-deps
```

2. Download MongoDB and create a cluster
Create a `local.env` file wih the cluster URL

3. Run frontend and backend
```shell
make all-start
```

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
