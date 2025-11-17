const express = require('express');

const router = express.Router();
const Case = require('../models/Case');
const Prediction = require('../models/Prediction');
const Logistics = require('../models/Logistics');
const logger = require('../utils/logger');

// Get dashboard statistics
router.get('/', async (req, res) => {
  try {
    const [
      totalCases,
      totalPredictions,
      highRiskPredictions,
      totalLogistics,
      recentCases,
    ] = await Promise.all([
      Case.countDocuments(),
      Prediction.countDocuments(),
      Prediction.countDocuments({ riskLevel: { $in: ['high', 'critical'] } }),
      Logistics.countDocuments(),
      Case.countDocuments({
        date: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      }),
    ]);

    // Get disease breakdown
    const diseaseBreakdown = await Case.aggregate([
      {
        $group: {
          _id: '$disease',
          count: { $sum: 1 },
          totalCases: { $sum: '$newCases' },
        },
      },
      { $sort: { totalCases: -1 } },
    ]);

    // Get risk level breakdown
    const riskBreakdown = await Prediction.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
        },
      },
    ]);

    logger.info('Fetched dashboard statistics');

    res.json({
      data: {
        cases: {
          total: totalCases,
          recent: recentCases,
        },
        predictions: {
          total: totalPredictions,
          highRisk: highRiskPredictions,
        },
        logistics: {
          total: totalLogistics,
        },
        breakdowns: {
          diseases: diseaseBreakdown,
          riskLevels: riskBreakdown,
        },
      },
    });
  } catch (error) {
    logger.error(`Error fetching statistics: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

module.exports = router;
