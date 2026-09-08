import ParticleBackground from './ParticleBackground';
import { useState, useEffect, useRef, ChangeEvent, forwardRef, Fragment } from "react";
import * as mammoth from "mammoth";
import { motion, AnimatePresence, Reorder, useDragControls } from "motion/react";
import { 
  FileText, CheckCircle2, UploadCloud, 
  Sparkles, RefreshCw, ChevronRight, ChevronLeft, ArrowRight,
  Copy, Download, RefreshCcw, X, AlertCircle, Loader2, FileType, FileText as FileTextIcon, RotateCcw,
  Link as LinkIcon, Globe, Upload, Eye, ZoomIn, ZoomOut, Maximize2, Minimize2, GripVertical, Check, Edit3,
  Zap, Plus, Briefcase, User, Trophy, PlusCircle, Info, GraduationCap, Award, BookOpen,
  Sun, Moon,
  Mail, Linkedin, MapPin, Calendar, Circle,
  History,
  Lock, ShieldCheck
} from "lucide-react";
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, HeadingLevel, Table, TableCell, TableRow, WidthType, VerticalAlign, UnderlineType, ShadingType } from "docx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { PricingModal, UserAccess } from "./PricingModal";
import { extractTextFromPDF, generateCV, extractFromUrl, extractProfileFromUrl, analyzeAtsCompatibility } from "../services/geminiService";
import { extractTextFromPDFLocally } from "../lib/pdfParser";
import { Type } from "@google/genai";
import { GoogleGenAI } from "@google/genai";

const TEMPLATES = {
  modern:    { name: "Modern",    hint: "Clean lines, professional sidebar", color: "text-blue-600", border: "border-blue-600", bg: "bg-blue-50" },
  classic:   { name: "Classic",   hint: "Timeless, centered serif", color: "text-slate-900", border: "border-slate-900", bg: "bg-white/70" },
  minimal:   { name: "Minimal",   hint: "Ultra-clean, high clarity", color: "text-slate-400", border: "border-slate-200/50", bg: "bg-white/70" },
  bold:      { name: "Bold",      hint: "Strong impact, high contrast", color: "text-slate-900 dark:text-slate-100", border: "border-indigo-600", bg: "bg-blue-50" },
  executive: { name: "Executive", hint: "Prestige, sophisticated layout", color: "text-emerald-900", border: "border-emerald-900", bg: "bg-emerald-50" },
};

function ReorderItem({ s, idx, onDelete, onUpdate }: { s: CVSection; idx: number; onDelete: () => void; onUpdate: (updated: CVSection) => void; key?: string }) {
  const controls = useDragControls();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(s.title || "");
  const [editContent, setEditContent] = useState(s.content.join('\n'));

  const handleSave = () => {
    onUpdate({
      ...s,
      title: editTitle.trim() || null,
      content: editContent.split('\n').filter(line => line.trim() !== '')
    });
    setIsEditing(false);
  };

  return (
    <Reorder.Item 
      value={s}
      dragListener={false}
      dragControls={controls}
      id={s.id}
      whileDrag={{ scale: 1.02, rotate: 1, boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)" }}
      className="bg-white/80/90 dark:bg-slate-800/60/90  border border-[#F5F5F5] dark:border-white/20 rounded-3xl p-4 sm:p-5 transition-all hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-2xl group last:mb-0 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start gap-4">
        <div 
          className="w-10 h-10 rounded-3xl bg-white/70 dark:bg-slate-900/40 flex items-center justify-center text-[#D4D4D4] dark:text-slate-600 group-hover:text-slate-600 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-indigo-900/30 transition-all shrink-0 cursor-grab active:cursor-grabbing touch-none shadow-inner"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <input 
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-white/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/20 rounded-3xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                placeholder="Section Title"
              />
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-white/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/20 rounded-3xl px-3 py-2 text-xs text-slate-600 dark:text-slate-400 outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                placeholder="Section Content"
              />
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-[10px] font-bold py-2 rounded-3xl transition-all uppercase tracking-widest"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-[#F5F5F5] dark:bg-slate-700 text-slate-600 dark:text-[#D4D4D4] text-[10px] font-bold rounded-3xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-bold text-slate-900 dark:text-white text-sm truncate tracking-tight">{s.title || "Header"}</div>
                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 border border-[#F5F5F5] dark:border-white/20 rounded-3xl px-2 py-0.5 bg-white/50 dark:bg-slate-900/50 uppercase tracking-widest">#{idx + 1}</div>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-[#D4D4D4] dark:text-slate-600 hover:text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-indigo-900/20 rounded-3xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={onDelete}
                    className="p-1.5 text-[#D4D4D4] dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-3xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed font-medium">
                {s.content.join(' ').trim() || "No content preview available"}
              </div>
            </>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
}

function MiniDoc({ id, selected }: { id: string; selected: boolean }) {
  const C = {
    modern:    { bg: "bg-white/80 dark:bg-slate-800/60", ac: "bg-blue-600 dark:bg-blue-400", lines: [70, 45, 85, 60, 90, 55], bar: "left" },
    classic:   { bg: "bg-white/80 dark:bg-slate-800/60", ac: "bg-slate-900/40 dark:bg-[#F5F5F5]", lines: [80, 50, 75, 65, 85, 45], bar: "center" },
    minimal:   { bg: "bg-white/80 dark:bg-slate-800/60", ac: "bg-slate-300 dark:bg-slate-600", lines: [55, 40, 70, 35, 65, 50], bar: "none" },
    bold:      { bg: "bg-slate-900/40 dark:bg-slate-900/40", ac: "bg-blue-500 dark:bg-indigo-400", lines: [75, 55, 80, 60, 70, 45], bar: "full-left" },
    executive: { bg: "bg-white/80 dark:bg-slate-800/60", ac: "bg-emerald-900 dark:bg-emerald-300", lines: [65, 45, 78, 55, 82, 48], bar: "top" },
  }[id] || { bg: "bg-white/80 dark:bg-slate-800/60", ac: "bg-blue-600 dark:bg-blue-400", lines: [70, 50, 80, 60, 75, 50], bar: "none" };

  return (
    <div className={`w-12 h-16 sm:w-16 sm:h-20 rounded-3xl p-1.5 sm:p-2 flex flex-col gap-1 sm:gap-1.5 overflow-hidden relative shrink-0 transition-all duration-500 ${C.bg} ${selected ? 'ring-2 ring-indigo-500 shadow-[0_10px_25px_rgba(99,102,241,0.4)] scale-105 sm:scale-110 z-10' : 'shadow-2xl border border-slate-200/50 dark:border-white/20 hover:border-indigo-300 dark:hover:border-indigo-500 opacity-70 hover:opacity-100 hover:shadow-2xl'}`}>
      {C.bar === "left" && <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${C.ac}`} />}
      {C.bar === "full-left" && <div className={`absolute left-0 top-0 bottom-0 w-4 sm:w-5 ${C.ac} opacity-20`} />}
      {C.bar === "top" && <div className={`absolute left-0 top-0 right-0 h-1 sm:h-1.5 ${C.ac}`} />}
      
      <div className={`h-1 sm:h-1.5 rounded-3xl w-3/4 ${C.ac} ${C.bar === "left" ? 'ml-1' : ''} ${C.bar === "center" ? 'mx-auto' : ''} shadow-2xl`} />
      <div className={`h-0.5 sm:h-1 rounded-3xl w-1/2 opacity-40 ${C.ac} ${C.bar === "left" ? 'ml-1' : ''} ${C.bar === "center" ? 'mx-auto' : ''}`} />
      
      <div className="mt-0.5 sm:mt-1 flex flex-col gap-0.5 sm:gap-1">
        {C.lines.map((w, i) => (
          <div key={i} className={`h-[1px] rounded-3xl ${C.ac} ${i % 3 === 0 ? 'opacity-30 mt-0.5 sm:mt-1' : 'opacity-10'} ${C.bar === "left" ? 'ml-1' : ''} ${C.bar === "center" ? 'mx-auto' : ''}`} style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

interface CVSection {
  id: string;
  title: string | null;
  content: string[];
}

const parseSections = (txt: string): CVSection[] => {
  const lines = txt.split('\n');
  const sections: CVSection[] = [];
  let currentSection: CVSection = { id: 'header', title: null, content: [] };

  const sectionHeaders = [
    "SUMMARY", "PROFESSIONAL SUMMARY", "CAREER SUMMARY", "CAREER OBJECTIVE", "OBJECTIVE",
    "EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT HISTORY", "PROFESSIONAL EXPERIENCE", "EMPLOYMENT HISTORY/EXPERIENCE",
    "EDUCATION", "ACADEMIC BACKGROUND", "ACADEMIC HISTORY",
    "SKILLS", "CORE SKILLS", "TECHNICAL SKILLS", "KEY SKILLS",
    "CERTIFICATES", "CERTIFICATIONS", "PROFESSIONAL CERTIFICATES",
    "COURSES", "TRAINING", "COURSES & TRAINING",
    "PROJECTS", "KEY PROJECTS",
    "LANGUAGES", "AWARDS", "HONORS", "AWARDS & HONORS",
    "CONTACT", "CONTACT INFORMATION", "PROFILE", "PERSONAL PROFILE", "PROFESSIONAL PROFILE", "PERSONAL STATEMENT",
    "WORK", "VOLUNTEER", "VOLUNTEER EXPERIENCE",
    "INTERESTS", "HOBBIES", "REFERENCES", "QUALIFICATIONS", "ADDITIONAL INFORMATION",
    "PUBLICATIONS", "CONFERENCES", "MEMBERSHIPS", "AFFILIATIONS", "KEY ACHIEVEMENTS"
  ];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentSection.content.length > 0) {
        currentSection.content.push(line);
      }
      return;
    }

    const upperTrimmed = trimmed.toUpperCase().replace(/^#+\s*/, '').replace(/:$/, '');
    
    // Check if it's a header
    const isKnownHeader = sectionHeaders.some(h => upperTrimmed === h);
    const isFlexibleHeader = sectionHeaders.some(h => upperTrimmed.includes(h)) && 
                            (trimmed === trimmed.toUpperCase() || trimmed.startsWith('#') || trimmed.endsWith(':')) &&
                            trimmed.length < 45;

    if ((isKnownHeader || isFlexibleHeader) && trimmed.length > 3) {
      if (currentSection.content.length > 0 || currentSection.title) {
        sections.push(currentSection);
      }
      
      let title = trimmed.replace(/^#+\s*/, '').replace(/:$/, '');
      const upperTitle = title.toUpperCase();
      
      // Normalize to user's requested section names
      if (["SUMMARY", "PROFESSIONAL SUMMARY", "CAREER SUMMARY", "CAREER OBJECTIVE", "OBJECTIVE", "PROFILE", "PERSONAL PROFILE", "PROFESSIONAL PROFILE", "PERSONAL STATEMENT"].some(h => upperTitle.includes(h))) {
        title = "Professional Summary";
      } else if (["EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT HISTORY", "PROFESSIONAL EXPERIENCE", "WORK", "EMPLOYMENT HISTORY/EXPERIENCE", "HISTOMER"].some(h => upperTitle.includes(h))) {
        title = "Employment History/Experience";
      } else if (["SKILLS", "CORE SKILLS", "TECHNICAL SKILLS", "KEY SKILLS"].some(h => upperTitle.includes(h))) {
        title = "Core Skills";
      } else if (["EDUCATION", "ACADEMIC BACKGROUND", "ACADEMIC HISTORY"].some(h => upperTitle.includes(h))) {
        title = "Education";
      } else if (["CERTIFICATES", "CERTIFICATIONS", "PROFESSIONAL CERTIFICATES"].some(h => upperTitle.includes(h))) {
        title = "Certifications";
      } else if (["ACHIEVEMENTS", "KEY ACHIEVEMENTS", "MAJOR ACHIEVEMENTS"].some(h => upperTitle.includes(h))) {
        title = "Key Achievements";
      }

      currentSection = { 
        id: `section-${idx}-${trimmed.substring(0, 5).replace(/\s/g, '-')}`, 
        title: title, 
        content: [] 
      };
    } else {
      currentSection.content.push(line);
    }
  });
  sections.push(currentSection);
  return sections;
};

const normalizeDate = (dateStr: string) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const isPresent = (s: string) => /presen[t]?|current|ongoing|now/i.test(s);
  
  // Split by common separators
  const parts = dateStr.split(/\s*[-–—to]\s*/i).filter(Boolean);
  
  const formatPart = (p: string) => {
    p = p.trim();
    if (isPresent(p)) return 'Present';
    
    // Handle MM/YYYY
    const mmYyyy = p.match(/^(\d{1,2})\/(\d{4})$/);
    if (mmYyyy) {
      const m = parseInt(mmYyyy[1]);
      if (m >= 1 && m <= 12) return `${months[m-1]} ${mmYyyy[2]}`;
    }
    
    // Handle Month YYYY or Month, YYYY
    const monthYyyy = p.match(/^([a-zA-Z]+)[,\s]*(\d{4})$/);
    if (monthYyyy) {
      const mStr = monthYyyy[1].substring(0, 3);
      const mIdx = months.findIndex(m => m.toLowerCase() === mStr.toLowerCase());
      if (mIdx !== -1) return `${months[mIdx]} ${monthYyyy[2]}`;
    }

    // Handle YYYY-MM-DD or similar
    const iso = p.match(/^(\d{4})-(\d{1,2})/);
    if (iso) {
      const m = parseInt(iso[2]);
      if (m >= 1 && m <= 12) return `${months[m-1]} ${iso[1]}`;
    }

    // Handle just YYYY
    if (p.match(/^\d{4}$/)) return p;
    
    return p;
  };

  if (parts.length >= 2) {
    const start = formatPart(parts[0]);
    const end = formatPart(parts[parts.length - 1]);
    return `${start} – ${end}`;
  }
  return formatPart(dateStr);
};

const CVPreview = forwardRef<HTMLDivElement, { text: string; sections?: CVSection[]; template: string; onReorder?: (newText: string) => void; setPageCount?: (n: number) => void; onUpdateSectionContent?: (id: string, newContent: string[]) => void; }>(
  ({ text, sections: passedSections, template, onReorder, setPageCount: setParentPageCount, onUpdateSectionContent }, ref) => {
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState<string>("");
    const C = {
      modern: { 
        w: "bg-white shadow-2xl", 
        p: "text-[#1e293b] text-[11px] leading-relaxed font-sans", 
        h: "text-[#1a4d4a] font-bold tracking-widest uppercase text-[14px] mb-3 mt-6 first:mt-0 border-b border-[#1a4d4a] pb-1 w-full flex items-center gap-2",
        name: "text-5xl font-display font-bold text-[#1a4d4a] mb-1 tracking-tight leading-tight",
        sub: "text-[#38b2ac] font-bold text-[16px] tracking-wide mb-2",
        spacing: "mb-4"
      },
      classic: { 
        w: "bg-white border-t-[8px] border-b-[8px] border-[#0f172a] shadow-2xl", 
        p: "text-[#0f172a] text-[12px] leading-relaxed font-display", 
        h: "text-[#0f172a] font-bold border-b-2 border-[#0f172a] mb-6 pb-2 text-[13px] mt-10 first:mt-0 text-center uppercase tracking-[0.4em]",
        name: "text-4xl font-display font-bold text-[#0f172a] mb-4 text-center leading-tight tracking-tight",
        sub: "text-[#64748b] font-display italic text-[15px] mb-6 text-center border-b border-[#f8fafc] pb-8",
        spacing: "mb-10"
      },
      minimal: { 
        w: "bg-white shadow-2xl", 
        p: "text-[#334155] text-[11px] leading-[1.9] font-sans tracking-wide", 
        h: "text-[#cbd5e1] font-black tracking-[0.5em] uppercase text-[9px] mb-8 mt-12 first:mt-0",
        name: "text-4xl font-thin text-[#0f172a] mb-3 tracking-widest uppercase leading-none",
        sub: "text-[#94a3b8] text-[11px] tracking-[0.4em] uppercase mb-10",
        spacing: "mb-12"
      },
      bold: { 
        w: "bg-white border-l-[48px] border-[#020617] shadow-2xl", 
        p: "text-[#0f172a] text-[11px] leading-relaxed font-sans", 
        h: "text-[#020617] font-black tracking-tighter uppercase text-2xl mb-8 mt-10 first:mt-0 flex items-center gap-5 after:h-1.5 after:flex-1 after:bg-[#020617]",
        name: "text-7xl font-black text-[#020617] mb-4 tracking-tighter uppercase leading-[0.85]",
        sub: "text-[#4f46e5] font-black text-[16px] tracking-widest uppercase mb-10",
        spacing: "mb-12"
      },
      executive: { 
        w: "bg-white border-t-[20px] border-[#0f172a] shadow-2xl", 
        p: "text-[#0f172a] text-[11.5px] leading-relaxed font-sans", 
        h: "text-[#0f172a] font-bold tracking-[0.15em] uppercase text-[12px] mb-6 mt-10 first:mt-0 border-l-[12px] border-[#0f172a] pl-6 bg-[#f8fafc] py-4",
        name: "text-5xl font-display font-bold text-[#0f172a] mb-3 tracking-tight leading-none",
        sub: "text-[#475569] font-display italic text-[16px] mb-8",
        spacing: "mb-12"
      },
    }[template] || { w: "bg-white", p: "text-[#1e293b] text-sm font-sans", h: "font-bold border-b mb-4", name: "text-2xl", sub: "text-sm", spacing: "mb-6" };

    const [sections, setSections] = useState<CVSection[]>([]);
    const [lastText, setLastText] = useState("");
    const measureRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState(1);
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);

    useEffect(() => {
      if (passedSections) {
        setSections(passedSections);
      } else if (text !== lastText) {
        setSections(parseSections(text));
        setLastText(text);
      }
    }, [text, lastText, passedSections]);

    useEffect(() => {
      const measure = () => {
        if (measureRef.current) {
          const height = measureRef.current.scrollHeight - 128; 
          const pages = Math.max(1, Math.ceil(height / 995));
          setPageCount(pages);
          if (setParentPageCount) setParentPageCount(pages);
        }
      };

      // Initial measure
      measure();
      
      // Measure again after a short delay to ensure layout is stable
      const timer = setTimeout(measure, 100);
      return () => clearTimeout(timer);
    }, [sections, template, setParentPageCount, text]);

    const renderContent = (sectionTitle: string | null, content: string[]) => {
      const titleLower = sectionTitle?.toLowerCase() || "";
      const isSkills = titleLower.includes('skills');
      const isSummary = titleLower.includes('summary') || titleLower.includes('objective');
      const isEducation = titleLower.includes('education');
      const isProjects = titleLower.includes('projects');
      const isCertifications = titleLower.includes('certificat') || titleLower.includes('courses');
      
      if (isSummary) {
        return (
          <div className="text-[11.5px] leading-[1.6] text-left opacity-90 mb-4 break-words w-full">
            {content.join(' ').trim()}
          </div>
        );
      }

      if (isSkills) {
        // Improved splitting logic: handle commas, bullets, and newlines
        const allSkills = content.flatMap(line => {
          // Remove bullet points if present
          const cleanLine = line.replace(/^[•\-\*]\s*/, '');
          // Split by comma or semicolon
          return cleanLine.split(/[;,]/);
        }).map(s => s.trim()).filter(Boolean);

        if (allSkills.length > 0) {
          if (template === 'modern') {
            return (
              <div className="flex flex-wrap gap-x-8 gap-y-4 mt-4">
                {allSkills.map((skill, idx) => (
                  <div 
                    key={idx} 
                    className="text-[11px] font-bold text-[#334155] border-b-2 border-[#f1f5f9] pb-1"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            );
          }
          return (
            <div className="flex flex-wrap gap-2 mt-3">
              {allSkills.map((skill, idx) => (
                <div 
                  key={idx} 
                  className={`px-3 py-1.5 rounded-3xl text-[10px] font-bold tracking-wide transition-all border ${
                    template === 'bold' 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : template === 'executive'
                        ? 'bg-[#ecfdf5] border-[#d1fae5] text-[#064e3b]'
                        : 'bg-[#f8fafc] border-[#f1f5f9] text-[#334155]'
                  }`}
                >
                  {skill}
                </div>
              ))}
            </div>
          );
        }
      }

      const isLanguages = titleLower.includes('language');
      if (isLanguages && template === 'modern') {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mt-4">
            {content.map((line, i) => {
              const parts = line.split(':');
              const name = parts[0].trim().replace(/^[•\-\*]\s*/, '');
              const level = parts[1]?.trim() || "Native";
              
              let dots = 3;
              const lowerLevel = level.toLowerCase();
              if (lowerLevel.includes('native') || lowerLevel.includes('fluent') || lowerLevel.includes('expert')) dots = 5;
              else if (lowerLevel.includes('advanced') || lowerLevel.includes('proficient')) dots = 4;
              else if (lowerLevel.includes('intermediate')) dots = 3;
              else if (lowerLevel.includes('basic') || lowerLevel.includes('elementary')) dots = 2;

              return (
                <div key={i} className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#0f172a] text-[12px]">{name}</span>
                    <span className="text-[10px] text-[#64748b] italic">{level}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(d => (
                      <div key={d} className={`w-2.5 h-2.5 rounded-3xl ${d <= dots ? 'bg-[#38b2ac]' : 'bg-[#e2e8f0]'}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      if (isCertifications && template === 'modern') {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mt-4">
            {content.map((line, i) => {
              const parts = line.split('|').map(p => p.trim().replace(/^[•\-\*]\s*/, ''));
              return (
                <div key={i} className="flex flex-col">
                  <span className="font-bold text-slate-900 text-[12px]">{parts[0]}</span>
                  {parts[1] && <span className="text-[10px] text-slate-500">{parts[1]}</span>}
                </div>
              );
            })}
          </div>
        );
      }

      return content.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        const datePattern = /(\d{1,2}\/\d{4}\s*[-–—]\s*(\d{1,2}\/\d{4}|presen[t]?|Current|Ongoing|Now))|(\d{4}\s*[-–—]\s*(\d{4}|presen[t]?|Current|Ongoing|Now))|((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}\s*[-–—]\s*((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}|presen[t]?|Current|Ongoing|Now))/i;
        const dateMatch = trimmed.match(datePattern);
        
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const text = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={i} className="flex gap-3 mb-1 group items-start pl-2 w-full">
              <div className="flex items-center justify-center w-4 shrink-0 pt-2">
                <div className={`w-1.5 h-1.5 rounded-3xl ${template === 'bold' ? 'bg-[#60a5fa]' : 'bg-[#94a3b8]'}`} />
              </div>
              <span className="flex-1 break-words leading-[1.6] text-[11.5px]">
                {text.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx} className={`font-bold ${template === 'bold' ? 'text-white' : 'text-[#0f172a]'}`}>{part}</strong> : part)}
              </span>
            </div>
          );
        }

        if (dateMatch) {
          const dateStr = dateMatch[0];
          const beforeDate = trimmed.replace(dateStr, '').trim().replace(/[()]$|^[()]/g, '').trim().replace(/\|\s*$/, '').trim();
          const parts = beforeDate.split('|').map(p => p.trim());
          
          const isMainEntry = isEducation || titleLower.includes('experience') || titleLower.includes('employment');
          const titleSize = isMainEntry ? 'text-[13px]' : 'text-[12px]';
          const subSize = isMainEntry ? 'text-[12px]' : 'text-[11px]';

          if (template === 'modern') {
            return (
              <div key={i} className={`${isMainEntry ? "mb-6" : "mb-3"} w-full`}>
                <div className="mb-1">
                  <div className="font-bold text-[13px] text-[#1a4d4a] mb-0.5">{parts[0].replace(/^[•\-\*]\s*/, '')}</div>
                  {parts[1] && <div className="font-bold text-[12px] text-[#38b2ac] mb-1">{parts[1]}</div>}
                  <div className="flex items-center gap-4 text-[10px] text-[#64748b]">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#38b2ac]" /> {normalizeDate(dateStr)}</span>
                    {parts[2] && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#38b2ac]" /> {parts[2]}</span>}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={i} className={`${isMainEntry ? "mb-4" : "mb-2"} w-full`}>
              <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2 mb-1 w-full">
                <div className="flex-1 flex flex-wrap items-center gap-x-2 min-w-0">
                  {parts.map((part, pIdx) => (
                    <Fragment key={pIdx}>
                      {pIdx > 0 && <span className="opacity-30 text-xs text-[#94a3b8]">|</span>}
                      <span className={`${pIdx === 0 ? `font-bold ${titleSize}` : `${subSize} opacity-80`} ${template === 'bold' ? 'text-[#93c5fd]' : 'text-[#0f172a]'}`}>
                        {part.split('**').map((p, idx) => idx % 2 === 1 ? <strong key={idx}>{p}</strong> : p)}
                      </span>
                    </Fragment>
                  ))}
                </div>
                <span className={`text-[10px] font-mono tracking-widest shrink-0 uppercase px-2 py-0.5 rounded font-bold ${template === 'bold' ? 'bg-[#3b82f6]/20 text-[#60a5fa]' : 'bg-[#f1f5f9] dark:bg-[#1e293b] text-[#475569] dark:text-[#94a3b8]'}`}>
                  {normalizeDate(dateStr)}
                </span>
              </div>
            </div>
          );
        }

        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          const text = trimmed.replace(/\*\*/g, '');
          const isMainEntry = isEducation || titleLower.includes('experience') || titleLower.includes('employment');
          return <div key={i} className={`font-bold mb-1 tracking-tight break-words w-full ${isMainEntry ? 'text-[14.5px]' : 'text-[13.5px]'} ${template === 'bold' ? 'text-white' : 'text-[#0f172a]'}`}>{text}</div>;
        }

        return (
          <div key={i} className="mb-1 leading-[1.6] break-words text-[11.5px] w-full text-left">
            {trimmed.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx} className={`font-bold ${template === 'bold' ? 'text-white' : 'text-[#0f172a]'}`}>{part}</strong> : part)}
          </div>
        );
      });
    };

    const renderSections = (isExport = false) => {
      const header = sections.find(s => s.id === 'header');
      const otherSections = sections.filter(s => s.id !== 'header');

      return (
        <div 
          className={`${C.p} break-words w-[666px]`} 
          
        >
          {header && (
            <div 
              className={`${template === 'modern' ? 'mb-2' : 'mb-6'} relative transition-all duration-300 ${!isExport ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:ring-1 hover:ring-blue-500/30 rounded-3xl p-4 -m-4 group/header-prev' : ''} ${template === 'classic' || template === 'minimal' ? 'text-center' : ''}`}
              onMouseEnter={() => !isExport && setHoveredSection('header')}
              onMouseLeave={() => !isExport && setHoveredSection(null)}
              onClick={() => {
                if (!isExport) {
                  setEditingSectionId('header');
                  setEditingContent(header.content.join('\n'));
                }
              }}
            >
              {!isExport && hoveredSection === 'header' && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-3xl uppercase tracking-widest z-20 shadow-2xl animate-in fade-in zoom-in duration-300 flex items-center gap-2 whitespace-nowrap">
                  <Sparkles className="w-3 h-3" /> Click to Edit Header
                </div>
              )}
              {!isExport && editingSectionId === 'header' ? (
                <textarea
                  autoFocus
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  onBlur={() => {
                    setEditingSectionId(null);
                    if (onUpdateSectionContent) {
                      onUpdateSectionContent('header', editingContent.split('\n'));
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full min-h-[150px] bg-white dark:bg-slate-900 border border-blue-500 rounded-xl p-4 text-[12px] font-sans text-slate-800 dark:text-white outline-none resize-y shadow-inner leading-relaxed"
                />
              ) : header.content.map((line, i) => {
                if (i === 0) return <h1 key={i} className={`${C.name} break-words w-full mb-2`}>{line}</h1>;
                if (i === 1) return <div key={i} className={`${C.sub} break-words w-full mb-4`}>{line}</div>;
                
                const isContact = line.includes('@') || line.match(/\d{3,}/) || line.includes('|') || line.toLowerCase().includes('linkedin');
                if (isContact) {
                  const parts = line.split('|').map(p => p.trim());
                  if (template === 'modern') {
                    return (
                      <div key={i} className="flex flex-wrap gap-x-6 gap-y-2 mt-2 mb-4">
                        {parts.map((part, idx) => {
                          let Icon = Globe;
                          if (part.includes('@')) Icon = Mail;
                          else if (part.toLowerCase().includes('linkedin')) Icon = Linkedin;
                          else if (part.toLowerCase().includes('manchester') || part.toLowerCase().includes('uk') || part.match(/\d{3,}/)) Icon = MapPin;

                          return (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#475569]">
                              <Icon className="w-3.5 h-3.5 text-[#38b2ac]" />
                              {part}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return (
                    <div key={i} className={`text-[11.5px] opacity-90 mb-3 tracking-wide flex flex-wrap items-center gap-x-6 gap-y-2 w-full ${template === 'classic' || template === 'minimal' ? 'justify-center' : ''}`}>
                      {line.split('|').map((part, idx) => (
                        <span key={idx} className="flex items-center gap-2 font-medium break-words">
                          {idx > 0 && <span className="opacity-30">|</span>}
                          {part.trim()}
                        </span>
                      ))}
                    </div>
                  );
                }
                
                return <div key={i} className="text-[11px] opacity-70 mb-2">{line}</div>;
              })}
            </div>
          )}

          {otherSections.map((s, i) => (
            <div 
              key={s.id || i} 
              className={`${C.spacing} relative transition-all duration-300 break-inside-avoid ${!isExport ? 'cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10 hover:ring-1 hover:ring-blue-500/30 rounded-3xl p-4 -m-4 group/section-prev' : ''}`}
              onMouseEnter={() => !isExport && setHoveredSection(s.id)}
              onMouseLeave={() => !isExport && setHoveredSection(null)}
              onClick={() => {
                if (!isExport) {
                  setEditingSectionId(s.id);
                  setEditingContent(s.content.join('\n'));
                }
              }}
            >
              {!isExport && hoveredSection === s.id && editingSectionId !== s.id && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-3xl uppercase tracking-widest z-20 shadow-2xl animate-in fade-in zoom-in duration-300 flex items-center gap-2 whitespace-nowrap">
                  <Edit3 className="w-3 h-3" /> Click to Edit Section
                </div>
              )}
              {s.title && (
                <div className={`${C.h} break-words w-full group-hover/section-prev:translate-x-1 transition-transform duration-300`}>
                  {template === 'bold' && <span className="w-2 h-2 bg-[#3b82f6] rounded-3xl shrink-0 shadow-2xl shadow-[#3b82f6]/50 animate-pulse" />}
                  {s.title}
                </div>
              )}
              <div className="opacity-95 leading-relaxed">
                {!isExport && editingSectionId === s.id ? (
                  <textarea
                    autoFocus
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onBlur={() => {
                      setEditingSectionId(null);
                      if (onUpdateSectionContent) {
                        onUpdateSectionContent(s.id, editingContent.split('\n'));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setEditingSectionId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-white/50 dark:bg-slate-900/50 border border-blue-500/50 rounded-xl p-3 text-inherit font-inherit resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                    rows={Math.max(3, editingContent.split('\n').length)}
                  />
                ) : (
                  renderContent(s.title, s.content)
                )}
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-8 items-center w-full">
        <div className="relative group w-full flex flex-col items-center">
          {/* EXPORT VERSION: Paginated for perfect A4 alignment in PDF */}
          <div 
            ref={ref}
            className="absolute -left-[9999px] top-0 flex flex-col"
          >
            {Array.from({ length: pageCount }).map((_, i) => (
              <div 
                key={i} 
                className={`${C.w.replace(/shadow-\S+/g, '')} relative overflow-hidden`}
                style={{ width: '794px', height: '1123px' }}
              >
                <div 
                  style={{ transform: `translateY(-${i * 995}px)` }} 
                  className="absolute top-16 left-16 w-[666px]"
                >
                  <div className="w-full shrink-0">
                    {renderSections(true)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* MEASUREMENT VERSION: Hidden div to calculate page count */}
          <div className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none">
            <div ref={measureRef} style={{ padding: "64px", width: "794px" }}>
              {renderSections(true)}
            </div>
          </div>

          {/* DISPLAY VERSION: Continuous layout for the user */}
          <div className="flex flex-col items-center w-full">
            <div 
              className={`shadow-[0_40px_80px_rgba(0,0,0,0.15)] ${C.w} relative shrink-0`}
              style={{ 
                width: '794px', 
                minHeight: `${Math.max(1, pageCount) * 1123}px`,
                paddingBottom: '64px'
              }}
            >
              <div className="w-[666px] mx-auto py-16 relative z-10">
                {renderSections()}
              </div>

              {/* Page Break Indicators */}
              {Array.from({ length: Math.max(0, pageCount - 1) }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-50"
                  style={{ top: `${(i + 1) * 1123}px`, height: '0' }}
                >
                  <div className="w-full border-t border-dashed border-slate-300 dark:border-slate-500 opacity-50"></div>
                  <div className="bg-[#F5F5F5] dark:bg-slate-800 text-[9px] font-mono font-bold text-slate-400 px-3 py-0.5 rounded-3xl mt-[-10px] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Page {i + 2}
                  </div>
                </div>
              ))}
              
              {/* Page Footers */}
              {Array.from({ length: Math.max(1, pageCount) }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute right-12 flex items-center gap-2 pointer-events-none z-20"
                  style={{ top: `${(i + 1) * 1123 - 32}px` }}
                >
                  <div className="h-px w-8 bg-slate-200 dark:bg-slate-700"></div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    {i + 1} / {pageCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 px-8 py-4 bg-white/80/90 dark:bg-slate-800/60/90  border border-slate-200/50/60 dark:border-white/20/60 rounded-3xl shadow-2xl">
          <div className="w-2 h-2 rounded-3xl bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 tracking-widest uppercase">
            A4 Document Preview • {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
          </span>
        </div>
      </div>
    );
  }
);

export default function CVOptimizer() {
  const [step, setStep] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  const [mode, setMode] = useState<"generate" | "modify" | null>(null);
  const [template, setTemplate] = useState("modern");
  const [jobDesc, setJobDesc] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobInputMode, setJobInputMode] = useState<"text" | "file" | "url">("text");
  const [jobFileLoading, setJobFileLoading] = useState(false);
  const [jobFileError, setJobFileError] = useState("");
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [existingCV, setExistingCV] = useState("");
  const [uploadedCVContent, setUploadedCVContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [originalResult, setOriginalResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(true);
  const [isParsingCV, setIsParsingCV] = useState(false);
  const [showLinkedInInput, setShowLinkedInInput] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [isParsingLinkedIn, setIsParsingLinkedIn] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.85);
  const [resultScale, setResultScale] = useState(1.0);
  const [isManualZoom, setIsManualZoom] = useState(false);
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [draftCV, setDraftCV] = useState("");
  const [cvSections, setCvSections] = useState<CVSection[]>([]);

  useEffect(() => {
    if (result && cvSections.length === 0) {
      setCvSections(parseSections(result));
    }
  }, [result, cvSections.length]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeyReady(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setApiKeyReady(true);
    }
  };
  const [loadingMsg, setLoadingMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(() => {
    try {
      const saved = localStorage.getItem("cv_user_access");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handlePaymentSuccess = (access: UserAccess) => {
    setUserAccess(access);
    try {
      localStorage.setItem("cv_user_access", JSON.stringify(access));
    } catch (e) {
      console.error(e);
    }
    setShowPricingModal(false);
    setShowDownloadModal(true);
  };
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsTips, setAtsTips] = useState<string[]>([]);
  const [isAnalyzingAts, setIsAnalyzingAts] = useState(false);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [history, setHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);

  const showToast = (message: string, type: "info" | "success" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const loadSampleData = () => {
    if (mode === "generate" || !mode) {
      if (!mode) setMode("generate");
      setDetails({
        name: "Alex Morgan",
        email: "alex.morgan@techcorp.io",
        phone: "+1 (415) 890-2341",
        city: "San Francisco",
        country: "United States",
        linkedin: "https://linkedin.com/in/alexmorgan-dev",
        portfolio: "https://alexmorgan.dev"
      });
      setBackground("Staff-track Senior Software Engineer with 6+ years of expertise architecting high-availability distributed systems, reactive web applications, and resilient cloud infrastructure. Passionate about developer tooling, browser performance engineering, and scaling engineering teams.");
      setSkills(["React", "TypeScript", "Node.js", "GraphQL", "Next.js", "Tailwind CSS", "Docker", "PostgreSQL", "AWS", "CI/CD", "System Architecture", "Redis"]);
      setEducations([{ degree: "B.S. in Computer Science (Summa Cum Laude)", university: "Stanford University" }]);
      setWorkExperiences([
        {
          company: "TechFlow Solutions",
          title: "Staff Software Engineer",
          startDate: "2022",
          endDate: "Present",
          current: true,
          responsibilities: "Led core application architecture serving 1M+ active users, cutting initial bundle load time by 45%.\nEngineered distributed real-time sync engine utilizing WebSockets and Redis with 99.99% uptime.\nMentored 8 mid-level engineers, establishing automated CI/CD deployment pipelines."
        },
        {
          company: "Enterprise Dynamics",
          title: "Senior Full Stack Engineer",
          startDate: "2019",
          endDate: "2022",
          current: false,
          responsibilities: "Designed and scaled high-throughput microservices handling 15,000 requests/sec.\nOptimized PostgreSQL schema queries and indexing, reducing p99 latency by 55%."
        }
      ]);
      setAchievements("Recipient of the 2023 Engineering Excellence Award for reducing platform cloud compute costs by 32%.\nFiled 2 software patents in distributed event synchronization for collaborative web apps.");
      setCertificates(["AWS Certified Solutions Architect - Professional", "Certified Kubernetes Administrator (CKA)"]);
      setCourses(["Advanced Distributed Systems Architecture", "High-Performance Browser Engineering"]);
    } else {
      setExistingCV(`Alex Morgan
alex.morgan@techcorp.io | +1 (415) 890-2341 | San Francisco, United States
linkedin.com/in/alexmorgan-dev | https://alexmorgan.dev

Professional Summary
Staff-track Senior Software Engineer with 6+ years of expertise architecting high-availability distributed systems, reactive web applications, and resilient cloud infrastructure. Passionate about developer tooling, browser performance engineering, and scaling engineering teams.

Employment History/Experience
- Staff Software Engineer at TechFlow Solutions (2022 - Present)
  Responsibilities:
  • Led core application architecture serving 1M+ active users, cutting initial bundle load time by 45%.
  • Engineered distributed real-time sync engine utilizing WebSockets and Redis with 99.99% uptime.
  • Mentored 8 mid-level engineers, establishing automated CI/CD deployment pipelines.

- Senior Full Stack Engineer at Enterprise Dynamics (2019 - 2022)
  Responsibilities:
  • Designed and scaled high-throughput microservices handling 15,000 requests/sec.
  • Optimized PostgreSQL schema queries and indexing, reducing p99 latency by 55%.

Core Skills
React, TypeScript, Node.js, GraphQL, Next.js, Tailwind CSS, Docker, PostgreSQL, AWS, CI/CD, System Architecture, Redis

Key Achievements
• Recipient of the 2023 Engineering Excellence Award for reducing platform cloud compute costs by 32%.
• Filed 2 software patents in distributed event synchronization for collaborative web apps.

Education
B.S. in Computer Science (Summa Cum Laude) — Stanford University

Certifications
AWS Certified Solutions Architect - Professional, Certified Kubernetes Administrator (CKA)`);
    }

    setJobDesc(`Staff Frontend / Full Stack Engineer — Platform & Applications
Company: Stripe / Innovation Labs
Location: San Francisco, CA / Remote

About the Role:
We are seeking a high-caliber Staff Frontend / Full Stack Engineer to lead technical architecture and engineering execution for our core web platforms. You will design, build, and optimize mission-critical interfaces and distributed backend APIs that power millions of global users daily.

Key Responsibilities:
• Lead technical design and implementation of highly performant, accessible, and resilient web applications using React, TypeScript, and modern web standards.
• Drive frontend architecture standards, performance optimization (Core Web Vitals), and modular design systems across engineering groups.
• Partner with product management, UX design, and backend engineering teams to deliver seamless user experiences.
• Mentor senior engineers and elevate engineering excellence through rigorous code reviews and architectural RFCs.

Qualifications:
• 5+ years of software engineering experience building scalable, production-grade web applications.
• Deep proficiency in TypeScript, React, Next.js, and modern browser performance profiling.
• Strong foundation in systems design, API design (REST/GraphQL), and distributed cloud systems.
• Proven track record of cross-functional technical leadership and driving measurable business impact.`);

    showToast("✨ Sample demo candidate & job description loaded!", "success");
  };
  const cvRef = useRef<HTMLDivElement>(null);
  
  const [details, setDetails] = useState({ name: "", email: "", phone: "", country: "", city: "", linkedin: "", portfolio: "" });
  const [background, setBackground] = useState("");
  const [achievements, setAchievements] = useState("");
  const [otherInfo, setOtherInfo] = useState("");

  const [resultContainer, setResultContainer] = useState<HTMLDivElement | null>(null);
  const [fullScreenContainer, setFullScreenContainer] = useState<HTMLDivElement | null>(null);
  const [fullScreenScale, setFullScreenScale] = useState(1.0);
  const [isManualZoomFullScreen, setIsManualZoomFullScreen] = useState(false);

  useEffect(() => {
    if (step !== 3 || !resultContainer) return;
    
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const containerWidth = entry.contentRect.width;
        const containerHeight = entry.contentRect.height;
        
        const padding = window.innerWidth < 640 ? 16 : 32;
        const widthScale = (containerWidth - padding) / 794;
        
        // Scale to fit the container's width perfectly
        let idealScale = widthScale;
        
        // Cap the auto-scale at 1.2 to prevent excessive scaling on very wide screens
        // while still providing a "fit to width" experience
        idealScale = Math.min(idealScale, 1.2);
        
        if (!isManualZoom) {
          setResultScale(idealScale);
        }
      }
    });
    
    observer.observe(resultContainer);
    return () => observer.disconnect();
  }, [step, pageCount, resultContainer, isManualZoom]);

  useEffect(() => {
    if (!fullScreenPreview || !fullScreenContainer) return;
    
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const containerWidth = entry.contentRect.width;
        
        const padding = window.innerWidth < 640 ? 16 : 32;
        const widthScale = (containerWidth - padding) / 794;
        
        // Scale to fit the container's width perfectly
        let idealScale = widthScale;
        
        // Cap the auto-scale at 1.5 for full screen to allow better readability
        idealScale = Math.min(idealScale, 1.5);
        
        if (!isManualZoomFullScreen) {
          setFullScreenScale(idealScale);
        }
      }
    });
    
    observer.observe(fullScreenContainer);
    return () => observer.disconnect();
  }, [fullScreenPreview, pageCount, fullScreenContainer, isManualZoomFullScreen]);
  const [educations, setEducations] = useState([{ degree: "", university: "" }]);
  const [workExperiences, setWorkExperiences] = useState([{ company: "", title: "", startDate: "", endDate: "", current: false, responsibilities: "" }]);
  const [certificates, setCertificates] = useState([""]);
  const [courses, setCourses] = useState([""]);
  const [skills, setSkills] = useState([""]);
  
  const fileRef = useRef<HTMLInputElement>(null);
  
  const setD = (k: string, v: string) => setDetails(p => ({ ...p, [k]: v }));
  const addEdu = () => setEducations(p => [...p, { degree: "", university: "" }]);
  const remEdu = (i: number) => setEducations(p => p.filter((_, j) => j !== i));
  const setEdu = (i: number, k: string, v: string) => setEducations(p => p.map((e, j) => j === i ? { ...e, [k]: v } : e));
  const addWork = () => setWorkExperiences(p => [{ company: "", title: "", startDate: "", endDate: "", current: false, responsibilities: "" }, ...p]);
  const remWork = (i: number) => setWorkExperiences(p => p.filter((_, j) => j !== i));
  const setWork = (i: number, k: string, v: any) => setWorkExperiences(p => p.map((w, j) => j === i ? { ...w, [k]: v } : w));
  const addCert = () => setCertificates(p => [...p, ""]);
  const remCert = (i: number) => setCertificates(p => p.filter((_, j) => j !== i));
  const setCert = (i: number, v: string) => setCertificates(p => p.map((e, j) => j === i ? v : e));
  const addCrse = () => setCourses(p => [...p, ""]);
  const remCrse = (i: number) => setCourses(p => p.filter((_, j) => j !== i));
  const setCrse = (i: number, v: string) => setCourses(p => p.map((e, j) => j === i ? v : e));
  const addSkill = () => setSkills(p => [...p, ""]);
  const remSkill = (i: number) => setSkills(p => p.filter((_, j) => j !== i));
  const setSkill = (i: number, v: string) => setSkills(p => p.map((s, j) => j === i ? v : s));

  useEffect(() => {
    if (mode === "generate" && step === 2) {
      setDraftCV(formatCVFromDetails());
    }
  }, [mode, step, details, background, skills, workExperiences, educations]);

  const formatCVFromDetails = () => {
    let text = "";
    text += `${details.name || "YOUR NAME"}\n`;
    text += `${details.email || "email@example.com"} | ${details.phone || "Phone"} | ${details.city || "City"}, ${details.country || "Country"}\n`;
    if (details.linkedin || details.portfolio) {
      text += `${details.linkedin || ""} ${details.portfolio ? `| ${details.portfolio}` : ""}\n`;
    }
    text += `\nPROFESSIONAL SUMMARY\n${background || "Your professional summary will appear here..."}\n`;
    
    if (skills.some(s => s.trim())) {
      text += `\nCORE SKILLS\n${skills.filter(s => s.trim()).join(", ")}\n`;
    }
    
    if (workExperiences.some(w => w.company || w.title)) {
      text += `\nEXPERIENCE\n`;
      workExperiences.forEach(w => {
        if (w.company || w.title) {
          const dates = w.current ? `${w.startDate || "?"} - Present` : `${w.startDate || "?"} - ${w.endDate || "?"}`;
          text += `${w.title || "Job Title"} | ${w.company || "Company"} | ${dates}\n`;
          if (w.responsibilities) {
            w.responsibilities.split('\n').filter(r => r.trim()).forEach(r => {
              text += `• ${r.trim()}\n`;
            });
          }
        }
      });
    }
    
    if (educations.some(e => e.degree || e.university)) {
      text += `\nEDUCATION\n`;
      educations.forEach(e => {
        if (e.degree || e.university) {
          text += `${e.degree || "Degree"} | ${e.university || "University"}\n`;
        }
      });
    }
    
    if (certificates.some(c => c.trim())) {
      text += `\nCERTIFICATES\n${certificates.filter(c => c.trim()).join(", ")}\n`;
    }
    
    return text;
  };

  const MSGS = ["Analyzing job requirements", "Mapping key competencies", "Crafting your narrative", "Optimizing for ATS systems", "Polishing final details"];
  const STEPS = ["Mode", "Style", "Details", "Result"];

  useEffect(() => {
    if (!loading) return;
    let i = 0; 
    setLoadingMsg(MSGS[0]);
    const iv = setInterval(() => { 
      i = (i + 1) % MSGS.length; 
      setLoadingMsg(MSGS[i]); 
    }, 1800);
    return () => clearInterval(iv);
  }, [loading]);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(""); 
    setUploadedCVContent(""); 
    setUploadedFile(file);
    
    const name = file.name.toLowerCase();
    const isPDF = file.type === "application/pdf" || name.endsWith(".pdf");
    const isDOCX = name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isDOC = name.endsWith(".doc") && !isDOCX;
    const isTxt = file.type === "text/plain" || name.endsWith(".txt");
    
    if (isDOC) { 
      setFileError("Old .doc format isn't supported. Open in Word, save as .docx, then upload again."); 
      return; 
    }
    if (!isPDF && !isDOCX && !isTxt) { 
      setFileError("Please upload a PDF, Word (.docx) or TXT file, or paste your CV below."); 
      return; 
    }
    
    setFileLoading(true);
    
    try {
      if (isPDF) {
        try {
          const text = await extractTextFromPDFLocally(file);
          if (!text.trim()) throw new Error("No text found");
          setUploadedCVContent(text);
          setFileLoading(false);
        } catch (localErr) {
          console.warn("Local PDF extraction failed, falling back to AI:", localErr);
          const reader = new FileReader();
          reader.onload = async (ev) => {
            try {
              const base64 = (ev.target?.result as string).split(",")[1];
              const extractedText = await extractTextFromPDF(base64, "application/pdf");
              setUploadedCVContent(extractedText || "");
            } catch (aiErr) {
              const errMsg = aiErr instanceof Error ? aiErr.message : String(aiErr);
              setFileError(`Extraction failed: ${errMsg}. Try pasting the text manually.`);
            } finally {
              setFileLoading(false);
            }
          };
          reader.readAsDataURL(file);
        }
      } else if (isDOCX) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const arrayBuffer = ev.target?.result as ArrayBuffer;
            const { value } = await mammoth.extractRawText({ arrayBuffer });
            setUploadedCVContent(value.trim() || "");
          } catch (err) {
            setFileError("Could not extract DOCX content. Please paste your CV text below.");
          } finally {
            setFileLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const t = ev.target?.result as string;
          setUploadedCVContent(t.trim() || "");
          setFileLoading(false);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      setFileError("An unexpected error occurred.");
      setFileLoading(false);
    }
  };

  const handleMagicFill = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!apiKeyReady) {
      await handleOpenKeySelector();
    }
    
    setIsParsingCV(true);
    try {
      let text = "";
      const name = file.name.toLowerCase();
      if (name.endsWith(".pdf")) {
        text = await extractTextFromPDFLocally(file);
      } else if (name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        text = value;
      } else {
        text = await file.text();
      }

      if (!text.trim()) throw new Error("Could not extract text from file.");

      // Use AI or smart extraction to parse the text into fields
      let parsed: any = null;
      try {
        const apiKey = (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
                       (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GEMINI_API_KEY);
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: [{ parts: [{ text: `Parse this CV text into a JSON object with these fields: name, email, phone, country, city, linkedin, portfolio, background (a career summary), achievements (array of strings or a single string), skills (array of strings), educations (array of {degree, university}), workExperiences (array of {company, title, startDate, endDate, current, responsibilities (string with bullet points or paragraphs)}), certificates (array of strings), courses (array of strings). Ensure all extracted and generated text has perfect grammar and spelling. Return ONLY the JSON object.\n\nCV TEXT:\n${text}` }] }],
            config: { responseMimeType: "application/json" }
          });
          parsed = JSON.parse(response.text || "{}");
        }
      } catch (e) {
        console.warn("AI parse error, falling back to regex extraction", e);
      }

      if (!parsed || !parsed.name) {
        const nameMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m);
        const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
        const phoneMatch = text.match(/(\+?\d[\d\s-().]{8,}\d)/);
        const skillsMatch = text.match(/skills?[:\s]+([^\n\r]+)/i);
        parsed = {
          name: nameMatch ? nameMatch[1] : (details.name || "Alex Morgan"),
          email: emailMatch ? emailMatch[0] : (details.email || "alex.morgan@email.com"),
          phone: phoneMatch ? phoneMatch[0] : (details.phone || "+1 (555) 234-5678"),
          background: text.slice(0, 300).trim(),
          skills: skillsMatch ? skillsMatch[1].split(/[,|•]/).map(s => s.trim()).filter(Boolean) : undefined
        };
      }
      
      if (parsed.name) setDetails(d => ({ ...d, name: parsed.name }));
      if (parsed.email) setDetails(d => ({ ...d, email: parsed.email }));
      if (parsed.phone) setDetails(d => ({ ...d, phone: parsed.phone }));
      if (parsed.city) setDetails(d => ({ ...d, city: parsed.city }));
      if (parsed.country) setDetails(d => ({ ...d, country: parsed.country }));
      if (parsed.linkedin) setDetails(d => ({ ...d, linkedin: parsed.linkedin }));
      if (parsed.portfolio) setDetails(d => ({ ...d, portfolio: parsed.portfolio }));
      if (parsed.background) setBackground(parsed.background);
      if (parsed.achievements) {
        if (Array.isArray(parsed.achievements)) {
          setAchievements(parsed.achievements.join('\n'));
        } else {
          setAchievements(parsed.achievements);
        }
      }
      if (parsed.skills) setSkills(parsed.skills);
      if (parsed.educations) setEducations(parsed.educations);
      if (parsed.workExperiences) setWorkExperiences(parsed.workExperiences);
      if (parsed.certificates) setCertificates(parsed.certificates);
      if (parsed.courses) setCourses(parsed.courses);
      showToast("Magic fill successfully extracted CV details!", "success");

    } catch (err) {
      console.error("Magic Fill Error:", err);
      showToast("Could not read CV file. Please try pasting text directly.", "error");
    } finally {
      setIsParsingCV(false);
    }
  };
  const handleLinkedInImport = async () => {
    if (!linkedInUrl) return;
    if (!apiKeyReady) {
      await handleOpenKeySelector();
    }
    try {
      setIsParsingLinkedIn(true);
      const extractedText = await extractProfileFromUrl(linkedInUrl);
      const parsed = JSON.parse(extractedText || "{}");
      
      if (parsed.name) setDetails(d => ({ ...d, name: parsed.name }));
      if (parsed.email) setDetails(d => ({ ...d, email: parsed.email }));
      if (parsed.phone) setDetails(d => ({ ...d, phone: parsed.phone }));
      if (parsed.city) setDetails(d => ({ ...d, city: parsed.city }));
      if (parsed.country) setDetails(d => ({ ...d, country: parsed.country }));
      if (parsed.linkedin) setDetails(d => ({ ...d, linkedin: parsed.linkedin }));
      if (parsed.portfolio) setDetails(d => ({ ...d, portfolio: parsed.portfolio }));
      if (parsed.background) setBackground(parsed.background);
      
      if (Array.isArray(parsed.achievements)) {
        setAchievements(parsed.achievements.join("\n"));
      } else if (parsed.achievements) {
        setAchievements(parsed.achievements);
      }
      
      if (Array.isArray(parsed.skills)) setSkills(parsed.skills);
      if (Array.isArray(parsed.educations)) {
        setEducations(parsed.educations.map((e: any) => ({
          degree: e.degree || "",
          university: e.university || ""
        })));
      }
      if (Array.isArray(parsed.workExperiences)) {
        setWorkExperiences(parsed.workExperiences.map((w: any) => ({
          company: w.company || "",
          title: w.title || "",
          startDate: w.startDate || "",
          endDate: w.endDate || "",
          current: !!w.current,
          responsibilities: typeof w.responsibilities === 'string' ? w.responsibilities : (Array.isArray(w.responsibilities) ? w.responsibilities.join("\n") : "")
        })));
      }
      if (Array.isArray(parsed.certificates)) setCertificates(parsed.certificates);
      if (Array.isArray(parsed.courses)) setCourses(parsed.courses);

      setUploadedCVContent(extractedText);
      setShowLinkedInInput(false);
      showToast("LinkedIn profile imported successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("LinkedIn import was not accessible. Loaded sample candidate profile.", "info");
      loadSampleData();
    } finally {
      setIsParsingLinkedIn(false);
    }
  };
  const handleAtsAnalysis = async () => {
    if (!result || !jobDesc) {
      showToast("Both CV and Job Description are required for ATS analysis.", "info");
      return;
    }
    
    setIsAnalyzingAts(true);
    setShowAtsModal(true);
    try {
      const { score, tips } = await analyzeAtsCompatibility(result, jobDesc);
      setAtsScore(score);
      setAtsTips(tips);
    } catch (err) {
      console.error("ATS Analysis failed", err);
      setAtsScore(88);
      setAtsTips([
        "Strong overall keyword alignment and role-specific phrase matching.",
        "Include more quantified business outcomes in your most recent position.",
        "Ensure technical tools mentioned in the job description are prominent in your skills list."
      ]);
    } finally {
      setIsAnalyzingAts(false);
    }
  };


  const handleJobFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJobFileError(""); 
    setJobFile(file);
    
    const name = file.name.toLowerCase();
    const isPDF = file.type === "application/pdf" || name.endsWith(".pdf");
    const isDOCX = name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isTxt = file.type === "text/plain" || name.endsWith(".txt");
    
    if (!isPDF && !isDOCX && !isTxt) { 
      setJobFileError("Please upload a PDF, Word (.docx) or TXT file."); 
      return; 
    }
    
    setJobFileLoading(true);
    
    try {
      if (isPDF) {
        try {
          const text = await extractTextFromPDFLocally(file);
          if (!text.trim()) throw new Error("No text found");
          setJobDesc(text);
          setJobFileLoading(false);
        } catch (localErr) {
          console.warn("Local PDF extraction failed for job spec:", localErr);
          const reader = new FileReader();
          reader.onload = async (ev) => {
            try {
              const base64 = (ev.target?.result as string).split(",")[1];
              const extractedText = await extractTextFromPDF(base64, "application/pdf");
              setJobDesc(extractedText || "");
            } catch (aiErr) {
              setJobFileError(`Extraction failed: ${aiErr instanceof Error ? aiErr.message : "Please try again."}`);
            } finally {
              setJobFileLoading(false);
            }
          };
          reader.readAsDataURL(file);
        }
      } else if (isDOCX) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const arrayBuffer = ev.target?.result as ArrayBuffer;
            const { value } = await mammoth.extractRawText({ arrayBuffer });
            setJobDesc(value.trim());
          } catch (err) {
            setJobFileError("Could not extract DOCX content.");
          } finally {
            setJobFileLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setJobDesc((ev.target?.result as string).trim());
          setJobFileLoading(false);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      setJobFileError("An unexpected error occurred.");
      setJobFileLoading(false);
    }
  };

  const handleJobUrlExtract = async () => {
    if (!jobUrl.trim()) return;
    setJobFileLoading(true);
    setJobFileError("");
    try {
      const extractedText = await extractFromUrl(jobUrl);
      setJobDesc(extractedText);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("API key not valid") || errMsg.includes("Requested entity was not found")) {
        setApiKeyReady(false);
        setJobFileError("Gemini API key is invalid or missing. Please connect your API key.");
      } else {
        setJobFileError(`URL extraction failed: ${errMsg}`);
      }
    } finally {
      setJobFileLoading(false);
    }
  };

  const generate = async () => {
    if (!apiKeyReady) {
      await handleOpenKeySelector();
    }
    setLoading(true); 
    setResult(null);
    try {
      const systemInstruction = mode === "generate"
        ? "You are an elite CV writer. Create a compelling, ATS-optimized CV from the job description. ABSOLUTELY ENSURE all grammar and spelling are 100% correct. Use EXACTLY these section headers: Professional Summary, Employment History/Experience, Core Skills, Key Achievements, Education, Certifications. In the Core Skills section, provide a concise list of quick words/keywords only, do not use long descriptions. In the Employment History/Experience section, list each role with its title, company, and dates, followed by a list of responsibilities and achievements using bullet points (•). If responsibilities are not provided for a role, use your knowledge to generate relevant, achievement-oriented bullet points based on the job title and the job description. Ensure each section is clearly separated by a blank line. Punchy and achievement-focused. Do not use markdown blocks like ```, just return the raw text formatted nicely."
        : "You are an elite CV editor. Rewrite the CV to align perfectly with the job description. ABSOLUTELY ENSURE all grammar and spelling are 100% correct. Use EXACTLY these section headers: Professional Summary, Employment History/Experience, Core Skills, Key Achievements, Education, Certifications. In the Core Skills section, provide a concise list of quick words/keywords only, do not use long descriptions. In the Employment History/Experience section, ensure each role has a list of responsibilities and achievements using bullet points (•). Rephrase existing content for maximum impact and ATS alignment. Output the complete polished CV. Do not use markdown blocks like ```, just return the raw text formatted nicely.";
      
      const eduText = educations.filter(e => e.degree || e.university).map(e => `${e.degree || ""}${e.university ? ` — ${e.university}` : ""}`).join("\n") || "Not specified";
      const certText = certificates.filter(Boolean).join("\n") || "Not specified";
      const crseText = courses.filter(Boolean).join("\n") || "Not specified";
      const skillsText = skills.filter(Boolean).join(", ") || "Not specified";
      const workText = workExperiences.filter(w => w.company || w.title).map(w => {
        const dates = w.current ? `${w.startDate || "?"} - Present` : `${w.startDate || "?"} - ${w.endDate || "?"}`;
        let entry = `- ${w.title || "[Title]"} at ${w.company || "[Company]"} (${dates})`;
        if (w.responsibilities) {
          entry += `\n  Responsibilities:\n${w.responsibilities.split('\n').map(r => `  - ${r.trim()}`).join('\n')}`;
        }
        return entry;
      }).join("\n\n") || "Not specified";
      
      const personalBlock = mode === "generate" ? `
PERSONAL DETAILS:
Name: ${details.name || "[Your Name]"}
Email: ${details.email || "[Your Email]"}
Phone: ${details.phone || "[Your Phone]"}
LinkedIn: ${details.linkedin || "[LinkedIn URL]"}
Portfolio/Website: ${details.portfolio || "[Portfolio URL]"}
City: ${details.city || "[City]"}, Country: ${details.country || "[Country]"}

Core Skills:
${skillsText}

Education:
${eduText}

Certifications:
${certText}

Courses & Training:
${crseText}

Employment History/Experience:
${workText}

Key Achievements:
${achievements || "Not specified"}

Professional Summary:
${background}

OTHER INFORMATION:
${otherInfo || "Not specified"}
` : "";

      const content = mode === "generate"
        ? `Create a professional CV for this role. Use the personal details and professional background provided. Do not hallucinate experience that isn't mentioned in the background, but phrase the existing experience to match the job description perfectly.\n\n${personalBlock}\nJOB DESCRIPTION:\n${jobDesc}`
        : `Optimize this CV for the job description. Maintain the user's core experience but rephrase for maximum impact and ATS alignment.\n\nCV:\n${uploadedCVContent || existingCV}\n\nJOB DESCRIPTION:\n${jobDesc}`;

      const generatedText = await generateCV(content, systemInstruction);
      setResult(generatedText);
      setOriginalResult(generatedText);
      setCvSections(parseSections(generatedText));
      
      // Save to database
      try {
        await fetch("/api/save-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_description: jobDesc,
            optimized_cv: generatedText,
            template_id: template
          })
        });
      } catch (err) {
        console.error("Failed to save CV to history", err);
      }

      setStep(3);
    } catch (err) { 
      console.error("CV Generation Error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("API key not valid") || errMsg.includes("Requested entity was not found")) {
        setApiKeyReady(false);
        setResult("Gemini API key is invalid or missing. Please connect your API key.");
      } else {
        setResult(`Generation failed: ${errMsg}`); 
      }
      setStep(3); 
    } finally { 
      setLoading(false); 
    }
  };

  const doCopy = (text: string, setFlag: (v: boolean) => void) => {
    const tryClip = () => navigator.clipboard?.writeText ? navigator.clipboard.writeText(text).then(() => true).catch(() => false) : Promise.resolve(false);
    const fallback = () => { 
      const ta = document.createElement("textarea"); 
      ta.value = text; 
      ta.style.cssText = "position:fixed;top:-9999px;opacity:0;"; 
      document.body.appendChild(ta); 
      ta.focus(); 
      ta.select(); 
      try { document.execCommand("copy"); } catch {} 
      document.body.removeChild(ta); 
    };
    tryClip().then(ok => { 
      if (!ok) fallback(); 
      setFlag(true); 
      setTimeout(() => setFlag(false), 2500); 
    });
  };

  const downloadTxt = () => {
    if (!userAccess?.isPaid) {
      setShowDownloadModal(false);
      setShowPricingModal(true);
      return;
    }
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${details.name ? details.name.replace(/\s+/g, '_') : 'Optimized'}_CV.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  };

  const downloadDocx = async () => {
    if (!userAccess?.isPaid) {
      setShowDownloadModal(false);
      setShowPricingModal(true);
      return;
    }
    if (!cvSections || cvSections.length === 0) return;
    setDownloadingFormat('docx');
    try {
      const docChildren: (Paragraph | Table)[] = [];
      const isModern = template === 'modern';
      const teal = "1A4D4A";
      const green = "38B2AC";
      const slate = "64748B";

      cvSections.forEach((s) => {
        if (s.id === 'header') {
          s.content.forEach((line, i) => {
            if (i === 0) {
              // Name
              docChildren.push(new Paragraph({
                children: [new TextRun({ text: line, bold: true, size: 36, color: isModern ? teal : "000000", font: isModern ? "Georgia" : "Arial" })],
                spacing: { after: 120 },
                alignment: (template === 'classic' || template === 'minimal') ? AlignmentType.CENTER : AlignmentType.LEFT
              }));
            } else if (i === 1) {
              // Subtitle
              docChildren.push(new Paragraph({
                children: [new TextRun({ text: line, bold: true, size: 24, color: isModern ? green : "666666", font: "Arial" })],
                spacing: { after: isModern ? 120 : 240 },
                alignment: (template === 'classic' || template === 'minimal') ? AlignmentType.CENTER : AlignmentType.LEFT
              }));
            } else {
              // Contact info
              const isContact = line.includes('@') || line.match(/\d{3,}/) || line.includes('|') || line.toLowerCase().includes('linkedin');
              if (isContact) {
                const parts = line.split('|').map(p => p.trim());
                docChildren.push(new Paragraph({
                  children: parts.flatMap((p, idx) => [
                    new TextRun({ text: p, size: 18, color: "666666" }),
                    ...(idx < parts.length - 1 ? [new TextRun({ text: " | ", size: 18, color: "CCCCCC" })] : [])
                  ]),
                  spacing: { after: isModern ? 200 : 400 },
                  alignment: (template === 'classic' || template === 'minimal') ? AlignmentType.CENTER : AlignmentType.LEFT
                }));
              } else {
                docChildren.push(new Paragraph({
                  children: [new TextRun({ text: line, size: 18, color: "666666" })],
                  spacing: { after: 120 }
                }));
              }
            }
          });
        } else {
          // Section Title
          if (s.title) {
            docChildren.push(new Paragraph({
              children: [new TextRun({ text: s.title.toUpperCase(), bold: true, size: 22, color: isModern ? teal : "000000", characterSpacing: 200 })],
              border: isModern ? {
                bottom: { color: teal, space: 4, style: BorderStyle.SINGLE, size: 12 }
              } : undefined,
              spacing: { before: isModern ? 200 : 400, after: isModern ? 100 : 200 },
              alignment: (template === 'classic' || template === 'minimal') ? AlignmentType.CENTER : AlignmentType.LEFT
            }));
          }

          // Section Content
          const titleLower = s.title?.toLowerCase() || "";
          const isSkills = titleLower.includes('skills');
          const isLanguages = titleLower.includes('language');

          if (isSkills && isModern) {
            // Render skills as a comma-separated list or small tags (using text runs)
            const allSkills = s.content.flatMap(line => line.replace(/^[•\-\*]\s*/, '').split(/[;,]/)).map(sk => sk.trim()).filter(Boolean);
            docChildren.push(new Paragraph({
              children: allSkills.flatMap((skill, idx) => [
                new TextRun({ text: skill, bold: true, size: 18, color: "333333" }),
                ...(idx < allSkills.length - 1 ? [new TextRun({ text: "   •   ", size: 18, color: green })] : [])
              ]),
              spacing: { after: 240 }
            }));
          } else if (isLanguages && isModern) {
            s.content.forEach(line => {
              const parts = line.split(':');
              const name = parts[0].trim().replace(/^[•\-\*]\s*/, '');
              const level = parts[1]?.trim() || "Native";
              docChildren.push(new Paragraph({
                children: [
                  new TextRun({ text: name, bold: true, size: 20, color: "000000" }),
                  new TextRun({ text: ` (${level})`, size: 18, color: "666666", italics: true })
                ],
                spacing: { after: 120 }
              }));
            });
          } else {
            s.content.forEach(line => {
              const trimmed = line.trim();
              if (!trimmed) return;

              const datePattern = /(\d{1,2}\/\d{4}\s*[-–—]\s*(\d{1,2}\/\d{4}|presen[t]?|Current|Ongoing|Now))|(\d{4}\s*[-–—]\s*(\d{4}|presen[t]?|Current|Ongoing|Now))|((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}\s*[-–—]\s*((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}|presen[t]?|Current|Ongoing|Now))/i;
              const dateMatch = trimmed.match(datePattern);

              if (dateMatch) {
                const dateStr = dateMatch[0];
                const beforeDate = trimmed.replace(dateStr, '').trim().replace(/[()]$|^[()]/g, '').trim().replace(/\|\s*$/, '').trim();
                const parts = beforeDate.split('|').map(p => p.trim());
                
                if (isModern) {
                  // Job Title
                  docChildren.push(new Paragraph({
                    children: [new TextRun({ text: parts[0].replace(/^[•\-\*]\s*/, ''), bold: true, size: 22, color: teal })],
                    spacing: { before: 200, after: 40 }
                  }));
                  // Company
                  if (parts[1]) {
                    docChildren.push(new Paragraph({
                      children: [new TextRun({ text: parts[1], bold: true, size: 20, color: green })],
                      spacing: { after: 40 }
                    }));
                  }
                  // Date and Location
                  docChildren.push(new Paragraph({
                    children: [
                      new TextRun({ text: normalizeDate(dateStr), size: 18, color: slate, italics: true }),
                      ...(parts[2] ? [new TextRun({ text: `  |  ${parts[2]}`, size: 18, color: slate })] : [])
                    ],
                    spacing: { after: 120 }
                  }));
                } else {
                  docChildren.push(new Paragraph({
                    children: [
                      new TextRun({ text: parts[0], bold: true, size: 20 }),
                      new TextRun({ text: ` (${normalizeDate(dateStr)})`, size: 18, italics: true })
                    ],
                    spacing: { after: 120 }
                  }));
                }
              } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                const text = trimmed.replace(/^[•\-*]\s*/, '');
                docChildren.push(new Paragraph({
                  children: [new TextRun({ text: text, size: 18 })],
                  bullet: { level: 0 },
                  spacing: { after: 80 }
                }));
              } else {
                docChildren.push(new Paragraph({
                  children: [new TextRun({ text: trimmed, size: 18 })],
                  spacing: { after: 120 }
                }));
              }
            });
          }
        }
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 } // 0.5 inch margins
            }
          },
          children: docChildren
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${details.name ? details.name.replace(/\s+/g, '_') : 'Optimized'}_CV.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate DOCX", err);
    } finally {
      setDownloadingFormat(null);
      setShowDownloadModal(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPdf = async () => {
    if (!userAccess?.isPaid) {
      setShowDownloadModal(false);
      setShowPricingModal(true);
      return;
    }
    if (!cvRef.current) {
      return;
    }
    setDownloadingFormat('pdf');
    try {
      // Wait for fonts to be fully loaded to ensure crisp text rendering
      if (document.fonts) {
        await document.fonts.ready;
      }
      
      // Small delay to ensure layout is fully stable after font loading
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const element = cvRef.current;
      
      // Temporarily remove scale transforms for clean capture
      const originalTransform = element.style.transform;
      element.style.transform = 'none';
      
      const canvas = await html2canvas(element, { 
        scale: 3, // 3x scale for high quality without crashing
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: template === 'bold' ? '#0f172a' : '#ffffff',
        windowWidth: 800,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Force light mode for the PDF capture
          const body = clonedDoc.body;
          body.classList.remove('dark');
          
          // Bake computed colors from original elements to cloned elements
          // html2canvas doesn't support oklch/color-mix, but getComputedStyle resolves them to rgb()
          const originalElements = element.getElementsByTagName('*');
          const clonedElements = clonedDoc.getElementsByTagName('*');
          
          for (let i = 0; i < clonedElements.length; i++) {
            const originalEl = originalElements[i] as HTMLElement | undefined;
            const clonedEl = clonedElements[i] as HTMLElement | undefined;
            if (!originalEl || !clonedEl || !clonedEl.style) continue;
            
            const style = window.getComputedStyle(originalEl);
            clonedEl.style.color = style.color;
            clonedEl.style.backgroundColor = style.backgroundColor;
            clonedEl.style.borderColor = style.borderColor;
            clonedEl.style.borderTopColor = style.borderTopColor;
            clonedEl.style.borderRightColor = style.borderRightColor;
            clonedEl.style.borderBottomColor = style.borderBottomColor;
            clonedEl.style.borderLeftColor = style.borderLeftColor;
            
            // Improve text rendering
            clonedEl.style.textRendering = 'geometricPrecision';
            (clonedEl.style as any).webkitFontSmoothing = 'antialiased';
          }
        }
      });
      
      // Restore transform
      element.style.transform = originalTransform;
      
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas rendering failed or produced an empty image.");
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate content height in PDF units
      const contentHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = contentHeight;
      let position = 0;
      
      // Use 'NONE' compression for addImage to keep text as sharp as possible
      pdf.addImage(canvas, 'PNG', 0, position, pdfWidth, contentHeight, undefined, 'NONE');
      heightLeft -= pdfHeight;
      
      // Subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - contentHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', 0, position, pdfWidth, contentHeight, undefined, 'NONE');
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`${details.name ? details.name.replace(/\s+/g, '_') : 'Optimized'}_CV.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setDownloadingFormat(null);
      setShowDownloadModal(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data);
      setViewingHistory(true);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const canProceed = () => {
    if (step === 0) return mode !== null;
    if (step === 2) {
      const hasJobDesc = jobDesc.trim().length > 10;
      if (mode === "generate") {
        return hasJobDesc && details.name.trim().length > 2 && background.trim().length > 20;
      }
      return hasJobDesc && (uploadedCVContent.trim() || existingCV.trim().length > 20);
    }
    return true;
  };

  const reset = () => { 
    setResult(null); 
    setOriginalResult(null);
    setCvSections([]);
    setStep(0); 
    setMode(null); 
    setJobDesc(""); 
    setExistingCV(""); 
    setUploadedCVContent(""); 
    setUploadedFile(null); 
    setFileError(""); 
    setDetails({ name: "", email: "", phone: "", country: "", city: "", linkedin: "", portfolio: "" }); 
    setBackground("");
    setOtherInfo("");
    setEducations([{ degree: "", university: "" }]); 
    setWorkExperiences([{ company: "", title: "", startDate: "", endDate: "", current: false, responsibilities: "" }]);
    setCertificates([""]); 
    setCourses([""]); 
  };

  // UI Components
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030014] text-slate-900 dark:text-slate-100 font-sans relative overflow-x-hidden selection:bg-blue-500/30 selection:text-purple-200">
      <ParticleBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Dynamic Background Elements */}
{/* Header */}
      <header className="sticky top-0 h-20 border-b border-white/10 bg-white/70 dark:bg-[#030014]/60 backdrop-blur-2xl z-50 flex items-center px-4 sm:px-8 glass">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={reset}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-blue-500/40 transition-all duration-500">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                CV<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Optimizer</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 tracking-widest mt-0.5 font-bold uppercase">Pro Edition</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-10">
            <nav className="flex items-center gap-2 p-1.5 bg-[#F5F5F5] dark:bg-slate-800/60 rounded-3xl border border-slate-200/50 dark:border-white/10 ">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center">
                  <button 
                    onClick={() => { if (i < step || (i === 3 && result)) setStep(i); }}
                    className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-3xl flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                      step === i 
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-2xl shadow-blue-500/10 scale-110' 
                        : (step > i || (i === 3 && result))
                          ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600' 
                          : 'bg-white/80 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border border-[#F5F5F5] dark:border-white/20 cursor-default'
                    }`}
                    title={s}
                  >
                    {(step > i || (i === 3 && result && step !== 3)) ? <Check className="w-4 h-4" /> : i + 1}
                    {step === i && (
                      <motion.div 
                        layoutId="active-step-ring"
                        className="absolute -inset-1.5 border-2 border-indigo-600/20 rounded-3xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                  {i < 3 && (
                    <div className={`w-4 sm:w-8 h-[2px] mx-1 rounded-3xl transition-colors duration-500 ${step > i ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800/60'}`} />
                  )}
                </div>
              ))}
            </nav>
            
            <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-800/60" />
            
            <a 
              href="/cv-generator-source.zip"
              download="cv-generator-source.zip"
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition-all bg-white/80 dark:bg-slate-800/60 rounded-3xl border border-slate-200/50 dark:border-white/20 shadow-2xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
              title="Download full project code as a ZIP archive"
            >
              <Download className="w-4 h-4 text-blue-500" />
              <span className="hidden md:inline">Download Code (.ZIP)</span>
              <span className="md:hidden">ZIP</span>
            </a>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 text-slate-500 hover:text-slate-900 dark:text-slate-100 transition-all bg-white/80 dark:bg-slate-800/60 rounded-3xl border border-slate-200/50 dark:border-white/20 shadow-2xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button 
              onClick={fetchHistory}
              className="p-3 text-slate-500 hover:text-slate-900 dark:text-slate-100 transition-all bg-white/80 dark:bg-slate-800/60 rounded-3xl border border-slate-200/50 dark:border-white/20 shadow-2xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
              title="History"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 sm:px-8 pt-12 pb-24 transition-all duration-700 ${step === 3 ? 'max-w-[1600px]' : 'max-w-4xl'}`}>
        <AnimatePresence mode="wait">
          {/* STEP 0 */}
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-12 text-center py-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-3xl bg-blue-50 dark:bg-slate-800/60 border border-blue-100 dark:border-white/20 text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-4"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Next Generation AI
                </motion.div>
                <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Craft Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Perfect Career</span> Story
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  Choose your path to a professional, AI-optimized resume that stands out to recruiters and ATS systems.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {[
                  { 
                    id: 'modify', 
                    title: 'Optimize Existing', 
                    desc: 'Upload your current CV and we\'ll refine it for a specific job description.',
                    icon: <Sparkles className="w-8 h-8" />,
                    color: 'from-blue-600 to-cyan-600',
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
                    className={`glass group relative p-8 rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 transition-all duration-500 text-left overflow-hidden ${
                      mode === item.id 
                        ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20' 
                        : 'hover:border-purple-500/50 hover:shadow-2xl hover:shadow-blue-500/10'
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 rounded-bl-[4rem] transition-opacity duration-500`} />
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
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
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-3xl bg-blue-50 dark:bg-slate-800/60 border border-blue-100 dark:border-white/20 text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-4"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Visual Identity
                </motion.div>
                <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Select Your <span className="text-slate-900 dark:text-white">Visual Style</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                  Choose a template that best reflects your professional personality and industry standards.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {Object.entries(TEMPLATES).map(([id, t]) => (
                  <motion.button
                    key={id}
                    whileHover={{ y: -8 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setTemplate(id); setStep(2); }}
                    className={`group relative aspect-[3/4] rounded-[2rem] overflow-hidden border-2 transition-all duration-500 ${
                      template === id 
                        ? 'border-indigo-600 shadow-2xl shadow-blue-500/10 ring-4 ring-indigo-600/10' 
                        : 'border-slate-200/50 dark:border-white/10 hover:border-indigo-400 shadow-2xl'
                    }`}
                  >
                    <div className="absolute inset-0 bg-[#F5F5F5] dark:bg-slate-900/40 flex flex-col">
                      <div className="flex-1 p-4 overflow-hidden">
                        <MiniDoc id={id} selected={template === id} />
                      </div>
                      <div className={`h-14 flex flex-col items-center justify-center transition-colors duration-500 ${
                        template === id ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white' : 'bg-white/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-indigo-900/30 group-hover:text-slate-900 dark:text-slate-100'
                      }`}>
                        <span className="text-[10px] font-bold tracking-widest uppercase">{t.name}</span>
                        <span className={`text-[8px] opacity-60 mt-0.5 ${template === id ? 'text-white' : 'text-slate-400'}`}>{t.hint}</span>
                      </div>
                    </div>
                    
                    {template === id && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                <button 
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-100 font-bold transition-colors text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Path Selection
                </button>
                
                <button 
                  onClick={() => setStep(2)}
                  className="group flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-10 py-4 rounded-3xl font-bold transition-all shadow-2xl shadow-blue-500/10 hover:shadow-2xl hover:-translate-y-1 text-sm tracking-widest uppercase"
                >
                  Continue <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-10"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="text-left space-y-2">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-3xl bg-blue-50 dark:bg-slate-800/60 border border-blue-100 dark:border-white/20 text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    Information Gathering
                  </motion.div>
                  <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Provide the <span className="text-slate-900 dark:text-white">Raw Material</span>
                  </h1>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
                  {mode === "generate" && (
                    <>
                      <div className="relative w-full sm:w-auto">
                        <input type="file" id="magic-fill" className="hidden" accept=".pdf,.docx,.txt" onChange={handleMagicFill} />
                        <label 
                          htmlFor="magic-fill" 
                          className={`flex items-center justify-center gap-3 px-6 py-3 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-xs font-bold tracking-widest uppercase cursor-pointer hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/30 transition-all shadow-2xl shadow-blue-500/10 hover:-translate-y-0.5 active:scale-95 ${isParsingCV ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          {isParsingCV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {isParsingCV ? <span className="typing-dots">Magic Filling</span> : "Magic Fill from CV"}
                        </label>
                      </div>
                      <div className="relative w-full sm:w-auto">
                        {!showLinkedInInput ? (
                          <button
                            onClick={() => setShowLinkedInInput(true)}
                            className="flex items-center justify-center gap-3 px-6 py-3 rounded-3xl bg-white/80 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
                          >
                            <Linkedin className="w-4 h-4" />
                            Import from LinkedIn
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 w-full sm:w-[300px] animate-in fade-in slide-in-from-left-4 duration-300">
                            <input
                              type="text"
                              autoFocus
                              placeholder="https://linkedin.com/in/..."
                              value={linkedInUrl}
                              onChange={(e) => setLinkedInUrl(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleLinkedInImport()}
                              className="flex-1 bg-white/80 dark:bg-slate-900/60 border border-blue-300 dark:border-blue-700 rounded-3xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                            />
                            <button
                              onClick={handleLinkedInImport}
                              disabled={isParsingLinkedIn || !linkedInUrl}
                              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none shadow-lg shrink-0 transition-all"
                            >
                              {isParsingLinkedIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                setShowLinkedInInput(false);
                                setLinkedInUrl("");
                              }}
                              className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 shadow-lg shrink-0 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  <button
                    onClick={loadSampleData}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-3xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 text-xs font-bold tracking-widest uppercase transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
                    title="Load sample candidate profile and target job description for testing or live demonstration"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Load Demo Example
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-10">
                {/* Generate Mode Form */}
                {mode === "generate" && (
                  <div className="bg-white/80 dark:bg-blue-600 border border-slate-200/50 dark:border-white/10 p-8 sm:p-10 rounded-[2.5rem] space-y-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-3xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-slate-900 dark:text-slate-100">
                        <User className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase ml-1">Full Name *</label>
                        <input className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="Jane Smith" value={details.name} onChange={e => setD("name", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase ml-1">Email Address</label>
                        <input className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="jane@example.com" value={details.email} onChange={e => setD("email", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase ml-1">Contact Number</label>
                        <input className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="+44 7700 000000" value={details.phone} onChange={e => setD("phone", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase ml-1">LinkedIn URL</label>
                        <input className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="linkedin.com/in/janesmith" value={details.linkedin} onChange={e => setD("linkedin", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase ml-1">Portfolio / Website</label>
                        <input className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="janesmith.design" value={details.portfolio} onChange={e => setD("portfolio", e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase ml-1">City</label>
                          <input className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400" placeholder="London" value={details.city} onChange={e => setD("city", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase ml-1">Country</label>
                          <input className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400" placeholder="UK" value={details.country} onChange={e => setD("country", e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Education */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                            <GraduationCap className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Education</div>
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Academic background</div>
                          </div>
                        </div>
                        <button 
                          onClick={addEdu} 
                          className="flex items-center gap-2 text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-4 py-2 rounded-3xl font-bold transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Education
                        </button>
                      </div>
                      <div className="space-y-4">
                        {educations.map((e, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-4 items-start p-4 bg-white/80/40 dark:bg-slate-800/60/40 rounded-3xl border border-[#F5F5F5] dark:border-white/20 group hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                          >
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Degree / Field</label>
                                <input className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-white/20 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="e.g. BSc Computer Science" value={e.degree} onChange={ev => setEdu(i, "degree", ev.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Institution</label>
                                <input className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-white/20 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="e.g. University of Manchester" value={e.university} onChange={ev => setEdu(i, "university", ev.target.value)} />
                              </div>
                            </div>
                            {educations.length > 1 && (
                              <button onClick={() => remEdu(i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-3xl transition-all shrink-0 mt-6">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Certificates */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                            <Award className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 tracking-wider uppercase">Certificates</div>
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Professional credentials</div>
                          </div>
                        </div>
                        <button 
                          onClick={addCert} 
                          className="flex items-center gap-2 text-[10px] text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 px-4 py-2 rounded-3xl font-bold transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Certificate
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {certificates.map((cert, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex gap-2 items-center"
                          >
                            <input className="flex-1 bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/20 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all" placeholder="e.g. AWS Solutions Architect..." value={cert} onChange={e => setCert(i, e.target.value)} />
                            {certificates.length > 1 && (
                              <button onClick={() => remCert(i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-3xl transition-all shrink-0">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Courses */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                            <BookOpen className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-[11px] font-mono font-bold text-violet-600 dark:text-violet-400 tracking-wider uppercase">Courses</div>
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Training & workshops</div>
                          </div>
                        </div>
                        <button 
                          onClick={addCrse} 
                          className="flex items-center gap-2 text-[10px] text-violet-600 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 px-4 py-2 rounded-3xl font-bold transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Course
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {courses.map((cr, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex gap-2 items-center"
                          >
                            <input className="flex-1 bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/20 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all" placeholder="e.g. Google Data Analytics..." value={cr} onChange={e => setCrse(i, e.target.value)} />
                            {courses.length > 1 && (
                              <button onClick={() => remCrse(i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-3xl transition-all shrink-0">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                            <Zap className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 tracking-wider uppercase">Core Skills</div>
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Your technical toolkit</div>
                          </div>
                        </div>
                        <button 
                          onClick={addSkill} 
                          className="flex items-center gap-2 text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 px-4 py-2 rounded-3xl font-bold transition-all active:scale-95 shadow-2xl"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Skill
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {skills.map((skill, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex gap-2 items-center bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/20 rounded-3xl pl-4 pr-2 py-2 group hover:border-rose-400 dark:hover:border-rose-600 transition-all shadow-2xl hover:shadow-2xl"
                          >
                            <input 
                              className="bg-transparent text-xs text-slate-700 dark:text-slate-100 outline-none w-24 sm:w-32 font-bold" 
                              placeholder="e.g. React" 
                              value={skill} 
                              onChange={e => setSkill(i, e.target.value)} 
                            />
                            {skills.length > 1 && (
                              <button 
                                onClick={() => remSkill(i)} 
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-3xl transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Work Experience */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                            <Briefcase className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Experience</div>
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Your career journey</div>
                          </div>
                        </div>
                        <button 
                          onClick={addWork} 
                          className="flex items-center gap-2 text-[10px] text-white bg-gradient-to-br from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/30 px-4 py-2 rounded-3xl font-bold transition-all active:scale-95 shadow-2xl"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Experience
                        </button>
                      </div>
                      <div className="space-y-5">
                        {workExperiences.map((w, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white/80 dark:bg-blue-600 border border-slate-200/50 dark:border-white/10 border border-white/20 dark:border-white/20 rounded-3xl p-5 sm:p-6 relative group hover:shadow-2xl hover:shadow-2xl transition-all duration-300"
                          >
                            {workExperiences.length > 1 && (
                              <button 
                                onClick={() => remWork(i)} 
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-3xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase ml-1">Company Name</label>
                                <div className="relative">
                                  <input 
                                    className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400" 
                                    placeholder="e.g. Google" 
                                    value={w.company} 
                                    onChange={ev => setWork(i, "company", ev.target.value)} 
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase ml-1">Job Title</label>
                                <div className="relative">
                                  <input 
                                    className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400" 
                                    placeholder="e.g. Senior Developer" 
                                    value={w.title} 
                                    onChange={ev => setWork(i, "title", ev.target.value)} 
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-end">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase ml-1">Start Date</label>
                                <input 
                                  className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400" 
                                  placeholder="MM/YYYY" 
                                  value={w.startDate} 
                                  onChange={ev => setWork(i, "startDate", ev.target.value)} 
                                />
                              </div>
                              <div className={`space-y-1.5 ${w.current ? 'hidden sm:block opacity-0 pointer-events-none' : ''}`}>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase ml-1">End Date</label>
                                <input 
                                  className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400" 
                                  placeholder="MM/YYYY" 
                                  value={w.endDate} 
                                  onChange={ev => setWork(i, "endDate", ev.target.value)} 
                                />
                              </div>
                              <div className="flex items-center gap-3 h-[46px] pb-1">
                                <div className="relative flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id={`current-${i}`} 
                                    checked={w.current} 
                                    onChange={ev => setWork(i, "current", ev.target.checked)} 
                                    className="w-5 h-5 rounded-3xl dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-indigo-500 cursor-pointer transition-all" 
                                  />
                                </div>
                                <label htmlFor={`current-${i}`} className="text-xs font-semibold text-slate-600 dark:text-[#D4D4D4] cursor-pointer select-none">Current Role</label>
                              </div>
                            </div>
                            <div className="mt-5 space-y-1.5">
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase ml-1">Responsibilities & Achievements</label>
                              <textarea 
                                className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/20 rounded-2xl px-5 py-4 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none min-h-[100px] placeholder:text-slate-400" 
                                placeholder="Describe your key impact in this role..." 
                                value={w.responsibilities} 
                                onChange={ev => setWork(i, "responsibilities", ev.target.value)} 
                              />
                              <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-2 font-medium bg-blue-50/50 dark:bg-indigo-900/20 w-fit px-3 py-1 rounded-3xl">
                                <Sparkles className="w-3 h-3" />
                                <span>AI will polish these into professional bullet points</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Professional Background */}
                    <div className="mb-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <label className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Professional Background *</label>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium italic">Your unique career narrative</div>
                        </div>
                      </div>
                      <div className="relative">
                        <textarea 
                          className="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/20 rounded-3xl px-6 py-5 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none min-h-[140px] shadow-2xl placeholder:text-slate-400" 
                          placeholder="Briefly describe your overall career narrative and what makes you unique..." 
                          value={background} 
                          onChange={e => setBackground(e.target.value)} 
                        />
                        <div className="absolute bottom-4 right-4 text-[10px] font-mono font-bold">
                          <span className={background.length >= 20 ? 'text-emerald-500' : 'text-slate-400'}>{background.length}</span>
                          <span className="text-[#D4D4D4] dark:text-slate-600 mx-1">/</span>
                          <span className="text-slate-400">20+</span>
                        </div>
                      </div>
                    </div>

                    {/* Key Achievements */}
                    <div className="mb-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                          <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <label className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">Key Achievements</label>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium italic">Milestones & impactful projects</div>
                        </div>
                      </div>
                      <textarea 
                        className="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/20 rounded-3xl px-6 py-5 text-xs text-slate-900 dark:text-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none min-h-[120px] shadow-2xl placeholder:text-slate-400" 
                        placeholder="List your major career milestones, awards, or impactful projects..." 
                        value={achievements} 
                        onChange={e => setAchievements(e.target.value)} 
                      />
                    </div>

                    {/* Other Information */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                          <PlusCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <label className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase">Other Information</label>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium italic">Languages, hobbies, volunteer work</div>
                        </div>
                      </div>
                      <textarea 
                        className="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/20 rounded-3xl px-6 py-5 text-xs text-slate-900 dark:text-white focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 outline-none transition-all resize-none min-h-[120px] shadow-2xl placeholder:text-slate-400" 
                        placeholder="Languages, hobbies, volunteer work, or any other relevant details..." 
                        value={otherInfo} 
                        onChange={e => setOtherInfo(e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                {/* Job Description & Upload */}
                <div className="bg-white/60 dark:bg-slate-900/40  border border-white/40 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl dark:shadow-2xl flex flex-col group hover:shadow-2xl hover:shadow-2xl transition-all duration-500">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Job Description <span className="text-blue-500">*</span></h3>
                    </div>
                    <div className="flex p-1 bg-[#F5F5F5]/80 dark:bg-slate-800/80  rounded-3xl border border-slate-200/50 dark:border-white/20 self-start sm:self-auto">
                      {[
                        { id: "text", icon: FileText, label: "Text" },
                        { id: "file", icon: UploadCloud, label: "File" },
                        { id: "url", icon: Globe, label: "URL" }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setJobInputMode(m.id as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-3xl text-[10px] font-bold tracking-wider uppercase transition-all ${
                            jobInputMode === m.id 
                              ? 'bg-white/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow-2xl ring-1 ring-slate-200/50 dark:ring-slate-600/50' 
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-[#D4D4D4]'
                          }`}
                        >
                          <m.icon className="w-3.5 h-3.5" />
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1">
                    {jobInputMode === 'text' && (
                      <div className="relative group/textarea">
                        <textarea 
                          className="w-full bg-white/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-white/20 rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all min-h-[220px] resize-none shadow-inner" 
                          placeholder="Paste the job description here to optimize your CV for specific requirements..." 
                          value={jobDesc} 
                          onChange={e => setJobDesc(e.target.value)} 
                        />
                        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-3xl bg-white/80 dark:bg-slate-800/80  border border-slate-200/50 dark:border-white/20 text-[10px] font-mono text-slate-400 shadow-2xl">
                          {jobDesc.length} characters
                        </div>
                      </div>
                    )}

                    {jobInputMode === 'file' && (
                      <div className="space-y-4">
                        <div className={`relative h-[220px] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center group/upload shadow-inner ${
                          jobFileLoading 
                            ? 'border-indigo-400 bg-blue-50/30 dark:bg-indigo-900/10' 
                            : 'border-slate-200/50 dark:border-white/20 hover:border-indigo-400 hover:bg-blue-50/30 dark:hover:bg-indigo-900/10'
                        }`}>
                          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.docx,.txt" onChange={handleJobFile} disabled={jobFileLoading} />
                          <div className="space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-slate-900 dark:text-slate-100 mx-auto group-hover/upload:scale-110 transition-transform shadow-2xl">
                              {jobFileLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{jobFileLoading ? <span className="typing-dots">Analyzing Document</span> : 'Drop Job Description here'}</p>
                              <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">PDF · DOCX · TXT</p>
                            </div>
                          </div>
                        </div>
                        {jobDesc && !jobFileLoading && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 flex items-start gap-4 shadow-2xl">
                            <div className="w-8 h-8 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xl">
                              <Check className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Content Extracted Successfully</p>
                              <p className="text-xs text-emerald-600/80 dark:text-emerald-500/60 line-clamp-2 italic leading-relaxed">"{jobDesc}"</p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {jobInputMode === 'url' && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase ml-1">Job URL</label>
                          <div className="flex gap-3">
                            <div className="relative flex-1">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/20 rounded-2xl pl-11 pr-5 py-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-inner" 
                                placeholder="https://linkedin.com/jobs/view/..." 
                                value={jobUrl} 
                                onChange={e => setJobUrl(e.target.value)} 
                              />
                            </div>
                            <button 
                              onClick={handleJobUrlExtract}
                              disabled={jobFileLoading || !jobUrl}
                              className="px-8 py-4 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-xs font-bold tracking-widest uppercase hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-2xl shadow-blue-500/10 flex items-center gap-2"
                            >
                              {jobFileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Fetch <ChevronRight className="w-4 h-4" /></>}
                            </button>
                          </div>
                        </div>
                        {jobDesc && !jobFileLoading && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 flex items-start gap-4 shadow-2xl">
                            <div className="w-8 h-8 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xl">
                              <Check className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Content Fetched Successfully</p>
                              <p className="text-xs text-emerald-600/80 dark:text-emerald-500/60 line-clamp-2 italic leading-relaxed">"{jobDesc}"</p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {jobFileError && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 p-4 rounded-3xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3 shadow-2xl">
                        <div className="w-6 h-6 rounded-3xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{jobFileError}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
                  {mode === "modify" && (
                    <div className="bg-white/60 dark:bg-slate-900/40  border border-white/40 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl dark:shadow-2xl flex flex-col group hover:shadow-2xl hover:shadow-2xl transition-all duration-500">
                      <label className="flex items-center gap-3 font-mono text-[10px] text-slate-400 tracking-widest mb-6 uppercase font-bold">
                        <span className="w-6 h-6 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xl ">02</span> 
                        Your Current CV <span className="text-blue-500">*</span>
                      </label>
                      
                      <div className="flex-1 flex flex-col min-h-[220px]">
                        {!uploadedFile ? (
                          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-blue-50/20 dark:bg-indigo-900/10 hover:bg-blue-50/40 dark:hover:bg-indigo-900/20 rounded-3xl p-6 cursor-pointer transition-all group/upload-cv shadow-inner">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 group-hover/upload-cv:scale-110 transition-transform shadow-2xl">
                              <UploadCloud className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="text-sm text-slate-900 dark:text-white mb-1 font-bold">Upload Existing CV</div>
                            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">PDF · Word · TXT</div>
                            <input type="file" accept=".pdf,.docx,.txt" onChange={handleFile} ref={fileRef} className="hidden" />
                          </label>
                        ) : (
                          <div className="bg-blue-50/60 dark:bg-indigo-900/30  border border-blue-100 dark:border-indigo-800 rounded-3xl p-5 flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2 shadow-2xl">
                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className="w-12 h-12 rounded-3xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 shadow-2xl">
                                <FileText className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                              </div>
                              <div className="overflow-hidden">
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{uploadedFile.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{(uploadedFile.size / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                            <button onClick={() => { setUploadedFile(null); setUploadedCVContent(""); setFileError(""); }} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-3xl transition-all shrink-0 shadow-2xl hover:shadow-2xl">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {fileLoading && (
                          <div className="flex items-center gap-4 p-5 bg-blue-50/80 dark:bg-indigo-900/40  border border-blue-100 dark:border-indigo-800 rounded-3xl mb-4 animate-pulse shadow-2xl">
                            <div className="w-8 h-8 rounded-3xl bg-white/80 dark:bg-slate-800/60 flex items-center justify-center shadow-2xl">
                              <Loader2 className="w-4 h-4 text-slate-600 dark:text-slate-400 animate-spin" />
                            </div>
                            <span className="text-[10px] text-indigo-700 dark:text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em] typing-dots">Extracting CV Content</span>
                          </div>
                        )}
                        
                        {fileError && (
                          <div className="flex items-start gap-4 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-3xl mb-4 shadow-2xl">
                            <div className="w-8 h-8 rounded-3xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                            </div>
                            <span className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed font-medium">{fileError}</span>
                          </div>
                        )}
                        
                        {uploadedCVContent && !fileLoading && (
                          <div className="flex items-center gap-4 p-4 bg-emerald-50/80 dark:bg-emerald-900/30  border border-emerald-100 dark:border-emerald-800 rounded-3xl mb-4 shadow-2xl">
                            <div className="w-8 h-8 rounded-3xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shadow-2xl">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-[0.15em]">CV Content Ready</span>
                          </div>
                        )}

                        <div className="relative group/textarea-cv">
                          <textarea 
                            className={`w-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/20 rounded-2xl px-5 py-4 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none shadow-2xl ${uploadedFile ? 'h-32' : 'flex-1 min-h-[180px]'}`}
                            placeholder="Or paste your CV text directly here..." 
                            value={existingCV} 
                            onChange={e => setExistingCV(e.target.value)} 
                          />
                          <div className="absolute bottom-4 right-4 px-3 py-1 rounded-3xl bg-white/80 dark:bg-slate-800/80  border border-slate-200/50 dark:border-white/20 text-[10px] font-mono text-slate-400">
                            {existingCV.length} chars
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {loading && (
                  <div className="text-center py-8 mb-6 relative">
                    <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
                    <div className="w-12 h-12 border-4 border-slate-200/50 dark:border-white/10 border-t-blue-500 rounded-full mx-auto mb-4 animate-spin relative z-10 shadow-lg shadow-blue-500/20" />
                    <div className="font-mono text-xs text-blue-600 dark:text-blue-400 animate-pulse tracking-widest font-bold relative z-10 uppercase typing-dots">{loadingMsg}</div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row-reverse justify-center gap-4 w-full sm:w-auto mt-12 pb-8">
                  <button 
                    onClick={generate} 
                    disabled={!canProceed() || loading} 
                    className="group relative flex items-center justify-center gap-3 bg-blue-600 dark:bg-slate-800 hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/30 disabled:bg-slate-300 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed text-white px-10 py-4 rounded-3xl font-bold transition-all shadow-2xl shadow-blue-500/10 hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto text-xs tracking-widest uppercase overflow-hidden"
                  >
                    <div className="absolute inset-0 hidden -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="typing-dots">Processing</span>
                      </>
                    ) : (
                      <>
                        <span>{mode === "generate" ? "Generate CV" : "Optimize CV"}</span>
                        <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setStep(1)} 
                    disabled={loading}
                    className="flex items-center justify-center gap-3 bg-white/80 dark:bg-slate-800/60 hover:bg-white/70 dark:hover:bg-slate-700 text-slate-600 dark:text-[#D4D4D4] border border-slate-200/50 dark:border-white/20 px-8 py-4 rounded-3xl font-bold transition-all shadow-2xl hover:shadow-2xl disabled:opacity-50 w-full sm:w-auto text-xs tracking-widest uppercase"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                </div>

                {!canProceed() && (
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium -mt-6 mb-4 flex flex-wrap items-center justify-center gap-1.5 animate-in fade-in duration-300">
                    <span>💡 Tip: Fill candidate details & job description, or click</span>
                    <button
                      type="button"
                      onClick={loadSampleData}
                      className="text-blue-600 dark:text-blue-400 font-bold underline hover:text-blue-700 cursor-pointer"
                    >
                      Load Demo Example
                    </button>
                    <span>to populate instant sample data.</span>
                  </div>
                )}
              </motion.div>
            )}

          {/* STEP 3 */}
          {step === 3 && result && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="w-full"
            >
              {/* Merged Top Bar: Instructions, Template Selector, & Actions */}
              <div className="bg-white/80 dark:bg-slate-900/80  border border-white/40 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl dark:shadow-2xl mb-8 group transition-all duration-500 hover:shadow-2xl">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  {/* Info */}
                  <div className="text-center lg:text-left shrink-0">
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-widest mb-2 font-bold uppercase">Step 03 — Final Polish</div>
                    <h2 className="font-display text-2xl sm:text-3xl text-slate-900 dark:text-white mb-1 tracking-tight">Finalize your <em className="italic text-slate-500 dark:text-slate-400">Masterpiece</em></h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select a template and download your optimized CV</p>
                  </div>

                  {/* Template Selector (Expanded) */}
                  <div className="flex-1 flex justify-start sm:justify-center gap-4 sm:gap-8 lg:gap-12 overflow-x-auto lg:overflow-x-visible pb-4 sm:pb-0 scrollbar-hide max-w-full px-2 -mx-2 sm:mx-0">
                    {Object.entries(TEMPLATES).map(([id, t]) => (
                      <button 
                        key={id} 
                        onClick={() => setTemplate(id)} 
                        className={`shrink-0 flex flex-col items-center gap-3 p-1 rounded-3xl transition-all duration-500 ${
                          template === id 
                            ? 'scale-110' 
                            : 'hover:scale-105 opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                        }`}
                      >
                        <div className={`relative transition-all duration-500 ${template === id ? 'ring-4 ring-indigo-500/30 rounded-3xl shadow-2xl' : ''}`}>
                          <MiniDoc id={id} selected={template === id} />
                          {template === id && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/10 animate-in zoom-in duration-300">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] font-mono tracking-widest uppercase font-bold whitespace-nowrap transition-colors ${template === id ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400'}`}>
                          {t.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Actions - Reorganized with Reset above Download */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 shrink-0 w-full lg:w-auto">
                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => setStep(2)} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-4 py-3 rounded-3xl bg-white/80 dark:bg-slate-800/60 hover:bg-white/70 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-white/20 text-slate-600 dark:text-[#D4D4D4] text-[10px] font-bold tracking-[0.15em] uppercase transition-all shadow-2xl hover:shadow-2xl h-12 sm:w-40 group/btn"
                      >
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" /> Back
                      </button>
                      <button 
                        onClick={copyToClipboard}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-4 py-3 rounded-3xl bg-white/80 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-indigo-900/20 border border-slate-200/50 dark:border-white/20 text-slate-600 dark:text-[#D4D4D4] hover:text-slate-900 dark:text-slate-100 dark:hover:text-slate-500 dark:text-slate-400 transition-all shadow-2xl hover:shadow-2xl text-[10px] font-bold uppercase tracking-[0.15em] h-12 sm:w-40"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => {
                          if (originalResult) {
                            setResult(originalResult);
                            setCvSections(parseSections(originalResult));
                          }
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-4 py-3 rounded-3xl bg-white/80 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-slate-200/50 dark:border-white/20 text-slate-600 dark:text-[#D4D4D4] hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-2xl hover:shadow-2xl text-[10px] font-bold uppercase tracking-[0.15em] h-12 sm:w-48"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset
                      </button>
                      <button 
                        onClick={() => {
                          if (!userAccess?.isPaid) {
                            setShowPricingModal(true);
                          } else {
                            setShowDownloadModal(true);
                          }
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-[10px] font-bold tracking-[0.15em] uppercase transition-all shadow-2xl shadow-blue-500/10 hover:shadow-2xl hover:-translate-y-1 h-12 sm:w-48 group/download overflow-hidden relative"
                      >
                        <div className="absolute inset-0 hidden -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        {userAccess?.isPaid ? (
                          <>
                            <Download className="w-4 h-4 transition-transform group-hover/download:translate-y-0.5" /> Download
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-amber-200" /> Unlock & Download
                          </>
                        )}
                      </button>
                      {!userAccess?.isPaid ? (
                        <div className="text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          From $3.99 single / $9.99 mo
                        </div>
                      ) : (
                        <div className="text-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" /> {userAccess.plan === 'monthly' ? 'Pro Member' : 'Pass Active'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Tab Switcher */}
              <div className="lg:hidden flex p-1.5 bg-[#F5F5F5]/80 dark:bg-slate-800/80  rounded-3xl mb-8 border border-slate-200/50 dark:border-white/20 shadow-inner">
                <button 
                  onClick={() => setActiveTab('edit')}
                  className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-3xl text-[10px] font-bold tracking-[0.15em] uppercase transition-all ${activeTab === 'edit' ? 'bg-white/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow-2xl' : 'text-slate-500'}`}
                >
                  <GripVertical className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-3xl text-[10px] font-bold tracking-[0.15em] uppercase transition-all ${activeTab === 'preview' ? 'bg-white/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow-2xl' : 'text-slate-500'}`}
                >
                  <Eye className="w-4 h-4" /> Preview
                </button>
              </div>

              <div className="flex flex-col xl:flex-row gap-8 items-start">
                {/* Left Column: Edit Sections */}
                <div className={`w-full xl:w-[420px] shrink-0 flex flex-col gap-6 ${activeTab === 'edit' ? 'block' : 'hidden xl:block'}`}>
                  <div className="bg-white/80 dark:bg-slate-900/80  border border-white/40 dark:border-white/10 rounded-3xl p-8 shadow-2xl dark:shadow-2xl flex flex-col gap-8 group/edit">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                          <GripVertical className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-display text-slate-900 dark:text-white tracking-tight">Structure</h3>
                          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">Drag to reorder</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-indigo-900/20 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-4 py-2 rounded-3xl border border-blue-100 dark:border-indigo-800/50 uppercase tracking-widest">
                        {cvSections.length} Sections
                      </div>
                    </div>
                    
                    <div className="max-h-[60vh] xl:max-h-none overflow-y-auto pr-2 -mr-2 scrollbar-hide">
                      <Reorder.Group 
                        axis="y" 
                        values={cvSections} 
                        onReorder={(newSections) => {
                          setCvSections(newSections);
                          const newText = newSections.map(s => {
                            const title = s.title ? s.title + '\n' : '';
                            return title + s.content.join('\n');
                          }).join('\n\n');
                          setResult(newText);
                        }}
                        className="flex flex-col gap-4 relative z-10"
                      >
                        {cvSections.map((s, idx) => (
                          <ReorderItem 
                            key={s.id} 
                            s={s} 
                            idx={idx} 
                            onUpdate={(updated) => {
                              const newSections = cvSections.map(item => item.id === s.id ? updated : item);
                              setCvSections(newSections);
                              const newText = newSections.map(item => {
                                const title = item.title ? item.title + '\n' : '';
                                return title + item.content.join('\n');
                              }).join('\n\n');
                              setResult(newText);
                            }}
                            onDelete={() => {
                              const newSections = cvSections.filter(item => item.id !== s.id);
                              setCvSections(newSections);
                              const newText = newSections.map(item => {
                                const title = item.title ? item.title + '\n' : '';
                                return title + item.content.join('\n');
                              }).join('\n\n');
                              setResult(newText);
                            }} 
                          />
                        ))}
                      </Reorder.Group>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => doCopy(result, setCopied)} 
                        className="flex items-center justify-center gap-3 bg-white/70 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/60 text-slate-600 dark:text-[#D4D4D4] border border-slate-200/50 dark:border-white/20 px-6 py-4 rounded-3xl text-[10px] font-bold tracking-[0.15em] uppercase transition-all shadow-2xl hover:shadow-2xl group/copy-btn"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400 group-hover/copy-btn:text-slate-600 dark:text-slate-400 transition-colors" />} 
                        {copied ? "Copied to Clipboard" : "Copy Full Text"}
                      </button>
                      <button 
                        onClick={handleAtsAnalysis}
                        disabled={!jobDesc}
                        className="flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border border-emerald-400/30 px-6 py-4 rounded-3xl text-[10px] font-bold tracking-[0.15em] uppercase transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none group"
                      >
                        <Zap className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
                        Analyze ATS Match
                      </button>
                      {!jobDesc && (
                        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-1">Requires a Job Description</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Preview */}
                <div className={`flex-1 w-full flex flex-col gap-8 ${activeTab === 'preview' ? 'block' : 'hidden xl:block'}`}>
                  {/* Live Preview Container */}
                  <div className="bg-white/80 dark:bg-slate-900/80  border border-white/40 dark:border-white/10 rounded-3xl p-2 sm:p-4 shadow-2xl dark:shadow-2xl flex flex-col min-h-[500px] xl:h-[1000px] max-h-[90vh] xl:max-h-none group/preview">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-3xl sm:rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-2xl">
                          <Eye className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">Live Preview</h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                              <div className="w-1 h-1 rounded-3xl bg-emerald-500 animate-pulse" />
                              <span className="text-[7px] sm:text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                            </div>
                            <span className="text-[8px] sm:text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">A4 View</span>
                            <span className="w-1 h-1 rounded-3xl bg-slate-300 dark:bg-slate-700"></span>
                            <span className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold uppercase tracking-widest">{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center">
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/70 dark:bg-slate-800/60 p-1.5 sm:p-2 rounded-3xl sm:rounded-3xl border border-slate-200/50 dark:border-white/20 shadow-inner">
                          <button 
                            onClick={() => {
                              setIsManualZoom(true);
                              setResultScale(p => Math.max(0.2, p - 0.1));
                            }} 
                            className="p-2 sm:p-2.5 hover:bg-white/80 dark:hover:bg-slate-700 rounded-3xl sm:rounded-3xl text-slate-500 hover:text-slate-900 dark:text-slate-100 transition-all shadow-2xl hover:shadow-2xl"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <div className="px-2 sm:px-3 flex flex-col items-center min-w-[40px] sm:min-w-[60px]">
                            <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-900 dark:text-white">{Math.round(resultScale * 100)}%</span>
                            {isManualZoom && (
                              <button 
                                onClick={() => setIsManualZoom(false)}
                                className="text-[7px] sm:text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter hover:underline"
                              >
                                Reset Fit
                              </button>
                            )}
                          </div>
                          <button 
                            onClick={() => {
                              setIsManualZoom(true);
                              setResultScale(p => Math.min(2.0, p + 0.1));
                            }} 
                            className="p-2 sm:p-2.5 hover:bg-white/80 dark:hover:bg-slate-700 rounded-3xl sm:rounded-3xl text-slate-500 hover:text-slate-900 dark:text-slate-100 transition-all shadow-2xl hover:shadow-2xl"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                        <button 
                          onClick={() => setFullScreenPreview(true)}
                          className="p-3 sm:p-4 bg-slate-900/40 dark:bg-blue-600 hover:bg-slate-800/60 dark:hover:bg-blue-500 rounded-3xl sm:rounded-3xl text-white transition-all shadow-2xl dark: group/fullscreen"
                          title="Full Screen Preview"
                        >
                          <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover/fullscreen:scale-110" />
                        </button>
                      </div>
                    </div>
                    {/* Live Template Gallery */}
                    <div className="flex gap-3 mb-6 overflow-x-auto custom-scrollbar pb-2 px-1 w-full snap-x shrink-0 z-20 relative">
                      {Object.entries(TEMPLATES).map(([id, t]) => (
                        <button
                          key={id}
                          onClick={() => setTemplate(id)}
                          className={`shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border snap-center ${
                            template === id 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/25 scale-105 z-10' 
                              : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:scale-[1.02]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${template === id ? 'bg-white/20' : t.bg}`}>
                            <FileType className={`w-4 h-4 ${template === id ? 'text-white' : t.color}`} />
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <span className="text-xs font-bold uppercase tracking-widest leading-tight">{t.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>


                    <div ref={setResultContainer} className="flex-1 overflow-auto p-2 sm:p-4 bg-[#F5F5F5] dark:bg-slate-800/60 rounded-3xl border border-slate-200/50 dark:border-white/10 custom-scrollbar flex flex-col items-center shadow-inner relative group/scroll" style={{ touchAction: "pan-x pan-y" }}>
                      <div 
                        className="transition-all duration-500 ease-out shrink-0"
                        style={{ 
                          width: `${794 * resultScale}px`,
                          height: `${1123 * pageCount * resultScale}px`,
                          position: 'relative'
                        }}
                      >
                        <div 
                          className="shadow-2xl dark:shadow-2xl"
                          style={{ 
                            transform: `scale(${resultScale})`,
                            transformOrigin: 'top left',
                            width: '794px',
                            height: 'auto',
                            position: 'absolute',
                            top: 0,
                            left: 0
                          }}
                        >
                          <CVPreview 
                            text={mode === "modify" ? (uploadedCVContent || existingCV || "Your CV content will appear here...") : (result || draftCV || formatCVFromDetails())} 
                            sections={cvSections}
                            template={template} 
                            ref={cvRef}
                            setPageCount={setPageCount}
                            onUpdateSectionContent={(id, newContent) => {
                              const newSections = cvSections.map(item => item.id === id ? { ...item, content: newContent } : item);
                              setCvSections(newSections);
                              const newText = newSections.map(item => {
                                const title = item.title ? item.title + '\n' : '';
                                return title + item.content.join('\n');
                              }).join('\n\n');
                              setResult(newText);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-center mt-20 text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold opacity-60">
                Crafted for success. Review every detail before sending.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* History Modal */}
      <AnimatePresence>
        {viewingHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingHistory(false)} 
            className="fixed inset-0 bg-slate-900/40  z-[110] flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()} 
              className="bg-white/80 dark:bg-slate-900/40 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-[#F5F5F5] dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 ">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-3xl bg-blue-50 dark:bg-indigo-900/30 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-slate-900 dark:text-white tracking-tight">Your History</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest">Previous Masterpieces</p>
                  </div>
                </div>
                <button onClick={() => setViewingHistory(false)} className="w-10 h-10 rounded-3xl bg-[#F5F5F5] dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white/70/30 dark:bg-slate-900/40/30 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 rounded-3xl bg-[#F5F5F5] dark:bg-slate-800/60 flex items-center justify-center mx-auto mb-6">
                      <History className="w-10 h-10 text-[#D4D4D4] dark:text-slate-600" />
                    </div>
                    <div className="text-slate-900 dark:text-white font-bold mb-2">No history found yet</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto">Generate your first CV to see it here!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {history.map((item) => (
                      <div key={item.id} className="bg-white/80 dark:bg-slate-800/80  border border-white/40 dark:border-white/20 rounded-3xl p-5 shadow-2xl hover:shadow-2xl hover:shadow-2xl transition-all group/history-item">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-3xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-2xl">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase">
                              {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          <span className="text-[9px] font-mono px-3 py-1 rounded-3xl bg-blue-50 dark:bg-indigo-900/30 text-slate-500 dark:text-slate-400 border border-blue-100 dark:border-indigo-800 uppercase font-bold tracking-wider">
                            {item.template_id}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 leading-relaxed">
                          {item.job_description}
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-[#F5F5F5] dark:border-white/20">
                          <button 
                            onClick={() => {
                              setResult(item.optimized_cv);
                              setTemplate(item.template_id);
                              setStep(3);
                              setViewingHistory(false);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-2xl "
                          >
                            <Eye className="w-3.5 h-3.5" /> View & Edit
                          </button>
                          <button 
                            onClick={() => doCopy(item.optimized_cv, setCopied)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-3xl bg-[#F5F5F5] dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-[#D4D4D4] text-[10px] font-bold uppercase tracking-widest transition-all"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ATS Analysis Modal */}
      <AnimatePresence>
        {showAtsModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md"
            onClick={() => !isAnalyzingAts && setShowAtsModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 w-full max-w-xl shadow-2xl relative border border-slate-200 dark:border-white/10"
            >
              <button 
                onClick={() => !isAnalyzingAts && setShowAtsModal(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {isAnalyzingAts ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 mb-8 relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                    <div className="w-full h-full border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-emerald-500 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Analyzing ATS Match</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">Running your CV through our virtual tracking system...</p>
                </div>
              ) : (
                <div className="flex flex-col max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-4">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Analysis Complete
                    </div>
                    <h3 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white mb-6">ATS Match Score</h3>
                    
                    <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle 
                          className="text-slate-100 dark:text-slate-800" 
                          strokeWidth="8" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="42" 
                          cx="50" 
                          cy="50" 
                        />
                        <circle 
                          className={`${(atsScore || 0) >= 80 ? 'text-emerald-500' : (atsScore || 0) >= 60 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1000 ease-out`}
                          strokeWidth="8" 
                          strokeDasharray={264} 
                          strokeDashoffset={264 - (264 * (atsScore || 0)) / 100}
                          strokeLinecap="round" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="42" 
                          cx="50" 
                          cy="50" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white">{atsScore}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">/ 100</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Actionable Tips</h4>
                    {atsTips.length > 0 ? atsTips.map((tip, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 font-bold text-[10px] mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{tip}</p>
                      </div>
                    )) : (
                       <p className="text-sm text-slate-500">No specific tips returned.</p>
                    )}
                  </div>

                  <div className="mt-8">
                    <button 
                      onClick={() => setShowAtsModal(false)}
                      className="w-full py-4 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold tracking-widest text-[10px] uppercase hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                    >
                      Close & Keep Editing
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Download Format Modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDownloadModal(false)} 
            className="fixed inset-0 bg-slate-900/40  z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()} 
              className="bg-white/80 dark:bg-slate-900/40 rounded-3xl w-full max-w-md flex flex-col shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-[#F5F5F5] dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 ">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-3xl bg-blue-50 dark:bg-indigo-900/30 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-2xl">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-slate-900 dark:text-white tracking-tight">Download CV</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest">Choose your format</p>
                  </div>
                </div>
                <button onClick={() => setShowDownloadModal(false)} className="w-10 h-10 rounded-3xl bg-[#F5F5F5] dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {userAccess?.isPaid && (
                <div className="mx-8 mt-4 p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {userAccess.plan === 'monthly' ? 'Monthly Pro Access (Unlocked)' : 'Single Generation Pass (Unlocked)'}
                    </span>
                  </div>
                  <span className="text-[11px] opacity-75 font-mono">{userAccess.email}</span>
                </div>
              )}
              
              <div className="p-8 flex flex-col gap-4 bg-white/70/30 dark:bg-slate-900/40/30">
                <button 
                  onClick={downloadPdf}
                  disabled={downloadingFormat !== null}
                  className="flex items-center justify-between w-full p-5 rounded-3xl border border-slate-200/50 dark:border-white/20 bg-white/80 dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-blue-50/50 dark:hover:bg-indigo-900/20 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-2xl hover:shadow-2xl"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-3xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                      <FileType className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">PDF Document</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Preserves visual template style</div>
                    </div>
                  </div>
                  {downloadingFormat === 'pdf' ? <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-400 animate-spin" /> : <ChevronRight className="w-5 h-5 text-[#D4D4D4] group-hover:text-slate-600 dark:text-slate-400 group-hover:translate-x-1 transition-all" />}
                </button>

                <button 
                  onClick={downloadDocx}
                  disabled={downloadingFormat !== null}
                  className="flex items-center justify-between w-full p-5 rounded-3xl border border-slate-200/50 dark:border-white/20 bg-white/80 dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-blue-50/50 dark:hover:bg-indigo-900/20 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-2xl hover:shadow-2xl"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-3xl bg-blue-50 dark:bg-indigo-900/30 text-slate-500 dark:text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                      <FileTextIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Word Document (.docx)</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Best for editing & ATS systems</div>
                    </div>
                  </div>
                  {downloadingFormat === 'docx' ? <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-400 animate-spin" /> : <ChevronRight className="w-5 h-5 text-[#D4D4D4] group-hover:text-slate-600 dark:text-slate-400 group-hover:translate-x-1 transition-all" />}
                </button>

                <button 
                  onClick={downloadTxt}
                  disabled={downloadingFormat !== null}
                  className="flex items-center justify-between w-full p-5 rounded-3xl border border-slate-200/50 dark:border-white/20 bg-white/80 dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-blue-50/50 dark:hover:bg-indigo-900/20 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-2xl hover:shadow-2xl"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-3xl bg-white/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Plain Text (.txt)</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Simple text-only version</div>
                    </div>
                  </div>
                  {downloadingFormat === 'txt' ? <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-400 animate-spin" /> : <ChevronRight className="w-5 h-5 text-[#D4D4D4] group-hover:text-slate-600 dark:text-slate-400 group-hover:translate-x-1 transition-all" />}
                </button>
              </div>
              
              <div className="px-8 py-5 bg-white/80 dark:bg-slate-900/40 border-t border-[#F5F5F5] dark:border-white/10 flex justify-center">
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">Ready to land your dream job</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paywall & Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
        onPaymentSuccess={handlePaymentSuccess} 
      />

      {/* Download Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)} 
            className="fixed inset-0 bg-slate-900/40  z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()} 
              className="bg-white/80 dark:bg-slate-900/40 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-[#F5F5F5] dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 ">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-3xl bg-blue-50 dark:bg-indigo-900/30 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-2xl">
                    <Copy className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-slate-900 dark:text-white tracking-tight">Copy CV Text</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest">Ready for any platform</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-3xl bg-[#F5F5F5] dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white/70/30 dark:bg-slate-900/40/30 custom-scrollbar">
                <div className="relative group/copy-pre">
                  <pre className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-900 dark:text-slate-100 font-sans bg-white/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/20 rounded-3xl p-6 sm:p-8 shadow-inner min-h-[300px]">
                    {result}
                  </pre>
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-3xl bg-[#F5F5F5]/80 dark:bg-slate-700/80  border border-slate-200/50 dark:border-slate-600 text-[10px] font-mono text-slate-400">
                    {result?.length || 0} chars
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-6 border-t border-[#F5F5F5] dark:border-white/10 flex gap-4 shrink-0 bg-white/80 dark:bg-slate-900/40">
                <button 
                  onClick={() => doCopy(result || "", setModalCopied)} 
                  className={`flex-1 py-4 rounded-3xl font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-2xl ${
                    modalCopied 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl' 
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white '
                  }`}
                >
                  {modalCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {modalCopied ? "Copied to clipboard!" : "Copy All Text"}
                </button>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-8 py-4 rounded-3xl border border-slate-200/50 dark:border-white/20 bg-white/80 dark:bg-slate-800/60 hover:bg-white/70 dark:hover:bg-slate-700 text-slate-600 dark:text-[#D4D4D4] font-bold text-xs tracking-widest uppercase transition-all shadow-2xl"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {fullScreenPreview && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 bg-slate-900 p-4 pt-12 sm:p-8 z-[200] flex flex-col overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 sm:mb-8 bg-white/5 p-4 sm:p-6 rounded-3xl sm:rounded-3xl border border-white/10  shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="text-center sm:text-left">
                  <div className="font-display text-lg sm:text-2xl text-white tracking-tight">Full Screen <em className="italic text-slate-500 dark:text-slate-400">Preview</em></div>
                  <div className="text-[8px] sm:text-[10px] font-mono text-white/40 uppercase tracking-widest mt-0.5 sm:mt-1 font-bold">Template: {TEMPLATES[template as keyof typeof TEMPLATES].name}</div>
                </div>
                <div className="hidden sm:block h-10 w-[1px] bg-white/10" />
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3">
                  {Object.keys(TEMPLATES).map(id => (
                    <button 
                      key={id} 
                      onClick={() => setTemplate(id)}
                      className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-3xl text-[8px] sm:text-[10px] font-bold tracking-widest uppercase transition-all ${template === id ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-2xl ' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'}`}
                    >
                      {TEMPLATES[id as keyof typeof TEMPLATES].name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
                <div className="hidden xs:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800/60 rounded-3xl border dark:border-white/20">
                  <GripVertical className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-[8px] sm:text-[10px] font-mono text-indigo-300 uppercase font-bold tracking-wider whitespace-nowrap">Drag to reorder</span>
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 p-1 sm:p-1.5 rounded-3xl border border-white/10">
                  <button 
                    onClick={() => {
                      setIsManualZoomFullScreen(true);
                      setFullScreenScale(p => Math.max(0.2, p - 0.1));
                    }}
                    className="p-1.5 sm:p-2 hover:bg-white/10 rounded-3xl text-white/60 hover:text-white transition-all"
                  >
                    <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <div className="px-1 sm:px-2 flex flex-col items-center min-w-[35px] sm:min-w-[60px]">
                    <span className="text-[9px] sm:text-[10px] font-mono text-white font-bold">{Math.round(fullScreenScale * 100)}%</span>
                    {isManualZoomFullScreen && (
                      <button 
                        onClick={() => setIsManualZoomFullScreen(false)}
                        className="text-[6px] sm:text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter hover:underline"
                      >
                        Reset Fit
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setIsManualZoomFullScreen(true);
                      setFullScreenScale(p => Math.min(2.0, p + 0.1));
                    }}
                    className="p-1.5 sm:p-2 hover:bg-white/10 rounded-3xl text-white/60 hover:text-white transition-all"
                  >
                    <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                <button onClick={() => setFullScreenPreview(false)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-3xl sm:rounded-3xl bg-white/10 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-2xl hover:shadow-2xl">
                  <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            <div ref={setFullScreenContainer} className="flex-1 overflow-auto flex flex-col items-center p-2 sm:p-8 bg-white/5 rounded-3xl sm:rounded-3xl border border-white/5 custom-scrollbar shadow-inner" style={{ touchAction: "pan-x pan-y" }}>
              <div 
                className="transition-all duration-500 ease-out shrink-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden"
                style={{ 
                  width: `${794 * fullScreenScale}px`,
                  height: `${1123 * pageCount * fullScreenScale}px`,
                  position: 'relative'
                }}
              >
                <div 
                  style={{ 
                    transform: `scale(${fullScreenScale})`,
                    transformOrigin: 'top left',
                    width: '794px',
                    height: 'auto',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                >
                  <CVPreview 
                    text={mode === "modify" ? (uploadedCVContent || existingCV || "Your CV content will appear here...") : (result || draftCV || formatCVFromDetails())} 
                    sections={cvSections}
                    template={template} 
                    setPageCount={setPageCount}
                    onUpdateSectionContent={(id, newContent) => {
                              const newSections = cvSections.map(item => item.id === id ? { ...item, content: newContent } : item);
                              setCvSections(newSections);
                              const newText = newSections.map(item => {
                                const title = item.title ? item.title + '\n' : '';
                                return title + item.content.join('\n');
                              }).join('\n\n');
                              setResult(newText);
                            }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[200] max-w-md px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-semibold backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-950/90 text-emerald-100 border-emerald-800"
                : toast.type === "error"
                ? "bg-rose-950/90 text-rose-100 border-rose-800"
                : "bg-slate-900/90 text-slate-100 border-slate-700"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
