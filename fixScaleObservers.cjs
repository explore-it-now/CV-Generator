const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

code = code.replace(
  /const widthScale = containerWidth \/ 794;/g,
  `const padding = window.innerWidth < 640 ? 16 : 32;
        const widthScale = (containerWidth - padding) / 794;`
);

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
console.log("Fixed scale observers.");
