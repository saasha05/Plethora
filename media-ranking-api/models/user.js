// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  subscriptions: [{ 
    type: String 
  }],
  rankings: [{
    mediaId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Media' 
    },
    rank: { 
      type: Number 
    },
    watchedOn: { 
      type: String 
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
