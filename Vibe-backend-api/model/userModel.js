const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },

  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 100
  },

  passwordHash: {
    type: String,
    required: true
  },

  avatarUrl: {
    type: String,
    maxlength: 500
  },

  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },

  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER'
  },

  isOnline: {
    type: Boolean,
    default: false
  },

  socketId: {
    type: String,
    default: null
  },

  lastSeen: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;