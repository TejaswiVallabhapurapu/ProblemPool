import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCollaborativeProblems } from '../services/api';
import { POPULAR_CATEGORIES } from '../components/CategoryFilter';
import GlassAiButton from '../components/GlassAiButton';
import { LoaderContainer } from '../components/Loader';

const TeamUpDiscovery = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCollaborative = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCollaborativeProblems({
        category: category !== 'All' ? category : undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit: 12,
      });

      if (res.success) {
        setProblems(res.problems || []);
        setTotalPages(res.totalPages || 1);
      } else {
        setError(res.message || 'Failed to load collaborative problems');
      }
    } catch (err) {
      setError(err.message || 'Failed to load collaborative problems');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborative();
  }, [category, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCollaborative();
  };

  return (
    <div className="relative min-h-screen text-white">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-white/10 text-xs font-bold text-slate-300 mb-4 shadow-md">
            
            <span>TEAM UP & COLLABORATE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            Find Problems to Solve Together
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Form small teams of up to 5 developers, divide tasks in private workspaces, build shared solutions, and earn contribution credit together.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[#141414] border border-white/10 shadow-xl mb-8 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collaborative problems by title, keywords, tags..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#111111] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <GlassAiButton
              type="submit"
              size="md"
              variant="primary"
            >
              Search
            </GlassAiButton>
          </form>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
            {POPULAR_CATEGORIES.slice(0, 10).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  category === cat
                    ? 'bg-[#262626] text-white border border-white/25 shadow-md'
                    : 'bg-[#181818] text-neutral-400 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Collaborative Problems Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoaderContainer text="Discovering collaborative problem teams..." />
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl bg-[#161616] border border-rose-500/20 text-center max-w-md mx-auto">
            <p className="text-rose-300 text-sm mb-4">{error}</p>
            <GlassAiButton onClick={fetchCollaborative} variant="primary" size="sm">
              Retry
            </GlassAiButton>
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-[#141414] border border-white/10 p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center mx-auto mb-4 text-2xl">
              
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No collaborative problems found</h3>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Be the first to post a problem with "Allow Team Up" enabled and invite fellow developers to collaborate.
            </p>
            <GlassAiButton
              to="/create-problem"
              variant="primary"
              size="md"
            >
              Post a Problem
            </GlassAiButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((prob) => {
              const openSlots = prob.membersNeeded > 0 ? prob.membersNeeded : 5;
              const hasActiveTeams = prob.activeTeamsCount > 0;

              return (
                <div
                  key={prob._id}
                  className="p-6 rounded-3xl bg-[#151515] border border-white/10 hover:border-white/20 transition-all shadow-lg flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Metadata */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1e1e1e] border border-white/10 text-xs font-semibold text-slate-300">
                        {prob.category}
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#202020] border border-white/15 text-[11px] font-bold text-slate-200">
                        
                        <span>{hasActiveTeams ? `${prob.activeTeamsCount} Teams Active` : 'Open for Teams'}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <Link
                      to={`/problems/${prob._id}`}
                      className="block group-hover:text-slate-300 transition-colors"
                    >
                      <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 mb-2 leading-snug">
                        {prob.title}
                      </h3>
                    </Link>

                    {/* Description preview */}
                    <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-4">
                      {prob.description}
                    </p>

                    {/* Team Slots Availability Card */}
                    <div className="p-3.5 rounded-2xl bg-[#121212] border border-white/10 mb-4 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-300 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          
                          <span>Collaborators:</span>
                        </span>
                        <span className="text-white font-black">
                          {prob.totalTeamMembers || 0} Members
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {prob.openTeamsCount > 0
                          ? ` ${prob.openTeamsCount} team(s) currently seeking members`
                          : ' Be the first to start a team for this problem!'}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-neutral-400 font-medium">
                      {prob.createdBy?.name ? `By ${prob.createdBy.name}` : 'Community Problem'}
                    </span>

                    <GlassAiButton
                      to={`/problems/${prob._id}`}
                      size="xs"
                      variant="primary"
                      iconPosition="right"
                    >
                      View & Team Up
                    </GlassAiButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamUpDiscovery;
