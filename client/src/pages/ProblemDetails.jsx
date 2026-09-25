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
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import AnswerCard from '../components/AnswerCard';
import { Bookmark, Loader2, Eye, Tag } from 'lucide-react';

const CATEGORY_COLORS = {
  Programming: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Web Development': 'bg-sky-50 text-sky-700 border-sky-200',
  Database: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'AI & ML': 'bg-purple-50 text-purple-700 border-purple-200',
  DSA: 'bg-rose-50 text-rose-700 border-rose-200',
  Technology: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Career: 'bg-amber-50 text-amber-700 border-amber-200',
  College: 'bg-orange-50 text-orange-700 border-orange-200',
  Projects: 'bg-blue-50 text-blue-700 border-blue-200',
  Education: 'bg-teal-50 text-teal-700 border-teal-200',
  Healthcare: 'bg-rose-50 text-rose-700 border-rose-200',
  Environment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Transportation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Community: 'bg-violet-50 text-violet-700 border-violet-200',
  General: 'bg-slate-50 text-slate-700 border-slate-200',
  Other: 'bg-slate-50 text-slate-700 border-slate-200',
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeletingProblem, setIsDeletingProblem] = useState(false);
  const [answerSort, setAnswerSort] = useState('best_answer');

  // Save states
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null);

  // Answer form states
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState('');
  const [answerSuccess, setAnswerSuccess] = useState('');

  const fetchProblemAndAnswers = async (currentSort = answerSort) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch problem details, answers, and saved problem status in parallel
      const promises = [
        getProblem(id),
        getProblemAnswers(id, currentSort, token).catch((err) => {
          console.warn('Failed to load answers:', err);
          return { success: true, answers: [] };
        }),
      ];

      if (token) {
        promises.push(
          getMySavedProblemIds(token).catch(() => ({ success: true, savedProblemIds: [] }))
        );
      }

      const [problemRes, answersRes, savedIdsRes] = await Promise.all(promises);

      if (problemRes.success && problemRes.problem) {
        setProblem(problemRes.problem);
      } else {
        setError('Problem not found');
      }

      if (answersRes && answersRes.answers) {
        setAnswers(answersRes.answers);
      }

      if (savedIdsRes && Array.isArray(savedIdsRes.savedProblemIds)) {
        setIsSaved(savedIdsRes.savedProblemIds.includes(id));
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
      setSaveNotice('Please login to save problems.');
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

  const handleDeleteProblem = async () => {
    if (!window.confirm('Are you sure you want to delete this problem and all its answers/reviews?')) {
      return;
    }

    try {
      setIsDeletingProblem(true);
      await deleteProblem(id, token);
      navigate('/problems');
    } catch (err) {
      alert('Failed to delete problem: ' + err.message);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/problems"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Problems</span>
        </Link>
      </div>

      {/* 1. Loading State */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Loading problem details...</p>
        </div>
      )}

      {/* 2. Error / Not Found State */}
      {!loading && error && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Problem Not Found</h2>
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
          <article className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
            {/* Header Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-slate-100 relative">
              {/* Notice popup if unauthenticated */}
              {saveNotice && (
                <div className="absolute top-0 right-0 z-20 bg-slate-900/95 text-white text-xs font-medium py-1.5 px-3 rounded-xl shadow-lg border border-slate-700/50 flex items-center gap-1.5 animate-in fade-in zoom-in duration-150">
                  <span>{saveNotice}</span>
                  {!isAuthenticated && (
                    <button
                      onClick={() => navigate('/login', { state: { from: location.pathname } })}
                      className="text-indigo-400 hover:text-indigo-300 underline font-semibold ml-1"
                    >
                      Login
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    CATEGORY_COLORS[problem.category] || 'bg-slate-50 text-slate-700 border-slate-200'
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
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
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
              </div>

              {/* Right Side Actions: Save Problem & Creator Delete */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveToggle}
                  disabled={savingState}
                  title={isSaved ? 'Remove from saved problems' : 'Save problem for later'}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    isSaved
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {savingState ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        isSaved ? 'fill-indigo-600 text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                  )}
                  <span>{isSaved ? '🔖 Saved' : '🔖 Save'}</span>
                </button>

                {isProblemOwner && (
                  <button
                    onClick={handleDeleteProblem}
                    disabled={isDeletingProblem}
                    className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors cursor-pointer ml-1"
                    title="Delete this problem"
                  >
                    {isDeletingProblem ? 'Deleting...' : 'Delete problem'}
                  </button>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-4">
              {problem.title}
            </h1>

            {/* Author & Location Meta Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span>Posted by {authorName}</span>
                {authorEmail && <span className="text-indigo-400 font-normal">({authorEmail})</span>}
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{problem.location}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{problem.views || 0} views</span>
              </div>
            </div>

            {/* Full Description */}
            <div className="prose prose-slate max-w-none">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Problem Description
              </h2>
              <div className="text-slate-700 text-base leading-relaxed whitespace-pre-line bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                {problem.description}
              </div>
            </div>

            {/* Tags Section */}
            {Array.isArray(problem.tags) && problem.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tags</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {problem.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/problems?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/80 transition"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* ========================================================= */}
          {/* ANSWERS SECTION */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
            {/* Answers Section Header with Sorting Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Answers
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {answers.length}
                </span>
              </div>

              {/* Answer Sorting Options */}
              {answers.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-semibold">Sort by:</span>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setAnswerSort('best_answer')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        answerSort === 'best_answer'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ⭐ Best Answer
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnswerSort('most_helpful')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        answerSort === 'most_helpful'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      👍 Most Helpful
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnswerSort('newest')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        answerSort === 'newest'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🕒 Newest
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnswerSort('oldest')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        answerSort === 'oldest'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ⌛ Oldest
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Answer Form (If Logged In) */}
            {isAuthenticated ? (
              <div className="mb-10 p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Your Answer
                  </h3>
                  {user && (
                    <span className="text-xs text-slate-500 font-medium">
                      Answering as <strong className="text-indigo-600">{user.name}</strong>
                    </span>
                  )}
                </div>

                {answerError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{answerError}</span>
                  </div>
                )}

                {answerSuccess && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{answerSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAnswerSubmit} className="space-y-4">
                  <textarea
                    rows={4}
                    value={answerContent}
                    onChange={(e) => {
                      setAnswerContent(e.target.value);
                      if (answerError) setAnswerError('');
                    }}
                    placeholder="Write your solution, explanation, or suggestion for this problem..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingAnswer || !answerContent.trim()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm shadow-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {submittingAnswer ? (
                        <>
                          <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Submitting Answer...</span>
                        </>
                      ) : (
                        <span>Submit Answer</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Prompt to Log in (If Not Logged In) */
              <div className="mb-10 p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Have a solution or idea for this problem?
                  </h3>
                  <p className="text-xs text-slate-600">
                    Please log in to answer this problem, vote, and review community solutions.
                  </p>
                </div>
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors shrink-0"
                >
                  Log in to Answer
                </Link>
              </div>
            )}

            {/* List of Existing Answers with Feedback, Reviews, Replies, and Best Answer */}
            <div className="space-y-6">
              {answers.length === 0 ? (
                /* Empty state */
                <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1">No answers yet.</h4>
                  <p className="text-xs text-slate-500">
                    Be the first to help solve this problem!
                  </p>
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

          {/* Bottom Navigation */}
          <div className="pt-2 flex items-center justify-between">
            <Link
              to="/problems"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Back to Problems</span>
            </Link>
            <Link
              to="/create-problem"
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Post another problem →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemDetails;
