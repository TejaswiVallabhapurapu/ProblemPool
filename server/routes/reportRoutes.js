const express = require('express');
const router = express.Router();
const { createReport } = require('../controllers/reportController');
const { protect, checkSuspended } = require('../middleware/authMiddleware');

// Submit a content or user report
router.post('/', protect, checkSuspended, createReport);

module.exports = router;
