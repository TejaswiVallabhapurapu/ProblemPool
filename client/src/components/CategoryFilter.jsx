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
        const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${
              isSelected
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
