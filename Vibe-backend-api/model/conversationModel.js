const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },

  name: {
    type: String,
    trim: true,
    maxlength: 100
  },

  isGroup: {
    type: Boolean,
    default: false
  },

  // Improved fields
  lastMessageAt: {
    type: Date,
    default: null
  },

  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'conversations'
});

conversationSchema.index({ isGroup: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ participants: 1 });

conversationSchema.virtual('members', {
  ref: 'ConversationMember',
  localField: '_id',
  foreignField: 'conversation'
});

conversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation'
});

conversationSchema.virtual('lastMessage', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation',
  justOne: true,
  options: { sort: { createdAt: -1 } }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;