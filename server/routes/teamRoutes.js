const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeamsByProblem,
  getTeamById,
  joinTeam,
  leaveTeam,
  removeTeamMember,
  transferLeadership,
  updateTeam,
  getTeamMessages,
  postTeamMessage,
  getTeamTasks,
  createTeamTask,
  updateTeamTask,
  deleteTeamTask,
  submitTeamAnswer,
  getCollaborativeProblems,
} = require('../controllers/teamController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Discovery of collaborative problems
router.get('/collaborative-problems', optionalProtect, getCollaborativeProblems);

// Problem-specific teams
router.route('/problem/:problemId')
  .get(optionalProtect, getTeamsByProblem)
  .post(protect, createTeam);

// Team Workspace operations
router.route('/:teamId')
  .get(protect, getTeamById)
  .patch(protect, updateTeam);

router.post('/:teamId/join', protect, joinTeam);
router.post('/:teamId/leave', protect, leaveTeam);
router.delete('/:teamId/members/:userId', protect, removeTeamMember);
router.patch('/:teamId/transfer-leadership', protect, transferLeadership);
router.post('/:teamId/submit', protect, submitTeamAnswer);

// Team Discussion Messages
router.route('/:teamId/messages')
  .get(protect, getTeamMessages)
  .post(protect, postTeamMessage);

// Team Tasks
router.route('/:teamId/tasks')
  .get(protect, getTeamTasks)
  .post(protect, createTeamTask);

router.route('/:teamId/tasks/:taskId')
  .patch(protect, updateTeamTask)
  .delete(protect, deleteTeamTask);

module.exports = router;
