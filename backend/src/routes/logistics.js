const express = require('express');

const router = express.Router();
const Logistics = require('../models/Logistics');
const logger = require('../utils/logger');

// Get all logistics records with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      region,
      district,
      state,
      priority,
      limit = 100,
      page = 1,
    } = req.query;

    const query = {};

    if (region) query.region = region;
    if (district) query.district = district;
    if (state) query.state = state;
    if (priority) query.priority = priority;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const logistics = await Logistics.find(query)
      .sort({ lastUpdated: -1 })
      .limit(parseInt(limit, 10))
      .skip(skip);

    const total = await Logistics.countDocuments(query);

    logger.info(`Fetched ${logistics.length} logistics records`);

    res.json({
      data: logistics,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error(`Error fetching logistics: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch logistics',
      message: error.message,
    });
  }
});

// Get logistics by ID
router.get('/:id', async (req, res) => {
  try {
    const logistics = await Logistics.findById(req.params.id);

    if (!logistics) {
      return res.status(404).json({ error: 'Logistics record not found' });
    }

    res.json({ data: logistics });
  } catch (error) {
    logger.error(`Error fetching logistics: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch logistics',
      message: error.message,
    });
  }
});

// Create or update logistics record
router.post('/', async (req, res) => {
  try {
    const { region, district, state } = req.body;

    // Try to find existing record
    let logistics = await Logistics.findOne({ region, district, state });

    if (logistics) {
      // Update existing record
      Object.assign(logistics, req.body);
      logistics.lastUpdated = new Date();
      await logistics.save();
      logger.info(`Updated logistics record: ${logistics._id}`);
    } else {
      // Create new record
      logistics = new Logistics(req.body);
      await logistics.save();
      logger.info(`Created new logistics record: ${logistics._id}`);
    }

    res.status(201).json({ data: logistics });
  } catch (error) {
    logger.error(`Error creating/updating logistics: ${error.message}`);
    res.status(400).json({
      error: 'Failed to create/update logistics',
      message: error.message,
    });
  }
});

module.exports = router;
