const mongoose = require('mongoose');

const conversationMemberSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },

  // References
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
    required: true
  },

  joinedAt: {
    type: Date,
    default: Date.now
  },

  lastReadAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,           // Adds createdAt & updatedAt
  collection: 'conversation_members'
});

// Compound unique index: One user can only be in a conversation once
conversationMemberSchema.index({ conversation: 1, user: 1 }, { unique: true });

// Indexes for performance
conversationMemberSchema.index({ conversation: 1 });
conversationMemberSchema.index({ user: 1 });

const ConversationMember = mongoose.model('ConversationMember', conversationMemberSchema);

module.exports = ConversationMember;