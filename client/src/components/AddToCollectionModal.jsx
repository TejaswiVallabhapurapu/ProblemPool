import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderPlus,
  X,
  Check,
  Plus,
  Sparkles,
  AlertCircle,
  FolderCheck,
} from 'lucide-react';
import { Loader } from './Loader';
import {
  getMyCollections,
  createCollection,
  addProblemToCollection,
  removeProblemFromCollection,
  getProblemCollections,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import GlassAiButton from './GlassAiButton';

const COLOR_MAP = {
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
};

const AddToCollectionModal = ({
  problem,
  isOpen,
  onClose,
  onCollectionUpdated,
}) => {
  const { token, isAuthenticated } = useAuth();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Collection Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColColor, setNewColColor] = useState('indigo');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const problemId = problem?._id;

  const fetchStatus = async () => {
    if (!token || !problemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getProblemCollections(problemId, token);
      if (res && res.success) {
        setCollections(res.collections || []);
      } else {
        setError(res?.message || 'Failed to load collections');
      }
    } catch (err) {
      setError(err.message || 'Unable to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && problemId) {
      fetchStatus();
      setShowCreateForm(false);
      setNewColName('');
      setNewColDesc('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, problemId]);

  if (!isOpen || !problem) return null;

  const handleToggleCollection = async (col) => {
    if (updatingId || !token) return;
    setUpdatingId(col._id);
    setError(null);
    setSuccessMsg(null);

    const isCurrentlyIn = Boolean(col.containsProblem);

    try {
      if (isCurrentlyIn) {
        await removeProblemFromCollection(col._id, problemId, token);
        setCollections((prev) =>
          prev.map((c) =>
            c._id === col._id ? { ...c, containsProblem: false } : c
          )
        );
        setSuccessMsg(`Removed from "${col.name}"`);
      } else {
        await addProblemToCollection(col._id, problemId, token);
        setCollections((prev) =>
          prev.map((c) =>
            c._id === col._id ? { ...c, containsProblem: true } : c
          )
        );
        setSuccessMsg(`Added to "${col.name}"`);
      }
      if (onCollectionUpdated) {
        onCollectionUpdated();
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update collection');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newColName.trim() || creating || !token) return;

    setCreating(true);
    setCreateError(null);

    try {
      const res = await createCollection(
        {
          name: newColName.trim(),
          description: newColDesc.trim(),
          color: newColColor,
        },
        token
      );

      if (res && res.success && res.collection) {
        const newColId = res.collection._id;
        // Automatically add the problem to the newly created collection
        await addProblemToCollection(newColId, problemId, token);

        setCollections((prev) => [
          {
            _id: newColId,
            name: res.collection.name,
            description: res.collection.description,
            color: res.collection.color,
            containsProblem: true,
          },
          ...prev,
        ]);

        setNewColName('');
        setNewColDesc('');
        setShowCreateForm(false);
        setSuccessMsg(`Created "${res.collection.name}" and added problem!`);
        if (onCollectionUpdated) {
          onCollectionUpdated();
        }
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setCreateError(res?.message || 'Failed to create collection');
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Organize into Collections
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                {problem.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content: Collections list or loading */}
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader size="sm" />
            <span className="text-xs font-medium">Loading your collections...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
              {collections.length === 0 && !showCreateForm ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                  <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    No collections yet
                  </p>
                  <p className="text-xs text-slate-400 mb-3">
                    Create custom collections like "React Issues", "Java Problems", or "DSA Prep".
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Your First Collection</span>
                  </button>
                </div>
              ) : (
                collections.map((col) => {
                  const isChecked = Boolean(col.containsProblem);
                  const isUpdating = updatingId === col._id;
                  const colorClass = COLOR_MAP[col.color] || COLOR_MAP.indigo;

                  return (
                    <button
                      key={col._id}
                      type="button"
                      onClick={() => handleToggleCollection(col)}
                      disabled={isUpdating}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-50/60 border-indigo-200 ring-1 ring-indigo-200'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${colorClass}`}
                        >
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {col.name}
                          </p>
                          {col.description && (
                            <p className="text-xs text-slate-500 truncate">
                              {col.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        {isUpdating ? (
                          <Loader size="sm" />
                        ) : isChecked ? (
                          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg border-2 border-slate-300 hover:border-indigo-400 bg-white" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Create Collection Section */}
            {showCreateForm ? (
              <form
                onSubmit={handleCreateCollection}
                className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 space-y-3 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Create New Collection</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                {createError && (
                  <p className="text-xs text-rose-600 font-medium">{createError}</p>
                )}

                <div>
                  <input
                    type="text"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="Collection name (e.g. Java Problems, DSA)..."
                    maxLength={80}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={newColDesc}
                    onChange={(e) => setNewColDesc(e.target.value)}
                    placeholder="Description (optional)..."
                    maxLength={200}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* Color Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">Color:</span>
                  <div className="flex items-center gap-1.5">
                    {['indigo', 'emerald', 'amber', 'rose', 'purple', 'sky'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColColor(c)}
                        className={`w-5 h-5 rounded-full border-2 transition ${
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
                            : 'bg-sky-500'
                        } ${
                          newColColor === c
                            ? 'ring-2 ring-indigo-500 ring-offset-1 border-white'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <GlassAiButton
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    size="xs"
                    variant="glass"
                  >
                    Cancel
                  </GlassAiButton>
                  <GlassAiButton
                    type="submit"
                    disabled={creating || !newColName.trim()}
                    loading={creating}
                    size="xs"
                    variant="primary"
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Save & Add
                  </GlassAiButton>
                </div>
              </form>
            ) : (
              collections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-slate-300 hover:border-indigo-400 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Collection</span>
                </button>
              )
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
          <GlassAiButton
            type="button"
            onClick={onClose}
            size="xs"
            variant="dark"
          >
            Done
          </GlassAiButton>
        </div>
      </div>
    </div>
  );
};

export default AddToCollectionModal;
