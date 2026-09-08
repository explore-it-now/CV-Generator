const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

code = code.replace(/text-white text-white/g, 'text-white');
code = code.replace(/className="sticky top-0 h-20 border-b border-white\/10 bg-white\/70 dark:bg-\[#030014\]\/60 backdrop-blur-2xl z-50 flex items-center px-4 sm:px-8"/g, 'className="sticky top-0 h-20 border-b border-white/10 bg-white/70 dark:bg-[#030014]/60 backdrop-blur-2xl z-50 flex items-center px-4 sm:px-8 glass"');

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
