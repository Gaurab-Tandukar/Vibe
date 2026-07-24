const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },

  // Reference to Message
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },

  fileUrl: {
    type: String,
    required: true,
    maxlength: 500
  },

  fileType: {
    type: String,
    required: true,
    trim: true
  },

  fileName: {
    type: String,
    required: true,
    trim: true
  },

  fileSize: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true,           // Adds createdAt & updatedAt
  collection: 'attachments'
});

// Indexes
attachmentSchema.index({ message: 1 });
attachmentSchema.index({ fileType: 1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);

module.exports = Attachment;