const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../client/src/pages/AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/<span className="px-2.5 py-0.5 rounded-full text-\[10px\] font-bold bg-rose-950\/40 text-rose-300 border border-rose-500\/20">\s*[\s\S]*?Suspended\s*<\/span>/g, '<span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/40 text-rose-300 border border-rose-500/20">Suspended</span>');
content = content.replace(/<span className="px-2.5 py-0.5 rounded-full text-\[10px\] font-bold bg-emerald-950\/40 text-emerald-300 border border-emerald-500\/20">\s*[\s\S]*?Active\s*<\/span>/g, '<span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/20">Active</span>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed AdminDashboard.jsx status badges!');
