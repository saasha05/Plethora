// models/Media.js
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  type: { 
    type: String, 
    enum: ['movie', 'tv'], 
    required: true 
  },
  platforms: [{ 
    type: String 
  }],
  genres: [{ 
    type: String 
  }],
  languages: [{ 
    type: String 
  }],
  imdbRating: { 
    type: Number 
  },
  imdbId: { 
    type: String 
  },
  tmdbId: { 
    type: String 
  },
  watchmodeId: { 
    type: String 
  },
  length: { 
    type: Number // minutes for movies, episodes for TV shows
  },
  releaseYear: { 
    type: Number 
  },
  poster: {
    type: String
  },
  backdrop: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the timestamp when document is modified
mediaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const media = mongoose.model('media', mediaSchema);

module.exports = media;
