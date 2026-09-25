import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import {
  getChallenges,
  getChallengeById,
  createChallenge,
  submitChallengeSolution,
  selectChallengeBestAnswer,
} from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import MarkdownToolbar from '../components/MarkdownToolbar';
import GlassAiButton from '../components/GlassAiButton';
import EmptyState3D from '../components/EmptyState3D';
import ChallengeCard from '../components/ChallengeCard';

// 6 Core Standard Challenges
const CORE_CHALLENGES = [
  {
    id: 'java-fundamentals',
    title: 'Java Fundamentals Challenge',
    description:
      'Test your understanding of Java basics, variables, conditions, loops, arrays, and functions.',
    category: 'Java',
    difficulty: 'Beginner',
    duration: '7 Days',
    durationDays: 7,
    problemsCount: 10,
    rewardPoints: 50,
    rules: [
      'Solve problems in order or at your own pace within the 7-day period.',
      'Write clean, idiomatic Java code with proper variable naming and comments.',
      'Focus on algorithm efficiency and standard Java collections.',
    ],
    problems: [
      { id: 1, title: 'Check whether a number is even or odd', description: 'Write a program to check if an integer is even or odd without using modulo operator if possible.' },
      { id: 2, title: 'Find the factorial of a number', description: 'Compute N! for a given positive integer using iterative and recursive approaches.' },
      { id: 3, title: 'Check whether a number is prime', description: 'Determine if a number N is prime with an O(sqrt(N)) primality test.' },
      { id: 4, title: 'Reverse a string', description: 'Reverse a given string without using built-in StringBuilder reverse method.' },
      { id: 5, title: 'Find the largest element in an array', description: 'Find the maximum value and its index in an unsorted integer array in linear time.' },
      { id: 6, title: 'Check whether a string is a palindrome', description: 'Verify if a string reads the same backwards, ignoring punctuation and casing.' },
      { id: 7, title: 'Count vowels and consonants in a string', description: 'Count the total number of vowels and consonants in an input sentence.' },
      { id: 8, title: 'Calculate Fibonacci series up to N terms', description: 'Print the first N terms of the Fibonacci sequence and handle large integer overflows.' },
      { id: 9, title: 'Find duplicate elements in an array', description: 'Identify all repeating elements in an integer array using a HashSet.' },
      { id: 10, title: 'Sort an array', description: 'Implement Bubble Sort or Insertion Sort to arrange numbers in ascending order.' },
    ],
  },
  {
    id: 'python-problem-solving',
    title: 'Python Problem Solving Challenge',
    description:
      'Solve Python programming problems involving loops, functions, strings, lists, and basic algorithms.',
    category: 'Python',
    difficulty: 'Beginner',
    duration: '7 Days',
    durationDays: 7,
    problemsCount: 10,
    rewardPoints: 50,
    rules: [
      'Use clean Pythonic conventions (PEP 8) and list comprehensions where applicable.',
      'Optimize dictionary and set operations for fast O(1) lookups.',
    ],
    problems: [
      { id: 1, title: 'Sum and average of elements in a list', description: 'Compute sum and arithmetic mean of a numbers list without using sum() built-in.' },
      { id: 2, title: 'Find maximum and minimum in a list', description: 'Find both smallest and largest numbers in a single pass through the list.' },
      { id: 3, title: 'Count frequency of words in a text', description: 'Count word occurrences in a text paragraph using Python dictionaries or Counter.' },
      { id: 4, title: 'Check if a list is sorted', description: 'Determine if an array of numbers is strictly in non-decreasing order.' },
      { id: 5, title: 'Matrix transposition', description: 'Transpose an N x M matrix into M x N using nested list comprehensions.' },
      { id: 6, title: 'String anagram checker', description: 'Check whether two strings are anagrams of each other in O(N) time.' },
      { id: 7, title: 'Remove duplicates while preserving order', description: 'Eliminate duplicate items from a list while maintaining the original sequence.' },
      { id: 8, title: 'Generate prime numbers up to N', description: 'Implement the Sieve of Eratosthenes to produce all primes up to N.' },
      { id: 9, title: 'Dictionary key-value inverter', description: 'Swap keys and values of a dictionary, grouping duplicate values into lists.' },
      { id: 10, title: 'Binary search algorithm', description: 'Implement recursive and iterative binary search on a sorted list.' },
    ],
  },
  {
    id: 'sql-mastery',
    title: 'SQL Mastery Challenge',
    description:
      'Practice SQL queries including SELECT, WHERE, JOIN, GROUP BY, subqueries, and aggregate functions.',
    category: 'SQL',
    difficulty: 'Intermediate',
    duration: '7 Days',
    durationDays: 7,
    problemsCount: 10,
    rewardPoints: 60,
    rules: [
      'Write ANSI SQL compliant queries.',
      'Avoid N+1 subqueries when JOINs or Window functions are more efficient.',
    ],
    problems: [
      { id: 1, title: 'Second highest salary in Employee table', description: 'Find the second highest distinct salary using subquery or LIMIT OFFSET.' },
      { id: 2, title: 'Employees earning more than their managers', description: 'Join Employee table to itself to compare employee and manager salaries.' },
      { id: 3, title: 'Customers who never placed an order', description: 'Find all customer IDs with zero matching records in Orders table using LEFT JOIN.' },
      { id: 4, title: 'Cumulative monthly revenue using Window functions', description: 'Calculate rolling total revenue over time using SUM() OVER (ORDER BY date).' },
      { id: 5, title: 'Delete duplicate email rows', description: 'Write a DELETE statement to remove duplicate emails keeping only the lowest ID.' },
      { id: 6, title: 'Department sales with HAVING clause', description: 'Group transactions by department and filter groups with total sales > $50,000.' },
      { id: 7, title: 'Rank top 3 products in each category', description: 'Use DENSE_RANK() OVER (PARTITION BY category_id ORDER BY sales DESC).' },
      { id: 8, title: 'Correlated subquery with EXISTS', description: 'Find all suppliers who supply at least one product with price > $100.' },
      { id: 9, title: 'Multi-table join report', description: 'Join Users, Orders, and OrderItems to compute user lifetime value (LTV).' },
      { id: 10, title: 'Pivot quarterly revenue with CASE WHEN', description: 'Aggregate quarterly sales Q1, Q2, Q3, Q4 from row records into separate columns.' },
    ],
  },
  {
    id: 'data-structures',
    title: 'Data Structures Challenge',
    description:
      'Test your knowledge of arrays, strings, stacks, queues, linked lists, and searching algorithms.',
    category: 'Data Structures',
    difficulty: 'Intermediate',
    duration: '14 Days',
    durationDays: 14,
    problemsCount: 15,
    rewardPoints: 100,
    rules: [
      'Focus on optimal time and space complexity.',
      'Always consider edge cases: empty structures, single elements, and cycles.',
    ],
    problems: [
      { id: 1, title: 'Two Sum with Hash Map', description: 'Find indices of two numbers that add up to target in O(N) time.' },
      { id: 2, title: 'Valid Parentheses using Stack', description: 'Verify that parentheses, brackets, and braces close in correct order.' },
      { id: 3, title: 'Reverse a Singly Linked List', description: 'Reverse a linked list iteratively in O(1) space and recursively.' },
      { id: 4, title: 'Detect cycle in Linked List', description: "Use Floyd's fast and slow pointer cycle detection algorithm." },
      { id: 5, title: 'Implement Queue using Two Stacks', description: 'Support push, pop, peek operations in amortized O(1) time.' },
      { id: 6, title: 'Merge Two Sorted Linked Lists', description: 'Splice together nodes of two sorted lists in sorted order.' },
      { id: 7, title: 'Binary Tree Inorder Traversal', description: 'Return inorder traversal of binary tree nodes iteratively and recursively.' },
      { id: 8, title: 'Maximum Depth of Binary Tree', description: 'Find height of binary tree using depth-first recursion and BFS queue.' },
      { id: 9, title: 'Lowest Common Ancestor in BST', description: 'Find LCA of two nodes utilizing Binary Search Tree properties.' },
      { id: 10, title: 'Breadth-First Search on Graphs', description: 'Traverse an undirected graph level-by-level using an adjacency list.' },
      { id: 11, title: 'Depth-First Search on Graphs', description: 'Explore graph paths recursively with visited node tracking.' },
      { id: 12, title: 'Kth Largest Element with Min-Heap', description: 'Find Kth largest element in array in O(N log K) time using heap.' },
      { id: 13, title: 'Longest Substring Without Repeating Characters', description: 'Use sliding window and hash map for O(N) substring search.' },
      { id: 14, title: 'LRU (Least Recently Used) Cache', description: 'Implement LRU Cache with O(1) get and put using Hash Map + Doubly Linked List.' },
      { id: 15, title: 'Trapping Rain Water', description: 'Compute total water trapped between elevation bars using two pointers.' },
    ],
  },
  {
    id: 'web-development',
    title: 'Web Development Challenge',
    description:
      'Solve practical problems related to HTML, CSS, JavaScript, HTTP, APIs, and React.',
    category: 'Web Development',
    difficulty: 'Intermediate',
    duration: '10 Days',
    durationDays: 10,
    problemsCount: 12,
    rewardPoints: 80,
    rules: [
      'Write clean, accessible, and responsive components.',
      'Follow modern React hooks and asynchronous error-handling patterns.',
    ],
    problems: [
      { id: 1, title: 'Debounce and Throttle Utilities', description: 'Implement custom debounce and throttle functions in JavaScript.' },
      { id: 2, title: 'Deep Clone Object Function', description: 'Deep clone nested JavaScript objects handling arrays, dates, and circular refs.' },
      { id: 3, title: 'Resilient Fetch with Abort & Retry', description: 'Build a wrapper around fetch supporting automatic retry with exponential backoff.' },
      { id: 4, title: 'Custom Hook useLocalStorage', description: 'Create a React hook syncing component state with localStorage across browser tabs.' },
      { id: 5, title: 'Infinite Scroll with IntersectionObserver', description: 'Load pagination items smoothly when sentinel element scrolls into view.' },
      { id: 6, title: 'Accessible Modal with Focus Trap', description: 'Trap keyboard Tab focus inside modal and close on ESC key.' },
      { id: 7, title: 'Custom Form Validation Hook', description: 'Manage form field state, touched flags, and async error messages.' },
      { id: 8, title: 'Event Emitter / Pub-Sub Pattern', description: 'Implement subscribe, unsubscribe, and emit methods in a custom EventEmitter.' },
      { id: 9, title: 'Glassmorphism Interactive Card', description: 'Build a responsive CSS 3D tilt card with backdrop-filter blur effects.' },
      { id: 10, title: 'JWT Refresh Token Interceptor', description: 'Catch 401 HTTP errors, refresh the access token, and replay pending requests.' },
      { id: 11, title: 'Responsive Masonry Card Layout', description: 'Design an adaptive masonry card layout using CSS Grid with zero layout shifts.' },
      { id: 12, title: 'Global State with Context & useReducer', description: 'Architect lightweight predictable application state management.' },
    ],
  },
  {
    id: '30-day-coding',
    title: '30-Day Coding Challenge',
    description:
      'Solve one programming problem every day and build a consistent problem-solving habit.',
    category: 'Programming',
    difficulty: 'Mixed',
    duration: '30 Days',
    durationDays: 30,
    problemsCount: 30,
    rewardPoints: 200,
    rules: [
      'Solve at least 1 problem each day for 30 days to build your coding habit.',
      'Document your reasoning and solution approach.',
    ],
    problems: Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      title: `Day ${i + 1}: ${
        [
          'Basic Syntax & Hello World',
          'FizzBuzz with Clean Branching',
          'Array Rotation by K Steps',
          'Roman Numeral to Integer',
          'Integer to Roman Numeral',
          'Longest Common Prefix',
          'Merge Overlapping Intervals',
          'Group Anagrams with Hash Maps',
          'Rotate 2D Matrix 90 Degrees',
          'Spiral Matrix Traversal',
          'Jump Game Greedy Solution',
          'Gas Station Circular Tour',
          'Search in Rotated Sorted Array',
          'First & Last Position in Sorted Array',
          'Generate Parentheses Backtracking',
          'Phone Number Letter Combinations',
          'Combination Sum DFS',
          'Word Search on 2D Board',
          'House Robber Dynamic Programming',
          'Coin Change Minimum Coins',
          'Longest Increasing Subsequence',
          'Edit Distance Levenshtein Matrix',
          'Maximum Subarray Kadane Algorithm',
          'Product of Array Except Self',
          'Minimum Window Substring',
          'Course Schedule Topological Sort',
          'Word Ladder Shortest BFS Sequence',
          'Number of Islands Grid Traversal',
          'Clone Graph with Deep Nodes',
          'Design URL Shortener System',
        ][i]
      }`,
      description: `Daily problem challenge for day ${i + 1}. Focus on building consistent problem-solving intuition.`,
    })),
  },
];

const CATEGORIES = [
  'All',
  'Java',
  'Python',
  'SQL',
  'Data Structures',
  'Web Development',
  'Programming',
];

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Mixed'];

const DIFFICULTY_STYLES = {
  Beginner: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20',
  Intermediate: 'bg-amber-950/40 text-amber-300 border-amber-500/20',
  Advanced: 'bg-rose-950/40 text-rose-300 border-rose-500/20',
  Mixed: 'bg-purple-50 text-purple-700 border-purple-200',
  Easy: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20',
  Medium: 'bg-amber-950/40 text-amber-300 border-amber-500/20',
  Hard: 'bg-rose-950/40 text-rose-300 border-rose-500/20',
  Expert: 'bg-purple-50 text-purple-700 border-purple-200',
};

const Challenges = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  // Active Challenge Modal / Details Drawer
  const [activeModalChallenge, setActiveModalChallenge] = useState(null);

  // Dynamic MongoDB Challenges (if created by Admin)
  const [dbChallenges, setDbChallenges] = useState([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // User Challenge Progress State (Persisted in localStorage per user ID)
  const progressStorageKey = `problempool_challenge_progress_${user?._id || user?.id || 'guest'}`;

  const [userProgress, setUserProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(progressStorageKey);
      return saved ? JSON.parse(saved) : ;
    } catch {
      return ;
    }
  });

  // Save progress changes
  useEffect(() => {
    try {
      localStorage.setItem(progressStorageKey, JSON.stringify(userProgress));
    } catch (e) {
      console.warn('Failed to save progress to localStorage:', e);
    }
  }, [userProgress, progressStorageKey]);

  // Load any dynamic MongoDB challenges from server
  useEffect(() => {
    const fetchDbChallenges = async () => {
      setLoadingDb(true);
      try {
        const res = await getChallenges(, token);
        if (res?.success && Array.isArray(res.challenges)) {
          setDbChallenges(res.challenges);
        }
      } catch (err) {
        console.warn('Challenges fetch from DB:', err.message);
      } finally {
        setLoadingDb(false);
      }
    };

    fetchDbChallenges();
  }, [token]);

  // Merge static core challenges with any database challenges
  const allChallenges = useMemo(() => {
    const merged = [...CORE_CHALLENGES];
    dbChallenges.forEach((dbc) => {
      // Map MongoDB challenge format if not already in core
      if (!merged.some((c) => c.id === dbc._id || c.title.toLowerCase() === dbc.title.toLowerCase())) {
        merged.push({
          id: dbc._id,
          title: dbc.title,
          description: dbc.description,
          category: dbc.category || 'Programming',
          difficulty: dbc.difficulty || 'Medium',
          duration: `${Math.max(1, Math.round((new Date(dbc.endDate) - new Date(dbc.startDate)) / (1000 * 60 * 60 * 24)))} Days`,
          problemsCount: 1,
          rewardPoints: dbc.pointsReward || 50,
          rules: ['Submit your best solution using Markdown & code blocks.'],
          problems: [
            {
              id: 1,
              title: dbc.title,
              description: dbc.description,
            },
          ],
          isDbChallenge: true,
          dbData: dbc,
        });
      }
    });
    return merged;
  }, [dbChallenges]);

  // Filtered Challenges according to Search, Category, and Difficulty
  const filteredChallenges = useMemo(() => {
    return allChallenges.filter((ch) => {
      // Category Filter
      if (selectedCategory !== 'All' && ch.category !== selectedCategory) {
        return false;
      }

      // Difficulty Filter
      if (selectedDifficulty !== 'All' && ch.difficulty !== selectedDifficulty) {
        return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = ch.title.toLowerCase().includes(q);
        const matchDesc = ch.description.toLowerCase().includes(q);
        const matchCat = ch.category.toLowerCase().includes(q);
        const matchProb = ch.problems?.some((p) => p.title.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchCat && !matchProb) {
          return false;
        }
      }

      return true;
    });
  }, [allChallenges, selectedCategory, selectedDifficulty, searchQuery]);

  // Toggle problem completion for a challenge
  const handleToggleProblem = (challengeId, problemId) => {
    setUserProgress((prev) => {
      const currentList = prev[challengeId] || [];
      const isCompleted = currentList.includes(problemId);
      const updatedList = isCompleted
        ? currentList.filter((id) => id !== problemId)
        : [...currentList, problemId];

      return {
        ...prev,
        [challengeId]: updatedList,
      };
    });
  };

  // Reset challenge progress
  const handleResetChallengeProgress = (challengeId) => {
    setUserProgress((prev) => {
      const updated = { ...prev };
      delete updated[challengeId];
      return updated;
    });
  };

  // Calculate stats for a given challenge
  const getChallengeStats = (challenge) => {
    const completedList = userProgress[challenge.id] || [];
    const total = challenge.problemsCount || challenge.problems?.length || 1;
    const completedCount = completedList.length;
    const percent = Math.min(100, Math.round((completedCount / total) * 100));

    let status = 'Not Started';
    if (completedCount === total && total > 0) {
      status = 'Completed';
    } else if (completedCount > 0) {
      status = 'In Progress';
    }

    return {
      completedCount,
      total,
      percent,
      status,
    };
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedCategory !== 'All' || selectedDifficulty !== 'All';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDifficulty('All');
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* ========================================================= */}
      {/* 1. HEADER SECTION */}
      {/* ========================================================= */}
      <div className="mb-10 text-center sm:text-left sm:flex sm:items-end sm:justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-bold mb-3 shadow-2xs">
            
            <span>ProblemPool Learning Tracks</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Challenges
          </h1>
          <p className="text-slate-300 mt-2 text-base sm:text-lg max-w-2xl">
            Test your skills, solve problems, and improve your programming knowledge.
          </p>
        </div>

        {/* Challenge Summary Badges */}
        <div className="mt-4 sm:mt-0 flex items-center justify-center sm:justify-end gap-3 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-[#141414]/90 backdrop-blur-md border border-white/10 text-center shadow-xs">
            <span className="block text-xl font-extrabold text-white">
              {allChallenges.length}
            </span>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Challenges
            </span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#141414]/90 backdrop-blur-md border border-white/10 text-center shadow-xs">
            <span className="block text-xl font-extrabold text-emerald-600">
              {allChallenges.reduce((acc, c) => acc + (c.problemsCount || 0), 0)}
            </span>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Problems
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SEARCH & FILTER CONTROLS */}
      {/* ========================================================= */}
      <div className="space-y-4 mb-10">
        {/* Search Input */}
        <div className="relative">
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search challenges by title, category, or problem..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[#141414]/90 backdrop-blur-md border border-white/10 text-white placeholder:text-neutral-400 text-sm sm:text-base font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-white/10 shadow-xs transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-slate-300 rounded-full hover:bg-[#202020]"
            >
              
            </button>
          )}
        </div>

        {/* Category & Difficulty Filters Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'bg-[#141414]/90 backdrop-blur-md text-slate-300 hover:text-white border border-white/10 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Difficulty Dropdown Filter */}
          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 text-xs">
            <span className="font-semibold text-neutral-400 flex items-center gap-1">
              
              <span>Difficulty:</span>
            </span>
            <div className="flex items-center gap-1 bg-[#141414]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-2xs">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedDifficulty === diff
                      ? 'bg-white/10 text-slate-200'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filter Notice & Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/10/70 border border-white/15 rounded-xl text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Filtered by:</span>
              {searchQuery && (
                <span className="px-2 py-0.5 rounded bg-[#141414]/90 backdrop-blur-md font-bold border border-white/20">
                  "{searchQuery}"
                </span>
              )}
              {selectedCategory !== 'All' && (
                <span className="px-2 py-0.5 rounded bg-[#141414]/90 backdrop-blur-md font-bold border border-white/20">
                  {selectedCategory}
                </span>
              )}
              {selectedDifficulty !== 'All' && (
                <span className="px-2 py-0.5 rounded bg-[#141414]/90 backdrop-blur-md font-bold border border-white/20">
                  {selectedDifficulty}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="font-bold text-slate-200 hover:text-indigo-900 underline cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. CHALLENGES GRID */}
      {/* ========================================================= */}
      {filteredChallenges.length === 0 ? (
        /* 3D Animated Empty State */
        <div className="py-8">
          <EmptyState3D
            type="challenges"
            title="No Challenges Found"
            description="We couldn't find any coding challenges matching your current search and difficulty filters."
            actionLabel="Reset Search & Filters"
            actionOnClick={clearAllFilters}
          />
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredChallenges.map((challenge) => {
            const stats = getChallengeStats(challenge);
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                stats={stats}
                onOpenDetails={setActiveModalChallenge}
              />
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CHALLENGE DETAILS MODAL */}
      {/* ========================================================= */}
      {activeModalChallenge && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div
            className="bg-[#141414]/90 backdrop-blur-md rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 sm:p-7 border-b border-white/10 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                      {activeModalChallenge.category}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        DIFFICULTY_STYLES[activeModalChallenge.difficulty] || ''
                      }`}
                    >
                      {activeModalChallenge.difficulty}
                    </span>
                    <span className="text-xs text-neutral-400 font-semibold flex items-center gap-1">
                      
                      <span>{activeModalChallenge.duration}</span>
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {activeModalChallenge.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModalChallenge(null)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-slate-200 hover:bg-[#141414]/90 backdrop-blur-md transition cursor-pointer"
                >
                  
                </button>
              </div>

              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {activeModalChallenge.description}
              </p>
            </div>

            {/* Modal Scrollable Content: Rules & Problem Checklist */}
            <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Challenge Rules */}
              {activeModalChallenge.rules && activeModalChallenge.rules.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#181818] border border-white/10">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    
                    <span>Challenge Rules & Guidelines</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 leading-relaxed pl-1">
                    {activeModalChallenge.rules.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Problem Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      
                      <span>Challenge Problems ({activeModalChallenge.problems?.length || 0})</span>
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Check off problems as you solve them to track your verified progress.
                    </p>
                  </div>

                  {(userProgress[activeModalChallenge.id] || []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleResetChallengeProgress(activeModalChallenge.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                      title="Reset challenge progress"
                    >
                      
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Problems List */}
                <div className="space-y-2.5">
                  {(activeModalChallenge.problems || []).map((prob, idx) => {
                    const completedList = userProgress[activeModalChallenge.id] || [];
                    const isDone = completedList.includes(prob.id);

                    return (
                      <div
                        key={prob.id}
                        onClick={() => handleToggleProblem(activeModalChallenge.id, prob.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isDone
                            ? 'bg-emerald-950/40/70 border-emerald-500/20 text-emerald-950'
                            : 'bg-[#141414]/90 backdrop-blur-md hover:bg-[#181818] border-white/10 text-white'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            className={`mt-0.5 shrink-0 rounded-md transition ${
                              isDone ? 'text-emerald-600' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            {isDone ? (
                              
                            ) : (
                              
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-xs sm:text-sm font-bold block ${
                                isDone ? 'line-through text-emerald-800' : 'text-white'
                              }`}
                            >
                              {idx + 1}. {prob.title}
                            </span>
                            {prob.description && (
                              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                                {prob.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                            isDone
                              ? 'bg-emerald-200/80 text-emerald-900'
                              : 'bg-[#202020] text-slate-300'
                          }`}
                        >
                          {isDone ? 'Solved ✓' : 'Open'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-[#181818] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">
                  {(userProgress[activeModalChallenge.id] || []).length} of{' '}
                  {activeModalChallenge.problemsCount || 10}
                </span>{' '}
                problems completed.
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <GlassAiButton
                  to="/create-problem"
                  size="xs"
                  variant="glass"
                >
                  Post Solution / Discussion
                </GlassAiButton>

                <GlassAiButton
                  type="button"
                  onClick={() => setActiveModalChallenge(null)}
                  size="xs"
                  variant="primary"
                >
                  Done
                </GlassAiButton>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Challenges;
