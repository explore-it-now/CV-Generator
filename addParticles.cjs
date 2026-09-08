const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

// Add import
if (!code.includes('import ParticleBackground')) {
  code = code.replace(/import React, \{[^}]+\} from 'react';/, "$&\nimport ParticleBackground from './ParticleBackground';");
}

// Remove old CSS blobs and add ParticleBackground
const oldBackground = `<div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/30 dark:bg-cyan-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-500/30 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>`;

const newBackground = `<ParticleBackground />`;

if (code.includes(oldBackground)) {
  code = code.replace(oldBackground, newBackground);
}

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
