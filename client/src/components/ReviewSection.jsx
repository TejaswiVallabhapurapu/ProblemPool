import React, { useState, useEffect } from 'react';
import {
  getAnswerReviews,
  createAnswerReview,
  updateReview,
  deleteReview,
  voteReview,
  createReviewReply,
  updateReply,
  deleteReply,
} from '../services/api';
import GlassAiButton from './GlassAiButton';
import { Loader } from './Loader';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ReviewSection = ({ answerId, isAnswerAuthor, currentUser, token, isAuthenticated }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('most_helpful');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Review Form
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Edit Review
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingReviewId, setSavingReviewId] = useState(null);

  // Reply Form
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReplyId, setSubmittingReplyId] = useState(null);

  // Edit Reply
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');
  const [savingReplyId, setSavingReplyId] = useState(null);

  // Fetch reviews on mount or sort change
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getAnswerReviews(answerId, sort, token);
      if (res.success && res.reviews) {
        setReviews(res.reviews);
      }
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [answerId, sort]);

  // Submit Review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isAuthenticated) {
      setFormError('Please log in to write a review.');
      return;
    }

    if (isAnswerAuthor) {
      setFormError('You cannot review your own answer.');
      return;
    }

    const trimmed = reviewContent.trim();
    if (!trimmed) {
      setFormError('Review content cannot be empty.');
      return;
    }

    if (trimmed.length > 1000) {
      setFormError('Review cannot exceed 1000 characters.');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await createAnswerReview(answerId, trimmed, token);
      if (res.success && res.review) {
        setReviews((prev) => [res.review, ...prev]);
        setReviewContent('');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Edit Review
  const handleSaveEditReview = async (reviewId) => {
    const trimmed = editingContent.trim();
    if (!trimmed) {
      alert('Review content cannot be empty.');
      return;
    }

    try {
      setSavingReviewId(reviewId);
      const res = await updateReview(reviewId, trimmed, token);
      if (res.success && res.review) {
        setReviews((prev) =>
          prev.map((r) => (r._id === reviewId ? { ...r, content: res.review.content } : r))
        );
        setEditingReviewId(null);
        setEditingContent('');
      }
    } catch (err) {
      alert('Failed to update review: ' + err.message);
    } finally {
      setSavingReviewId(null);
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await deleteReview(reviewId, token);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      alert('Failed to delete review: ' + err.message);
    }
  };

  // Vote on Review
  const handleVoteReview = async (review) => {
    if (!isAuthenticated) {
      alert('Please log in to vote on reviews.');
      return;
    }

    const isOwnReview =
      currentUser && review.user && (currentUser._id === review.user._id || currentUser._id === review.user);
    if (isOwnReview) {
      alert('You cannot vote on your own review.');
      return;
    }

    // Optimistic toggle
    const prevHasVoted = review.hasVoted;
    const prevCount = review.helpfulCount || 0;
    const nextHasVoted = !prevHasVoted;
    const nextCount = nextHasVoted ? prevCount + 1 : Math.max(0, prevCount - 1);

    setReviews((prev) =>
      prev.map((r) =>
        r._id === review._id ? { ...r, hasVoted: nextHasVoted, helpfulCount: nextCount } : r
      )
    );

    try {
      const res = await voteReview(review._id, token);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === review._id
              ? { ...r, hasVoted: res.hasVoted, helpfulCount: res.helpfulCount }
              : r
          )
        );
      }
    } catch (err) {
      // Revert on failure
      setReviews((prev) =>
        prev.map((r) =>
          r._id === review._id ? { ...r, hasVoted: prevHasVoted, helpfulCount: prevCount } : r
        )
      );
      alert('Vote failed: ' + err.message);
    }
  };

  // Submit Reply to Review
  const handleReplySubmit = async (reviewId) => {
    if (!isAuthenticated) {
      alert('Please log in to reply.');
      return;
    }

    const trimmed = replyContent.trim();
    if (!trimmed) {
      alert('Reply cannot be empty.');
      return;
    }

    try {
      setSubmittingReplyId(reviewId);
      const res = await createReviewReply(reviewId, trimmed, token);
      if (res.success && res.reply) {
        setReviews((prev) =>
          prev.map((r) => {
            if (r._id === reviewId) {
              const currentReplies = r.replies || [];
              return {
                ...r,
                replies: [...currentReplies, res.reply],
                repliesCount: (r.repliesCount || 0) + 1,
              };
            }
            return r;
          })
        );
        setReplyingReviewId(null);
        setReplyContent('');
      }
    } catch (err) {
      alert('Failed to post reply: ' + err.message);
    } finally {
      setSubmittingReplyId(null);
    }
  };

  // Save Edit Reply
  const handleSaveEditReply = async (reviewId, replyId) => {
    const trimmed = editingReplyContent.trim();
    if (!trimmed) {
      alert('Reply content cannot be empty.');
      return;
    }

    try {
      setSavingReplyId(replyId);
      const res = await updateReply(replyId, trimmed, token);
      if (res.success && res.reply) {
        setReviews((prev) =>
          prev.map((r) => {
            if (r._id === reviewId) {
              return {
                ...r,
                replies: r.replies.map((rep) =>
                  rep._id === replyId ? { ...rep, content: res.reply.content } : rep
                ),
              };
            }
            return r;
          })
        );
        setEditingReplyId(null);
        setEditingReplyContent('');
      }
    } catch (err) {
      alert('Failed to update reply: ' + err.message);
    } finally {
      setSavingReplyId(null);
    }
  };

  // Delete Reply
  const handleDeleteReply = async (reviewId, replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    try {
      await deleteReply(replyId, token);
      setReviews((prev) =>
        prev.map((r) => {
          if (r._id === reviewId) {
            return {
              ...r,
              replies: (r.replies || []).filter((rep) => rep._id !== replyId),
              repliesCount: Math.max(0, (r.repliesCount || 1) - 1),
            };
          }
          return r;
        })
      );
    } catch (err) {
      alert('Failed to delete reply: ' + err.message);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/10 bg-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Reviews & Feedback</span>
          <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-full bg-white/10 text-neutral-300">
            {reviews.length}
          </span>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-neutral-400 font-medium">Sort:</span>
          <div className="inline-flex rounded-lg bg-white/5 border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setSort('most_helpful')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                sort === 'most_helpful'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Most Helpful
            </button>
            <button
              type="button"
              onClick={() => setSort('newest')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                sort === 'newest'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSort('oldest')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                sort === 'oldest'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Oldest
            </button>
          </div>
        </div>
      </div>

      {/* Review Submission Form */}
      {isAuthenticated && !isAnswerAuthor && (
        <form onSubmit={handleReviewSubmit} className="space-y-2.5 bg-white/5 p-3.5 rounded-xl border border-white/10 shadow-xs">
          {formError && (
            <p className="text-xs text-red-400 font-medium">{formError}</p>
          )}
          <textarea
            rows={2}
            value={reviewContent}
            onChange={(e) => {
              setReviewContent(e.target.value);
              if (formError) setFormError('');
            }}
            maxLength={1000}
            placeholder="Share feedback or ask a clarifying question about this solution..."
            className="w-full px-3 py-2 rounded-lg border border-white/10 text-xs sm:text-sm text-white placeholder-neutral-500 bg-black/40 focus:outline-none focus:border-white/30 transition-all resize-none"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              {reviewContent.length}/1000 characters
            </span>
            <GlassAiButton
              type="submit"
              disabled={submittingReview || !reviewContent.trim()}
              loading={submittingReview}
              size="xs"
              variant="primary"
            >
              Post Review
            </GlassAiButton>
          </div>
        </form>
      )}

      {isAnswerAuthor && (
        <div className="text-xs text-neutral-400 italic bg-white/5 px-3 py-2 rounded-lg border border-white/10">
          You are the author of this answer. You can reply to community reviews below.
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2">
          <Loader size="sm" />
          <span className="text-xs text-neutral-400">Loading reviews...</span>
        </div>
      ) : error ? (
        <div className="text-xs text-red-400 text-center py-4">{error}</div>
      ) : reviews.length === 0 ? (
        <div className="py-6 text-center text-xs text-neutral-400 italic">
          No reviews yet. Share your feedback about this answer.
        </div>
      ) : (
        <div className="space-y-3.5">
          {reviews.map((review) => {
            const reviewerName = review.user?.name || 'Community Member';
            const reviewerInitial = reviewerName.charAt(0).toUpperCase() || 'U';
            const isReviewOwner =
              currentUser && review.user && (currentUser._id === review.user._id || currentUser._id === review.user);
            const isEditing = editingReviewId === review._id;
            const isReplying = replyingReviewId === review._id;

            return (
              <div
                key={review._id}
                className="p-3.5 rounded-xl bg-white/5 border border-white/10 shadow-xs space-y-2.5 transition-all"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-[10px] border border-white/10">
                      {reviewerInitial}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white mr-2">
                        {reviewerName}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Owner Edit / Delete actions */}
                  {isReviewOwner && !isEditing && (
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => {
                          setEditingReviewId(review._id);
                          setEditingContent(review.content);
                        }}
                        className="text-neutral-400 hover:text-white font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="text-neutral-400 hover:text-red-400 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Review Body or Edit Form */}
                {isEditing ? (
                  <div className="space-y-2 pl-8">
                    <textarea
                      rows={2}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      maxLength={1000}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-white/10 bg-black/40 text-white focus:outline-none focus:border-white/30"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <GlassAiButton
                        type="button"
                        onClick={() => setEditingReviewId(null)}
                        size="xs"
                        variant="glass"
                      >
                        Cancel
                      </GlassAiButton>
                      <GlassAiButton
                        type="button"
                        onClick={() => handleSaveEditReview(review._id)}
                        disabled={savingReviewId === review._id || !editingContent.trim()}
                        loading={savingReviewId === review._id}
                        size="xs"
                        variant="primary"
                      >
                        Save
                      </GlassAiButton>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed pl-8">
                    {review.content}
                  </p>
                )}

                {/* Review Action Buttons: Helpful Vote + Reply */}
                <div className="flex items-center gap-3 pl-8 pt-1 text-xs">
                  {/* Helpful Vote Button */}
                  <GlassAiButton
                    type="button"
                    onClick={() => handleVoteReview(review)}
                    size="xs"
                    variant={review.hasVoted ? "primary" : "glass"}
                  >
                    Helpful ({review.helpfulCount || 0})
                  </GlassAiButton>

                  {/* Reply Button */}
                  <GlassAiButton
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        alert('Please log in to reply.');
                        return;
                      }
                      setReplyingReviewId(isReplying ? null : review._id);
                      setReplyContent('');
                    }}
                    size="xs"
                    variant="glass"
                  >
                    Reply
                  </GlassAiButton>
                </div>

                {/* Inline Reply Input */}
                {isReplying && (
                  <div className="ml-8 mt-2 p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                    <textarea
                      rows={2}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      maxLength={500}
                      placeholder={`Reply to ${reviewerName}...`}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white focus:outline-none focus:border-white/30 bg-black/40"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{replyContent.length}/500</span>
                      <div className="flex items-center gap-2">
                        <GlassAiButton
                          type="button"
                          onClick={() => {
                            setReplyingReviewId(null);
                            setReplyContent('');
                          }}
                          size="xs"
                          variant="glass"
                        >
                          Cancel
                        </GlassAiButton>
                        <GlassAiButton
                          type="button"
                          onClick={() => handleReplySubmit(review._id)}
                          disabled={submittingReplyId === review._id || !replyContent.trim()}
                          loading={submittingReplyId === review._id}
                          size="xs"
                          variant="primary"
                        >
                          Submit Reply
                        </GlassAiButton>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1-Level Replies List */}
                {review.replies && review.replies.length > 0 && (
                  <div className="ml-8 mt-2 space-y-2 border-l border-white/10 pl-3.5 pt-1">
                    {review.replies.map((reply) => {
                      const replyAuthorName = reply.user?.name || 'Community Member';
                      const replyAuthorInitial = replyAuthorName.charAt(0).toUpperCase() || 'U';
                      const isReplyOwner =
                        currentUser &&
                        reply.user &&
                        (currentUser._id === reply.user._id || currentUser._id === reply.user);
                      const isEditingReply = editingReplyId === reply._id;

                      return (
                        <div
                          key={reply._id}
                          className="bg-white/5 p-2.5 rounded-lg border border-white/10 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-[9px] border border-white/10">
                                {replyAuthorInitial}
                              </div>
                              <span className="font-semibold text-white">{replyAuthorName}</span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>

                            {/* Reply Edit/Delete */}
                            {isReplyOwner && !isEditingReply && (
                              <div className="flex items-center gap-2 text-[11px]">
                                <button
                                  onClick={() => {
                                    setEditingReplyId(reply._id);
                                    setEditingReplyContent(reply.content);
                                  }}
                                  className="text-neutral-400 hover:text-white font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteReply(review._id, reply._id)}
                                  className="text-neutral-400 hover:text-red-400 font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditingReply ? (
                            <div className="space-y-1.5 pl-6">
                              <textarea
                                rows={2}
                                value={editingReplyContent}
                                onChange={(e) => setEditingReplyContent(e.target.value)}
                                maxLength={500}
                                className="w-full px-2 py-1 text-xs rounded border border-white/10 bg-black/40 text-white focus:outline-none"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingReplyId(null)}
                                  className="text-neutral-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEditReply(review._id, reply._id)}
                                  disabled={savingReplyId === reply._id || !editingReplyContent.trim()}
                                  className="px-2 py-0.5 bg-white text-black rounded font-medium text-xs"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-neutral-200 pl-6 leading-relaxed">
                              {reply.content}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
