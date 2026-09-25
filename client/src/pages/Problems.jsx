import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, AlertCircle, RefreshCw, FolderSearch } from 'lucide-react';
import { getProblems, getMySavedProblemIds } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProblemCard from '../components/ProblemCard';
import CategoryFilter from '../components/CategoryFilter';

const Problems = () => {
  const { token, isAuthenticated } = useAuth();
  const [problems, setProblems] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchProblemList = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [getProblems()];
      if (token && isAuthenticated) {
        promises.push(getMySavedProblemIds(token).catch(() => ({ success: true, savedProblemIds: [] })));
      }

      const [problemsData, savedData] = await Promise.all(promises);

      if (problemsData && problemsData.success) {
        setProblems(problemsData.problems || []);
      } else {
        setError(problemsData?.message || 'Failed to retrieve problems');
      }

      if (savedData && Array.isArray(savedData.savedProblemIds)) {
        setSavedIds(new Set(savedData.savedProblemIds));
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to the server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblemList();
  }, [token, isAuthenticated]);

  const handleToggleSave = (problemId, nextSaved) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (nextSaved) {
        next.add(problemId);
      } else {
        next.delete(problemId);
      }
      return next;
    });
  };

  // Filter problems based on both search term and selected category
  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Category condition
      const matchesCategory =
        selectedCategory === 'All' ||
        (problem.category && problem.category.toLowerCase() === selectedCategory.toLowerCase());

      // Search condition across title, description, category, and location
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === '' ||
        (problem.title && problem.title.toLowerCase().includes(term)) ||
        (problem.description && problem.description.toLowerCase().includes(term)) ||
        (problem.category && problem.category.toLowerCase().includes(term)) ||
        (problem.location && problem.location.toLowerCase().includes(term));

      return matchesCategory && matchesSearch;
    });
  }, [problems, searchTerm, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Problems
          </h1>
          <p className="text-slate-600 mt-2 text-base">
            Discover real-world problems shared by the community.
          </p>
        </div>

        <Link
          to="/create-problem"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post a Problem</span>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search problems by title, description, category, or location..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 placeholder:text-slate-400 text-sm outline-none transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 hover:text-slate-700 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Filter by Category
          </div>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </div>

      {/* Main Content Areas: Loading, Error, Empty, or Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-slate-200 rounded-full" />
                <div className="h-4 w-16 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
              </div>
              <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Failed to Load Problems</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={fetchProblemList}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <FolderSearch className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Problems Found</h2>
          <p className="text-sm text-slate-600 mb-6">
            {searchTerm || selectedCategory !== 'All'
              ? 'No problems match your active search or category filters. Try clearing your filters to see more results.'
              : 'There are currently no problems posted. Be the first to share a real-world problem!'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {(searchTerm || selectedCategory !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Clear Filters
              </button>
            )}
            <Link
              to="/create-problem"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
            >
              Post a Problem
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-4 px-1">
            <span>
              Showing {filteredProblems.length}{' '}
              {filteredProblems.length === 1 ? 'problem' : 'problems'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProblems.map((problem) => (
              <ProblemCard
                key={problem._id}
                problem={problem}
                isSaved={savedIds.has(problem._id)}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Problems;
