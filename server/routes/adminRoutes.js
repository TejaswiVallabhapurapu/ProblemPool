const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAdminReports,
  updateReportStatus,
  removeReportedContent,
  toggleUserSuspension,
  getAdminUsers,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// All admin routes strictly require JWT authentication AND role === 'admin'
router.use(protect, requireAdmin);

// Dashboard metrics
router.get('/stats', getAdminStats);

// Moderation reports
router.get('/reports', getAdminReports);
router.put('/reports/:id/status', updateReportStatus);
router.delete('/reports/:id/content', removeReportedContent);

// User moderation & management
router.get('/users', getAdminUsers);
router.put('/users/:userId/suspend', toggleUserSuspension);

module.exports = router;
