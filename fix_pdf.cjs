const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

// 1. Remove style={isExport ? { padding: '64px', width: '794px' } : {}}
code = code.replace(
  /style=\{isExport \? \{ padding: '64px', width: '794px' \} : \{\}\}/g,
  ''
);

// 2. Add padding to MEASUREMENT version to replace the removed padding
code = code.replace(
  /<div ref=\{measureRef\}>/g,
  '<div ref={measureRef} style={{ padding: "64px", width: "794px" }}>'
);

// 3. Change EXPORT version to use renderSections(true)
code = code.replace(
  /<div className="w-full shrink-0">\s*\{renderSections\(\)\}\s*<\/div>/g,
  '<div className="w-full shrink-0">\n                    {renderSections(true)}\n                  </div>'
);

// 4. In downloadPdf, remove the uiElements display none logic since the UI elements are no longer rendered
code = code.replace(
  /\/\/ Hide any UI elements that shouldn't be in the PDF[\s\S]*?uiElements\.forEach[\s\S]*?\}\);/g,
  '// UI elements are no longer rendered in EXPORT version'
);

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
console.log("Applied PDF fixes");
