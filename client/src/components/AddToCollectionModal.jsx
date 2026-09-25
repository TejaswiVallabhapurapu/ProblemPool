import React, { useState, useEffect } from 'react';
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
  const [newColColor, setNewColColor] = useState('neutral');
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="relative bg-[#141414] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              Organize into Collections
            </h3>
            <p className="text-xs text-neutral-400 line-clamp-1 max-w-xs mt-0.5">
              {problem.title}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Notices */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {/* Content: Collections list or loading */}
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader size="sm" />
            <span className="text-xs font-medium">Loading your collections...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
              {collections.length === 0 && !showCreateForm ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                  <p className="text-sm font-semibold text-white mb-1">
                    No collections yet
                  </p>
                  <p className="text-xs text-neutral-400 mb-3">
                    Create custom collections like "React Issues", "Java Problems", or "DSA Prep".
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition cursor-pointer"
                  >
                    Create Your First Collection
                  </button>
                </div>
              ) : (
                collections.map((col) => {
                  const isChecked = Boolean(col.containsProblem);
                  const isUpdating = updatingId === col._id;

                  return (
                    <button
                      key={col._id}
                      type="button"
                      onClick={() => handleToggleCollection(col)}
                      disabled={isUpdating}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isChecked
                          ? 'bg-white/10 border-white/30 ring-1 ring-white/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {col.name}
                        </p>
                        {col.description && (
                          <p className="text-xs text-neutral-400 truncate">
                            {col.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center">
                        {isUpdating ? (
                          <Loader size="sm" />
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              isChecked
                                ? 'bg-white text-black font-semibold'
                                : 'text-neutral-400 border border-white/10'
                            }`}
                          >
                            {isChecked ? 'Added' : 'Add'}
                          </span>
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
                className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white">
                    Create New Collection
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                {createError && (
                  <p className="text-xs text-red-400 font-medium">{createError}</p>
                )}

                <div>
                  <input
                    type="text"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="Collection name (e.g. Java Problems, DSA)..."
                    maxLength={80}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:border-white/30 text-white placeholder-neutral-500"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={newColDesc}
                    onChange={(e) => setNewColDesc(e.target.value)}
                    placeholder="Description (optional)..."
                    maxLength={200}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:border-white/30 text-white placeholder-neutral-500"
                  />
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
                  className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-white/15 hover:border-white/30 text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/5 flex items-center justify-center transition cursor-pointer"
                >
                  Create New Collection
                </button>
              )
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end">
          <GlassAiButton
            type="button"
            onClick={onClose}
            size="xs"
            variant="glass"
          >
            Done
          </GlassAiButton>
        </div>
      </div>
    </div>
  );
};

export default AddToCollectionModal;
