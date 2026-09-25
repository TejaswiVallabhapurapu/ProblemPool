const mongoose = require('mongoose');
const Team = require('../models/Team');
const TeamMessage = require('../models/TeamMessage');
const TeamTask = require('../models/TeamTask');
const Problem = require('../models/Problem');
const Answer = require('../models/Answer');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { adjustReputation, REPUTATION_RULES } = require('../services/reputationService');

const MAX_TEAM_MEMBERS = 5;

/**
 * @desc    Create a new collaborative team for a problem
 * @route   POST /api/problems/:problemId/teams
 * @access  Private (JWT Protected)
 */
const createTeam = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { name, description = '' } = req.body;

    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem ID format',
      });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid team name',
      });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    if (!problem.allowTeamUp) {
      return res.status(400).json({
        success: false,
        message: 'Collaborative Team Up is not enabled for this problem',
      });
    }

    // Check if user is already in an active/submitted team for this problem
    const existingTeam = await Team.findOne({
      problemId,
      status: { $in: ['ACTIVE', 'SUBMITTED'] },
      members: req.user._id,
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You already belong to an active team for this problem',
      });
    }

    // Create the team with the current user as leader and 1st member
    const team = await Team.create({
      problemId,
      name: name.trim(),
      description: description.trim(),
      leaderId: req.user._id,
      members: [req.user._id],
      status: 'ACTIVE',
      sharedSolution: '',
    });

    // Notify problem owner if someone starts a team on their problem (if not self)
    if (problem.createdBy.toString() !== req.user._id.toString()) {
      createNotification({
        recipient: problem.createdBy,
        sender: req.user._id,
        type: 'team',
        title: '🤝 New Collaborative Team Formed',
        message: `${req.user.name} created team "${team.name}" to solve your problem: "${problem.title.slice(0, 45)}..."`,
        referenceType: 'problem',
        referenceId: problem._id,
        link: `/problems/${problem._id}`,
      });
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('leaderId', 'name username avatar email')
      .populate('members', 'name username avatar email')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: {
        ...populatedTeam,
        memberCount: populatedTeam.members.length,
        maxMembers: MAX_TEAM_MEMBERS,
        isUserMember: true,
        isUserLeader: true,
      },
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create team: ' + error.message,
    });
  }
};

/**
 * @desc    Get all teams for a specific problem
 * @route   GET /api/problems/:problemId/teams
 * @access  Public / Optional JWT
 */
const getTeamsByProblem = async (req, res) => {
  try {
    const { problemId } = req.params;

    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid problem ID format',
      });
    }

    const problem = await Problem.findById(problemId).select('allowTeamUp title').lean();
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    const currentUserId = req.user ? req.user._id.toString() : null;

    const rawTeams = await Team.find({
      problemId,
      status: { $in: ['ACTIVE', 'SUBMITTED', 'COMPLETED'] },
    })
      .populate('leaderId', 'name username avatar email')
      .populate('members', 'name username avatar email')
      .sort({ createdAt: -1 })
      .lean();

    let userActiveTeamId = null;

    const teams = rawTeams.map((team) => {
      const memberIds = team.members.map((m) => m._id.toString());
      const isUserMember = Boolean(currentUserId && memberIds.includes(currentUserId));
      const isUserLeader = Boolean(currentUserId && team.leaderId?._id?.toString() === currentUserId);

      if (isUserMember && (team.status === 'ACTIVE' || team.status === 'SUBMITTED')) {
        userActiveTeamId = team._id;
      }

      return {
        ...team,
        memberCount: team.members.length,
        maxMembers: MAX_TEAM_MEMBERS,
        isFull: team.members.length >= MAX_TEAM_MEMBERS,
        isUserMember,
        isUserLeader,
      };
    });

    return res.status(200).json({
      success: true,
      allowTeamUp: Boolean(problem.allowTeamUp),
      count: teams.length,
      userActiveTeamId,
      teams,
    });
  } catch (error) {
    console.error('Error fetching problem teams:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve teams: ' + error.message,
    });
  }
};

/**
 * @desc    Get full Team Workspace details by team ID
 * @route   GET /api/teams/:teamId
 * @access  Private (Team Members & Problem Owner)
 */
const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format',
      });
    }

    const team = await Team.findById(teamId)
      .populate('problemId', 'title description category tags location createdBy allowTeamUp bestAnswer status')
      .populate('leaderId', 'name username avatar email')
      .populate('members', 'name username avatar email')
      .lean();

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const currentUserId = req.user._id.toString();
    const isMember = team.members.some((m) => m._id.toString() === currentUserId);
    const isProblemOwner = team.problemId?.createdBy?.toString() === currentUserId;
    const isAdmin = req.user.role === 'admin';

    if (!isMember && !isProblemOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team',
        isMember: false,
      });
    }

    const isUserLeader = team.leaderId?._id?.toString() === currentUserId;

    return res.status(200).json({
      success: true,
      team: {
        ...team,
        memberCount: team.members.length,
        maxMembers: MAX_TEAM_MEMBERS,
        isFull: team.members.length >= MAX_TEAM_MEMBERS,
        isUserMember: isMember,
        isUserLeader,
      },
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve team workspace: ' + error.message,
    });
  }
};

/**
 * @desc    Join an active collaborative team
 * @route   POST /api/teams/:teamId/join
 * @access  Private (JWT Protected)
 */
const joinTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (team.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Cannot join team because its status is ${team.status.toLowerCase()}`,
      });
    }

    if (team.members.length >= MAX_TEAM_MEMBERS) {
      return res.status(400).json({
        success: false,
        message: 'Team is already full (maximum 5 members)',
      });
    }

    // Check if user is already in this team
    if (team.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team',
      });
    }

    // Check if user is in another active team for this same problem
    const inOtherTeam = await Team.findOne({
      problemId: team.problemId,
      status: { $in: ['ACTIVE', 'SUBMITTED'] },
      members: req.user._id,
    });

    if (inOtherTeam) {
      return res.status(400).json({
        success: false,
        message: 'You already belong to another active team for this problem',
      });
    }

    team.members.push(req.user._id);
    await team.save();

    // Notify team leader
    createNotification({
      recipient: team.leaderId,
      sender: req.user._id,
      type: 'team_join',
      title: '🤝 Member Joined Team',
      message: `${req.user.name} joined your team "${team.name}"`,
      referenceType: 'team',
      referenceId: team._id,
      link: `/problems/${team.problemId}/team/${team._id}`,
    });

    const updatedTeam = await Team.findById(teamId)
      .populate('leaderId', 'name username avatar email')
      .populate('members', 'name username avatar email')
      .lean();

    return res.status(200).json({
      success: true,
      message: `Successfully joined team "${team.name}"`,
      team: {
        ...updatedTeam,
        memberCount: updatedTeam.members.length,
        maxMembers: MAX_TEAM_MEMBERS,
        isUserMember: true,
        isUserLeader: updatedTeam.leaderId._id.toString() === req.user._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error joining team:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join team: ' + error.message,
    });
  }
};

/**
 * @desc    Leave an active collaborative team
 * @route   POST /api/teams/:teamId/leave
 * @access  Private (JWT Protected)
 */
const leaveTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const currentUserId = req.user._id.toString();
    const isMember = team.members.some((m) => m.toString() === currentUserId);
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this team',
      });
    }

    if (team.status === 'SUBMITTED' || team.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave a team after a solution has been submitted or completed',
      });
    }

    const isLeader = team.leaderId.toString() === currentUserId;

    if (isLeader) {
      if (team.members.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'As Team Leader, please transfer leadership to another member before leaving, or close the team.',
        });
      } else {
        // Leader is the sole member -> close team
        team.status = 'CLOSED';
        await team.save();
        return res.status(200).json({
          success: true,
          message: 'You were the only member. Team has been closed.',
          teamClosed: true,
        });
      }
    }

    // Regular member leaving
    team.members = team.members.filter((m) => m.toString() !== currentUserId);
    await team.save();

    // Notify team leader
    createNotification({
      recipient: team.leaderId,
      sender: req.user._id,
      type: 'team_leave',
      title: '👋 Member Left Team',
      message: `${req.user.name} left team "${team.name}"`,
      referenceType: 'team',
      referenceId: team._id,
      link: `/problems/${team.problemId}/team/${team._id}`,
    });

    return res.status(200).json({
      success: true,
      message: `You left team "${team.name}"`,
    });
  } catch (error) {
    console.error('Error leaving team:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to leave team: ' + error.message,
    });
  }
};

/**
 * @desc    Remove a member from team (Team Leader Only)
 * @route   DELETE /api/teams/:teamId/members/:userId
 * @access  Private (Team Leader)
 */
const removeTeamMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    if (!teamId || !userId || !mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID parameters',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (team.leaderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the Team Leader can remove members',
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Team Leader cannot remove themselves. Transfer leadership or leave/close the team.',
      });
    }

    team.members = team.members.filter((m) => m.toString() !== userId);
    await team.save();

    // Notify removed user
    createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'team_removed',
      title: 'Team Update',
      message: `You were removed from team "${team.name}"`,
      referenceType: 'problem',
      referenceId: team.problemId,
      link: `/problems/${team.problemId}`,
    });

    const updatedTeam = await Team.findById(teamId)
      .populate('leaderId', 'name username avatar email')
      .populate('members', 'name username avatar email')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove member: ' + error.message,
    });
  }
};

/**
 * @desc    Transfer team leadership to another member
 * @route   PATCH /api/teams/:teamId/transfer-leadership
 * @access  Private (Team Leader)
 */
const transferLeadership = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { newLeaderId } = req.body;

    if (!teamId || !newLeaderId || !mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(newLeaderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID parameters',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (team.leaderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the current Team Leader can transfer leadership',
      });
    }

    const isMember = team.members.some((m) => m.toString() === newLeaderId.toString());
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'The new leader must be an existing member of the team',
      });
    }

    team.leaderId = newLeaderId;
    await team.save();

    // Notify new leader
    createNotification({
      recipient: newLeaderId,
      sender: req.user._id,
      type: 'team',
      title: '👑 Leadership Transferred',
      message: `${req.user.name} transferred team leadership of "${team.name}" to you.`,
      referenceType: 'team',
      referenceId: team._id,
      link: `/problems/${team.problemId}/team/${team._id}`,
    });

    const updatedTeam = await Team.findById(teamId)
      .populate('leaderId', 'name username avatar email')
      .populate('members', 'name username avatar email')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Leadership transferred successfully',
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Error transferring leadership:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to transfer leadership: ' + error.message,
    });
  }
};

/**
 * @desc    Update team metadata or shared solution draft
 * @route   PATCH /api/teams/:teamId
 * @access  Private (Team Members)
 */
const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description, sharedSolution } = req.body;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const currentUserId = req.user._id.toString();
    const isMember = team.members.some((m) => m.toString() === currentUserId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only team members can update the workspace',
      });
    }

    const isLeader = team.leaderId.toString() === currentUserId;

    // Leader can edit name & description
    if (name && typeof name === 'string' && name.trim()) {
      if (!isLeader) {
        return res.status(403).json({
          success: false,
          message: 'Only the Team Leader can change the team name',
        });
      }
      team.name = name.trim();
    }

    if (description !== undefined && typeof description === 'string') {
      if (!isLeader) {
        return res.status(403).json({
          success: false,
          message: 'Only the Team Leader can change the team description',
        });
      }
      team.description = description.trim();
    }

    // Any member can edit the shared solution draft while ACTIVE
    if (sharedSolution !== undefined && typeof sharedSolution === 'string') {
      team.sharedSolution = sharedSolution;
    }

    await team.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('leaderId', 'name username avatar email')
      .populate('members', 'name username avatar email')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Team workspace updated successfully',
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update team: ' + error.message,
    });
  }
};

/**
 * @desc    Get discussion messages for a team
 * @route   GET /api/teams/:teamId/messages
 * @access  Private (Team Members)
 */
const getTeamMessages = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const isMember = team.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Private discussion: only team members can view messages',
      });
    }

    const messages = await TeamMessage.find({ teamId })
      .populate('userId', 'name username avatar email')
      .sort({ createdAt: 1 })
      .limit(300)
      .lean();

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve team messages: ' + error.message,
    });
  }
};

/**
 * @desc    Post a discussion message in team workspace
 * @route   POST /api/teams/:teamId/messages
 * @access  Private (Team Members)
 */
const postTeamMessage = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { message } = req.body;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format',
      });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const isMember = team.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only team members can post in this discussion',
      });
    }

    const newMsg = await TeamMessage.create({
      teamId,
      userId: req.user._id,
      message: message.trim(),
    });

    const populatedMsg = await TeamMessage.findById(newMsg._id)
      .populate('userId', 'name username avatar email')
      .lean();

    return res.status(201).json({
      success: true,
      message: populatedMsg,
    });
  } catch (error) {
    console.error('Error posting message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to post message: ' + error.message,
    });
  }
};

/**
 * @desc    Get all tasks for a team workspace + contribution breakdown
 * @route   GET /api/teams/:teamId/tasks
 * @access  Private (Team Members)
 */
const getTeamTasks = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format',
      });
    }

    const team = await Team.findById(teamId).populate('members', 'name username avatar');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const isMember = team.members.some((m) => m._id.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only team members can view tasks',
      });
    }

    const tasks = await TeamTask.find({ teamId })
      .populate('assignedTo', 'name username avatar')
      .populate('createdBy', 'name username avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate dynamic team contribution counts per member based on completed tasks
    const contributionMap = {};
    team.members.forEach((m) => {
      contributionMap[m._id.toString()] = {
        userId: m._id,
        name: m.name,
        username: m.username,
        avatar: m.avatar,
        completedCount: 0,
        assignedCount: 0,
      };
    });

    tasks.forEach((task) => {
      if (task.assignedTo?._id) {
        const idStr = task.assignedTo._id.toString();
        if (contributionMap[idStr]) {
          contributionMap[idStr].assignedCount += 1;
          if (task.completed) {
            contributionMap[idStr].completedCount += 1;
          }
        }
      }
    });

    const contribution = Object.values(contributionMap).sort((a, b) => b.completedCount - a.completedCount);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
      contribution,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks: ' + error.message,
    });
  }
};

/**
 * @desc    Create a new task in team workspace
 * @route   POST /api/teams/:teamId/tasks
 * @access  Private (Team Members)
 */
const createTeamTask = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { title, description = '', assignedTo = null } = req.body;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format',
      });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const isMember = team.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only team members can create tasks',
      });
    }

    let assignedUser = null;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      if (team.members.some((m) => m.toString() === assignedTo.toString())) {
        assignedUser = assignedTo;
      }
    }

    const newTask = await TeamTask.create({
      teamId,
      title: title.trim(),
      description: description.trim(),
      assignedTo: assignedUser,
      createdBy: req.user._id,
      completed: false,
    });

    // Notify assigned user if assigned to someone else
    if (assignedUser && assignedUser.toString() !== req.user._id.toString()) {
      createNotification({
        recipient: assignedUser,
        sender: req.user._id,
        type: 'team_task',
        title: '📋 New Task Assigned',
        message: `${req.user.name} assigned you a task in "${team.name}": "${newTask.title.slice(0, 45)}"`,
        referenceType: 'team',
        referenceId: team._id,
        link: `/problems/${team.problemId}/team/${team._id}`,
      });
    }

    const populatedTask = await TeamTask.findById(newTask._id)
      .populate('assignedTo', 'name username avatar')
      .populate('createdBy', 'name username avatar')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task: ' + error.message,
    });
  }
};

/**
 * @desc    Update task status / assignment
 * @route   PATCH /api/teams/:teamId/tasks/:taskId
 * @access  Private (Team Members)
 */
const updateTeamTask = async (req, res) => {
  try {
    const { teamId, taskId } = req.params;
    const { title, description, assignedTo, completed } = req.body;

    if (!teamId || !taskId || !mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID parameters',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const isMember = team.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only team members can update tasks',
      });
    }

    const task = await TeamTask.findById(taskId);
    if (!task || task.teamId.toString() !== teamId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in this team',
      });
    }

    if (title && typeof title === 'string' && title.trim()) {
      task.title = title.trim();
    }

    if (description !== undefined && typeof description === 'string') {
      task.description = description.trim();
    }

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '') {
        task.assignedTo = null;
      } else if (mongoose.Types.ObjectId.isValid(assignedTo) && team.members.some((m) => m.toString() === assignedTo.toString())) {
        task.assignedTo = assignedTo;
      }
    }

    if (completed !== undefined) {
      const isCompleted = Boolean(completed);
      task.completed = isCompleted;
      task.completedAt = isCompleted ? new Date() : null;
    }

    await task.save();

    const populatedTask = await TeamTask.findById(taskId)
      .populate('assignedTo', 'name username avatar')
      .populate('createdBy', 'name username avatar')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: populatedTask,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task: ' + error.message,
    });
  }
};

/**
 * @desc    Delete a task in team workspace
 * @route   DELETE /api/teams/:teamId/tasks/:taskId
 * @access  Private (Task Creator or Team Leader)
 */
const deleteTeamTask = async (req, res) => {
  try {
    const { teamId, taskId } = req.params;

    if (!teamId || !taskId || !mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID parameters',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const task = await TeamTask.findById(taskId);
    if (!task || task.teamId.toString() !== teamId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in this team',
      });
    }

    const currentUserId = req.user._id.toString();
    const isLeader = team.leaderId.toString() === currentUserId;
    const isCreator = task.createdBy.toString() === currentUserId;

    if (!isLeader && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Only the task creator or Team Leader can delete this task',
      });
    }

    await TeamTask.findByIdAndDelete(taskId);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task: ' + error.message,
    });
  }
};

/**
 * @desc    Submit Team Shared Solution as a verified Team Answer
 * @route   POST /api/teams/:teamId/submit
 * @access  Private (Team Leader Only)
 */
const submitTeamAnswer = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { content } = req.body;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (team.leaderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the Team Leader can submit the final team solution',
      });
    }

    if (team.status === 'SUBMITTED' || team.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'A team solution has already been submitted for this team',
      });
    }

    const solutionText = content && typeof content === 'string' && content.trim() !== ''
      ? content.trim()
      : team.sharedSolution.trim();

    if (!solutionText) {
      return res.status(400).json({
        success: false,
        message: 'Team solution content cannot be empty',
      });
    }

    const problem = await Problem.findById(team.problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Create Answer with isTeamAnswer: true and populated team & teamMembers
    const newAnswer = await Answer.create({
      problem: team.problemId,
      user: req.user._id,
      content: solutionText,
      isTeamAnswer: true,
      team: team._id,
      teamMembers: team.members,
    });

    // Update Team status to SUBMITTED
    team.status = 'SUBMITTED';
    team.submittedAnswerId = newAnswer._id;
    team.sharedSolution = solutionText;
    await team.save();

    // Award reputation to team members for collaborative answer
    for (const memberId of team.members) {
      adjustReputation({
        userId: memberId,
        points: REPUTATION_RULES.POST_ANSWER,
        reason: `Contributed to team answer by "${team.name}" on: "${problem.title.slice(0, 40)}..."`,
        referenceType: 'answer',
        referenceId: newAnswer._id,
      });
    }

    // Notify problem owner
    if (problem.createdBy.toString() !== req.user._id.toString()) {
      createNotification({
        recipient: problem.createdBy,
        sender: req.user._id,
        type: 'team_submit',
        title: '🤝 Team Solution Submitted',
        message: `Team "${team.name}" (${team.members.length} members) submitted a collaborative solution to your problem: "${problem.title.slice(0, 45)}..."`,
        referenceType: 'problem',
        referenceId: problem._id,
        link: `/problems/${problem._id}`,
      });
    }

    // Notify all other team members
    for (const memberId of team.members) {
      if (memberId.toString() !== req.user._id.toString()) {
        createNotification({
          recipient: memberId,
          sender: req.user._id,
          type: 'team',
          title: '🚀 Team Solution Submitted!',
          message: `Your team leader ${req.user.name} submitted your team's solution to "${problem.title.slice(0, 45)}..."`,
          referenceType: 'problem',
          referenceId: problem._id,
          link: `/problems/${problem._id}`,
        });
      }
    }

    const populatedAnswer = await Answer.findById(newAnswer._id)
      .populate('user', 'name username avatar email')
      .populate('team', 'name description leaderId')
      .populate('teamMembers', 'name username avatar email')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Team answer submitted successfully!',
      answer: {
        ...populatedAnswer,
        helpfulCount: 0,
        notHelpfulCount: 0,
        reviewCount: 0,
        userVote: null,
        isBestAnswer: false,
      },
      team,
    });
  } catch (error) {
    console.error('Error submitting team answer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit team answer: ' + error.message,
    });
  }
};

/**
 * @desc    Get collaborative problems seeking team members
 * @route   GET /api/teams/collaborative-problems
 * @access  Public / Optional JWT
 */
const getCollaborativeProblems = async (req, res) => {
  try {
    const { category, search, sort = 'newest', limit = 20, page = 1 } = req.query;

    const query = { allowTeamUp: true };

    if (category && category !== 'All' && category.trim() !== '') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    if (search && search.trim() !== '') {
      query.$text = { $search: search.trim() };
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [problems, total] = await Promise.all([
      Problem.find(query)
        .populate('createdBy', 'name username avatar')
        .populate('bestAnswer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Problem.countDocuments(query),
    ]);

    // For each problem, fetch active team statistics
    const problemIds = problems.map((p) => p._id);
    const teams = await Team.find({
      problemId: { $in: problemIds },
      status: { $in: ['ACTIVE', 'SUBMITTED', 'COMPLETED'] },
    })
      .populate('members', 'name username avatar')
      .lean();

    const teamsByProblem = {};
    teams.forEach((t) => {
      const pid = t.problemId.toString();
      if (!teamsByProblem[pid]) teamsByProblem[pid] = [];
      teamsByProblem[pid].push(t);
    });

    const enrichedProblems = problems.map((prob) => {
      const probTeams = teamsByProblem[prob._id.toString()] || [];
      const totalTeamMembers = probTeams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
      const activeTeamsCount = probTeams.filter((t) => t.status === 'ACTIVE').length;
      const openTeams = probTeams.filter((t) => t.status === 'ACTIVE' && t.members.length < MAX_TEAM_MEMBERS);
      const membersNeeded = openTeams.reduce((acc, t) => acc + (MAX_TEAM_MEMBERS - t.members.length), 0);

      const status = prob.bestAnswer ? 'Solved' : 'Open';

      return {
        ...prob,
        teamsCount: probTeams.length,
        activeTeamsCount,
        totalTeamMembers,
        membersNeeded,
        openTeamsCount: openTeams.length,
        teams: probTeams.slice(0, 3),
        status,
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedProblems.length,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      problems: enrichedProblems,
    });
  } catch (error) {
    console.error('Error fetching collaborative problems:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve collaborative problems: ' + error.message,
    });
  }
};

module.exports = {
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
};
