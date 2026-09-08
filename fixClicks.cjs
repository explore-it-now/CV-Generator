const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

code = code.replace(
  /if \(\!isExport && \!editingSectionId\) \{/g,
  'if (!isExport) {'
);

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
console.log("Fixed clicks.");
