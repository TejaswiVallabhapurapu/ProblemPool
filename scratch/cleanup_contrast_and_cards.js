const fs = require('fs');
const path = require('path');

const filesToClean = [
  'client/src/pages/Problems.jsx',
  'client/src/pages/SavedProblems.jsx',
  'client/src/pages/ProblemDetails.jsx',
  'client/src/pages/Leaderboard.jsx',
  'client/src/pages/Challenges.jsx',
  'client/src/pages/Notifications.jsx',
  'client/src/pages/CreateProblem.jsx',
  'client/src/pages/AdminDashboard.jsx',
];

filesToClean.forEach((relPath) => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.log('File does not exist:', fullPath);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');

  // Common replacements for dark theme contrast
  content = content.replace(/\btext-slate-900\b/g, 'text-white');
  content = content.replace(/\btext-slate-800\b/g, 'text-slate-100');
  content = content.replace(/\btext-slate-700\b/g, 'text-slate-200');
  content = content.replace(/\btext-slate-600\b/g, 'text-slate-300');
  content = content.replace(/\bbg-slate-50\/[0-9]+\b/g, 'bg-[#181818]');
  content = content.replace(/\bbg-slate-50\b/g, 'bg-[#181818]');
  content = content.replace(/\bbg-slate-100\b/g, 'bg-[#202020]');
  content = content.replace(/\bborder-slate-200\/[0-9]+\b/g, 'border-white/10');
  content = content.replace(/\bborder-slate-200\b/g, 'border-white/10');
  content = content.replace(/\bborder-slate-100\b/g, 'border-white/10');
  content = content.replace(/\bbg-white\b/g, (match, offset, string) => {
    // Check surrounding context: if it's text-white, don't change
    return 'bg-[#141414]/90 backdrop-blur-md';
  });

  // Re-adjust instances where bg-white was supposed to be a button or specific element
  // Also clean up any broken class combinations
  content = content.replace(/bg-\[#141414\]\/90 backdrop-blur-md rounded-3xl p-6 border border-white\/10 shadow-sm/g, 'glass-card-3d rounded-3xl p-6 border border-white/10 shadow-sm');
  content = content.replace(/bg-indigo-50\b/g, 'bg-white/10');
  content = content.replace(/text-indigo-700\b/g, 'text-slate-200');
  content = content.replace(/text-indigo-600\b/g, 'text-white');
  content = content.replace(/border-indigo-100\b/g, 'border-white/15');
  content = content.replace(/border-indigo-200\b/g, 'border-white/20');
  content = content.replace(/ring-indigo-100\b/g, 'ring-white/10');
  content = content.replace(/ring-indigo-50\b/g, 'ring-white/10');
  content = content.replace(/bg-emerald-50\b/g, 'bg-emerald-950/40');
  content = content.replace(/text-emerald-700\b/g, 'text-emerald-300');
  content = content.replace(/border-emerald-200\b/g, 'border-emerald-500/20');
  content = content.replace(/bg-amber-50\b/g, 'bg-amber-950/40');
  content = content.replace(/text-amber-700\b/g, 'text-amber-300');
  content = content.replace(/text-amber-600\b/g, 'text-amber-400');
  content = content.replace(/border-amber-200\b/g, 'border-amber-500/20');
  content = content.replace(/bg-rose-50\b/g, 'bg-rose-950/40');
  content = content.replace(/text-rose-700\b/g, 'text-rose-300');
  content = content.replace(/text-rose-600\b/g, 'text-rose-400');
  content = content.replace(/border-rose-200\b/g, 'border-rose-500/20');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Cleaned:', relPath);
});

console.log('All files successfully updated to dark monochrome glass theme!');
