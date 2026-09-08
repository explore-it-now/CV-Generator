const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

const oldTitle = `<div className="font-serif text-xl font-extrabold tracking-tight text-slate-900">CV<span className="text-slate-100">Optimizer</span></div>`;
const newTitle = `<div className="font-serif text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">CV<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400">Optimizer</span></div>`;
code = code.replace(oldTitle, newTitle);

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
