const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
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
    forecastDate: {
      type: Date,
      required: true,
      index: true,
    },
    predictedCases: {
      type: Number,
      required: true,
      min: 0,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    confidenceInterval: {
      lower: {
        type: Number,
        default: null,
      },
      upper: {
        type: Number,
        default: null,
      },
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    modelVersion: {
      type: String,
      default: '1.0.0',
    },
    features: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
predictionSchema.index({ region: 1, disease: 1, forecastDate: -1 });
predictionSchema.index({ district: 1, disease: 1, forecastDate: -1 });
predictionSchema.index({ riskLevel: 1, forecastDate: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
