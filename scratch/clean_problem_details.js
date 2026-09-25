const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../client/src/pages/ProblemDetails.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove lucide-react import
content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]lucide-react['"];?/g, '');

// 2. Remove emojis
content = content.replace(/🤝/g, '');
content = content.replace(/⭐\s*/g, '');
content = content.replace(/✨\s*/g, '');
content = content.replace(/💡\s*/g, '');
content = content.replace(/🏆\s*/g, '');
content = content.replace(/❓\s*/g, '');
content = content.replace(/👑\s*/g, '');

// 3. Remove specific icon JSX elements
const iconsToRemove = [
  'Bookmark', 'Eye', 'Tag', 'MessageSquare', 'CheckCircle2', 'HelpCircle',
  'Layers', 'ArrowRight', 'Sparkles', 'FolderPlus', 'Flag', 'Bot',
  'RefreshCw', 'X', 'ChevronDown', 'ChevronUp', 'Users', 'Crown', 'Plus'
];

iconsToRemove.forEach(icon => {
  const selfClosingRegex = new RegExp(`<${icon}[^>]*\\/>`, 'g');
  content = content.replace(selfClosingRegex, '');
  const openCloseRegex = new RegExp(`<${icon}[^>]*>[\\s\\S]*?<\\/${icon}>`, 'g');
  content = content.replace(openCloseRegex, '');
});

// Remove icon prop from GlassAiButton
content = content.replace(/\s*icon=\{<[^>]+>\}/g, '');
content = content.replace(/\s*icon=\{[A-Za-z0-9_]+\}/g, '');

// Clean up any remaining double spaces or empty spans
content = content.replace(/<span className="text-xl">\s*<\/span>/g, '');
content = content.replace(/<span className="text-lg">\s*<\/span>/g, '');

// Fix status text
content = content.replace(/'\s*Solved'/g, "'Solved'");
content = content.replace(/'\s*Answered'/g, "'Answered'");
content = content.replace(/'\s*Open'/g, "'Open'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('ProblemDetails.jsx successfully cleaned!');
