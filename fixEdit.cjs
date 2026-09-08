const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

code = code.replace(
  "className={`\${C.spacing} relative transition-all duration-300 break-inside-avoid ${\!isExport ? 'cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10 rounded-3xl p-4 -m-4 group/section-prev' : ''}`}",
  "className={`\${C.spacing} relative transition-all duration-300 break-inside-avoid ${\!isExport ? 'cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10 hover:ring-1 hover:ring-blue-500/30 rounded-3xl p-4 -m-4 group/section-prev' : ''}`}"
);

const headerClickSearch = `              onClick={() => {
                if (!isExport) {
                  const el = document.getElementById('personal-info-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-4', 'ring-blue-500/50', 'ring-offset-4');
                    setTimeout(() => el.classList.remove('ring-4', 'ring-blue-500/50', 'ring-offset-4'), 2000);
                  }
                }
              }}`;

const headerClickReplace = `              onClick={() => {
                if (!isExport && !editingSectionId) {
                  setEditingSectionId('header');
                  setEditingContent(header.content.join('\\n'));
                }
              }}`;

code = code.replace(headerClickSearch, headerClickReplace);

const headerMapSearch = `{header.content.map((line, i) => {`;
const headerMapReplace = `{editingSectionId === 'header' ? (
                <textarea
                  autoFocus
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  onBlur={() => {
                    setEditingSectionId(null);
                    if (onUpdateSectionContent) {
                      onUpdateSectionContent('header', editingContent.split('\\n'));
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full min-h-[150px] bg-white dark:bg-slate-900 border border-blue-500 rounded-xl p-4 text-[12px] font-sans text-slate-800 dark:text-white outline-none resize-y shadow-inner leading-relaxed"
                />
              ) : header.content.map((line, i) => {`;

code = code.replace(headerMapSearch, headerMapReplace);

const headerEndSearch = `return <div key={i} className="text-[11px] opacity-70 mb-2">{line}</div>;
              })}`;

const headerEndReplace = `return <div key={i} className="text-[11px] opacity-70 mb-2">{line}</div>;
              })}`;
              
code = code.replace(headerEndSearch, headerEndReplace);

fs.writeFileSync('src/components/CVOptimizer.tsx', code);
console.log("Done applying edits.");
