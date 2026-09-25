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
  Folder,
  FolderPlus,
  Edit2,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  Layers,
  X,
  Tag,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getMySavedProblems,
  getMyCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  removeProblemFromCollection,
} from '../services/api';
import ProblemCard from '../components/ProblemCard';
import AddToCollectionModal from '../components/AddToCollectionModal';
import GlassAiButton from '../components/GlassAiButton';
import ParticlesBackground from '../components/ParticlesBackground';
import EmptyState3D from '../components/EmptyState3D';

// Helper to safely extract the problem entity from various API response shapes
const getProblemObj = (item) => {
  if (!item) return null;
  if (item.problem && typeof item.problem === 'object' && item.problem._id) {
    return item.problem;
  }
  return item;
};

const COLOR_MAP = {
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    activeBg: 'bg-indigo-600 text-white',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    activeBg: 'bg-emerald-600 text-white',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    activeBg: 'bg-amber-600 text-white',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    activeBg: 'bg-rose-600 text-white',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    activeBg: 'bg-purple-600 text-white',
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    activeBg: 'bg-sky-600 text-white',
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    activeBg: 'bg-cyan-600 text-white',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    activeBg: 'bg-blue-600 text-white',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    activeBg: 'bg-orange-600 text-white',
  },
};

const SavedProblems = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // All Saved Problems & Collections states
  const [savedItems, setSavedItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeCollectionId, setActiveCollectionId] = useState('all'); // 'all' or collectionId
  const [selectedCollection, setSelectedCollection] = useState(null);

  const [loading, setLoading] = useState(true);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('recent'); // 'recent' | 'oldest'

  // Modal states
  const [manageProblem, setManageProblem] = useState(null); // problem obj for AddToCollectionModal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionForm, setCollectionForm] = useState({
    name: '',
    description: '',
    color: 'indigo',
  });
  const [submittingCol, setSubmittingCol] = useState(false);
  const [colError, setColError] = useState(null);
  const [toastNotice, setToastNotice] = useState(null);

  const showToast = (msg) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Fetch initial saved problems and collections
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [savedRes, colRes] = await Promise.all([
        getMySavedProblems(token),
        getMyCollections(token),
      ]);

      if (savedRes && savedRes.success) {
        setSavedItems(savedRes.savedProblems || []);
      } else {
        setError(savedRes?.message || 'Failed to retrieve saved problems');
      }

      if (colRes && colRes.success) {
        setCollections(colRes.collections || []);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // When active collection changes, fetch full collection details if not 'all'
  useEffect(() => {
    if (activeCollectionId === 'all') {
      setSelectedCollection(null);
      return;
    }

    const loadSingleCollection = async () => {
      if (!token) return;
      setCollectionLoading(true);
      try {
        const res = await getCollectionById(activeCollectionId, token);
        if (res && res.success) {
          setSelectedCollection(res.collection);
        } else {
          setActiveCollectionId('all');
        }
      } catch (err) {
        console.warn('Failed to load collection details:', err);
        setActiveCollectionId('all');
      } finally {
        setCollectionLoading(false);
      }
    };

    loadSingleCollection();
  }, [activeCollectionId, token]);

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

      // If viewing a specific collection, remove it there too
      if (selectedCollection) {
        setSelectedCollection((prev) => ({
          ...prev,
          problems: (prev?.problems || []).filter((p) => p._id !== problemId),
          problemCount: Math.max(0, (prev?.problemCount || 1) - 1),
        }));
      }

      // Refresh collections counts
      fetchCollectionsOnly();
    }
  };

  const fetchCollectionsOnly = async () => {
    if (!token) return;
    try {
      const colRes = await getMyCollections(token);
      if (colRes?.success) {
        setCollections(colRes.collections || []);
      }
    } catch (err) {
      console.warn('Refresh collections failed:', err);
    }
  };

  // Remove problem from specific collection
  const handleRemoveFromCurrentCollection = async (problemId, probTitle) => {
    if (!selectedCollection || !token) return;
    try {
      await removeProblemFromCollection(selectedCollection._id, problemId, token);
      setSelectedCollection((prev) => ({
        ...prev,
        problems: prev.problems.filter((p) => p._id !== problemId),
        problemCount: Math.max(0, prev.problemCount - 1),
      }));
      showToast(`Removed "${probTitle || 'Problem'}" from collection`);
      fetchCollectionsOnly();
    } catch (err) {
      showToast(err.message || 'Failed to remove problem from collection');
    }
  };

  // Create New Collection
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!collectionForm.name.trim() || submittingCol || !token) return;

    setSubmittingCol(true);
    setColError(null);

    try {
      const res = await createCollection(
        {
          name: collectionForm.name.trim(),
          description: collectionForm.description.trim(),
          color: collectionForm.color || 'indigo',
        },
        token
      );

      if (res && res.success && res.collection) {
        setCollections((prev) => [res.collection, ...prev]);
        setShowCreateModal(false);
        setCollectionForm({ name: '', description: '', color: 'indigo' });
        setActiveCollectionId(res.collection._id);
        showToast(`Collection "${res.collection.name}" created!`);
      } else {
        setColError(res?.message || 'Failed to create collection');
      }
    } catch (err) {
      setColError(err.message || 'Failed to create collection');
    } finally {
      setSubmittingCol(false);
    }
  };

  // Update Collection (Rename / Edit)
  const handleUpdateCollection = async (e) => {
    e.preventDefault();
    if (!selectedCollection || !collectionForm.name.trim() || submittingCol || !token) return;

    setSubmittingCol(true);
    setColError(null);

    try {
      const res = await updateCollection(
        selectedCollection._id,
        {
          name: collectionForm.name.trim(),
          description: collectionForm.description.trim(),
          color: collectionForm.color || 'indigo',
        },
        token
      );

      if (res && res.success && res.collection) {
        setSelectedCollection((prev) => ({
          ...prev,
          ...res.collection,
        }));
        setCollections((prev) =>
          prev.map((c) => (c._id === selectedCollection._id ? { ...c, ...res.collection } : c))
        );
        setShowEditModal(false);
        showToast('Collection updated successfully');
      } else {
        setColError(res?.message || 'Failed to update collection');
      }
    } catch (err) {
      setColError(err.message || 'Failed to update collection');
    } finally {
      setSubmittingCol(false);
    }
  };

  // Delete Collection
  const handleDeleteCollection = async () => {
    if (!selectedCollection || submittingCol || !token) return;

    setSubmittingCol(true);
    try {
      const res = await deleteCollection(selectedCollection._id, token);
      if (res && res.success) {
        setCollections((prev) => prev.filter((c) => c._id !== selectedCollection._id));
        setActiveCollectionId('all');
        setSelectedCollection(null);
        setShowDeleteModal(false);
        showToast('Collection deleted. Saved problems were retained.');
      } else {
        showToast(res?.message || 'Failed to delete collection');
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete collection');
    } finally {
      setSubmittingCol(false);
    }
  };

  // Determine which problem list to display
  const currentProblemsList = useMemo(() => {
    if (activeCollectionId === 'all') {
      return savedItems;
    }
    return selectedCollection?.problems || [];
  }, [activeCollectionId, savedItems, selectedCollection]);

  // Filter and Sort current problems
  const filteredAndSorted = useMemo(() => {
    const validItems = currentProblemsList.filter((item) => {
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
  }, [currentProblemsList, searchTerm, sortOrder]);

  return (
    <div className="relative min-h-screen">
      <ParticlesBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white text-xs font-semibold py-2.5 px-4 rounded-2xl shadow-xl border border-slate-700/60 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <Bookmark className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
            <span>Personal Collection System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>🔖 Saved Problems</span>
            {!loading && (
              <span className="text-sm font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                {savedItems.length} {savedItems.length === 1 ? 'saved' : 'saved'}
              </span>
            )}
          </h1>
          <p className="text-slate-600 mt-2 text-base">
            Organize bookmarked problems into customized folders and study collections.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <GlassAiButton
            type="button"
            onClick={() => {
              setCollectionForm({ name: '', description: '', color: 'indigo' });
              setColError(null);
              setShowCreateModal(true);
            }}
            variant="primary"
            size="md"
            icon={<FolderPlus className="w-4 h-4" />}
          >
            New Collection
          </GlassAiButton>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            title="Refresh saved problems and collections"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Collections Navigation Tabs Bar */}
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center gap-2 min-w-max">
          {/* All Saved Problems Tab */}
          <button
            type="button"
            onClick={() => setActiveCollectionId('all')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeCollectionId === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Saved Problems</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeCollectionId === 'all'
                  ? 'bg-slate-800 text-slate-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {savedItems.length}
            </span>
          </button>

          {/* User Collections Tabs */}
          {collections.map((col) => {
            const isActive = activeCollectionId === col._id;
            const colorCfg = COLOR_MAP[col.color] || COLOR_MAP.indigo;

            return (
              <button
                key={col._id}
                type="button"
                onClick={() => setActiveCollectionId(col._id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? `${colorCfg.activeBg} shadow-md`
                    : `bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50`
                }`}
              >
                <Folder className="w-4 h-4" />
                <span>{col.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                    isActive
                      ? 'bg-black/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {col.problemCount || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Specific Collection Details & Actions Banner (When viewing a user collection) */}
      {selectedCollection && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white mb-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {selectedCollection.name}
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10">
                  {selectedCollection.problemCount || 0}{' '}
                  {selectedCollection.problemCount === 1 ? 'problem' : 'problems'}
                </span>
              </div>
              {selectedCollection.description && (
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {selectedCollection.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <GlassAiButton
                type="button"
                onClick={() => {
                  setCollectionForm({
                    name: selectedCollection.name,
                    description: selectedCollection.description || '',
                    color: selectedCollection.color || 'indigo',
                  });
                  setColError(null);
                  setShowEditModal(true);
                }}
                size="xs"
                variant="glass"
                icon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Rename / Edit
              </GlassAiButton>

              <GlassAiButton
                type="button"
                onClick={() => setShowDeleteModal(true)}
                size="xs"
                variant="danger"
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Collection
              </GlassAiButton>
            </div>
          </div>
        </div>
      )}

      {/* Search & Sort Controls Bar */}
      {currentProblemsList.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search problems by title, description, or category..."
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
      {loading || collectionLoading ? (
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
          <GlassAiButton
            type="button"
            onClick={fetchData}
            variant="primary"
            size="md"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </GlassAiButton>
        </div>
      ) : currentProblemsList.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 text-3xl">
            {activeCollectionId === 'all' ? '🔖' : '📁'}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {activeCollectionId === 'all'
              ? 'No saved problems yet.'
              : `Collection "${selectedCollection?.name}" is empty.`}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {activeCollectionId === 'all'
              ? "Found an interesting problem? Bookmark it to review or solve later."
              : 'Add problems to this collection using the folder button on any saved problem.'}
          </p>
          {activeCollectionId === 'all' ? (
            <GlassAiButton
              to="/problems"
              variant="primary"
              size="md"
            >
              Browse Problems
            </GlassAiButton>
          ) : (
            <GlassAiButton
              type="button"
              onClick={() => setActiveCollectionId('all')}
              variant="dark"
              size="md"
            >
              View All Saved Problems
            </GlassAiButton>
          )}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        /* Empty State: Search query yielded no results */
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <FolderSearch className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No matching problems</h3>
          <p className="text-xs text-slate-600 mb-4">
            No problems matched "{searchTerm}".
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
              Showing {filteredAndSorted.length} of {currentProblemsList.length}{' '}
              {currentProblemsList.length === 1 ? 'problem' : 'problems'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSorted.map((item) => {
              const prob = getProblemObj(item);
              const savedDate = item.savedAt || item.createdAt || prob?.savedAt || prob?.createdAt;
              const probId = prob?._id || item.savedProblemId || item._id;

              return (
                <div key={probId} className="flex flex-col relative group/card">
                  <ProblemCard
                    problem={prob}
                    isSaved={true}
                    onToggleSave={handleToggleSave}
                    onManageCollections={(p) => setManageProblem(p)}
                  />

                  {/* Card Sub-bar: Saved date & Remove from Collection button */}
                  <div className="px-2 pt-1.5 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    {savedDate && (
                      <span>
                        Saved on{' '}
                        {new Date(savedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}

                    {selectedCollection && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCurrentCollection(prob._id, prob.title)}
                        className="text-slate-400 hover:text-rose-600 transition ml-auto font-semibold flex items-center gap-1 cursor-pointer"
                        title="Remove from this collection (problem remains in saved list)"
                      >
                        <X className="w-3 h-3" />
                        <span>Remove from folder</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add To Collection Modal */}
      {manageProblem && (
        <AddToCollectionModal
          problem={manageProblem}
          isOpen={Boolean(manageProblem)}
          onClose={() => setManageProblem(null)}
          onCollectionUpdated={() => {
            fetchCollectionsOnly();
            if (activeCollectionId !== 'all') {
              getCollectionById(activeCollectionId, token).then((res) => {
                if (res?.success) setSelectedCollection(res.collection);
              });
            }
          }}
        />
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">New Collection</h3>
                  <p className="text-xs text-slate-500">Organize your saved problems</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {colError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{colError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Collection Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={collectionForm.name}
                  onChange={(e) =>
                    setCollectionForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Java Problems, DSA, React Issues..."
                  maxLength={80}
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={collectionForm.description}
                  onChange={(e) =>
                    setCollectionForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="What kind of questions are in this collection?"
                  maxLength={250}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Folder Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {['indigo', 'emerald', 'amber', 'rose', 'purple', 'sky', 'cyan', 'orange'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCollectionForm((prev) => ({ ...prev, color: c }))}
                        className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                          c === 'indigo'
                            ? 'bg-indigo-500'
                            : c === 'emerald'
                            ? 'bg-emerald-500'
                            : c === 'amber'
                            ? 'bg-amber-500'
                            : c === 'rose'
                            ? 'bg-rose-500'
                            : c === 'purple'
                            ? 'bg-purple-500'
                            : c === 'sky'
                            ? 'bg-sky-500'
                            : c === 'cyan'
                            ? 'bg-cyan-500'
                            : 'bg-orange-500'
                        } ${
                          collectionForm.color === c
                            ? 'ring-2 ring-indigo-500 ring-offset-2 border-white scale-110'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <GlassAiButton
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  size="xs"
                  variant="glass"
                >
                  Cancel
                </GlassAiButton>
                <GlassAiButton
                  type="submit"
                  disabled={submittingCol || !collectionForm.name.trim()}
                  loading={submittingCol}
                  size="xs"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Create Collection
                </GlassAiButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Rename Collection Modal */}
      {showEditModal && selectedCollection && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Collection</h3>
                  <p className="text-xs text-slate-500">Update name and description</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {colError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{colError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Collection Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={collectionForm.name}
                  onChange={(e) =>
                    setCollectionForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  maxLength={80}
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={collectionForm.description}
                  onChange={(e) =>
                    setCollectionForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  maxLength={250}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Folder Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {['indigo', 'emerald', 'amber', 'rose', 'purple', 'sky', 'cyan', 'orange'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCollectionForm((prev) => ({ ...prev, color: c }))}
                        className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                          c === 'indigo'
                            ? 'bg-indigo-500'
                            : c === 'emerald'
                            ? 'bg-emerald-500'
                            : c === 'amber'
                            ? 'bg-amber-500'
                            : c === 'rose'
                            ? 'bg-rose-500'
                            : c === 'purple'
                            ? 'bg-purple-500'
                            : c === 'sky'
                            ? 'bg-sky-500'
                            : c === 'cyan'
                            ? 'bg-cyan-500'
                            : 'bg-orange-500'
                        } ${
                          collectionForm.color === c
                            ? 'ring-2 ring-indigo-500 ring-offset-2 border-white scale-110'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <GlassAiButton
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  size="xs"
                  variant="glass"
                >
                  Cancel
                </GlassAiButton>
                <GlassAiButton
                  type="submit"
                  disabled={submittingCol || !collectionForm.name.trim()}
                  loading={submittingCol}
                  size="xs"
                  variant="primary"
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Save Changes
                </GlassAiButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Collection Confirmation Modal */}
      {showDeleteModal && selectedCollection && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Delete "{selectedCollection.name}"?
            </h3>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              This will remove the collection folder. All {selectedCollection.problemCount || 0}{' '}
              problems inside it will <span className="font-bold text-slate-900">remain saved</span> in
              your main "All Saved Problems" list.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <GlassAiButton
                type="button"
                onClick={() => setShowDeleteModal(false)}
                size="xs"
                variant="glass"
              >
                Cancel
              </GlassAiButton>
              <GlassAiButton
                type="button"
                onClick={handleDeleteCollection}
                disabled={submittingCol}
                loading={submittingCol}
                size="xs"
                variant="danger"
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Yes, Delete Collection
              </GlassAiButton>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SavedProblems;
