import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Trophy,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  MessageSquare,
  Star,
  Plus,
  Loader2,
  AlertCircle,
  Tag,
  ArrowRight,
  Flame,
  Code2,
  Award,
  ChevronRight,
  Send,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getChallenges,
  getChallengeById,
  createChallenge,
  submitChallengeSolution,
  selectChallengeBestAnswer,
} from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import MarkdownToolbar from '../components/MarkdownToolbar';

const DIFFICULTY_BADGES = {
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-rose-50 text-rose-700 border-rose-200',
  Expert: 'bg-purple-50 text-purple-700 border-purple-200',
};

const Challenges = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'upcoming' | 'completed'
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [challengeDetailsLoading, setChallengeDetailsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Submit solution modal/state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [solutionContent, setSolutionContent] = useState('');
  const [solutionTab, setSolutionTab] = useState('write');
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState(null);
  const solutionTextareaRef = useRef(null);

  // Admin create challenge modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'Programming',
    tags: '',
    difficulty: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pointsReward: 50,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const isAdmin = Boolean(user && user.role === 'admin');

  // Fetch all challenges
  const fetchChallengesList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getChallenges({}, token);
      if (res && res.success) {
        setChallenges(res.challenges || []);
        // Automatically select the first active challenge or first challenge
        const active = res.challenges.find((c) => c.status === 'active') || res.challenges[0];
        if (active) {
          loadChallengeDetails(active._id);
        }
      } else {
        setError(res?.message || 'Failed to load challenges');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Load single challenge with submissions
  const loadChallengeDetails = async (id) => {
    setChallengeDetailsLoading(true);
    try {
      const res = await getChallengeById(id, token);
      if (res && res.success) {
        setSelectedChallenge(res.challenge);
      }
    } catch (err) {
      console.warn('Failed to load challenge details:', err);
    } finally {
      setChallengeDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengesList();
  }, [token]);

  // Submit solution
  const handleSolutionSubmit = async (e) => {
    e.preventDefault();
    if (!solutionContent.trim() || submittingSolution || !selectedChallenge) return;

    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    setSubmittingSolution(true);
    setSolutionError(null);

    try {
      const res = await submitChallengeSolution(
        selectedChallenge._id,
        { content: solutionContent.trim() },
        token
      );

      if (res && res.success) {
        showToast('Solution submitted! +5 reputation points earned.');
        setSolutionContent('');
        setShowSubmitModal(false);
        loadChallengeDetails(selectedChallenge._id);
      } else {
        setSolutionError(res?.message || 'Failed to submit solution');
      }
    } catch (err) {
      setSolutionError(err.message || 'Submission failed');
    } finally {
      setSubmittingSolution(false);
    }
  };

  // Admin: Select Best Answer
  const handleSelectBestAnswer = async (answerId) => {
    if (!isAdmin || !selectedChallenge || !token) return;
    try {
      const res = await selectChallengeBestAnswer(selectedChallenge._id, answerId, token);
      if (res && res.success) {
        showToast(res.message || 'Best answer awarded!');
        loadChallengeDetails(selectedChallenge._id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to award best answer');
    }
  };

  // Admin: Create Challenge
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim() || creating || !token) return;

    setCreating(true);
    setCreateError(null);

    try {
      const tagsArray = createForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await createChallenge(
        {
          ...createForm,
          tags: tagsArray,
        },
        token
      );

      if (res && res.success) {
        showToast('Weekly challenge created successfully!');
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          description: '',
          category: 'Programming',
          tags: '',
          difficulty: 'Medium',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pointsReward: 50,
        });
        fetchChallengesList();
      } else {
        setCreateError(res?.message || 'Failed to create challenge');
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create challenge');
    } finally {
      setCreating(false);
    }
  };

  const filteredChallenges = challenges.filter((c) => {
    if (activeTab === 'active') return c.status === 'active';
    if (activeTab === 'upcoming') return c.status === 'upcoming';
    if (activeTab === 'completed') return c.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white text-xs font-semibold py-2.5 px-4 rounded-2xl shadow-xl border border-slate-700/60 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
            <span>Community Hack & Learn</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>🧩 Weekly Coding Challenges</span>
          </h1>
          <p className="text-slate-600 mt-1.5 text-sm sm:text-base">
            Tackle curated community challenges, test your skills, and earn reputation points.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Challenge</span>
            </button>
          )}

          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Leaderboard</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Challenge Selector & Active Details View */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <span className="text-sm font-semibold">Loading weekly challenges...</span>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-md mx-auto">
          <p className="text-sm text-rose-600 font-semibold mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchChallengesList}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Challenge Details & Submissions (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {selectedChallenge ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-9 space-y-6">
                {/* Challenge Header Meta */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        DIFFICULTY_BADGES[selectedChallenge.difficulty] ||
                        DIFFICULTY_BADGES.Medium
                      }`}
                    >
                      {selectedChallenge.difficulty}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {selectedChallenge.category}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        selectedChallenge.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedChallenge.status === 'upcoming'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {selectedChallenge.status === 'active'
                        ? '🔥 Active Challenge'
                        : selectedChallenge.status === 'upcoming'
                        ? '⏳ Upcoming'
                        : '🏆 Completed'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold">
                    <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>+{selectedChallenge.pointsReward || 50} Rep Points Reward</span>
                  </div>
                </div>

                {/* Challenge Title */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                    {selectedChallenge.title}
                  </h2>

                  <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Ends on{' '}
                        {new Date(selectedChallenge.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </span>

                    <span>•</span>

                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{selectedChallenge.participantsCount || 0} participants</span>
                    </span>

                    <span>•</span>

                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{selectedChallenge.submissionsCount || 0} solutions</span>
                    </span>
                  </div>
                </div>

                {/* Markdown Description */}
                <div className="py-2">
                  <MarkdownRenderer content={selectedChallenge.description} />
                </div>

                {/* Tags */}
                {selectedChallenge.tags && selectedChallenge.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {selectedChallenge.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action CTA: Submit Solution Button */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                  {selectedChallenge.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) navigate('/login');
                        else setShowSubmitModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition cursor-pointer"
                    >
                      <Code2 className="w-4 h-4" />
                      <span>Submit Solution / Answer</span>
                    </button>
                  ) : selectedChallenge.status === 'completed' ? (
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>This challenge has ended. Submissions are closed.</span>
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span>This challenge opens soon.</span>
                    </div>
                  )}

                  {selectedChallenge.problem && (
                    <Link
                      to={`/problems/${selectedChallenge.problem._id || selectedChallenge.problem}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>View in Problems →</span>
                    </Link>
                  )}
                </div>

                {/* Submissions List */}
                <div className="pt-8 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span>Community Solutions ({selectedChallenge.submissions?.length || 0})</span>
                    </h3>
                  </div>

                  {selectedChallenge.submissions && selectedChallenge.submissions.length > 0 ? (
                    <div className="space-y-4">
                      {selectedChallenge.submissions.map((sub) => {
                        const isBest = Boolean(sub.isBestAnswer);

                        return (
                          <div
                            key={sub._id}
                            className={`p-5 rounded-2xl border transition-all ${
                              isBest
                                ? 'bg-gradient-to-r from-amber-50/60 to-white border-amber-300 shadow-sm ring-1 ring-amber-200'
                                : 'bg-slate-50/50 border-slate-200'
                            }`}
                          >
                            {/* Best Answer Badge */}
                            {isBest && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold mb-3">
                                <span>⭐</span>
                                <span>WINNING BEST ANSWER</span>
                              </div>
                            )}

                            {/* Author Row */}
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                  {sub.author?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <Link
                                    to={`/profile/${sub.author?.username || sub.author?._id}`}
                                    className="font-bold text-xs text-slate-900 hover:text-indigo-600 block"
                                  >
                                    {sub.author?.name}
                                  </Link>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(sub.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              {/* Admin award Best Answer button */}
                              {isAdmin && !isBest && (
                                <button
                                  type="button"
                                  onClick={() => handleSelectBestAnswer(sub._id)}
                                  className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 rounded-xl transition cursor-pointer"
                                >
                                  Award Best Answer ⭐
                                </button>
                              )}
                            </div>

                            {/* Solution Code & Markdown Content */}
                            <div className="text-sm">
                              <MarkdownRenderer content={sub.content} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
                      <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-slate-600 mb-1">
                        No solutions submitted yet.
                      </p>
                      <p className="text-[11px]">
                        Be the first to submit an answer and earn reputation!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                Select a challenge from the right to view its problem statement.
              </div>
            )}
          </div>

          {/* Right Column: Challenge Browser & Tabs (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Status Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1">
              {['active', 'upcoming', 'completed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActiveTab(st)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    activeTab === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Challenges List Cards */}
            <div className="space-y-3">
              {filteredChallenges.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                  No {activeTab} challenges right now.
                </div>
              ) : (
                filteredChallenges.map((ch) => {
                  const isSelected = selectedChallenge?._id === ch._id;
                  const diffBadge =
                    DIFFICULTY_BADGES[ch.difficulty] || DIFFICULTY_BADGES.Medium;

                  return (
                    <button
                      key={ch._id}
                      type="button"
                      onClick={() => loadChallengeDetails(ch._id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200 shadow-sm'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${diffBadge}`}>
                          {ch.difficulty}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          +{ch.pointsReward || 50} pts
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 line-clamp-2 mb-1.5">
                        {ch.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{ch.category}</span>
                        <span className="font-semibold text-slate-600">
                          {ch.submissionsCount || 0} answers
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Solution Modal */}
      {showSubmitModal && selectedChallenge && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Submit Challenge Solution
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {selectedChallenge.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {solutionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {solutionError}
              </div>
            )}

            <form onSubmit={handleSolutionSubmit} className="space-y-4">
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <MarkdownToolbar
                  textareaRef={solutionTextareaRef}
                  value={solutionContent}
                  onChange={setSolutionContent}
                  activeTab={solutionTab}
                  setActiveTab={setSolutionTab}
                />

                {solutionTab === 'write' ? (
                  <textarea
                    ref={solutionTextareaRef}
                    rows={8}
                    value={solutionContent}
                    onChange={(e) => setSolutionContent(e.target.value)}
                    placeholder="Write your explanation and code solution here (e.g. ```python ... ```)..."
                    className="w-full px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent font-mono"
                  />
                ) : (
                  <div className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto bg-slate-50/50">
                    {solutionContent.trim() ? (
                      <MarkdownRenderer content={solutionContent} />
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Nothing to preview yet. Switch back to Write mode and type your solution.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSolution || !solutionContent.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {submittingSolution ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Solution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Create Challenge Modal */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Create Weekly Coding Challenge
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateChallenge} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Implement an LRU Cache in O(1)"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-slate-900"
                  >
                    <option value="Programming">Programming</option>
                    <option value="DSA">DSA</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Database">Database</option>
                    <option value="AI & ML">AI & ML</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Difficulty</label>
                  <select
                    value={createForm.difficulty}
                    onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-slate-900"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Problem Description & Instructions (Markdown supported) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Explain the problem constraints, input/output examples, and rules..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={createForm.tags}
                    onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                    placeholder="dsa, algorithms, python"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Points Reward</label>
                  <input
                    type="number"
                    value={createForm.pointsReward}
                    onChange={(e) => setCreateForm({ ...createForm, pointsReward: Number(e.target.value) })}
                    min={10}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !createForm.title.trim()}
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-xl transition cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Create Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challenges;
