const express = require('express');

const router = express.Router();
const Prediction = require('../models/Prediction');
const logger = require('../utils/logger');

// Get all predictions with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      region,
      district,
      state,
      disease,
      riskLevel,
      startDate,
      endDate,
      limit = 100,
      page = 1,
    } = req.query;

    const query = {};

    if (region) query.region = region;
    if (district) query.district = district;
    if (state) query.state = state;
    if (disease) query.disease = disease;
    if (riskLevel) query.riskLevel = riskLevel;

    if (startDate || endDate) {
      query.forecastDate = {};
      if (startDate) query.forecastDate.$gte = new Date(startDate);
      if (endDate) query.forecastDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const predictions = await Prediction.find(query)
      .sort({ forecastDate: -1 })
      .limit(parseInt(limit, 10))
      .skip(skip);

    const total = await Prediction.countDocuments(query);

    logger.info(`Fetched ${predictions.length} predictions`);

    res.json({
      data: predictions,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error(`Error fetching predictions: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch predictions',
      message: error.message,
    });
  }
});

// Get prediction by ID
router.get('/:id', async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json({ data: prediction });
  } catch (error) {
    logger.error(`Error fetching prediction: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch prediction',
      message: error.message,
    });
  }
});

// Create new prediction
router.post('/', async (req, res) => {
  try {
    const prediction = new Prediction(req.body);
    const savedPrediction = await prediction.save();

    logger.info(`Created new prediction: ${savedPrediction._id}`);

    res.status(201).json({ data: savedPrediction });
  } catch (error) {
    logger.error(`Error creating prediction: ${error.message}`);
    res.status(400).json({
      error: 'Failed to create prediction',
      message: error.message,
    });
  }
});

module.exports = router;
