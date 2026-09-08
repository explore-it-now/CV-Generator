const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

// Replace dark:bg-white/80 or dark:bg-white with gradients everywhere that has bg-purple-600
code = code.replace(/bg-purple-600 dark:bg-white\/80 text-white dark:text-slate-900/g, 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white');
code = code.replace(/bg-purple-600 dark:bg-white text-white dark:text-slate-900/g, 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white');
code = code.replace(/bg-purple-600 dark:bg-white\/80 hover:bg-\[#333333\] dark:hover:bg-\[#E5E5E5\] text-white dark:text-slate-900/g, 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white');

// Double text fix
code = code.replace(/text-white dark:text-slate-900 text-white dark:text-slate-900/g, 'text-white');
code = code.replace(/text-white dark:text-slate-900/g, 'text-white');

// Background fixes for headers/cards
code = code.replace(/bg-slate-900\/40\/60/g, 'bg-slate-900/40');
code = code.replace(/bg-white\/80\/60/g, 'bg-white/60');
code = code.replace(/bg-white\/80\/5/g, 'bg-white/5');
code = code.replace(/bg-white\/80\/10/g, 'bg-white/10');

// Fix border white logic
code = code.replace(/border-white\/10\/40/g, 'border-white/10');
code = code.replace(/border-white\/20\/50/g, 'border-white/20');

// Fix the random dark:bg-purple-600 dark:bg-white/80
code = code.replace(/dark:bg-purple-600 dark:bg-white\/80/g, 'dark:bg-purple-600');
code = code.replace(/dark:bg-white\/80/g, 'dark:bg-slate-800');

// Fix shadows
code = code.replace(/shadow-2xl shadow-2xl/g, 'shadow-2xl shadow-purple-500/10');
code = code.replace(/shadow-2xl  /g, 'shadow-2xl shadow-purple-500/10 ');

// Add a brand glow to the CV sections
code = code.replace(/className={\`\$\{template === 'modern' \? 'mb-2' : 'mb-6'\} relative transition-all duration-300 \$\{!isExport \? 'cursor-pointer hover:bg-blue-50\/30 dark:hover:bg-blue-900\/10 rounded-3xl p-4 -m-4 group\/header-prev' : ''\}/,
`className={\`\$\{template === 'modern' ? 'mb-2' : 'mb-6'} relative transition-all duration-300 \$\{!isExport ? 'cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-900/20 hover:ring-1 hover:ring-purple-500/30 rounded-3xl p-4 -m-4 group/header-prev' : ''\}`);

code = code.replace(/className="absolute -top-8 left-1\/2 -translate-x-1\/2 bg-blue-600/g, 'className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600');

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
