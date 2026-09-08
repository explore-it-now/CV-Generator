const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

// Fix the Merged Top Bar buttons so they stack on mobile instead of squishing
code = code.replace(
  /<div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto">/g,
  '<div className="flex flex-col gap-3 w-full sm:w-auto">'
);

// Fix the Full Screen Modal background and padding
code = code.replace(
  /className="fixed inset-0 bg-slate-900 sm:p-8 z-\[200\] flex flex-col overflow-hidden"/g,
  'className="fixed inset-0 bg-slate-900 p-4 pt-12 sm:p-8 z-[200] flex flex-col overflow-hidden"'
);

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
console.log("Fixed mobile nav and modal.");
