const fs = require('fs');
const path = require('path');

const filesToClean = [
  'client/src/pages/CreateProblem.jsx',
  'client/src/pages/SavedProblems.jsx',
  'client/src/pages/Challenges.jsx',
  'client/src/pages/Leaderboard.jsx',
  'client/src/pages/Notifications.jsx',
  'client/src/pages/TeamUpDiscovery.jsx',
  'client/src/pages/TeamWorkspace.jsx',
  'client/src/pages/AdminDashboard.jsx',
  'client/src/pages/Login.jsx',
  'client/src/pages/Signup.jsx',
];

const allKnownIcons = [
  'Tag', 'Plus', 'X', 'Sparkles', 'Search', 'ExternalLink', 'CheckCircle2', 'MessageSquare',
  'AlertCircle', 'ChevronDown', 'ChevronUp', 'Wand2', 'Lightbulb', 'Check', 'Bookmark',
  'ArrowUpDown', 'RefreshCw', 'FolderSearch', 'Folder', 'FolderPlus', 'Edit2', 'Trash2',
  'Layers', 'Trophy', 'Calendar', 'Clock', 'Users', 'Star', 'Flame', 'Code2', 'Award',
  'ChevronRight', 'Send', 'BookOpen', 'Filter', 'Play', 'HelpCircle', 'CheckSquare',
  'Square', 'RotateCcw', 'Medal', 'Crown', 'ThumbsUp', 'TrendingUp', 'MapPin', 'Bell',
  'CheckCheck', 'UserPlus', 'AtSign', 'MessageCircle', 'Inbox', 'FileCode2', 'User',
  'ArrowLeft', 'ArrowRight', 'LogOut', 'UserMinus', 'Shield', 'AlertTriangle', 'UserX',
  'UserCheck', 'AlertOctagon', 'ShieldCheck', 'BarChart3', 'Mail', 'Lock', 'Info', 'ShieldAlert'
];

const emojisRegex = /[⭐🏆🤝💡🔔👤🎯📌❓👑🔥🚀✨⚡🎉💎🎖️🏅🟡🟢🔵🔖🕒⌛👀💬👍🌐🛡️☰]/g;

filesToClean.forEach((relPath) => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.log('File does not exist:', fullPath);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Remove lucide-react import completely
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]lucide-react['"];?\n?/g, '');

  // 2. Remove emojis
  content = content.replace(emojisRegex, '');

  // 3. Remove known icon tags
  allKnownIcons.forEach((icon) => {
    // Self closing e.g. <Icon className="..." />
    const selfClosing = new RegExp(`<${icon}(?:\\s+[^>]*)?\\/>`, 'g');
    content = content.replace(selfClosing, '');

    // Open & close e.g. <Icon ...>...</Icon>
    const openClose = new RegExp(`<${icon}(?:\\s+[^>]*)?>[\\s\\S]*?<\\/${icon}>`, 'g');
    content = content.replace(openClose, '');
  });

  // 4. Remove icon props from components like GlassAiButton
  content = content.replace(/\s*icon=\{<[^>]+>\}/g, '');
  content = content.replace(/\s*icon=\{[A-Za-z0-9_]+\}/g, '');

  // 5. Clean up category/status objects that referenced icon identifiers
  // e.g. icon: Layers, or icon: MessageSquare
  content = content.replace(/,\s*icon:\s*[A-Za-z0-9_]+/g, '');
  content = content.replace(/icon:\s*[A-Za-z0-9_]+,\s*/g, '');

  // 6. Clean up text contrast
  content = content.replace(/\btext-slate-900\b/g, 'text-white');
  content = content.replace(/\btext-slate-800\b/g, 'text-neutral-100');
  content = content.replace(/\btext-slate-700\b/g, 'text-neutral-200');
  content = content.replace(/\btext-slate-600\b/g, 'text-neutral-300');
  content = content.replace(/\btext-slate-500\b/g, 'text-neutral-400');
  content = content.replace(/\btext-slate-400\b/g, 'text-neutral-400');

  // 7. Clean up card surfaces & borders
  content = content.replace(/\bbg-slate-50\/[0-9]+\b/g, 'bg-[#181818]');
  content = content.replace(/\bbg-slate-50\b/g, 'bg-[#181818]');
  content = content.replace(/\bbg-slate-100\b/g, 'bg-[#202020]');
  content = content.replace(/\bborder-slate-200\/[0-9]+\b/g, 'border-white/10');
  content = content.replace(/\bborder-slate-200\b/g, 'border-white/10');
  content = content.replace(/\bborder-slate-100\b/g, 'border-white/10');

  // Replace white card containers with dark glass
  content = content.replace(/bg-white rounded-3xl/g, 'bg-[#141414]/90 backdrop-blur-md rounded-3xl');
  content = content.replace(/bg-white rounded-2xl/g, 'bg-[#141414]/90 backdrop-blur-md rounded-2xl');

  // 8. Fix empty spans or broken whitespace
  content = content.replace(/<span className="text-xl">\s*<\/span>/g, '');
  content = content.replace(/<span className="text-lg">\s*<\/span>/g, '');
  content = content.replace(/<span>\s*<\/span>/g, '');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Cleaned file:', relPath);
});

console.log('All files processed!');
