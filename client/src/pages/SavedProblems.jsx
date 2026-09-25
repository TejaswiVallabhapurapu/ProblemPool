import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Search,
  ArrowUpDown,
  AlertCircle,
  RefreshCw,
  FolderSearch,
  Loader2,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMySavedProblems } from '../services/api';
import ProblemCard from '../components/ProblemCard';

// Helper to safely extract the problem entity from various API response shapes
const getProblemObj = (item) => {
  if (!item) return null;
  if (item.problem && typeof item.problem === 'object' && item.problem._id) {
    return item.problem;
  }
  return item;
};

const SavedProblems = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('recent'); // 'recent' | 'oldest'

  const fetchSavedList = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMySavedProblems(token);
      if (data && data.success) {
        setSavedItems(data.savedProblems || []);
      } else {
        setError(data?.message || 'Failed to retrieve saved problems');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchSavedList();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Handle unsave removal dynamically from the list
  const handleToggleSave = (problemId, nextSavedState) => {
    if (!nextSavedState) {
      // Remove from saved items immediately
      setSavedItems((prev) =>
        prev.filter((item) => {
          const prob = getProblemObj(item);
          return prob?._id !== problemId && item._id !== problemId;
        })
      );
    }
  };

  // Filter and Sort saved problems
  const filteredAndSorted = useMemo(() => {
    // Filter out any orphaned/null problem references
    const validItems = savedItems.filter((item) => {
      const prob = getProblemObj(item);
      return Boolean(prob && (prob._id || prob.title));
    });

    // Filter by search query
    const term = searchTerm.trim().toLowerCase();
    const filtered = validItems.filter((item) => {
      if (!term) return true;
      const prob = getProblemObj(item);
      if (!prob) return false;
      const titleMatch = prob.title && prob.title.toLowerCase().includes(term);
      const descMatch = prob.description && prob.description.toLowerCase().includes(term);
      const catMatch = prob.category && prob.category.toLowerCase().includes(term);
      const locMatch = prob.location && prob.location.toLowerCase().includes(term);
      return titleMatch || descMatch || catMatch || locMatch;
    });

    // Sort by saved date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.savedAt || a.createdAt || a.problem?.savedAt || 0).getTime();
      const dateB = new Date(b.savedAt || b.createdAt || b.problem?.savedAt || 0).getTime();
      if (sortOrder === 'recent') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  }, [savedItems, searchTerm, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <Bookmark className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
            <span>Personal Collection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>🔖 My Saved Problems</span>
            {!loading && (
              <span className="text-sm font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                {savedItems.length} {savedItems.length === 1 ? 'saved problem' : 'saved problems'}
              </span>
            )}
          </h1>
          <p className="text-slate-600 mt-2 text-base">
            Problems you've bookmarked to review or solve later.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchSavedList}
            disabled={loading}
            title="Refresh saved problems"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <Link
            to="/problems"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-colors"
          >
            <span>Browse All Problems</span>
          </Link>
        </div>
      </div>

      {/* Search & Sort Controls Bar */}
      {savedItems.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search saved problems by title, description, or category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 placeholder:text-slate-400 text-sm outline-none transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort:</span>
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition cursor-pointer"
            >
              <option value="recent">Recently Saved ▼</option>
              <option value="oldest">Oldest Saved ▲</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content Areas: Loading, Error, Empty State, or Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
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
          <h2 className="text-lg font-bold text-slate-900 mb-2">Failed to Load Saved Problems</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={fetchSavedList}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      ) : savedItems.length === 0 ? (
        /* Empty State: No Saved Problems */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 text-3xl">
            🔖
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No saved problems yet.</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Found an interesting problem but don't have time to solve it now?
            <br />
            Save it and come back later.
          </p>
          <Link
            to="/problems"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
          >
            <span>Browse Problems</span>
          </Link>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        /* Empty State: Search yielded no matches */
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <FolderSearch className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No matching saved problems</h3>
          <p className="text-xs text-slate-600 mb-4">
            No saved problems matched "{searchTerm}".
          </p>
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        /* Grid of Saved Problem Cards */
        <>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-4 px-1">
            <span>
              Showing {filteredAndSorted.length} of {savedItems.length} saved{' '}
              {savedItems.length === 1 ? 'problem' : 'problems'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSorted.map((item) => {
              const prob = getProblemObj(item);
              const savedDate = item.savedAt || item.createdAt || prob?.savedAt || prob?.createdAt;
              return (
                <div key={prob?._id || item.savedProblemId || item._id} className="flex flex-col">
                  <ProblemCard
                    problem={prob}
                    isSaved={true}
                    onToggleSave={handleToggleSave}
                  />
                  {savedDate && (
                    <div className="text-[11px] text-slate-400 font-medium px-2 pt-1.5 flex items-center gap-1">
                      <span>
                        Saved on{' '}
                        {new Date(savedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SavedProblems;
