import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  MessageSquare,
  ThumbsUp,
  Star,
  MapPin,
  User,
  Eye,
  Tag,
  FolderPlus,
  Trash2,
  AlertTriangle,
  X,
  Sparkles,
  ArrowRight,
  RotateCw,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveProblem, unsaveProblem, deleteProblem } from '../services/api';
import GlassAiButton from './GlassAiButton';
import ThreeDFlipCard from './ThreeDFlipCard';

const CATEGORY_COLORS = {
  Programming: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  'Web Development': 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Database: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  'AI & ML': 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  DSA: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Technology: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Career: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  College: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Projects: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Education: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Healthcare: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Environment: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Transportation: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Community: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  General: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
  Other: 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]',
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const ProblemCard = ({
  problem,
  isSaved: initialIsSaved = null,
  onToggleSave = null,
  onTagClick = null,
  onManageCollections = null,
  onDelete = null,
}) => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [saved, setSaved] = useState(Boolean(initialIsSaved));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (initialIsSaved !== null) {
      setSaved(Boolean(initialIsSaved));
    }
  }, [initialIsSaved]);

  if (!problem) return null;

  const categoryBadgeClass =
    CATEGORY_COLORS[problem.category] || 'bg-[#1a1a1a] text-slate-300 border-[#2e2e2e]';

  const authorName = problem.createdBy?.name || 'Community Member';

  // Compute status & engagement metrics
  const answersCount = problem.answersCount || (Array.isArray(problem.answers) ? problem.answers.length : 0);
  const savesCount = problem.savesCount || 0;
  const hasBestAnswer = Boolean(problem.bestAnswer);
  const totalHelpfulVotes = problem.totalHelpfulVotes || 0;
  const viewsCount = problem.views || 0;
  const tagsList = Array.isArray(problem.tags) ? problem.tags : [];

  const status =
    problem.status ||
    (hasBestAnswer ? 'Solved' : answersCount > 0 ? 'Answered' : 'Unanswered');

  const statusBadge =
    status === 'Solved' ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1e1e1e] text-slate-200 border border-white/20">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Solved
      </span>
    ) : status === 'Answered' ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#181818] text-slate-300 border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        Answered
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#141414] text-slate-400 border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        Unanswered
      </span>
    );

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !token) {
      setNotice('Please sign in to save problems.');
      setTimeout(() => setNotice(null), 3500);
      return;
    }

    if (saving) return;

    const nextState = !saved;
    setSaving(true);
    setNotice(null);

    // Optimistic UI update
    setSaved(nextState);

    try {
      if (nextState) {
        await saveProblem(problem._id, token);
      } else {
        await unsaveProblem(problem._id, token);
      }
      if (onToggleSave) {
        onToggleSave(problem._id, nextState);
      }
    } catch (err) {
      console.error('Save toggle error:', err);
      // Revert optimistic update on error
      setSaved(!nextState);
      setNotice(err.message || 'Failed to update saved status');
      setTimeout(() => setNotice(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleTagClickInternal = (e, t) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) {
      onTagClick(t);
    } else {
      navigate(`/problems?tag=${encodeURIComponent(t)}`);
    }
  };

  const isOwner = Boolean(
    isAuthenticated &&
      user &&
      problem?.createdBy &&
      ((problem.createdBy?._id && (problem.createdBy._id === user._id || problem.createdBy._id === user.id)) ||
        problem.createdBy === user._id ||
        problem.createdBy === user.id ||
        user.role === 'admin')
  );

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDeleting) {
      setShowDeleteModal(false);
    }
  };

  const handleDeleteConfirm = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting || !token) return;

    setIsDeleting(true);
    try {
      await deleteProblem(problem._id, token);
      setShowDeleteModal(false);
      if (onDelete) {
        onDelete(problem._id);
      }
    } catch (err) {
      console.error('Delete problem error:', err);
      setShowDeleteModal(false);
      setNotice(err.message || 'Failed to delete problem');
      setTimeout(() => setNotice(null), 3500);
    } finally {
      setIsDeleting(false);
    }
  };

  // ================= 3D CARD FRONT CONTENT =================
  const frontContent = (
    <>
      <div>
        {/* Top bar: Category, Status, Date & 3D Flip Hint */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryBadgeClass}`}
            >
              {problem.category}
            </span>
            {statusBadge}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] text-slate-400 font-medium">
              {formatDate(problem.createdAt)}
            </span>
            <span
              className="uiverse-3d-flip-hint"
              title="Flip card for full 3D analytics"
              data-no-flip="true"
            >
              <RotateCw className="w-2.5 h-2.5" />
              <span>3D</span>
            </span>
          </div>
        </div>

        {/* Problem Title */}
        <Link
          to={`/problems/${problem._id}`}
          className="block group/title"
          data-no-flip="true"
        >
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover/title:text-indigo-600 transition-colors line-clamp-2 mb-2 leading-snug">
            {problem.title}
          </h3>
        </Link>

        {/* Short Description */}
        <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-3.5">
          {problem.description}
        </p>

        {/* Tags Row */}
        {tagsList.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
            {tagsList.slice(0, 3).map((t) => (
              <button
                key={t}
                type="button"
                data-no-flip="true"
                onClick={(e) => handleTagClickInternal(e, t)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition border border-slate-200/80 cursor-pointer"
              >
                <span>#{t}</span>
              </button>
            ))}
            {tagsList.length > 3 && (
              <span className="text-[11px] font-medium text-slate-400 px-1">
                +{tagsList.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Author attribution & Location */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-3 gap-2">
          <div className="flex items-center gap-1.5 text-indigo-600 font-medium truncate">
            <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{authorName}</span>
          </div>

          {problem.location && (
            <div className="flex items-center gap-1 text-slate-400 truncate text-[11px]">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{problem.location}</span>
            </div>
          )}
        </div>

        {/* Engagement stats */}
        <div className="flex items-center gap-2.5 py-1.5 px-3 bg-slate-50/90 rounded-xl text-xs font-medium text-slate-600 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-slate-700" title="Answers">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>{answersCount}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-slate-600" title="Views">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{viewsCount}</span>
          </span>

          {savesCount > 0 && (
            <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold" title="Saves">
              <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
              <span>{savesCount}</span>
            </span>
          )}

          {totalHelpfulVotes > 0 && (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold" title="Helpful Votes">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>{totalHelpfulVotes}</span>
            </span>
          )}

          {hasBestAnswer && (
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 font-bold ml-auto text-[10px]">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>Best Answer</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer Info: Save, Collections, Delete & View */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1.5" data-no-flip="true">
          <GlassAiButton
            type="button"
            onClick={handleSaveToggle}
            disabled={saving}
            loading={saving}
            size="xs"
            variant={saved ? "primary" : "glass"}
            title={saved ? 'Remove from saved problems' : 'Save for later'}
            icon={
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  saved ? 'fill-white text-white' : 'text-slate-400'
                }`}
              />
            }
          >
            {saved ? 'Saved' : 'Save'}
          </GlassAiButton>

          {saved && onManageCollections && (
            <GlassAiButton
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onManageCollections(problem);
              }}
              size="xs"
              variant="glass"
              title="Add or remove from custom collections"
              icon={<FolderPlus className="w-3.5 h-3.5" />}
            />
          )}

          {isOwner && (
            <GlassAiButton
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              size="xs"
              variant="danger"
              title="Delete your problem post"
              icon={<Trash2 className="w-3.5 h-3.5" />}
            />
          )}
        </div>

        <div data-no-flip="true">
          <GlassAiButton
            to={`/problems/${problem._id}`}
            size="xs"
            variant="secondary"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            View
          </GlassAiButton>
        </div>
      </div>
    </>
  );

  // ================= 3D CARD BACK CONTENT =================
  const backContent = (
    <>
      <div className="space-y-4">
        {/* Top Header of Back */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>{problem.category}</span>
          </span>

          <span
            className="uiverse-3d-flip-hint"
            title="Flip back to problem post"
            data-no-flip="true"
          >
            <RotateCw className="w-2.5 h-2.5" />
            <span>Flip Back</span>
          </span>
        </div>

        {/* Center Visual Badge */}
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-purple-950/50">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white line-clamp-1">
            {problem.title}
          </h4>
          <p className="text-[11px] text-purple-200/70 mt-0.5">
            Asked by <strong className="text-purple-300">{authorName}</strong>
          </p>
        </div>

        {/* Detailed 3D Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-base font-black text-white">{answersCount}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">💬 Solutions</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-base font-black text-white">{viewsCount}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">👀 Total Views</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-base font-black text-emerald-400">+{totalHelpfulVotes}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">👍 Helpful Score</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-center">
            <div className="text-base font-black text-indigo-300">{savesCount}</div>
            <div className="text-[10px] text-purple-300/80 font-medium">🔖 Bookmarks</div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-between text-xs">
          <span className="text-purple-200 font-medium">Resolution Status</span>
          <span className="font-bold text-white flex items-center gap-1">
            {hasBestAnswer ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">Best Answer Selected</span>
              </>
            ) : answersCount > 0 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Open Community Answers</span>
              </>
            ) : (
              <span className="text-amber-300">Awaiting First Answer</span>
            )}
          </span>
        </div>
      </div>

      {/* Back Actions Footer */}
      <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between gap-2 mt-auto">
        <div data-no-flip="true">
          <GlassAiButton
            type="button"
            onClick={handleSaveToggle}
            disabled={saving}
            size="xs"
            variant="glass"
            icon={<Bookmark className="w-3.5 h-3.5" />}
          >
            {saved ? 'Saved' : 'Bookmark'}
          </GlassAiButton>
        </div>

        <div data-no-flip="true">
          <GlassAiButton
            to={`/problems/${problem._id}`}
            size="xs"
            variant="primary"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            Open Problem
          </GlassAiButton>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative w-full">
      {/* Toast / Notice notification */}
      {notice && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white text-xs font-medium py-1.5 px-3 rounded-xl shadow-lg border border-slate-700/50 flex items-center gap-1.5 animate-in fade-in zoom-in duration-150 whitespace-nowrap">
          <span>{notice}</span>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="text-indigo-400 hover:text-indigo-300 underline font-semibold ml-1"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleDeleteCancel}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleDeleteCancel}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Problem Post?</h3>
                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 mb-5 border border-slate-100">
              <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                "{problem.title}"
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                All associated answers, reviews, and community votes on this post will be removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <GlassAiButton
                type="button"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                size="sm"
                variant="glass"
              >
                Cancel
              </GlassAiButton>

              <GlassAiButton
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                loading={isDeleting}
                size="sm"
                variant="danger"
                icon={<Trash2 className="w-4 h-4" />}
              >
                {isDeleting ? 'Deleting...' : 'Delete Post'}
              </GlassAiButton>
            </div>
          </div>
        </div>
      )}

      {/* 3D Flip Card Container */}
      <ThreeDFlipCard
        frontContent={frontContent}
        backContent={backContent}
        ariaLabel={`Problem: ${problem.title}`}
      />
    </div>
  );
};

export default ProblemCard;
