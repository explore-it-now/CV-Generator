const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

code = code.replace(/className="bg-white\/80 dark:bg-slate-900\/40 border border-slate-200\/50 dark:border-white\/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative group"/g, 'className="glass-card rounded-3xl p-6 sm:p-8 relative group"');

code = code.replace(/className="bg-white\/60 dark:bg-slate-900\/40  border border-white\/40 dark:border-white\/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col group"/g, 'className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col group"');

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
