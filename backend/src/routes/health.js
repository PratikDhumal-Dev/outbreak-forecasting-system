const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  req.log.info('Health check requested');
  res.json({
    status: 'ok',
    service: 'MedSentinel Backend',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

