const fs = require('fs');
let code = fs.readFileSync('src/components/CVOptimizer.tsx', 'utf8');

const oldStep0 = `              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-4xl mx-auto border-t border-b border-slate-200/50 dark:border-white/10">
                {[
                  { 
                    id: 'modify', 
                    title: 'Optimize Existing CV', 
                    desc: 'Upload an existing document. We will analyze your past experience and tailor it directly to a new job description.',
                    icon: <Sparkles className="w-6 h-6" />,
                    tag: 'Upload'
                  },
                  { 
                    id: 'generate', 
                    title: 'Create from Scratch', 
                    desc: 'Start with raw bullet points or a LinkedIn dump. We will structure it perfectly for ATS systems and your target role.',
                    icon: <PlusCircle className="w-6 h-6" />,
                    tag: 'Builder'
                  }
                ].map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => { setMode(item.id as any); setStep(1); }}
                    className={\`group relative p-12 bg-transparent transition-all duration-300 text-left \${
                      index === 0 ? 'border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-white/10' : ''
                    } hover:bg-[#F5F5F5] dark:hover:bg-slate-800/60\`}
                  >
                    <div className="flex justify-between items-start mb-12">
                      <div className="w-12 h-12 flex items-center justify-center text-slate-900 dark:text-slate-100 border border-slate-200/50 dark:border-white/10 bg-white/80 dark:bg-slate-900/40">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="font-serif text-3xl text-slate-900 dark:text-slate-100 mb-4">
                      {item.title}
                    </h3>
                    <p className="font-sans text-slate-500 dark:text-slate-400 leading-relaxed text-[15px] max-w-sm mb-12">
                      {item.desc}
                    </p>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-xs tracking-widest uppercase">
                      Select Workflow
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </motion.button>
                ))}
              </div>`;

const newStep0 = `              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {[
                  { 
                    id: 'modify', 
                    title: 'Optimize Existing', 
                    desc: 'Upload your current CV and we\\'ll refine it for a specific job description.',
                    icon: <Sparkles className="w-8 h-8" />,
                    color: 'from-purple-600 to-indigo-600',
                    tag: 'Refinement'
                  },
                  { 
                    id: 'generate', 
                    title: 'Create from Scratch', 
                    desc: 'Start fresh with our guided builder and AI-powered content generation.',
                    icon: <PlusCircle className="w-8 h-8" />,
                    color: 'from-cyan-500 to-blue-600',
                    tag: 'Fresh Start'
                  }
                ].map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setMode(item.id as any); setStep(1); }}
                    className={\`glass group relative p-8 rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 transition-all duration-500 text-left overflow-hidden \${
                      mode === item.id 
                        ? 'ring-2 ring-purple-500 shadow-2xl shadow-purple-500/20' 
                        : 'hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10'
                    }\`}
                  >
                    <div className={\`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br \${item.color} opacity-10 group-hover:opacity-20 rounded-bl-[4rem] transition-opacity duration-500\`} />
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className={\`w-16 h-16 rounded-2xl bg-gradient-to-br \${item.color} flex items-center justify-center text-white shadow-2xl shadow-purple-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500\`}>
                        {item.icon}
                      </div>
                      <span className="text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                        {item.tag}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-cyan-400 transition-colors duration-300 relative z-10">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm relative z-10">
                      {item.desc}
                    </p>
                    
                    <div className="mt-8 flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm relative z-10">
                      Get Started
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-purple-400 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </div>`;

code = code.replace(oldStep0, newStep0);
fs.writeFileSync('src/components/CVOptimizer.tsx', code);
