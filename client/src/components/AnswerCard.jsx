import React, { useState } from 'react';
import { voteAnswer, removeAnswerVote, setBestAnswer, removeBestAnswer } from '../services/api';
import ReviewSection from './ReviewSection';
import MarkdownRenderer from './MarkdownRenderer';
import ReportModal from './ReportModal';
import GlassAiButton from './GlassAiButton';
import { Flag } from 'lucide-react';

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
  const [showReportModal, setShowReportModal] = useState(false);

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
      className={`rounded-3xl border transition-all p-6 sm:p-7 space-y-4 ${
        isBestAnswer
          ? 'bg-gradient-to-r from-amber-50/60 via-white to-amber-50/30 border-amber-300 shadow-xl ring-2 ring-amber-300/60 best-answer-glow'
          : 'glass-card-3d border-slate-200/90 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Header Badges: Best Answer & Team Answer */}
      <div className="flex items-center gap-2 flex-wrap">
        {isBestAnswer && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222222] border border-white/30 text-white text-xs font-black tracking-wide uppercase shadow-md">
            <span>⭐</span>
            <span>BEST ANSWER</span>
          </div>
        )}

        {answer.isTeamAnswer && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1a] border border-white/20 text-slate-200 text-xs font-bold tracking-wide shadow-sm">
            <span>🤝</span>
            <span>TEAM ANSWER</span>
            {answer.team?.name && (
              <span className="text-white font-black ml-1">• {answer.team.name}</span>
            )}
          </div>
        )}
      </div>

      {/* Author & Header Meta */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs border ${
              isBestAnswer
                ? 'bg-[#222222] text-white border-white/30'
                : 'bg-[#181818] text-slate-200 border-white/10'
            }`}
          >
            {answer.isTeamAnswer ? '🤝' : answerAuthorInitial}
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{answer.isTeamAnswer ? (answer.team?.name || 'Collaborative Team') : answerAuthorName}</span>
              {isAnswerAuthor && (
                <span className="text-[10px] bg-[#222222] text-slate-300 border border-white/10 px-1.5 py-0.5 rounded font-medium">
                  {answer.isTeamAnswer ? 'Your Team' : 'You'}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {formatDate(answer.createdAt)}
            </div>
          </div>
        </div>

        {/* Team Members List (If Team Answer) */}
        {answer.isTeamAnswer && Array.isArray(answer.teamMembers) && answer.teamMembers.length > 0 && (
          <div className="w-full sm:w-auto p-2 rounded-xl bg-[#121212] border border-white/10 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium">Contributors:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {answer.teamMembers.map((member) => (
                <span
                  key={member._id || member}
                  className="px-2 py-0.5 rounded-md bg-[#1c1c1c] border border-white/10 text-slate-200 text-[11px] font-semibold flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>{member.name || member.username || 'Member'}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions for Author vs Other Users */}
        <div className="flex items-center gap-2">
          {isAnswerAuthor ? (
            <GlassAiButton
              type="button"
              onClick={() => onDeleteAnswer(answer._id)}
              size="xs"
              variant="danger"
              title="Delete your answer"
            >
              Delete
            </GlassAiButton>
          ) : (
            <GlassAiButton
              type="button"
              onClick={() => setShowReportModal(true)}
              size="xs"
              variant="glass"
              title="Report inappropriate answer"
              icon={<Flag className="w-3.5 h-3.5 text-rose-500" />}
            />
          )}
        </div>
      </div>

      {/* Markdown Rich Content */}
      <div className="pl-1 sm:pl-2">
        <MarkdownRenderer content={answer.content} />
      </div>

      {/* Interactive Actions Bar */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
        {/* Voting & Reviews Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Helpful Button */}
          <GlassAiButton
            type="button"
            onClick={() => handleVote('helpful')}
            disabled={isAnswerAuthor || voting}
            size="xs"
            variant={userVote === 'helpful' ? "success" : "glass"}
            title={
              isAnswerAuthor
                ? 'You cannot vote on your own answer'
                : 'Mark this answer as helpful'
            }
          >
            👍 {helpfulCount} <span className="hidden sm:inline">Helpful</span>
          </GlassAiButton>

          {/* Not Helpful Button */}
          <GlassAiButton
            type="button"
            onClick={() => handleVote('not_helpful')}
            disabled={isAnswerAuthor || voting}
            size="xs"
            variant={userVote === 'not_helpful' ? "danger" : "glass"}
            title={
              isAnswerAuthor
                ? 'You cannot vote on your own answer'
                : 'Mark this answer as not helpful'
            }
          >
            👎 {notHelpfulCount} <span className="hidden sm:inline">Not Helpful</span>
          </GlassAiButton>

          {/* Toggle Reviews Section Button */}
          <GlassAiButton
            type="button"
            onClick={() => setShowReviews(!showReviews)}
            size="xs"
            variant={showReviews ? "primary" : "glass"}
          >
            ⭐ Reviews ({reviewCount})
          </GlassAiButton>
        </div>

        {/* Problem Owner Best Answer Action Button */}
        {isProblemOwner && (
          <GlassAiButton
            type="button"
            onClick={handleBestAnswerToggle}
            disabled={togglingBestAnswer}
            loading={togglingBestAnswer}
            size="xs"
            variant={isBestAnswer ? "primary" : "glass"}
          >
            ⭐ {isBestAnswer ? 'Unmark Best Answer' : 'Mark as Best Answer'}
          </GlassAiButton>
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

      {/* Report Answer Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          contentType="answer"
          contentId={answer._id}
          contentTitle={`Answer by ${answerAuthorName}`}
        />
      )}
    </div>
  );
};

export default AnswerCard;
