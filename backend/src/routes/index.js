const express = require('express');

const healthRouter = require('./health');
const casesRouter = require('./cases');
const predictionsRouter = require('./predictions');
const logisticsRouter = require('./logistics');
const etlRouter = require('./etl');
const statsRouter = require('./stats');
const forecastRouter = require('./forecast');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/cases', casesRouter);
router.use('/predictions', predictionsRouter);
router.use('/logistics', logisticsRouter);
router.use('/etl', etlRouter);
router.use('/stats', statsRouter);
router.use('/forecast', forecastRouter);

module.exports = router;

