# Media Ranking System - Setup Guide

This guide will help you set up both the backend API and frontend application for the Media Ranking System.

## Backend Setup

### 1. Create the project structure

```bash
mkdir media-ranking-api
cd media-ranking-api
```

### 2. Initialize the project and install dependencies

```bash
npm init -y
npm install express mongoose body-parser cors jsonwebtoken axios node-cron dotenv
npm install --save-dev nodemon jest supertest
```

### 3. Create the file structure

```bash
mkdir models routes middleware services
touch app.js watchmode-integration.js .env
```

### 4. Add environment variables

Create a `.env` file in the root directory with the following content:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/media-ranking
JWT_SECRET=your_secure_jwt_secret_change_this_in_production
WATCHMODE_API_KEY=your_watchmode_api_key
```

### 5. Set up MongoDB

Ensure MongoDB is installed and running on your system. You can download it from [mongodb.com](https://www.mongodb.com/try/download/community).

### 6. Start the backend server

```bash
npm run dev
```

## Frontend Setup

### 1. Create the React application

```bash
npx create-react-app media-ranking-frontend
cd media-ranking-frontend
```

### 2. Install dependencies

```bash
npm install axios react-router-dom chart.js react-chartjs-2 @mantine/core @mantine/hooks @emotion/react
```

### 3. Create the project structure

```bash
mkdir -p src/components/auth
mkdir -p src/components/media
mkdir -p src/components/ranking
mkdir -p src/components/subscription
mkdir -p src/context
mkdir -p src/hooks
mkdir -p src/pages
mkdir -p src/services
mkdir -p src/styles
```

### 4. Create environment variables

Create a `.env` file in the root of the frontend project:

```
REACT_APP_API_URL=http://localhost:3000/api
```

### 5. Start the frontend application

```bash
npm start
```

## Testing the Application

1. Register a new user at http://localhost:3000
2. Search for media and add it to your watched list
3. Make pairwise comparisons to build your rankings
4. View your personalized rankings and subscription recommendations

## Getting a Watchmode API Key

1. Go to [Watchmode API](https://api.watchmode.com/) and sign up for an account
2. Subscribe to a plan (they offer a free tier)
3. Get your API key from the dashboard
4. Add it to your `.env` file in the backend project

## Next Steps

- Set up proper authentication with password hashing
- Deploy the application to a hosting service
- Implement additional features like social sharing
- Add more visualization options for rankings
