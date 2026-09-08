const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

// Replace bad background artifacts from previous scripts
code = code.replace(/bg-\[#FCFBF9\]\/50/g, 'bg-white/50');
code = code.replace(/bg-\[#FCFBF9\]/g, 'bg-white/70');
code = code.replace(/dark:bg-slate-800\/60\/50/g, 'dark:bg-slate-800/50');
code = code.replace(/dark:bg-slate-800\/60\/60/g, 'dark:bg-slate-800/60');
code = code.replace(/dark:bg-slate-800\/60\/30/g, 'dark:bg-slate-800/30');
code = code.replace(/dark:bg-slate-800\/60\/80/g, 'dark:bg-slate-800/80');
code = code.replace(/bg-white\/80\/80/g, 'bg-white/80');
code = code.replace(/bg-white\/60/g, 'bg-white/60');
code = code.replace(/dark:bg-slate-900\/40\/50/g, 'dark:bg-slate-900/50');
code = code.replace(/dark:bg-slate-900\/40\/80/g, 'dark:bg-slate-900/80');

// Fix focus rings
code = code.replace(/rounded-3xl (px-[45])/g, 'rounded-2xl $1');
code = code.replace(/rounded-3xl (pl-11)/g, 'rounded-2xl $1');

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
