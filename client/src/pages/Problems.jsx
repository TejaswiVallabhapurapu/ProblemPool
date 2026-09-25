import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  FolderSearch,
  Filter,
  ArrowUpDown,
  X,
  Tag as TagIcon,
  Sparkles,
  Layers,
  CheckCircle2,
  Bookmark,
  MessageSquare,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { getProblems, getPopularTags, getMySavedProblemIds } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProblemCard from '../components/ProblemCard';
import CategoryFilter, { POPULAR_CATEGORIES } from '../components/CategoryFilter';
import GlassAiButton from '../components/GlassAiButton';
import ParticlesBackground from '../components/ParticlesBackground';
import EmptyState3D from '../components/EmptyState3D';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Problems', icon: Layers },
  { value: 'unanswered', label: '🟡 Unanswered', icon: MessageSquare },
  { value: 'answered', label: '🟢 Answered', icon: MessageSquare },
  { value: 'solved', label: '🔵 Solved', icon: CheckCircle2 },
  { value: 'my_problems', label: '👤 My Problems', icon: Layers, authRequired: true },
  { value: 'saved_problems', label: '🔖 Saved Problems', icon: Bookmark, authRequired: true },
];

const SORT_OPTIONS = [
  { value: 'newest', label: '🕒 Newest' },
  { value: 'oldest', label: '⌛ Oldest' },
  { value: 'most_viewed', label: '👀 Most Viewed' },
  { value: 'most_answered', label: '💬 Most Answered' },
  { value: 'most_helpful', label: '👍 Most Helpful' },
  { value: 'most_saved', label: '🔖 Most Saved' },
];

const Problems = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams();

  // State derived from URL query params or route params
  const initialQ = searchParams.get('q') || '';
  const initialCategory = routeParams.category || searchParams.get('category') || 'All';
  const initialTag = routeParams.tag || searchParams.get('tag') || '';
  const initialStatus = searchParams.get('status') || 'all';
  const initialSort = searchParams.get('sort') || 'newest';

  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedSort, setSelectedSort] = useState(initialSort);

  // Data states
  const [problems, setProblems] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync route params changes (e.g. /problems/tag/react)
  useEffect(() => {
    if (routeParams.tag && routeParams.tag !== selectedTag) {
      setSelectedTag(routeParams.tag);
    }
    if (routeParams.category && routeParams.category !== selectedCategory) {
      setSelectedCategory(routeParams.category);
    }
  }, [routeParams.tag, routeParams.category]);

  // Sync state to URL search params
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
    if (selectedTag) params.tag = selectedTag;
    if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
    if (selectedSort && selectedSort !== 'newest') params.sort = selectedSort;

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedCategory, selectedTag, selectedStatus, selectedSort, setSearchParams]);

  // Fetch popular tags once on mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await getPopularTags(12);
        if (res && res.success && Array.isArray(res.tags)) {
          setPopularTags(res.tags);
        }
      } catch (err) {
        console.warn('Failed to load popular tags:', err);
      }
    };
    loadTags();
  }, []);

  // Fetch problems from backend
  const fetchProblemsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = {
        q: debouncedSearch || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        tag: selectedTag || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        sort: selectedSort,
      };

      const promises = [getProblems(apiParams, token)];
      if (token && isAuthenticated) {
        promises.push(getMySavedProblemIds(token).catch(() => ({ success: true, savedProblemIds: [] })));
      }

      const [problemsData, savedData] = await Promise.all(promises);

      if (problemsData && problemsData.success) {
        setProblems(problemsData.problems || []);
        setTotalCount(problemsData.count ?? (problemsData.problems ? problemsData.problems.length : 0));
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
  }, [debouncedSearch, selectedCategory, selectedTag, selectedStatus, selectedSort, token, isAuthenticated]);

  useEffect(() => {
    fetchProblemsList();
  }, [fetchProblemsList]);

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

  const handleTagClick = (tag) => {
    setSelectedTag(tag);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSelectedTag('');
    setSelectedStatus('all');
    setSelectedSort('newest');
    navigate('/problems');
  };

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    selectedCategory !== 'All' ||
    Boolean(selectedTag) ||
    selectedStatus !== 'all' ||
    selectedSort !== 'newest';

  return (
    <div className="relative min-h-screen">
      <ParticlesBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real-world Problem Pool</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Problems
          </h1>
          <p className="text-slate-600 mt-2 text-base max-w-2xl">
            Search across titles, descriptions, categories, tags, and authors to find real-world challenges to solve.
          </p>
        </div>

        <GlassAiButton
          to="/create-problem"
          size="md"
          variant="primary"
          icon={<PlusCircle className="w-4 h-4" />}
          className="self-start md:self-auto shrink-0"
        >
          Post a Problem
        </GlassAiButton>
      </div>

      {/* ========================================================= */}
      {/* SEARCH & FILTERS CONTROL BAR */}
      {/* ========================================================= */}
      <div className="glass-card-3d rounded-3xl p-6 border border-slate-200/90 shadow-sm mb-8 space-y-5">
        {/* 1. Main Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search problems by title, description, tags, category, or author username..."
            className="w-full pl-12 pr-24 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-slate-900 placeholder:text-slate-400 text-sm outline-none transition bg-slate-50/50 focus:bg-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* 2. Dropdown Filters & Sorters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Status Filter Dropdown */}
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Status Filter</span>
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer pr-9 transition"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.authRequired && !isAuthenticated}
                  >
                    {opt.label} {opt.authRequired && !isAuthenticated ? '(Sign In required)' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              <span>Sort Order</span>
            </label>
            <div className="relative">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer pr-9 transition"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Category Dropdown (for quick mobile selection) */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>Selected Category</span>
              </span>
              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="text-indigo-600 hover:text-indigo-800 text-[10px] font-semibold lowercase underline"
                >
                  Reset category
                </button>
              )}
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer pr-9 transition"
              >
                <option value="All">🌐 All Categories</option>
                {POPULAR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Category Filter Horizontal Scroll Pills */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Browse by Category</span>
          </div>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* 4. Trending / Popular Tags Ribbon */}
        {popularTags.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <TagIcon className="w-3 h-3" />
              <span>Trending Tags:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {popularTags.map((item) => {
                const isSelected = selectedTag.toLowerCase() === item.tag.toLowerCase();
                return (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? '' : item.tag)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    <span>#{item.tag}</span>
                    <span className={`text-[10px] opacity-75 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      ({item.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Active Filter Badges Bar */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-slate-50/70 p-3 rounded-2xl">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-500">Active Filters:</span>

              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium shadow-2xs">
                  <span>Query: "{debouncedSearch}"</span>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="hover:text-rose-600 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-medium">
                  <span>Category: {selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('All')}
                    className="hover:text-rose-600 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium">
                  <span>Tag: #{selectedTag}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTag('')}
                    className="hover:text-indigo-200 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium shadow-2xs">
                  <span>
                    Status: {STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label || selectedStatus}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('all')}
                    className="hover:text-rose-600 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSort !== 'newest' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium shadow-2xs">
                  <span>
                    Sort: {SORT_OPTIONS.find((s) => s.value === selectedSort)?.label || selectedSort}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSort('newest')}
                    className="hover:text-rose-600 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer ml-auto"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SEARCH RESULTS HEADER */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-6 px-1">
        <div className="flex items-center gap-2">
          {debouncedSearch ? (
            <span>
              Search Results for <strong className="text-slate-900">"{debouncedSearch}"</strong>
            </span>
          ) : selectedTag ? (
            <span>
              Problems tagged with <strong className="text-indigo-600">#{selectedTag}</strong>
            </span>
          ) : (
            <span>Showing all matching problems</span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {totalCount} {totalCount === 1 ? 'problem found' : 'problems found'}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN CONTENT: SKELETON / ERROR / EMPTY / PROBLEM CARDS */}
      {/* ========================================================= */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 animate-pulse shadow-xs"
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
              <div className="flex gap-2">
                <div className="h-5 w-14 bg-slate-100 rounded" />
                <div className="h-5 w-14 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-full bg-slate-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-10 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Failed to Load Problems</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <GlassAiButton
            type="button"
            onClick={fetchProblemsList}
            variant="primary"
            size="md"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </GlassAiButton>
        </div>
      ) : problems.length === 0 ? (
        <div className="py-8">
          <EmptyState3D
            type="problems"
            title="No Problems Found"
            description={
              hasActiveFilters
                ? 'No problems match your current search criteria or active filters. Try clearing your filters or searching for different keywords.'
                : 'There are currently no problems posted. Be the first to share a real-world problem!'
            }
            actionLabel={hasActiveFilters ? 'Clear All Filters' : 'Post a Problem'}
            actionOnClick={hasActiveFilters ? handleClearAllFilters : undefined}
            actionTo={hasActiveFilters ? undefined : '/create-problem'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem) => (
            <ProblemCard
              key={problem._id}
              problem={problem}
              isSaved={savedIds.has(problem._id)}
              onToggleSave={handleToggleSave}
              onTagClick={handleTagClick}
              onDelete={(deletedId) => setProblems((prev) => prev.filter((p) => p._id !== deletedId))}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Problems;
