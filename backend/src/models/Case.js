const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
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
    disease: {
      type: String,
      required: true,
      enum: ['Dengue', 'Malaria', 'COVID-19', 'Flu', 'Cholera', 'Other'],
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    newCases: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCases: {
      type: Number,
      default: 0,
      min: 0,
    },
    population: {
      type: Number,
      default: null,
    },
    temperature: {
      type: Number,
      default: null,
    },
    humidity: {
      type: Number,
      default: null,
    },
    rainfall: {
      type: Number,
      default: null,
    },
    source: {
      type: String,
      default: 'manual',
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
caseSchema.index({ region: 1, disease: 1, date: -1 });
caseSchema.index({ district: 1, disease: 1, date: -1 });
caseSchema.index({ state: 1, disease: 1, date: -1 });

module.exports = mongoose.model('Case', caseSchema);
