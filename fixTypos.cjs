const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

code = code.replace(/bg-white\/80\/70/g, 'bg-white/70');
code = code.replace(/shadow-2xl shadow-2xl/g, 'shadow-2xl');
code = code.replace(/shadow-2xl  group-hover:/g, 'shadow-2xl group-hover:');
code = code.replace(/text-slate-900 dark:text-black/g, 'text-slate-900');

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
