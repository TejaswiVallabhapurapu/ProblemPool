const express = require('express');
const router = express.Router();
const {
  updateReply,
  deleteReply,
} = require('../controllers/replyController');
const { protect } = require('../middleware/authMiddleware');

// Reply Edit / Delete (Author only)
router.route('/:replyId')
  .put(protect, updateReply)
  .delete(protect, deleteReply);

module.exports = router;
