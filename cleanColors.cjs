const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

code = code.replace(/hover:bg-\[#333333\] dark:hover:bg-\[#E5E5E5\]/g, 'hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/30');
code = code.replace(/dark:bg-\[#E5E5E5\] dark:bg-\[#262626\]/g, 'dark:bg-slate-800/60');
code = code.replace(/dark:border-\[#D4D4D4\] /g, '');
code = code.replace(/bg-\[#E5E5E5\] dark:bg-\[#262626\]/g, 'bg-slate-800/60');
code = code.replace(/border-\[#D4D4D4\] /g, '');

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
