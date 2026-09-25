import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTeamById,
  getTeamMessages,
  postTeamMessage,
  getTeamTasks,
  createTeamTask,
  updateTeamTask,
  deleteTeamTask,
  updateTeam,
  submitTeamAnswer,
  leaveTeam,
  removeTeamMember,
  transferTeamLeadership,
} from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import MarkdownToolbar from '../components/MarkdownToolbar';
import GlassAiButton from '../components/GlassAiButton';
import { Loader, LoaderContainer } from '../components/Loader';

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TeamWorkspace = () => {
  const { problemId, teamId } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('discussion'); // 'discussion' | 'tasks' | 'solution'

  // Discussion states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef(null);

  // Tasks states
  const [tasks, setTasks] = useState([]);
  const [taskContribution, setTaskContribution] = useState([]);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // Shared solution states
  const [solutionDraft, setSolutionDraft] = useState('');
  const [solutionTab, setSolutionTab] = useState('write');
  const solutionTextareaRef = useRef(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedNotice, setDraftSavedNotice] = useState(false);

  // Submit Answer states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Leader Management states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [showProblemContext, setShowProblemContext] = useState(false);

  // Fetch Team Workspace
  const fetchWorkspaceData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const [teamRes, messagesRes, tasksRes] = await Promise.all([
        getTeamById(teamId, token),
        getTeamMessages(teamId, token).catch(() => ({ messages: [] })),
        getTeamTasks(teamId, token).catch(() => ({ tasks: [], contribution: [] })),
      ]);

      if (teamRes.success && teamRes.team) {
        setTeam(teamRes.team);
        setSolutionDraft(teamRes.team.sharedSolution || '');
      } else {
        setError(teamRes.message || 'Team not found or access denied.');
      }

      if (messagesRes.messages) {
        setMessages(messagesRes.messages);
      }

      if (tasksRes.tasks) {
        setTasks(tasksRes.tasks);
        setTaskContribution(tasksRes.contribution || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load team workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [teamId, token]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (activeTab === 'discussion') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sendingMsg || !token) return;

    setSendingMsg(true);
    try {
      const res = await postTeamMessage(teamId, text, token);
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || creatingTask || !token) return;

    setCreatingTask(true);
    try {
      const res = await createTeamTask(
        teamId,
        {
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          assignedTo: newTaskAssignee || null,
        },
        token
      );
      if (res.success && res.task) {
        setTasks((prev) => [res.task, ...prev]);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskAssignee('');
        setShowNewTaskForm(false);
        // Refresh contribution
        const taskRes = await getTeamTasks(teamId, token);
        if (taskRes.contribution) setTaskContribution(taskRes.contribution);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setCreatingTask(false);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (task) => {
    if (!token) return;
    const nextCompleted = !task.completed;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, completed: nextCompleted } : t))
    );

    try {
      await updateTeamTask(teamId, task._id, { completed: nextCompleted }, token);
      const taskRes = await getTeamTasks(teamId, token);
      if (taskRes.contribution) setTaskContribution(taskRes.contribution);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      // Revert
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, completed: !nextCompleted } : t))
      );
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!token) return;
    try {
      await deleteTeamTask(teamId, taskId, token);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      const taskRes = await getTeamTasks(teamId, token);
      if (taskRes.contribution) setTaskContribution(taskRes.contribution);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Save Shared Solution Draft
  const handleSaveDraft = async () => {
    if (!token || savingDraft) return;
    setSavingDraft(true);
    setDraftSavedNotice(false);

    try {
      await updateTeam(teamId, { sharedSolution: solutionDraft }, token);
      setDraftSavedNotice(true);
      setTimeout(() => setDraftSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit Final Team Answer
  const handleConfirmSubmitAnswer = async () => {
    if (!token || submittingAnswer) return;
    setSubmittingAnswer(true);
    setSubmitError(null);

    try {
      const res = await submitTeamAnswer(teamId, solutionDraft, token);
      if (res.success) {
        setShowSubmitModal(false);
        setTeam((prev) => ({ ...prev, status: 'SUBMITTED', submittedAnswerId: res.answer?._id }));
        navigate(`/problems/${team.problemId._id || team.problemId}`, {
          state: { message: 'Team Solution submitted successfully! It is now live in the problem answers section.' },
        });
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit team answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Leave Team
  const handleConfirmLeave = async () => {
    if (!token || leaving) return;
    setLeaving(true);
    try {
      const res = await leaveTeam(teamId, token);
      if (res.success) {
        setShowLeaveModal(false);
        navigate(`/problems/${team.problemId._id || team.problemId}`, {
          state: { message: res.message || 'You left the team.' },
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to leave team');
    } finally {
      setLeaving(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId, memberName) => {
    if (!token || !window.confirm(`Are you sure you want to remove ${memberName} from this team?`)) {
      return;
    }
    try {
      const res = await removeTeamMember(teamId, memberId, token);
      if (res.success && res.team) {
        setTeam(res.team);
      }
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  };

  // Transfer Leadership
  const handleConfirmTransfer = async () => {
    if (!token || !selectedNewLeader || transferring) return;
    setTransferring(true);
    try {
      const res = await transferTeamLeadership(teamId, selectedNewLeader, token);
      if (res.success && res.team) {
        setTeam(res.team);
        setShowTransferModal(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to transfer leadership');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <LoaderContainer text="Loading Team Workspace..." />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4">
        <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-[#141414] border border-white/10 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center mx-auto mb-4 text-white">
            
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Workspace Access Denied</h2>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            {error || 'You are not a member of this team or this team does not exist.'}
          </p>
          <GlassAiButton
            to={problemId ? `/problems/${problemId}` : '/problems'}
            variant="primary"
            size="md"
            icon={}
          >
            Back to Problem
          </GlassAiButton>
        </div>
      </div>
    );
  }

  const currentUserId = user?._id?.toString();
  const isLeader = team.leaderId?._id?.toString() === currentUserId;
  const isSubmitted = team.status === 'SUBMITTED' || team.status === 'COMPLETED';
  const problemData = team.problemId || {};

  return (
    <div className="relative min-h-screen text-white">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <Link
            to={`/problems/${problemData._id || problemId}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white transition-colors group"
          >
            
            <span>Problem: <strong className="text-slate-200 font-bold">{problemData.title || 'View Problem'}</strong></span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProblemContext((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              
              <span>{showProblemContext ? 'Hide Problem Details' : 'View Problem Details'}</span>
              {showProblemContext ?  : }
            </button>

            {!isSubmitted && (
              <GlassAiButton
                type="button"
                onClick={() => setShowLeaveModal(true)}
                size="xs"
                variant="glass"
                icon={}
              >
                Leave Team
              </GlassAiButton>
            )}
          </div>
        </div>

        {/* Expandable Problem Context Banner */}
        {showProblemContext && (
          <div className="mb-6 p-6 rounded-3xl bg-[#121212]/95 border border-white/10 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Problem Objective</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1e1e1e] border border-white/10 text-slate-300 font-semibold">
                {problemData.category || 'General'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{problemData.title}</h3>
            <div className="text-sm text-slate-300 max-h-60 overflow-y-auto pr-2">
              <MarkdownRenderer content={problemData.description} />
            </div>
          </div>
        )}

        {/* Workspace Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#151515] border border-white/10 shadow-xl mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className="w-10 h-10 rounded-2xl bg-[#1e1e1e] border border-white/15 flex items-center justify-center text-xl shadow-md">
                  
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {team.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    team.status === 'COMPLETED'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                      : team.status === 'SUBMITTED'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                      : 'bg-[#222222] text-slate-200 border border-white/20'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  <span>{team.status === 'SUBMITTED' ? 'Solution Submitted' : team.status}</span>
                </span>
              </div>
              {team.description && (
                <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
                  {team.description}
                </p>
              )}
            </div>

            {/* Submit Solution Button (Leader only) */}
            <div className="flex items-center gap-3 flex-wrap">
              {isLeader && !isSubmitted && (
                <GlassAiButton
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  size="md"
                  variant="primary"
                  icon={}
                >
                  Submit Team Answer
                </GlassAiButton>
              )}

              {isSubmitted && (
                <div className="p-3 rounded-2xl bg-[#1b1b1b] border border-white/15 flex items-center gap-2.5 text-xs text-slate-200">
                  
                  <span>Team solution has been submitted for community review!</span>
                </div>
              )}
            </div>
          </div>

          {/* Members Bar */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mr-2">
                Team Members ({team.members?.length || 0}/5):
              </span>
              {team.members?.map((member) => {
                const isMemberLeader = member._id.toString() === team.leaderId?._id?.toString();
                const isSelf = member._id.toString() === currentUserId;

                return (
                  <div
                    key={member._id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1c1c1c] border border-white/10 text-xs font-semibold text-slate-200 shadow-xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#2a2a2a] text-white flex items-center justify-center text-[10px] font-bold">
                      {member.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span>{member.name} {isSelf && '(You)'}</span>
                    {isMemberLeader && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#2c2c2c] text-slate-200 border border-white/15">
                        
                        Leader
                      </span>
                    )}

                    {/* Leader Controls: Remove member or transfer leadership */}
                    {isLeader && !isSelf && !isSubmitted && (
                      <div className="flex items-center gap-1 ml-1 pl-1 border-l border-white/10">
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member._id, member.name)}
                          className="text-neutral-400 hover:text-rose-400 p-0.5 transition cursor-pointer"
                          title={`Remove ${member.name}`}
                        >
                          
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isLeader && team.members?.length > 1 && !isSubmitted && (
              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="text-xs text-neutral-400 hover:text-white underline font-semibold cursor-pointer"
              >
                Transfer Leadership
              </button>
            )}
          </div>
        </div>

        {/* Workspace Main Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#141414] border border-white/10 mb-6 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab('discussion')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'discussion'
                ? 'bg-[#222222] text-white shadow-md border border-white/15'
                : 'text-neutral-400 hover:text-white hover:bg-[#181818]'
            }`}
          >
            
            <span>Discussion</span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#121212] text-[10px] text-slate-300">
                {messages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-[#222222] text-white shadow-md border border-white/15'
                : 'text-neutral-400 hover:text-white hover:bg-[#181818]'
            }`}
          >
            
            <span>Tasks</span>
            {tasks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#121212] text-[10px] text-slate-300">
                {tasks.filter((t) => t.completed).length}/{tasks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('solution')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'solution'
                ? 'bg-[#222222] text-white shadow-md border border-white/15'
                : 'text-neutral-400 hover:text-white hover:bg-[#181818]'
            }`}
          >
            
            <span>Shared Solution</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: TEAM DISCUSSION */}
        {/* ========================================================= */}
        {activeTab === 'discussion' && (
          <div className="rounded-3xl bg-[#141414] border border-white/10 shadow-xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#181818]">
              <div className="flex items-center gap-2">
                
                <h3 className="text-sm font-bold text-white">Team Chat & Strategy</h3>
              </div>
              <span className="text-xs text-neutral-400">Private to team members</span>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                  <div className="w-12 h-12 rounded-2xl bg-[#1c1c1c] border border-white/10 flex items-center justify-center mx-auto mb-3 text-white">
                    
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">No discussion yet</h4>
                  <p className="text-xs max-w-xs leading-relaxed">
                    Start the conversation! Discuss the problem constraints, algorithm ideas, or delegate tasks.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMyMsg = msg.userId?._id?.toString() === currentUserId;
                  const senderName = msg.userId?.name || 'Team Member';
                  const isLeaderMsg = msg.userId?._id?.toString() === team.leaderId?._id?.toString();

                  return (
                    <div
                      key={msg._id}
                      className={`flex gap-3 max-w-2xl ${isMyMsg ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#222222] border border-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {senderName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className={`flex items-center gap-2 mb-1 ${isMyMsg ? 'justify-end' : ''}`}>
                          <span className="text-xs font-bold text-slate-300">{senderName}</span>
                          {isLeaderMsg && (
                            <span className="text-[10px] text-neutral-400 font-bold px-1.5 rounded bg-[#1e1e1e] border border-white/10">
                              Leader
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-400">{formatTime(msg.createdAt)}</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                            isMyMsg
                              ? 'bg-[#262626] text-white border border-white/20 rounded-tr-xs'
                              : 'bg-[#1a1a1a] text-slate-200 border border-white/10 rounded-tl-xs'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-[#161616] flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message to your team..."
                disabled={sendingMsg}
                className="flex-1 px-4 py-3 rounded-2xl bg-[#111111] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white/30"
              />
              <GlassAiButton
                type="submit"
                disabled={!newMessage.trim() || sendingMsg}
                loading={sendingMsg}
                size="sm"
                variant="primary"
                icon={}
              >
                Send
              </GlassAiButton>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TEAM TASKS & CONTRIBUTIONS */}
        {/* ========================================================= */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Task List & Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-3xl bg-[#141414] border border-white/10 shadow-xl">
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      
                      <span>Team Action Items</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Break down problem solving steps and assign them to team members.
                    </p>
                  </div>

                  {!showNewTaskForm && (
                    <GlassAiButton
                      type="button"
                      onClick={() => setShowNewTaskForm(true)}
                      size="xs"
                      variant="primary"
                      icon={}
                    >
                      New Task
                    </GlassAiButton>
                  )}
                </div>

                {/* New Task Form */}
                {showNewTaskForm && (
                  <form onSubmit={handleCreateTask} className="p-4 sm:p-5 rounded-2xl bg-[#181818] border border-white/10 mb-6 animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Create New Task</h4>
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Task title (e.g. Research dynamic programming approach)..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-white/30"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={newTaskAssignee}
                          onChange={(e) => setNewTaskAssignee(e.target.value)}
                          className="px-3.5 py-2 rounded-xl bg-[#121212] border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-white/30"
                        >
                          <option value="">Unassigned</option>
                          {team.members?.map((m) => (
                            <option key={m._id} value={m._id}>
                              Assign to: {m.name}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => setShowNewTaskForm(false)}
                            className="px-3 py-1.5 rounded-xl bg-[#222222] text-slate-300 hover:text-white text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <GlassAiButton
                            type="submit"
                            disabled={!newTaskTitle.trim() || creatingTask}
                            loading={creatingTask}
                            size="xs"
                            variant="primary"
                          >
                            Add Task
                          </GlassAiButton>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* Task Items */}
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400">
                    <div className="w-12 h-12 rounded-2xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center mx-auto mb-3 text-white">
                      �
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">No tasks yet</h4>
                    <p className="text-xs">Create the first team task to track contribution and solution milestones.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => {
                      const isAssignedToMe = task.assignedTo?._id?.toString() === currentUserId;
                      const isTaskCreator = task.createdBy?._id?.toString() === currentUserId;

                      return (
                        <div
                          key={task._id}
                          className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                            task.completed
                              ? 'bg-[#121212]/80 border-white/5 opacity-70'
                              : 'bg-[#181818] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task)}
                            className="mt-1 w-4 h-4 rounded-md accent-white bg-[#1e1e1e] border-white/20 text-white cursor-pointer"
                          />

                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4
                                className={`text-sm font-bold ${
                                  task.completed ? 'line-through text-neutral-400' : 'text-white'
                                }`}
                              >
                                {task.title}
                              </h4>

                              {(isLeader || isTaskCreator) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="text-neutral-400 hover:text-rose-400 transition p-1 cursor-pointer"
                                  title="Delete task"
                                >
                                  
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400 flex-wrap">
                              {task.assignedTo ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                                  isAssignedToMe ? 'bg-[#252525] text-white border border-white/15' : 'bg-[#1c1c1c] text-slate-300'
                                }`}>
                                   {task.assignedTo.name} {isAssignedToMe && '(You)'}
                                </span>
                              ) : (
                                <span className="text-neutral-400 italic">Unassigned</span>
                              )}

                              <span>Created by {task.createdBy?.name || 'Member'}</span>

                              {task.completedAt && (
                                <span className="text-emerald-400 font-medium">
                                  ✓ Completed {formatDate(task.completedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Team Contribution Breakdown */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#141414] border border-white/10 shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2">
                  
                  <span>Team Contribution</span>
                </h3>

                <div className="space-y-4">
                  {taskContribution.length === 0 ? (
                    <p className="text-xs text-neutral-400">Complete tasks to see live contribution statistics.</p>
                  ) : (
                    taskContribution.map((member) => {
                      const totalTasks = tasks.length || 1;
                      const percentage = Math.round((member.completedCount / totalTasks) * 100);

                      return (
                        <div key={member.userId} className="p-3.5 rounded-2xl bg-[#181818] border border-white/10">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                              <span>{member.name}</span>
                            </span>
                            <span className="text-slate-300 font-bold">
                              {member.completedCount} tasks completed
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-[#222222] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-white transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SHARED SOLUTION DRAFT */}
        {/* ========================================================= */}
        {activeTab === 'solution' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#141414] border border-white/10 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    
                    <span>Collaborative Solution Workspace</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    All team members can draft, review, and format the joint markdown & code solution here.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {draftSavedNotice && (
                    <span className="text-xs text-emerald-400 font-bold animate-in fade-in duration-200">
                      ✓ Draft Saved!
                    </span>
                  )}
                  {!isSubmitted && (
                    <GlassAiButton
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={savingDraft}
                      loading={savingDraft}
                      size="sm"
                      variant="glass"
                    >
                      Save Draft
                    </GlassAiButton>
                  )}
                </div>
              </div>

              {/* Markdown Editor Container */}
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#111111] shadow-inner">
                <MarkdownToolbar
                  textareaRef={solutionTextareaRef}
                  value={solutionDraft}
                  onChange={(val) => setSolutionDraft(val)}
                  activeTab={solutionTab}
                  setActiveTab={setSolutionTab}
                />

                {solutionTab === 'write' ? (
                  <textarea
                    ref={solutionTextareaRef}
                    rows={14}
                    value={solutionDraft}
                    onChange={(e) => setSolutionDraft(e.target.value)}
                    disabled={isSubmitted}
                    placeholder="Write the team's complete solution here. Include explanation, approach, and code blocks (e.g. ```javascript ... ```)..."
                    className="w-full px-4 py-4 text-sm text-white placeholder-slate-500 focus:outline-none bg-transparent font-mono"
                  />
                ) : (
                  <div className="p-6 min-h-[300px] max-h-[600px] overflow-y-auto bg-[#141414]">
                    {solutionDraft.trim() ? (
                      <MarkdownRenderer content={solutionDraft} />
                    ) : (
                      <p className="text-sm text-neutral-400 italic">
                        No solution text written yet. Switch to Write mode to prepare your team's solution.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Leader Submit Action Footer */}
              <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-xs text-neutral-400">
                  {isLeader
                    ? 'As Team Leader, you can submit this draft as the official Team Answer.'
                    : 'Your Team Leader will submit the final solution when ready.'}
                </span>

                {isLeader && !isSubmitted && (
                  <GlassAiButton
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    disabled={!solutionDraft.trim()}
                    size="md"
                    variant="primary"
                    icon={}
                  >
                    Submit Team Answer
                  </GlassAiButton>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Team Answer Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-[#161616] border border-white/15 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Submit Team Solution?</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Are you sure you want to submit this as your team's official solution? Once submitted, it will be published to the problem's Answers section for community review and Best Answer selection.
              </p>

              {submitError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submittingAnswer}
                  className="px-4 py-2 rounded-xl bg-[#222222] text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <GlassAiButton
                  type="button"
                  onClick={handleConfirmSubmitAnswer}
                  disabled={submittingAnswer}
                  loading={submittingAnswer}
                  size="sm"
                  variant="primary"
                >
                  Confirm & Submit
                </GlassAiButton>
              </div>
            </div>
          </div>
        )}

        {/* Leave Team Confirmation Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#161616] border border-white/15 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Leave Team?</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                {isLeader
                  ? 'You are the Team Leader. If you are the only member, the team will close. Otherwise, please transfer leadership first.'
                  : 'Are you sure you want to leave this team? You can join another team or collaborate on other problems.'}
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  disabled={leaving}
                  className="px-4 py-2 rounded-xl bg-[#222222] text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <GlassAiButton
                  type="button"
                  onClick={handleConfirmLeave}
                  disabled={leaving}
                  loading={leaving}
                  size="sm"
                  variant="danger"
                >
                  Leave Team
                </GlassAiButton>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Leadership Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#161616] border border-white/15 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Transfer Team Leadership</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                Select a team member to become the new Team Leader:
              </p>

              <div className="space-y-2 mb-6">
                {team.members
                  ?.filter((m) => m._id.toString() !== currentUserId)
                  .map((m) => (
                    <label
                      key={m._id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        selectedNewLeader === m._id
                          ? 'bg-[#222222] border-white/30 text-white'
                          : 'bg-[#181818] border-white/10 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="newLeader"
                        value={m._id}
                        checked={selectedNewLeader === m._id}
                        onChange={() => setSelectedNewLeader(m._id)}
                        className="accent-white"
                      />
                      <span className="font-bold text-xs">{m.name} (@{m.username || 'user'})</span>
                    </label>
                  ))}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  disabled={transferring}
                  className="px-4 py-2 rounded-xl bg-[#222222] text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <GlassAiButton
                  type="button"
                  onClick={handleConfirmTransfer}
                  disabled={!selectedNewLeader || transferring}
                  loading={transferring}
                  size="sm"
                  variant="primary"
                >
                  Confirm Transfer
                </GlassAiButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamWorkspace;
