const mongoose = require('mongoose');

const logisticsSchema = new mongoose.Schema(
  {
    region: {
      type: String,
      required: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      index: true,
    },
    stockLevel: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    suggestedAction: {
      type: String,
      default: null,
    },
    actionType: {
      type: String,
      enum: ['reallocate', 'restock', 'dispatch', 'alert', null],
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
logisticsSchema.index({ region: 1, lastUpdated: -1 });
logisticsSchema.index({ district: 1, lastUpdated: -1 });
logisticsSchema.index({ priority: 1, lastUpdated: -1 });

module.exports = mongoose.model('Logistics', logisticsSchema);
