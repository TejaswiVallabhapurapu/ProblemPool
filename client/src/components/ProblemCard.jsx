import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, MessageSquare, ThumbsUp, Star, MapPin, User, Eye, Tag, Loader2, FolderPlus, Trash2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveProblem, unsaveProblem, deleteProblem } from '../services/api';
import GlassAiButton from './GlassAiButton';

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

  const categoryBadgeClass =
    CATEGORY_COLORS[problem.category] || 'bg-slate-50 text-slate-700 border-slate-200';

  const authorName = problem.createdBy?.name || 'Community Member';

  // Compute status
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        🔵 Solved
      </span>
    ) : status === 'Answered' ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        🟢 Answered
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        🟡 Unanswered
      </span>
    );

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !token) {
      setNotice('Please login to save problems.');
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

  return (
    <div className="group glass-card-3d rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between p-6 relative">
      {/* Toast / Notice notification */}
      {notice && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 text-white text-xs font-medium py-1.5 px-3 rounded-xl shadow-lg border border-slate-700/50 flex items-center gap-1.5 animate-in fade-in zoom-in duration-150 whitespace-nowrap">
          <span>{notice}</span>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="text-indigo-400 hover:text-indigo-300 underline font-semibold ml-1"
            >
              Login
            </button>
          )}
        </div>
      )}

      <div>
        {/* Category, Status & Date */}
        <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryBadgeClass}`}
            >
              {problem.category}
            </span>
            {statusBadge}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {formatDate(problem.createdAt)}
          </span>
        </div>

        {/* Problem Title */}
        <Link to={`/problems/${problem._id}`} className="block group/title">
          <h3 className="text-lg font-bold text-slate-900 group-hover/title:text-indigo-600 transition-colors line-clamp-2 mb-2 leading-snug">
            {problem.title}
          </h3>
        </Link>

        {/* Short Description */}
        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-3.5">
          {problem.description}
        </p>

        {/* Tags Row */}
        {tagsList.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {tagsList.slice(0, 4).map((t) => (
              <button
                key={t}
                type="button"
                onClick={(e) => handleTagClickInternal(e, t)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition border border-slate-200/80 cursor-pointer"
              >
                <span>#{t}</span>
              </button>
            ))}
            {tagsList.length > 4 && (
              <span className="text-[11px] font-medium text-slate-400 px-1">
                +{tagsList.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Author attribution & Location */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-4 gap-2">
          <div className="flex items-center gap-1.5 text-indigo-600 font-medium truncate">
            <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">👤 {authorName}</span>
          </div>

          {problem.location && (
            <div className="flex items-center gap-1 text-slate-400 truncate text-[11px]">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{problem.location}</span>
            </div>
          )}
        </div>

        {/* Engagement stats (Answers, Helpful votes, Views, Saves, Best Answer) */}
        <div className="flex items-center gap-3 py-2 px-3 bg-slate-50/80 rounded-xl text-xs font-medium text-slate-600 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 text-slate-700" title="Answers">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>💬 {answersCount}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-slate-600" title="Views">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>👀 {viewsCount}</span>
          </span>

          {savesCount > 0 && (
            <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold" title="Saves">
              <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
              <span>🔖 {savesCount}</span>
            </span>
          )}

          {totalHelpfulVotes > 0 && (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold" title="Helpful Votes">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>👍 {totalHelpfulVotes}</span>
            </span>
          )}

          {hasBestAnswer && (
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 font-bold ml-auto text-[11px]">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>⭐ Best Answer</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer Info: Save Button, Collection Button & View Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1.5">
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
        </div>

        <GlassAiButton
          to={`/problems/${problem._id}`}
          size="xs"
          variant="secondary"
          icon={
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          }
          iconPosition="right"
        >
          View Problem
        </GlassAiButton>
      </div>
    </div>
  );
};

export default ProblemCard;
