const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },

  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  content: {
    type: String,
    trim: true
  },

  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },

  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  isEdited: {
    type: Boolean,
    default: false
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  // Improved field
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'messages'
});

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

messageSchema.virtual('attachments', {
  ref: 'Attachment',
  localField: '_id',
  foreignField: 'message'
});

messageSchema.virtual('reactions', {
  ref: 'Reaction',
  localField: '_id',
  foreignField: 'message'
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;