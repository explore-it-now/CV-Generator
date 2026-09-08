const fs = require('fs');

const cssContent = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

@import "tailwindcss";

@theme {
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Outfit", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

@variant dark (&:where(.dark, .dark *));

@layer utilities {
  .animate-blob {
    animation: blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

body {
  @apply bg-slate-50 text-slate-900 antialiased selection:bg-purple-500/30 selection:text-purple-900;
}

.dark body {
  @apply bg-[#030014] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200;
}

@layer utilities {
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    @apply bg-transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-slate-300 dark:bg-white/20 rounded-full hover:bg-slate-400 dark:hover:bg-white/30 transition-colors;
  }
}
`;

fs.writeFileSync('src/index.css', cssContent);
