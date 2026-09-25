import React from 'react';
import { Link } from 'react-router-dom';

const CATEGORY_COLORS = {
  Education: 'bg-amber-50 text-amber-700 border-amber-200',
  Technology: 'bg-sky-50 text-sky-700 border-sky-200',
  Healthcare: 'bg-rose-50 text-rose-700 border-rose-200',
  Environment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Transportation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Community: 'bg-purple-50 text-purple-700 border-purple-200',
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

const ProblemCard = ({ problem }) => {
  const categoryBadgeClass =
    CATEGORY_COLORS[problem.category] || 'bg-slate-50 text-slate-700 border-slate-200';

  const authorName = problem.createdBy?.name || 'Community Member';

  // Dynamic Status Badge
  const status = problem.status || (problem.bestAnswer ? 'Solved' : problem.answersCount > 0 ? 'Answered' : 'Unanswered');

  const statusBadge =
    status === 'Solved' ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
        <span>🟢</span> Solved
      </span>
    ) : status === 'Answered' ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
        <span>🟢</span> Answered
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span>🟡</span> Unanswered
      </span>
    );

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between p-6">
      <div>
        {/* Category, Status & Date */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryBadgeClass}`}
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
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
          {problem.title}
        </h3>

        {/* Short Description */}
        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-4">
          {problem.description}
        </p>

        {/* Author attribution */}
        <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium mb-4">
          <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="truncate">Posted by {authorName}</span>
        </div>
      </div>

      {/* Footer Info: Location & Action */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center text-xs text-slate-500 font-medium gap-1.5 truncate">
          <svg
            className="w-4 h-4 text-slate-400 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          <span className="truncate">{problem.location}</span>
        </div>

        <Link
          to={`/problems/${problem._id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <span>View Problem</span>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default ProblemCard;
