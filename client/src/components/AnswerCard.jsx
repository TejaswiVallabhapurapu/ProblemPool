import React, { useState } from 'react';
import { voteAnswer, removeAnswerVote, setBestAnswer, removeBestAnswer } from '../services/api';
import ReviewSection from './ReviewSection';

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

const AnswerCard = ({
  answer,
  problemId,
  isProblemOwner,
  currentUser,
  token,
  isAuthenticated,
  onDeleteAnswer,
  onBestAnswerChange,
}) => {
  const [helpfulCount, setHelpfulCount] = useState(answer.helpfulCount || 0);
  const [notHelpfulCount, setNotHelpfulCount] = useState(answer.notHelpfulCount || 0);
  const [userVote, setUserVote] = useState(answer.userVote || null);
  const [isBestAnswer, setIsBestAnswer] = useState(Boolean(answer.isBestAnswer));
  const [voting, setVoting] = useState(false);
  const [togglingBestAnswer, setTogglingBestAnswer] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewCount, setReviewCount] = useState(answer.reviewCount || 0);

  // Sync state if props change (e.g. from parent sorting or best answer shift)
  React.useEffect(() => {
    setHelpfulCount(answer.helpfulCount || 0);
    setNotHelpfulCount(answer.notHelpfulCount || 0);
    setUserVote(answer.userVote || null);
    setIsBestAnswer(Boolean(answer.isBestAnswer));
    setReviewCount(answer.reviewCount || 0);
  }, [answer]);

  const answerAuthorName = answer.user?.name || 'Community Member';
  const answerAuthorInitial = answerAuthorName.charAt(0).toUpperCase() || 'U';
  const isAnswerAuthor =
    currentUser &&
    answer.user &&
    (currentUser._id === answer.user._id || currentUser._id === answer.user);

  // Handle Voting
  const handleVote = async (type) => {
    if (!isAuthenticated) {
      alert('Please log in to vote on answers.');
      return;
    }

    if (isAnswerAuthor) {
      alert('You cannot vote on your own answer.');
      return;
    }

    if (voting) return;

    // Optimistic Vote Calculations
    const prevHelpful = helpfulCount;
    const prevNotHelpful = notHelpfulCount;
    const prevVote = userVote;

    let newHelpful = prevHelpful;
    let newNotHelpful = prevNotHelpful;
    let newVote = prevVote;

    if (prevVote === type) {
      // Toggle Off
      newVote = null;
      if (type === 'helpful') newHelpful = Math.max(0, prevHelpful - 1);
      if (type === 'not_helpful') newNotHelpful = Math.max(0, prevNotHelpful - 1);
    } else {
      // Switch or New Vote
      if (prevVote === 'helpful') newHelpful = Math.max(0, prevHelpful - 1);
      if (prevVote === 'not_helpful') newNotHelpful = Math.max(0, prevNotHelpful - 1);

      if (type === 'helpful') newHelpful += 1;
      if (type === 'not_helpful') newNotHelpful += 1;
      newVote = type;
    }

    setUserVote(newVote);
    setHelpfulCount(newHelpful);
    setNotHelpfulCount(newNotHelpful);

    try {
      setVoting(true);
      const res = await voteAnswer(answer._id, type, token);
      if (res.success) {
        setHelpfulCount(res.helpfulCount);
        setNotHelpfulCount(res.notHelpfulCount);
        setUserVote(res.userVote);
      }
    } catch (err) {
      // Revert on error
      setUserVote(prevVote);
      setHelpfulCount(prevHelpful);
      setNotHelpfulCount(prevNotHelpful);
      alert('Voting failed: ' + err.message);
    } finally {
      setVoting(false);
    }
  };

  // Handle Best Answer Toggle (Problem Owner Only)
  const handleBestAnswerToggle = async () => {
    if (!isProblemOwner) {
      alert('Only the problem owner can select the Best Answer.');
      return;
    }

    try {
      setTogglingBestAnswer(true);
      if (isBestAnswer) {
        // Remove Best Answer
        await removeBestAnswer(problemId, token);
        setIsBestAnswer(false);
        if (onBestAnswerChange) onBestAnswerChange(null);
      } else {
        // Set as Best Answer
        await setBestAnswer(problemId, answer._id, token);
        setIsBestAnswer(true);
        if (onBestAnswerChange) onBestAnswerChange(answer._id);
      }
    } catch (err) {
      alert('Failed to update Best Answer: ' + err.message);
    } finally {
      setTogglingBestAnswer(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all p-6 sm:p-7 space-y-4 ${
        isBestAnswer
          ? 'bg-gradient-to-r from-amber-50/40 via-white to-indigo-50/30 border-amber-300 shadow-md ring-1 ring-amber-200'
          : 'bg-white border-slate-200/90 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Best Answer Header Badge if marked */}
      {isBestAnswer && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-extrabold tracking-wide uppercase shadow-xs">
          <span>⭐</span>
          <span>BEST ANSWER</span>
        </div>
      )}

      {/* Author & Header Meta */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
              isBestAnswer
                ? 'bg-amber-100 text-amber-800'
                : 'bg-indigo-100 text-indigo-700'
            }`}
          >
            {answerAuthorInitial}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{answerAuthorName}</span>
              {isAnswerAuthor && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                  You
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {formatDate(answer.createdAt)}
            </div>
          </div>
        </div>

        {/* Delete option for Author */}
        {isAnswerAuthor && (
          <button
            onClick={() => onDeleteAnswer(answer._id)}
            className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors cursor-pointer"
            title="Delete your answer"
          >
            Delete
          </button>
        )}
      </div>

      {/* Content */}
      <div className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-line pl-1 sm:pl-2">
        {answer.content}
      </div>

      {/* Interactive Actions Bar */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
        {/* Voting & Reviews Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Helpful Button */}
          <button
            type="button"
            onClick={() => handleVote('helpful')}
            disabled={isAnswerAuthor || voting}
            title={
              isAnswerAuthor
                ? 'You cannot vote on your own answer'
                : 'Mark this answer as helpful'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              userVote === 'helpful'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            } ${isAnswerAuthor ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span>👍</span>
            <span>{helpfulCount}</span>
            <span className="hidden sm:inline">Helpful</span>
          </button>

          {/* Not Helpful Button */}
          <button
            type="button"
            onClick={() => handleVote('not_helpful')}
            disabled={isAnswerAuthor || voting}
            title={
              isAnswerAuthor
                ? 'You cannot vote on your own answer'
                : 'Mark this answer as not helpful'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              userVote === 'not_helpful'
                ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            } ${isAnswerAuthor ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span>👎</span>
            <span>{notHelpfulCount}</span>
            <span className="hidden sm:inline">Not Helpful</span>
          </button>

          {/* Toggle Reviews Section Button */}
          <button
            type="button"
            onClick={() => setShowReviews(!showReviews)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              showReviews
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>⭐</span>
            <span>Reviews</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[11px]">
              {reviewCount}
            </span>
          </button>
        </div>

        {/* Problem Owner Best Answer Action Button */}
        {isProblemOwner && (
          <button
            type="button"
            onClick={handleBestAnswerToggle}
            disabled={togglingBestAnswer}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isBestAnswer
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <span>⭐</span>
            <span>{isBestAnswer ? 'Unmark Best Answer' : 'Mark as Best Answer'}</span>
          </button>
        )}
      </div>

      {/* Expandable Review Section */}
      {showReviews && (
        <ReviewSection
          answerId={answer._id}
          isAnswerAuthor={isAnswerAuthor}
          currentUser={currentUser}
          token={token}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
};

export default AnswerCard;
