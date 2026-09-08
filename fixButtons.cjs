const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

// The main generate button
code = code.replace(
  /className="group relative flex items-center justify-center gap-3 bg-purple-600 dark:bg-white\/80 hover:bg-\[#333333\] dark:hover:bg-\[#E5E5E5\] disabled:bg-slate-300 dark:disabled:bg-slate-800\/60 disabled:cursor-not-allowed text-white dark:text-slate-900 px-10 py-4 rounded-3xl font-bold transition-all shadow-2xl hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto text-xs tracking-widest uppercase overflow-hidden"/,
  'className="group relative flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white px-10 py-4 rounded-full font-bold transition-all shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-1 w-full sm:w-auto text-xs tracking-widest uppercase overflow-hidden"'
);

// Loading spinner was flattened
const loadingBlock = `{loading && (
                  <div className="flex flex-col items-center justify-center py-10 mb-4 space-y-4">
                    <div className="flex space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-white/80 rounded-3xl animate-[pulse_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-white/80 rounded-3xl animate-[pulse_1.5s_ease-in-out_infinite]" style={{ animationDelay: '200ms' }} />
                      <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-white/80 rounded-3xl animate-[pulse_1.5s_ease-in-out_infinite]" style={{ animationDelay: '400ms' }} />
                    </div>
                    <div className="font-sans text-xs font-medium text-slate-500 animate-pulse tracking-wide uppercase">{loadingMsg}</div>
                  </div>
                )}`;

const newLoadingBlock = `{loading && (
                  <div className="text-center py-8 mb-6 relative">
                    <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full" />
                    <div className="w-12 h-12 border-4 border-slate-200/50 dark:border-white/10 border-t-purple-500 rounded-full mx-auto mb-4 animate-spin relative z-10 shadow-lg shadow-purple-500/20" />
                    <div className="font-mono text-xs text-purple-600 dark:text-purple-400 animate-pulse tracking-widest font-bold relative z-10 uppercase">{loadingMsg}</div>
                  </div>
                )}`;
code = code.replace(loadingBlock, newLoadingBlock);

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
