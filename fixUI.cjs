const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

// Replace the root wrapper to have animated background
code = code.replace(
  /<div className="min-h-screen [^>]+>/,
  `<div className="min-h-screen bg-slate-50 dark:bg-[#030014] text-slate-900 dark:text-slate-100 font-sans relative overflow-x-hidden selection:bg-purple-500/30 selection:text-purple-200">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/30 dark:bg-cyan-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-500/30 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>`
);

// Re-glassmorphism the header
code = code.replace(
  /<header className="sticky top-0 h-20 border-b border-\[#E5E5E5\] dark:border-\[#262626\] bg-white dark:bg-\[#0A0A0A\]  z-50 flex items-center px-4 sm:px-8">/,
  '<header className="sticky top-0 h-20 border-b border-white/10 bg-white/70 dark:bg-[#030014]/60 backdrop-blur-2xl z-50 flex items-center px-4 sm:px-8">'
);

// Change text colors
code = code.replace(/text-\[#171717\]/g, 'text-slate-900');
code = code.replace(/text-\[#EDEDED\]/g, 'text-slate-100');
code = code.replace(/text-\[#111111\]/g, 'text-slate-900');
code = code.replace(/text-\[#737373\]/g, 'text-slate-500');
code = code.replace(/text-\[#A3A3A3\]/g, 'text-slate-400');
code = code.replace(/text-\[#525252\]/g, 'text-slate-600');

// Change background colors
code = code.replace(/bg-\[#0A0A0A\]/g, 'bg-slate-900/40');
code = code.replace(/bg-\[#171717\]/g, 'bg-slate-800/60');
code = code.replace(/bg-\[#111111\]/g, 'bg-purple-600');
code = code.replace(/bg-white/g, 'bg-white/80');

// Fix border colors
code = code.replace(/border-\[#E5E5E5\]/g, 'border-slate-200/50');
code = code.replace(/border-\[#262626\]/g, 'border-white/10');
code = code.replace(/border-\[#404040\]/g, 'border-white/20');

// Add rounded corners back
code = code.replace(/rounded-none/g, 'rounded-3xl');

// Add shadows
code = code.replace(/shadow-none/g, 'shadow-2xl');
code = code.replace(/shadow-sm/g, 'shadow-2xl shadow-purple-500/10');

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
