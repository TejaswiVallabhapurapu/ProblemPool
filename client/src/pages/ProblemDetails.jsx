import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  getProblem,
  deleteProblem,
  getProblemAnswers,
  submitAnswer,
  deleteAnswer,
  saveProblem,
  unsaveProblem,
  getMySavedProblemIds,
  getRelatedProblems,
  summarizeAnswersWithAI,
  getProblemTeams,
  createTeam,
  joinTeam,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import AnswerCard from '../components/AnswerCard';
import MarkdownRenderer from '../components/MarkdownRenderer';
import MarkdownToolbar from '../components/MarkdownToolbar';
import AddToCollectionModal from '../components/AddToCollectionModal';
import GlassAiButton from '../components/GlassAiButton';
import EmptyState3D from '../components/EmptyState3D';
import { Loader, LoaderContainer } from '../components/Loader';


const CATEGORY_COLORS = {
  Programming: 'bg-white/10 text-slate-200 border-white/20',
  'Web Development': 'bg-sky-50 text-sky-700 border-sky-200',
  Database: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20',
  'AI & ML': 'bg-purple-50 text-purple-700 border-purple-200',
  DSA: 'bg-rose-950/40 text-rose-300 border-rose-500/20',
  Technology: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Career: 'bg-amber-950/40 text-amber-300 border-amber-500/20',
  College: 'bg-orange-50 text-orange-700 border-orange-200',
  Projects: 'bg-blue-50 text-blue-700 border-blue-200',
  Education: 'bg-teal-50 text-teal-700 border-teal-200',
  Healthcare: 'bg-rose-950/40 text-rose-300 border-rose-500/20',
  Environment: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20',
  Transportation: 'bg-white/10 text-slate-200 border-white/20',
  Community: 'bg-violet-50 text-violet-700 border-violet-200',
  General: 'bg-[#181818] text-slate-200 border-white/10',
  Other: 'bg-[#181818] text-slate-200 border-white/10',
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ProblemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isAuthenticated } = useAuth();

  const [problem, setProblem] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [relatedProblems, setRelatedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeletingProblem, setIsDeletingProblem] = useState(false);
  const [answerSort, setAnswerSort] = useState('best_answer');

  // Save states
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showReportProblemModal, setShowReportProblemModal] = useState(false);
  const [showDeleteProblemModal, setShowDeleteProblemModal] = useState(false);
  const [deleteProblemError, setDeleteProblemError] = useState(null);

  // Answer form states
  const [answerContent, setAnswerContent] = useState('');
  const [answerTab, setAnswerTab] = useState('write');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState('');
  const [answerSuccess, setAnswerSuccess] = useState('');

  // AI Answer Summary states
  const [aiSummary, setAiSummary] = useState(null);
  const [aiKeyTakeaways, setAiKeyTakeaways] = useState([]);
  const [summarizingAi, setSummarizingAi] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState(null);
  const [showAiSummaryCard, setShowAiSummaryCard] = useState(false);

  // Collaborative Team Up states
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [userActiveTeamId, setUserActiveTeamId] = useState(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamDescInput, setTeamDescInput] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState(null);
  const [joiningTeamId, setJoiningTeamId] = useState(null);
  const [teamNotice, setTeamNotice] = useState(null);

  const handleSummarizeAnswers = async () => {
    if (!answers || answers.length === 0) {
      setAiSummaryError('No answers are available to summarize yet.');
      setShowAiSummaryCard(true);
      return;
    }

    setSummarizingAi(true);
    setAiSummaryError(null);
    setShowAiSummaryCard(true);

    try {
      const res = await summarizeAnswersWithAI(
        {
          problemId: id,
          problemTitle: problem?.title || '',
          problemDescription: problem?.description || '',
          answers: answers.map((a) => ({
            content: a.content,
            upvotes: a.upvotes || 0,
            isAccepted: a.isAccepted || false,
            createdAt: a.createdAt,
          })),
        },
        token
      );

      if (res?.success && res.summary) {
        setAiSummary(res.summary);
        setAiKeyTakeaways(res.keyTakeaways || []);
      } else {
        setAiSummaryError(res?.message || 'Unable to generate summary at this moment.');
      }
    } catch (err) {
      setAiSummaryError(err.message || 'Failed to generate AI summary. Please check your connection.');
    } finally {
      setSummarizingAi(false);
    }
  };

  const fetchProblemAndAnswers = async (currentSort = answerSort) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch problem details, answers, saved problem status, and related problems in parallel
      const promises = [
        getProblem(id, token),
        getProblemAnswers(id, currentSort, token).catch((err) => {
          console.warn('Failed to load answers:', err);
          return { success: true, answers: [] };
        }),
        getRelatedProblems(id, token, 6).catch((err) => {
          console.warn('Failed to load related problems:', err);
          return { success: true, problems: [] };
        }),
      ];

      if (token) {
        promises.push(
          getMySavedProblemIds(token).catch(() => ({ success: true, savedProblemIds: [] }))
        );
      }

      // Fetch collaborative teams if problem allows team up
      promises.push(
        getProblemTeams(id, token).catch(() => ({ success: true, teams: [], userActiveTeamId: null }))
      );

      const [problemRes, answersRes, relatedRes, savedIdsRes, teamsRes] = await Promise.all(promises);

      if (problemRes.success && problemRes.problem) {
        setProblem(problemRes.problem);
      } else {
        setError('Problem not found');
      }

      if (answersRes && answersRes.answers) {
        setAnswers(answersRes.answers);
      }

      if (relatedRes && Array.isArray(relatedRes.problems)) {
        setRelatedProblems(relatedRes.problems);
      }

      if (savedIdsRes && Array.isArray(savedIdsRes.savedProblemIds)) {
        setIsSaved(savedIdsRes.savedProblemIds.includes(id));
      }

      if (teamsRes && Array.isArray(teamsRes.teams)) {
        setTeams(teamsRes.teams);
        setUserActiveTeamId(teamsRes.userActiveTeamId || null);
      }
    } catch (err) {
      setError(err.message || 'Unable to load problem details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblemAndAnswers(answerSort);
  }, [id, answerSort, token]);

  const handleSaveToggle = async () => {
    if (!isAuthenticated || !token) {
      setSaveNotice('Please sign in to save problems.');
      setTimeout(() => setSaveNotice(null), 3500);
      return;
    }

    if (savingState) return;

    const nextState = !isSaved;
    setSavingState(true);
    setSaveNotice(null);
    setIsSaved(nextState);

    try {
      if (nextState) {
        await saveProblem(id, token);
      } else {
        await unsaveProblem(id, token);
      }
    } catch (err) {
      setIsSaved(!nextState);
      setSaveNotice(err.message || 'Failed to update saved status');
      setTimeout(() => setSaveNotice(null), 3000);
    } finally {
      setSavingState(false);
    }
  };

  const handleDeleteProblem = () => {
    setDeleteProblemError(null);
    setShowDeleteProblemModal(true);
  };

  const handleConfirmDeleteProblem = async () => {
    if (isDeletingProblem || !token) return;

    try {
      setIsDeletingProblem(true);
      setDeleteProblemError(null);
      await deleteProblem(id, token);
      setShowDeleteProblemModal(false);
      navigate('/problems', { state: { message: 'Problem deleted successfully' } });
    } catch (err) {
      console.error('Failed to delete problem:', err);
      setDeleteProblemError(err.message || 'Failed to delete problem. Please try again.');
      setIsDeletingProblem(false);
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    setAnswerError('');
    setAnswerSuccess('');

    const trimmedContent = answerContent.trim();
    if (!trimmedContent) {
      setAnswerError('Please write an answer before submitting.');
      return;
    }

    if (!isAuthenticated || !token) {
      setAnswerError('Authentication required. Please log in to answer.');
      return;
    }

    try {
      setSubmittingAnswer(true);
      const res = await submitAnswer(id, trimmedContent, token);

      if (res.success && res.answer) {
        // Prepend new answer immediately to state
        setAnswers((prevAnswers) => [res.answer, ...prevAnswers]);
        setAnswerContent('');
        setAnswerSuccess('Your answer has been posted successfully!');

        // Clear success message after 4 seconds
        setTimeout(() => {
          setAnswerSuccess('');
        }, 4000);
      } else {
        setAnswerError(res.message || 'Failed to post answer.');
      }
    } catch (err) {
      setAnswerError(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('Are you sure you want to delete your answer?')) {
      return;
    }

    try {
      await deleteAnswer(id, answerId, token);
      setAnswers((prevAnswers) => prevAnswers.filter((a) => a._id !== answerId));
      if (problem?.bestAnswer === answerId) {
        setProblem((prev) => (prev ? { ...prev, bestAnswer: null } : prev));
      }
    } catch (err) {
      alert('Failed to delete answer: ' + err.message);
    }
  };

  // Callback when Best Answer changes
  const handleBestAnswerChange = (newBestAnswerId) => {
    setProblem((prev) => (prev ? { ...prev, bestAnswer: newBestAnswerId } : prev));
    setAnswers((prev) =>
      prev.map((ans) => ({
        ...ans,
        isBestAnswer: Boolean(newBestAnswerId && ans._id === newBestAnswerId),
      }))
    );
  };

  const authorName = problem?.createdBy?.name || 'Community Member';
  const authorEmail = problem?.createdBy?.email;
  const isProblemOwner = Boolean(
    user &&
      problem?.createdBy &&
      (user._id === problem.createdBy._id || user._id === problem.createdBy)
  );

  // Dynamic status computation
  const problemStatus = problem?.bestAnswer
    ? 'Solved'
    : answers.length > 0
    ? 'Answered'
    : 'Unanswered';

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/problems"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Problems</span>
        </Link>
      </div>

      {/* 1. Loading State */}
      {loading && (
        <LoaderContainer minHeight="50vh" message="Loading problem details..." />
      )}

      {/* 2. Error / Not Found State */}
      {!loading && error && (
        <div className="bg-[#141414]/90 backdrop-blur-md border border-white/10 rounded-2xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-950/40 text-rose-400 mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Problem Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Link
            to="/problems"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            ← Back to Problems
          </Link>
        </div>
      )}

      {/* 3. Problem Details & Answers Section */}
      {!loading && !error && problem && (
        <div className="space-y-8">
          {/* Problem Card */}
          <article className="bg-[#141414]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm p-6 sm:p-10">
            {/* Header Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-white/10 relative">
              {/* Notice popup if unauthenticated */}
              {saveNotice && (
                <div className="absolute top-0 right-0 z-20 bg-slate-900/95 text-white text-xs font-medium py-1.5 px-3 rounded-xl shadow-lg border border-slate-700/50 flex items-center gap-1.5 animate-in fade-in zoom-in duration-150">
                  <span>{saveNotice}</span>
                  {!isAuthenticated && (
                    <button
                      onClick={() => navigate('/login', { state: { from: location.pathname } })}
                      className="text-indigo-400 hover:text-indigo-300 underline font-semibold ml-1"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    CATEGORY_COLORS[problem.category] || 'bg-[#181818] text-slate-200 border-white/10'
                  }`}
                >
                  {problem.category}
                </span>

                {/* Status Indicator */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    problemStatus === 'Solved'
                      ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-xs'
                      : problemStatus === 'Answered'
                      ? 'bg-emerald-950/40 text-emerald-800 border-emerald-500/20'
                      : 'bg-amber-950/40 text-amber-800 border-amber-500/20'
                  }`}
                >
                  <span>
                    {problemStatus === 'Solved' ? '🔵' : problemStatus === 'Answered' ? '🟢' : '🟡'}
                  </span>
                  <span>{problemStatus}</span>
                </span>

                <span className="text-xs text-slate-400 font-medium">
                  Posted on {formatDate(problem.createdAt)}
                </span>
                         {/* Right Side Actions: Save Problem, Collection Button & Creator Delete */}
              <div className="flex items-center gap-2.5">
                <GlassAiButton
                  type="button"
                  onClick={handleSaveToggle}
                  disabled={savingState}
                  loading={savingState}
                  size="xs"
                  variant={isSaved ? "primary" : "glass"}
                  title={isSaved ? 'Remove from saved problems' : 'Save problem for later'}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </GlassAiButton>

                {isSaved && (
                  <GlassAiButton
                    type="button"
                    onClick={() => setShowCollectionModal(true)}
                    size="xs"
                    variant="glass"
                    title="Organize into collections"
                  >
                    Collections
                  </GlassAiButton>
                )}

                {isProblemOwner ? (
                  <GlassAiButton
                    type="button"
                    onClick={handleDeleteProblem}
                    disabled={isDeletingProblem}
                    loading={isDeletingProblem}
                    size="xs"
                    variant="danger"
                    title="Delete this problem"
                  >
                    Delete problem
                  </GlassAiButton>
                ) : (
                  <GlassAiButton
                    type="button"
                    onClick={() => setShowReportProblemModal(true)}
                    size="xs"
                    variant="glass"
                    title="Report inappropriate problem"
                  />
                )}
              </div>           </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug mb-4">
              {problem.title}
            </h1>

            {/* Author & Location Meta Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span>Posted by {authorName}</span>
                {authorEmail && <span className="text-indigo-400 font-normal">({authorEmail})</span>}
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181818] border border-white/10 text-slate-200 text-xs font-medium">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{problem.location}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-white/10 text-slate-300 text-xs font-medium">
                
                <span>{problem.views || 0} views</span>
              </div>
            </div>

            {/* Full Description with Markdown & Syntax Highlighting */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                
                <span>Problem Description</span>
              </h2>
              <div className="bg-[#181818] p-5 sm:p-7 rounded-2xl border border-white/10">
                <MarkdownRenderer content={problem.description} />
              </div>
            </div>

            {/* Tags Section */}
            {Array.isArray(problem.tags) && problem.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  
                  <span>Tags</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {problem.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/problems?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-white/10/80 text-slate-200 hover:bg-indigo-100 hover:text-indigo-800 border border-white/20/80 transition"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* ========================================================= */}
          {/*  COLLABORATIVE PROBLEM SOLVING (TEAM UP) SECTION */}
          {/* ========================================================= */}
          {problem.allowTeamUp && (
            <section className="p-6 sm:p-8 rounded-3xl bg-[#141414] border border-white/10 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center text-base">
                      
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Collaborate With Others
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#202020] border border-white/15 text-[11px] font-bold text-slate-200">
                      Team Up Enabled
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                    Form or join a team of up to 5 developers. Collaborate in a private workspace, delegate tasks, build a shared solution, and submit a joint answer.
                  </p>
                </div>

                {!userActiveTeamId && (
                  <GlassAiButton
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login', { state: { message: 'Please sign in to create or join a team', from: location.pathname } });
                        return;
                      }
                      setCreateTeamError(null);
                      setShowCreateTeamModal(true);
                    }}
                    size="sm"
                    variant="primary"
                  >
                    Start a Team
                  </GlassAiButton>
                )}
              </div>

              {/* Toast / Notice for team actions */}
              {teamNotice && (
                <div className="p-3.5 rounded-2xl bg-[#1c1c1c] border border-white/15 text-slate-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  
                  <span>{teamNotice}</span>
                </div>
              )}

              {/* Active Teams List / Empty State */}
              {teams.length === 0 ? (
                <div className="text-center py-10 rounded-2xl bg-[#101010] border border-white/5 p-6">
                  <p className="text-sm font-bold text-white mb-1">Be the first to start a team!</p>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                    Gather collaborators, solve this problem together, and share the contribution reward.
                  </p>
                  <GlassAiButton
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login', { state: { message: 'Please sign in to create a team', from: location.pathname } });
                        return;
                      }
                      setCreateTeamError(null);
                      setShowCreateTeamModal(true);
                    }}
                    size="xs"
                    variant="primary"
                  >
                    Create First Team
                  </GlassAiButton>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map((team) => {
                    const isMyTeam = team.isUserMember;
                    const isFull = team.isFull;
                    const isSubmitted = team.status === 'SUBMITTED' || team.status === 'COMPLETED';

                    return (
                      <div
                        key={team._id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isMyTeam
                            ? 'bg-[#181818] border-white/25 shadow-md'
                            : 'bg-[#121212] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div>
                          {/* Team Title & Member Count Badge */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                                <span>{team.name}</span>
                                {isMyTeam && (
                                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#2a2a2a] text-white border border-white/20 font-bold">
                                    Your Team
                                  </span>
                                )}
                              </h3>
                              {team.description && (
                                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                  {team.description}
                                </p>
                              )}
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 ${
                                isFull
                                  ? 'bg-[#222222] text-slate-400 border border-white/10'
                                  : 'bg-[#1a1a1a] text-slate-200 border border-white/15'
                              }`}
                            >
                              {team.memberCount} / 5 members
                            </span>
                          </div>

                          {/* Member Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap my-3">
                            {team.members?.map((m) => (
                              <span
                                key={m._id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1a1a1a] border border-white/10 text-[11px] font-medium text-neutral-300"
                              >
                                <span>{m.name}</span>
                                {m._id === team.leaderId?._id && (
                                  <span className="text-[9px] font-mono text-neutral-400 font-semibold uppercase">(Leader)</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Team Action Button */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-2">
                          <span className="text-[11px] text-slate-500">
                            Status: <strong className="text-slate-300 font-semibold">{team.status}</strong>
                          </span>

                          {isMyTeam ? (
                            <GlassAiButton
                              to={`/problems/${problem._id}/team/${team._id}`}
                              size="xs"
                              variant="primary"
                              iconPosition="right"
                            >
                              Open Workspace
                            </GlassAiButton>
                          ) : isSubmitted ? (
                            <span className="text-xs text-slate-400 font-semibold italic">
                              Solution Submitted
                            </span>
                          ) : isFull ? (
                            <span className="text-xs text-slate-500 font-semibold">
                              Team Full
                            </span>
                          ) : userActiveTeamId ? (
                            <span className="text-xs text-slate-500 font-semibold">
                              In Another Team
                            </span>
                          ) : (
                            <GlassAiButton
                              type="button"
                              onClick={async () => {
                                if (!isAuthenticated) {
                                  navigate('/login', { state: { message: 'Please sign in to join a team', from: location.pathname } });
                                  return;
                                }
                                setJoiningTeamId(team._id);
                                try {
                                  const res = await joinTeam(team._id, token);
                                  if (res.success) {
                                    setTeamNotice(`Joined team "${team.name}"! Navigating to workspace...`);
                                    setTimeout(() => {
                                      navigate(`/problems/${problem._id}/team/${team._id}`);
                                    }, 600);
                                  }
                                } catch (err) {
                                  alert(err.message || 'Failed to join team');
                                } finally {
                                  setJoiningTeamId(null);
                                }
                              }}
                              disabled={joiningTeamId === team._id}
                              loading={joiningTeamId === team._id}
                              size="xs"
                              variant="glass"
                            >
                              Join Team
                            </GlassAiButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ========================================================= */}
          {/* ANSWERS SECTION */}
          {/* ========================================================= */}
          <section className="bg-[#141414]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm p-6 sm:p-10">
            {/* Answers Section Header with Sorting Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Answers
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {answers.length}
                </span>
              </div>

              {/* Right Side Header Controls: Sort & AI Summarize Answers */}
              <div className="flex flex-wrap items-center gap-3">
                {/* AI Summarize Answers Button */}
                {answers.length > 0 && (
                  <GlassAiButton
                    type="button"
                    onClick={handleSummarizeAnswers}
                    disabled={summarizingAi}
                    loading={summarizingAi}
                    size="xs"
                    variant="primary"
                    title="Generate an AI-powered overview of all community solutions"
                  >
                    Summarize Answers
                  </GlassAiButton>
                )}

                {/* Answer Sorting Options */}
                {answers.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 font-semibold hidden sm:inline">Sort:</span>
                    <div className="inline-flex rounded-xl bg-[#202020] p-1">
                      <button
                        type="button"
                        onClick={() => setAnswerSort('best_answer')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          answerSort === 'best_answer'
                            ? 'bg-[#141414]/90 backdrop-blur-md text-white shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Best Answer
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnswerSort('most_helpful')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          answerSort === 'most_helpful'
                            ? 'bg-[#141414]/90 backdrop-blur-md text-white shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        👍 Most Helpful
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnswerSort('newest')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          answerSort === 'newest'
                            ? 'bg-[#141414]/90 backdrop-blur-md text-white shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🕒 Newest
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnswerSort('oldest')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          answerSort === 'oldest'
                            ? 'bg-[#141414]/90 backdrop-blur-md text-white shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        ⌛ Oldest
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Answer Summary Display Card */}
            {showAiSummaryCard && (
              <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 border border-white/20 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/15 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                      
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">AI Answer Summary</h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-white/20">
                          AI-generated summary
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Synthesized from {answers.length} community answer{answers.length > 1 ? 's' : ''}. Does not replace original answers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSummarizeAnswers}
                      disabled={summarizingAi}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-[#141414]/90 backdrop-blur-md/80 transition cursor-pointer"
                      title="Re-generate summary"
                    >
                      
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAiSummaryCard(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#141414]/90 backdrop-blur-md/80 transition cursor-pointer"
                      title="Close summary"
                    >
                      
                    </button>
                  </div>
                </div>

                {summarizingAi ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-200 font-medium">
                    <Loader size="sm" />
                    <span>Analyzing community solutions and generating summary...</span>
                  </div>
                ) : aiSummaryError ? (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-800 text-xs flex items-center justify-between">
                    <span>{aiSummaryError}</span>
                    <button
                      type="button"
                      onClick={handleSummarizeAnswers}
                      className="font-bold underline ml-2 cursor-pointer text-rose-900"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-[#141414]/90 backdrop-blur-md/90 border border-white/15/80 shadow-2xs text-xs sm:text-sm text-slate-100 leading-relaxed">
                      {aiSummary}
                    </div>

                    {aiKeyTakeaways && aiKeyTakeaways.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-white/10/60 border border-white/15">
                        <span className="text-xs font-bold text-indigo-950 block mb-1.5">
                          Key Takeaways:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-xs text-indigo-900/90">
                          {aiKeyTakeaways.map((takeaway, idx) => (
                            <li key={idx}>{takeaway}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>AI summaries help understand answers quickly. Always check original code blocks below.</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Answer Form (If Logged In) */}
            {isAuthenticated ? (
              <div className="mb-10 p-6 rounded-2xl bg-[#181818] border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-white">
                    Your Answer
                  </h3>
                  {user && (
                    <span className="text-xs text-slate-500 font-medium">
                      Answering as <strong className="text-white">{user.name}</strong>
                    </span>
                  )}
                </div>

                {answerError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-800 text-xs flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{answerError}</span>
                  </div>
                )}

                {answerSuccess && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 text-xs flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{answerSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAnswerSubmit} className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-[#141414]/90 backdrop-blur-md shadow-xs overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-white/10 transition-all">
                    <MarkdownToolbar
                      value={answerContent}
                      onChange={(newVal) => {
                        setAnswerContent(newVal);
                        if (answerError) setAnswerError('');
                      }}
                      activeTab={answerTab}
                      onTabChange={setAnswerTab}
                    />

                    {answerTab === 'write' ? (
                      <textarea
                        rows={6}
                        value={answerContent}
                        onChange={(e) => {
                          setAnswerContent(e.target.value);
                          if (answerError) setAnswerError('');
                        }}
                        placeholder="Explain your solution, steps to resolve, or code examples using Markdown (e.g. ```java ... ```)..."
                        className="w-full px-4 py-3 bg-[#141414]/90 backdrop-blur-md text-white text-sm placeholder-slate-400 focus:outline-none font-mono text-[13px] leading-relaxed resize-y"
                      />
                    ) : (
                      <div className="p-4 sm:p-5 min-h-[160px] bg-[#181818]">
                        {answerContent.trim() ? (
                          <MarkdownRenderer content={answerContent} />
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Nothing to preview yet. Write some Markdown or code in the Write tab!
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Tip: Use <code className="bg-[#202020] text-white px-1 py-0.5 rounded font-mono">```language</code> for syntax-highlighted code blocks with a copy button.
                    </span>
                    <GlassAiButton
                      type="submit"
                      disabled={submittingAnswer || !answerContent.trim()}
                      loading={submittingAnswer}
                      variant="primary"
                      size="md"
                    >
                      Submit Answer
                    </GlassAiButton>
                  </div>
                </form>
              </div>
            ) : (
              /* Prompt to Log in (If Not Logged In) */
              <div className="mb-10 p-6 rounded-2xl bg-white/10/60 border border-white/15 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-base font-bold text-white mb-1">
                    Have a solution or idea for this problem?
                  </h3>
                  <p className="text-xs text-slate-300">
                    Please sign in to answer this problem, vote, and review community solutions.
                  </p>
                </div>
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors shrink-0"
                >
                  Sign In to Answer
                </Link>
              </div>
            )}

            {/* List of Existing Answers with Feedback, Reviews, Replies, and Best Answer */}
            <div className="space-y-6">
              {answers.length === 0 ? (
                /* 3D Animated Empty state */
                <div className="py-4">
                  <EmptyState3D
                    type="unanswered"
                    title="No Answers Yet"
                    description="Be the first to help solve this problem by submitting your code or explanation!"
                  />
                </div>
              ) : (
                /* Answer Cards */
                answers.map((ans) => (
                  <AnswerCard
                    key={ans._id}
                    answer={ans}
                    problemId={id}
                    isProblemOwner={isProblemOwner}
                    currentUser={user}
                    token={token}
                    isAuthenticated={isAuthenticated}
                    onDeleteAnswer={handleDeleteAnswer}
                    onBestAnswerChange={handleBestAnswerChange}
                  />
                ))
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* RELATED PROBLEMS SECTION */}
          {/* ========================================================= */}
          {relatedProblems.length > 0 && (
            <section className="bg-[#141414]/90 backdrop-blur-md rounded-3xl border border-white/10 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>🔗 Related Problems</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Explore similar community challenges, questions, and solutions.
                  </p>
                </div>
                <Link
                  to={problem.category ? `/problems?category=${encodeURIComponent(problem.category)}` : '/problems'}
                  className="text-xs font-semibold text-white hover:text-slate-200 inline-flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>More in {problem.category || 'this category'}</span>
                  
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedProblems.map((rel) => {
                  const isSolved = rel.status === 'Solved' || Boolean(rel.bestAnswer);
                  const isAnswered = rel.status === 'Answered' || rel.answersCount > 0;

                  return (
                    <Link
                      key={rel._id}
                      to={`/problems/${rel._id}`}
                      className="group p-4 rounded-2xl border border-white/10 bg-[#181818] hover:bg-[#141414]/90 backdrop-blur-md hover:border-white/20 transition-all duration-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Category + Status */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              CATEGORY_COLORS[rel.category] || CATEGORY_COLORS.General
                            }`}
                          >
                            {rel.category || 'General'}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isSolved
                                ? 'bg-amber-950/40 text-amber-300 border border-amber-500/20'
                                : isAnswered
                                ? 'bg-white/10 text-slate-200 border border-white/20'
                                : 'bg-[#202020] text-slate-300 border border-white/10'
                            }`}
                          >
                            {isSolved ? 'Solved' : isAnswered ? 'Answered' : 'Open'}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-sm text-white group-hover:text-white transition-colors line-clamp-2 mb-2 leading-snug">
                          {rel.title}
                        </h4>

                        {/* Tags */}
                        {Array.isArray(rel.tags) && rel.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {rel.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#202020] text-slate-300"
                              >
                                #{t}
                              </span>
                            ))}
                            {rel.tags.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{rel.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer metrics */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            
                            <span>{rel.views || 0}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            
                            <span>{rel.answersCount || 0}</span>
                          </span>
                        </div>
                        <span className="text-white group-hover:translate-x-0.5 transition-transform font-semibold">
                          View →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bottom Navigation */}
          <div className="pt-2 flex items-center justify-between">
            <Link
              to="/problems"
              className="text-sm font-semibold text-white hover:text-slate-200 inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Back to Problems</span>
            </Link>
            <Link
              to="/create-problem"
              className="text-sm font-medium text-slate-500 hover:text-white"
            >
              Post another problem →
            </Link>
          </div>

          {/* Add to Collection Modal */}
          {showCollectionModal && problem && (
            <AddToCollectionModal
              problem={problem}
              isOpen={showCollectionModal}
              onClose={() => setShowCollectionModal(false)}
            />
          )}

          {/* Report Problem Modal */}
          {showReportProblemModal && problem && (
            <ReportModal
              isOpen={showReportProblemModal}
              onClose={() => setShowReportProblemModal(false)}
              contentType="problem"
              contentId={problem._id}
              contentTitle={problem.title}
            />
          )}

          {/* Delete Problem Confirmation Modal */}
          {showDeleteProblemModal && problem && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => !isDeletingProblem && setShowDeleteProblemModal(false)}
            >
              <div
                className="bg-[#141414]/90 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => !isDeletingProblem && setShowDeleteProblemModal(false)}
                  className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-300 hover:bg-[#202020] transition"
                  aria-label="Close modal"
                >
                  
                </button>

                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-rose-950/40 text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 shadow-xs">
                    <Trash2 className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Delete Problem Post?</h3>
                    <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
                  </div>
                </div>

                <div className="bg-[#181818] rounded-2xl p-3.5 mb-4 border border-white/10">
                  <p className="text-xs font-semibold text-slate-100 line-clamp-2">
                    "{problem.title}"
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    All answers, reviews, helpful votes, and saved bookmarks will be permanently removed.
                  </p>
                </div>

                {deleteProblemError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/20 text-xs text-rose-300 font-medium">
                    {deleteProblemError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5">
                  <GlassAiButton
                    type="button"
                    onClick={() => setShowDeleteProblemModal(false)}
                    disabled={isDeletingProblem}
                    size="sm"
                    variant="glass"
                  >
                    Cancel
                  </GlassAiButton>

                  <GlassAiButton
                    type="button"
                    onClick={handleConfirmDeleteProblem}
                    disabled={isDeletingProblem}
                    loading={isDeletingProblem}
                    size="sm"
                    variant="danger"
                  >
                    {isDeletingProblem ? 'Deleting...' : 'Delete Permanently'}
                  </GlassAiButton>
                </div>
              </div>
            </div>
          )}

          {/* Create Collaborative Team Modal */}
          {showCreateTeamModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#161616] border border-white/15 shadow-2xl">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    
                    <h3 className="text-lg font-bold text-white">Create Collaborative Team</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateTeamModal(false)}
                    className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
                  >
                    
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Start a small team (up to 5 members). You will automatically become the Team Leader and get access to a private workspace with live chat, tasks, and a collaborative solution draft.
                </p>

                {createTeamError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/30 text-xs text-rose-300">
                    {createTeamError}
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!teamNameInput.trim() || creatingTeam || !token) return;
                    setCreatingTeam(true);
                    setCreateTeamError(null);

                    try {
                      const res = await createTeam(
                        id,
                        { name: teamNameInput.trim(), description: teamDescInput.trim() },
                        token
                      );
                      if (res.success && res.team) {
                        setShowCreateTeamModal(false);
                        setTeamNameInput('');
                        setTeamDescInput('');
                        navigate(`/problems/${id}/team/${res.team._id}`);
                      }
                    } catch (err) {
                      setCreateTeamError(err.message || 'Failed to create team');
                    } finally {
                      setCreatingTeam(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Team Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      placeholder="e.g., ML Problem Solvers, Python Coders..."
                      className="w-full px-4 py-3 rounded-xl bg-[#111111] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Short Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={teamDescInput}
                      onChange={(e) => setTeamDescInput(e.target.value)}
                      placeholder="e.g. Aiming for an optimal O(n) solution in Python"
                      className="w-full px-4 py-3 rounded-xl bg-[#111111] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateTeamModal(false)}
                      className="px-4 py-2 rounded-xl bg-[#222222] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <GlassAiButton
                      type="submit"
                      disabled={!teamNameInput.trim() || creatingTeam}
                      loading={creatingTeam}
                      size="sm"
                      variant="primary"
                    >
                      Create Team
                    </GlassAiButton>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default ProblemDetails;
