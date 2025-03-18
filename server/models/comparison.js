// models/Comparison.js
const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  winner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Media', 
    required: true 
  },
  loser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Media', 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

const Comparison = mongoose.model('Comparison', comparisonSchema);

module.exports = Comparison;
