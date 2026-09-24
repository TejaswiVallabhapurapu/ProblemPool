import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProblem, deleteProblem } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ProblemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProblem(id);
        if (data.success && data.problem) {
          setProblem(data.problem);
        } else {
          setError('Problem not found');
        }
      } catch (err) {
        setError(err.message || 'Unable to load problem details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this problem?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProblem(id, token);
      navigate('/problems');
    } catch (err) {
      alert('Failed to delete problem: ' + err.message);
      setIsDeleting(false);
    }
  };

  const authorName = problem?.createdBy?.name || 'Community Member';
  const authorEmail = problem?.createdBy?.email;
  const isCreator = user && problem?.createdBy && (user._id === problem.createdBy._id || user._id === problem.createdBy);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/problems"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <span>← Back to Problems</span>
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

      {/* 3. Problem Details Card */}
      {!loading && !error && problem && (
        <article className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                  CATEGORY_COLORS[problem.category] || 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {problem.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Posted on {formatDate(problem.createdAt)}
              </span>
            </div>

            {/* Creator or Admin Delete Option */}
            {isCreator && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors cursor-pointer"
                title="Delete this problem"
              >
                {isDeleting ? 'Deleting...' : 'Delete problem'}
              </button>
            )}
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

          {/* Bottom Actions */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/problems"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1.5"
            >
              <span>← Back to Problems</span>
            </Link>
            <Link
              to="/create-problem"
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Post another problem →
            </Link>
          </div>
        </article>
      )}
    </div>
  );
};

export default ProblemDetails;
