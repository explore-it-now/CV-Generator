const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

// Add touch-action to prevent pinch zoom on the container from zooming the whole page 
// (though the meta tag does most of the work).
code = code.replace(
  /className="flex-1 overflow-auto p-2 sm:p-4 bg-\[#F5F5F5\] dark:bg-slate-800\/60 rounded-3xl border border-slate-200\/50 dark:border-white\/10 custom-scrollbar flex flex-col items-center shadow-inner relative group\/scroll"/g,
  'className="flex-1 overflow-auto p-2 sm:p-4 bg-[#F5F5F5] dark:bg-slate-800/60 rounded-3xl border border-slate-200/50 dark:border-white/10 custom-scrollbar flex flex-col items-center shadow-inner relative group/scroll" style={{ touchAction: "pan-x pan-y" }}'
);

code = code.replace(
  /className="flex-1 overflow-auto flex flex-col items-center p-2 sm:p-8 bg-white\/5 rounded-3xl sm:rounded-3xl border border-white\/5 custom-scrollbar shadow-inner"/g,
  'className="flex-1 overflow-auto flex flex-col items-center p-2 sm:p-8 bg-white/5 rounded-3xl sm:rounded-3xl border border-white/5 custom-scrollbar shadow-inner" style={{ touchAction: "pan-x pan-y" }}'
);

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
console.log("Added touchAction styles.");
