const express = require('express');

const router = express.Router();
const Case = require('../models/Case');
const logger = require('../utils/logger');

// Get all cases with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      region,
      district,
      state,
      disease,
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

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const cases = await Case.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit, 10))
      .skip(skip);

    const total = await Case.countDocuments(query);

    logger.info(`Fetched ${cases.length} cases`);

    res.json({
      data: cases,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error(`Error fetching cases: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch cases',
      message: error.message,
    });
  }
});

// Get case by ID
router.get('/:id', async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ data: caseData });
  } catch (error) {
    logger.error(`Error fetching case: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch case',
      message: error.message,
    });
  }
});

// Create new case
router.post('/', async (req, res) => {
  try {
    const caseData = new Case(req.body);
    const savedCase = await caseData.save();

    logger.info(`Created new case: ${savedCase._id}`);

    res.status(201).json({ data: savedCase });
  } catch (error) {
    logger.error(`Error creating case: ${error.message}`);
    res.status(400).json({
      error: 'Failed to create case',
      message: error.message,
    });
  }
});

module.exports = router;

