require('dotenv').config({ path: require('path').join(__dirname, '../..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../db/connection');
const Case = require('../models/Case');
const Prediction = require('../models/Prediction');
const Logistics = require('../models/Logistics');
const logger = require('../utils/logger');

const sampleRegions = [
  { region: 'Pune', district: 'Pune', state: 'Maharashtra' },
  { region: 'Mumbai', district: 'Mumbai', state: 'Maharashtra' },
  { region: 'Delhi', district: 'New Delhi', state: 'Delhi' },
  { region: 'Bangalore', district: 'Bangalore Urban', state: 'Karnataka' },
  { region: 'Chennai', district: 'Chennai', state: 'Tamil Nadu' },
  { region: 'Nagpur', district: 'Nagpur', state: 'Maharashtra' },
  { region: 'Hyderabad', district: 'Hyderabad', state: 'Telangana' },
  { region: 'Kolkata', district: 'Kolkata', state: 'West Bengal' },
];

const diseases = ['Dengue', 'Malaria', 'COVID-19', 'Flu', 'Cholera'];

async function seedCases() {
  logger.info('Seeding cases...');
  const cases = [];

  // Generate cases for the last 30 days
  // Ensure each region has data for ALL diseases on each day for forecasting
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    for (const regionData of sampleRegions) {
      // Generate data for ALL diseases, not just random ones
      for (const disease of diseases) {
        const newCases = Math.floor(Math.random() * 50) + 1;
        const totalCases = Math.floor(Math.random() * 1000) + newCases;

        cases.push({
          region: regionData.region,
          district: regionData.district,
          state: regionData.state,
          disease,
          date: new Date(date),
          newCases,
          totalCases,
          population: Math.floor(Math.random() * 5000000) + 1000000,
          temperature: Math.floor(Math.random() * 15) + 25, // 25-40°C
          humidity: Math.floor(Math.random() * 40) + 50, // 50-90%
          rainfall: Math.random() * 20, // 0-20mm
          source: 'seed',
        });
      }
    }
  }

  await Case.insertMany(cases);
  logger.info(`Seeded ${cases.length} cases`);
}

async function seedPredictions() {
  logger.info('Seeding predictions...');
  const predictions = [];

  // Generate predictions for next 14 days
  for (let i = 1; i <= 14; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i);

    for (const regionData of sampleRegions) {
      const disease = diseases[Math.floor(Math.random() * diseases.length)];
      const riskScore = Math.random();
      let riskLevel = 'low';
      if (riskScore > 0.8) riskLevel = 'critical';
      else if (riskScore > 0.6) riskLevel = 'high';
      else if (riskScore > 0.3) riskLevel = 'medium';

      const predictedCases = Math.floor(riskScore * 200) + 10;
      const confidence = 0.7 + Math.random() * 0.25; // 0.7-0.95

      predictions.push({
        region: regionData.region,
        district: regionData.district,
        state: regionData.state,
        disease,
        forecastDate: new Date(forecastDate),
        predictedCases,
        confidence,
        confidenceInterval: {
          lower: Math.floor(predictedCases * 0.8),
          upper: Math.floor(predictedCases * 1.2),
        },
        riskLevel,
        riskScore,
        modelVersion: '1.0.0',
        features: {
          historicalCases: Math.floor(Math.random() * 100),
          temperature: Math.floor(Math.random() * 15) + 25,
          humidity: Math.floor(Math.random() * 40) + 50,
        },
      });
    }
  }

  await Prediction.insertMany(predictions);
  logger.info(`Seeded ${predictions.length} predictions`);
}

async function seedLogistics() {
  logger.info('Seeding logistics...');
  const logistics = [];

  const medicines = ['paracetamol', 'doxycycline', 'chloroquine', 'ivermectin', 'remdesivir'];

  for (const regionData of sampleRegions) {
    const stockLevel = {};
    medicines.forEach((med) => {
      stockLevel[med] = Math.floor(Math.random() * 2000) + 100;
    });

    const riskScore = Math.random();
    let priority = 'medium';
    let suggestedAction = null;
    let actionType = null;

    if (riskScore > 0.7) {
      priority = 'high';
      suggestedAction = `High risk detected. Consider reallocating stock from neighboring districts.`;
      actionType = 'reallocate';
    } else if (riskScore > 0.5) {
      priority = 'medium';
      suggestedAction = `Monitor stock levels closely. Current levels are adequate.`;
      actionType = 'alert';
    }

    logistics.push({
      region: regionData.region,
      district: regionData.district,
      state: regionData.state,
      stockLevel,
      lastUpdated: new Date(),
      suggestedAction,
      actionType,
      priority,
    });
  }

  await Logistics.insertMany(logistics);
  logger.info(`Seeded ${logistics.length} logistics records`);
}

async function seed() {
  try {
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    logger.info('Clearing existing seed data...');
    await Case.deleteMany({ source: 'seed' });
    await Prediction.deleteMany({ modelVersion: '1.0.0' });
    await Logistics.deleteMany({});

    // Seed data
    await seedCases();
    await seedPredictions();
    await seedLogistics();

    logger.info('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Seeding failed: ${error.message}`, error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;
