const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

// Fix header textarea to only show if !isExport
code = code.replace(
  /\{editingSectionId === 'header' \? \(/g,
  "{!isExport && editingSectionId === 'header' ? ("
);

// Fix other sections textarea to only show if !isExport
code = code.replace(
  /\{editingSectionId === s\.id \? \(/g,
  "{!isExport && editingSectionId === s.id ? ("
);

// Ensure the template gallery doesn't shrink
code = code.replace(
  /className="flex gap-3 mb-6 overflow-x-auto custom-scrollbar pb-2 px-1 w-full snap-x"/g,
  'className="flex gap-3 mb-6 overflow-x-auto custom-scrollbar pb-2 px-1 w-full snap-x shrink-0 z-20 relative"'
);

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
console.log("Fixed textarea and gallery.");
