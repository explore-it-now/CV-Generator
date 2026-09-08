const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const glassClasses = `
  .glass {
    @apply bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10;
  }
  .glass-card {
    @apply bg-white/80 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 shadow-2xl;
  }
  .text-gradient {
    @apply bg-gradient-to-br from-purple-500 to-cyan-400 bg-clip-text text-transparent;
  }
`;

if (!code.includes('.glass-card')) {
  code = code.replace(/@layer utilities \{/, '@layer utilities {' + glassClasses);
  fs.writeFileSync('src/index.css', code);
}
