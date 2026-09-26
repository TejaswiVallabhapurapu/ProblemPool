import React from 'react';

export const POPULAR_CATEGORIES = [
  'All',
  'Programming',
  'Web Development',
  'Database',
  'AI & ML',
  'DSA',
  'Technology',
  'Career',
  'College',
  'Projects',
  'Education',
  'Healthcare',
  'Environment',
  'Transportation',
  'Community',
  'General',
  'Other',
];

const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {POPULAR_CATEGORIES.map((category) => {
        const isSelected = (selectedCategory || '').toLowerCase() === (category || '').toLowerCase();
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 border cursor-pointer ${
              isSelected
                ? 'bg-white text-black border-white font-bold shadow-xs'
                : 'bg-[#141414]/80 text-neutral-300 border-white/10 hover:border-white/20 hover:text-white hover:bg-white/8'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
