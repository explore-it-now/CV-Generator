const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

// Fix translucent CV paper
code = code.replace(/w: "bg-white\/80 shadow-2xl"/g, 'w: "bg-white shadow-2xl"');
code = code.replace(/w: "bg-white\/80 border-t-\[8px\] border-b-\[8px\] border-\[#0f172a\] shadow-2xl"/g, 'w: "bg-white border-t-[8px] border-b-[8px] border-[#0f172a] shadow-2xl"');
code = code.replace(/w: "bg-white\/80 border-l-\[48px\] border-\[#020617\] shadow-2xl"/g, 'w: "bg-white border-l-[48px] border-[#020617] shadow-2xl"');
code = code.replace(/w: "bg-white\/80 border-t-\[20px\] border-\[#0f172a\] shadow-2xl"/g, 'w: "bg-white border-t-[20px] border-[#0f172a] shadow-2xl"');
code = code.replace(/w: "bg-white\/80"/g, 'w: "bg-white"');

// Fix fullscreen modal background
code = code.replace(/className="fixed inset-0 sm:inset-4 bg-slate-900\/40\/95  z-\[200\] flex flex-col p-2 sm:p-8 overflow-hidden"/g, 'className="fixed inset-0 bg-slate-900 sm:p-8 z-[200] flex flex-col overflow-hidden"');

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
console.log("Fixed styles.");
