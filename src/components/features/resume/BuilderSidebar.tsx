/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ResumeData, ExperienceItem, EducationItem, ResumeLayout } from "@/types";
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical, LayoutTemplate, FileText } from "lucide-react";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const LAYOUTS: { value: ResumeLayout; label: string; description: string }[] = [

  { value: "classic", label: "Classic", description: "Centered & traditional" },
  { value: "modern", label: "Modern", description: "Bold header block" },
  { value: "minimal", label: "Minimal", description: "Clean & spacious" },
  { value: "professional", label: "Professional", description: "Split header" },
  { value: "executive", label: "Executive", description: "Formal & authoritative" },
  { value: "bold", label: "Bold", description: "High contrast, heavy" },
  { value: "academic", label: "Academic", description: "Dense & structured" },
  { value: "tech", label: "Tech", description: "Developer focused" },
  { value: "creative", label: "Creative", description: "Vibrant accents" },
  { value: "elegant", label: "Elegant", description: "Delicate typography" },
  
  { value: "corporate", label: "Corporate", description: "Standard business standard" },
  { value: "banking", label: "Banking", description: "Conservative & trustworthy" },
  { value: "legal", label: "Legal", description: "Strict & traditional" },
  { value: "consultant", label: "Consultant", description: "Client-facing focus" },
  { value: "enterprise", label: "Enterprise", description: "Large-scale corporate" },
  { value: "management", label: "Management", description: "Leadership focused" },
  { value: "finance", label: "Finance", description: "Data-driven structure" },
  { value: "director", label: "Director", description: "Boardroom ready" },
  { value: "official", label: "Official", description: "Government standard" },
  { value: "traditional", label: "Traditional", description: "Time-tested layout" },

  { value: "studio", label: "Studio", description: "Agency style" },
  { value: "portfolio", label: "Portfolio", description: "Designer focused" },
  { value: "vibrant", label: "Vibrant", description: "High energy" },
  { value: "pastel", label: "Pastel", description: "Soft & approachable" },
  { value: "geometric", label: "Geometric", description: "Sharp & angled" },
  { value: "organic", label: "Organic", description: "Flowing & natural" },
  { value: "artistic", label: "Artistic", description: "Unconventional" },
  { value: "editorial", label: "Editorial", description: "Magazine style" },
  { value: "neon", label: "Neon", description: "Bright & cyber" },
  { value: "contemporary", label: "Contemporary", description: "Modern art feel" },

  { value: "startup", label: "Startup", description: "Agile & fresh" },
  { value: "hacker", label: "Hacker", description: "Terminal aesthetic" },
  { value: "cyber", label: "Cyber", description: "Futuristic" },
  { value: "saas", label: "SaaS", description: "Cloud software style" },
  { value: "devops", label: "DevOps", description: "Infrastructure focused" },
  { value: "fintech", label: "Fintech", description: "Modern finance" },
  { value: "crypto", label: "Crypto", description: "Web3 aesthetic" },
  { value: "cleancode", label: "Clean Code", description: "Ultra-minimal tech" },
  { value: "matrix", label: "Matrix", description: "Data heavy" },
  { value: "agile", label: "Agile", description: "Sprint focused" },

  { value: "crisp", label: "Crisp", description: "Ultra sharp edges" },
  { value: "breezy", label: "Breezy", description: "High whitespace" },
  { value: "sharp", label: "Sharp", description: "Distinct lines" },
  { value: "flat", label: "Flat", description: "No shadows" },
  { value: "material", label: "Material", description: "Google-inspired" },
  { value: "glass", label: "Glass", description: "Translucent feel" },
  { value: "monochrome", label: "Monochrome", description: "Black & white focus" },
  { value: "duotone", label: "Duo-tone", description: "Two-color emphasis" },
  { value: "spaced", label: "Spaced", description: "Airy & light" },
  { value: "compact", label: "Compact", description: "Information dense" },

  { value: "engineering", label: "Engineering", description: "Schematic style" },
  { value: "researcher", label: "Researcher", description: "Data & lab focus" },
  { value: "educator", label: "Educator", description: "Accessible & clear" },
  { value: "hospitality", label: "Hospitality", description: "Warm & inviting" },
  { value: "retail", label: "Retail", description: "Customer-facing" },
  { value: "sales", label: "Sales", description: "Results & metrics" },
  { value: "marketing", label: "Marketing", description: "Brand focused" },
  { value: "pr", label: "PR", description: "Communication first" },
  { value: "media", label: "Media", description: "Content-driven" },
  { value: "medical", label: "Medical", description: "Clinical & precise" }
];

const MOCK_DATA: Partial<ResumeData> = {
  firstName: "Angelito",
  lastName: "Decatoria",
  jobTitle: "Full Stack Developer",
  email: "angelitodecatoriaa@email.com",
  phone: "+63 938 510 0460",
  address: "Naic, PH",
  summary: "Results-driven Senior Full Stack Developer with over 8 years of experience architecting scalable web applications and leading cross-functional engineering teams. Expertise in React, Node.js, and cloud infrastructure. Passionate about clean code, performance optimization, and mentoring junior developers to build exceptional user experiences.",
  experience: [
    {
      id: crypto.randomUUID(),
      company: "TechNova Solutions",
      role: "Lead Software Engineer",
      date: "Jan 2021 – Present",
      description: "• Architected and migrated a legacy monolith application to a microservices architecture, improving system scalability by 40%.\n• Led a team of 6 engineers to deliver a highly requested enterprise dashboard using Next.js and Tailwind CSS.\n• Implemented automated CI/CD pipelines using GitHub Actions, reducing deployment times from 45 minutes to 8 minutes."
    },
    {
      id: crypto.randomUUID(),
      company: "WebSphere Dynamics",
      role: "Frontend Developer",
      date: "Mar 2017 – Dec 2020",
      description: "• Developed interactive, responsive UI components using React.js and Redux for a SaaS platform with over 100,000 active users.\n• Optimized application performance, reducing initial load times by 2.5 seconds through code splitting and lazy loading.\n• Collaborated closely with UX/UI designers to ensure strict adherence to accessibility standards (WCAG 2.1)."
    }
  ],
  education: [
    {
      id: crypto.randomUUID(),
      school: "University of California, Berkeley",
      degree: "Master of Science in Computer Science",
      date: "2015 – 2017"
    },
    {
      id: crypto.randomUUID(),
      school: "University of Washington",
      degree: "Bachelor of Science in Software Engineering",
      date: "2011 – 2015"
    }
  ],
  skills: "Languages: JavaScript (ES6+), TypeScript, Python, SQL\nFrontend: React, Next.js, Vue.js, Tailwind CSS, Redux\nBackend: Node.js, Express, Django, PostgreSQL, MongoDB\nTools/Cloud: AWS, Docker, Kubernetes, Git, CI/CD, Jest",
  certifications: "• AWS Certified Solutions Architect – Associate (2023)\n• Meta Front-End Developer Professional Certificate (2022)"
};

export default function BuilderSidebar({ data, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<"builder" | "templates">("builder");
  const [draggedItem, setDraggedItem] = useState<{type: 'experience'|'education', index: number} | null>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    summary: true,
    experience: true,
    education: true,
    skills: false,
    certifications: false
  });
  
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const update = (field: keyof ResumeData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const loadMockData = () => {
    onChange({
      ...data,
      ...MOCK_DATA,
      theme: data.theme
    });
  };

  const handleDragStart = (e: React.DragEvent, type: 'experience'|'education', index: number) => {
    setDraggedItem({ type, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropType: 'experience'|'education', dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== dropType || draggedItem.index === dropIndex) return;

    const arr = [...(data[dropType] || [])] as any[];
    const [movedItem] = arr.splice(draggedItem.index, 1);
    arr.splice(dropIndex, 0, movedItem);
    
    update(dropType, arr);
    setDraggedItem(null);
  };

  const addExperience = () => {
    const newExp: ExperienceItem = { id: crypto.randomUUID(), company: "", role: "", date: "", description: "" };
    update("experience", [...(data.experience || []), newExp]);
    setOpenSections(prev => ({ ...prev, experience: true }));
  };

  const removeExperience = (id: string) => {
    update("experience", (data.experience || []).filter(e => e.id !== id));
  };

  const updateExperienceItem = (id: string, field: keyof ExperienceItem, value: string) => {
    update("experience", (data.experience || []).map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addEducation = () => {
    const newEdu: EducationItem = { id: crypto.randomUUID(), school: "", degree: "", date: "" };
    update("education", [...(data.education || []), newEdu]);
    setOpenSections(prev => ({ ...prev, education: true }));
  };

  const removeEducation = (id: string) => {
    update("education", (data.education || []).filter(e => e.id !== id));
  };

  const updateEducationItem = (id: string, field: keyof EducationItem, value: string) => {
    update("education", (data.education || []).map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const updateThemeLayout = (layout: ResumeLayout) => {
    const currentTheme = data.theme || { layout: 'classic', primaryColor: '#000000', fontFamily: 'inter', fontSize: 'md' };
    onChange({ ...data, theme: { ...currentTheme, layout } });
  };

  const rewriteWithAI = async () => {
    if (!data.summary?.trim()) {
      setRewriteError("Write a short summary first.");
      return;
    }
    setIsRewriting(true);
    setRewriteError(null);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.summary, jobTitle: data.jobTitle }),
      });
      if (!res.ok) throw new Error("Failed to rewrite");
      const { text } = await res.json();
      update("summary", text);
    } catch {
      setRewriteError("Couldn't rewrite summary.");
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 shrink-0">
        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
          <button 
            onClick={() => setActiveTab("builder")}
            className={`flex-1 rounded-md py-1.5 transition-all ${activeTab === 'builder' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Builder
          </button>
          <button 
            onClick={() => setActiveTab("templates")}
            className={`flex-1 rounded-md py-1.5 transition-all ${activeTab === 'templates' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Templates
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === "builder" ? (
          <>
            <div className="p-4 border-b border-gray-100 bg-indigo-50/50">
               <button 
                 onClick={loadMockData}
                 className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 text-sm font-bold shadow-sm transition-colors"
               >
                 <FileText size={16} /> Fill with Example Data
               </button>
               <p className="text-[10px] text-gray-500 text-center mt-2 font-medium">
                 Use this to quickly test how templates look.
               </p>
            </div>

            <div className="border-b border-gray-100">
              <button onClick={() => toggleSection('personal')} className="w-full flex items-center justify-between p-4 font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                Personal Details
                {openSections['personal'] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {openSections['personal'] && (
                <div className="p-4 pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">First Name</label>
                      <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={data.firstName} onChange={(e) => update("firstName", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Last Name</label>
                      <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={data.lastName} onChange={(e) => update("lastName", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Job Title</label>
                    <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={data.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
                      <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={data.email} onChange={(e) => update("email", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone</label>
                      <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={data.phone} onChange={(e) => update("phone", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-b border-gray-100">
              <button onClick={() => toggleSection('summary')} className="w-full flex items-center justify-between p-4 font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                Professional Summary
                {openSections['summary'] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {openSections['summary'] && (
                <div className="p-4 pt-0 space-y-3">
                  <textarea
                    rows={5}
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:border-indigo-500"
                    value={data.summary || ""}
                    onChange={(e) => update("summary", e.target.value)}
                  />
                  {rewriteError && <p className="text-xs text-red-500 font-medium">{rewriteError}</p>}
                  <button onClick={rewriteWithAI} disabled={isRewriting} className="w-full bg-indigo-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {isRewriting ? "Rewriting..." : "Enhance with AI ✨"}
                  </button>
                </div>
              )}
            </div>

            <div className="border-b border-gray-100">
              <button onClick={() => toggleSection('experience')} className="w-full flex items-center justify-between p-4 font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                Work Experience
                {openSections['experience'] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {openSections['experience'] && (
                <div className="p-4 pt-0 space-y-4">
                  {(data.experience || []).map((exp, i) => (
                    <div 
                      key={exp.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, 'experience', i)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'experience', i)}
                      className={`p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3 relative group transition-all ${draggedItem?.type === 'experience' && draggedItem.index === i ? 'opacity-50 border-indigo-300 bg-indigo-50' : 'opacity-100'}`}
                    >
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 pl-2">
                        <div className="cursor-grab text-gray-400 hover:text-indigo-600 p-1"><GripVertical size={16} /></div>
                        <button onClick={() => removeExperience(exp.id)} className="text-gray-400 hover:text-red-500 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Company</label>
                        <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={exp.company} onChange={e => updateExperienceItem(exp.id, 'company', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Role</label>
                          <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={exp.role} onChange={e => updateExperienceItem(exp.id, 'role', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Dates</label>
                          <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={exp.date} onChange={e => updateExperienceItem(exp.id, 'date', e.target.value)} />
                        </div>
                      </div>
                      <div>
                         <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                         <textarea rows={3} className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none resize-none focus:border-indigo-500" value={exp.description} onChange={e => updateExperienceItem(exp.id, 'description', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <button onClick={addExperience} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 text-sm font-semibold">
                    <Plus size={16} /> Add Experience
                  </button>
                </div>
              )}
            </div>

            <div className="border-b border-gray-100">
              <button onClick={() => toggleSection('education')} className="w-full flex items-center justify-between p-4 font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                Education
                {openSections['education'] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {openSections['education'] && (
                <div className="p-4 pt-0 space-y-4">
                  {(data.education || []).map((edu, i) => (
                    <div 
                      key={edu.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, 'education', i)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'education', i)}
                      className={`p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3 relative group transition-all ${draggedItem?.type === 'education' && draggedItem.index === i ? 'opacity-50 border-indigo-300 bg-indigo-50' : 'opacity-100'}`}
                    >
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 pl-2">
                        <div className="cursor-grab text-gray-400 hover:text-indigo-600 p-1"><GripVertical size={16} /></div>
                        <button onClick={() => removeEducation(edu.id)} className="text-gray-400 hover:text-red-500 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">School</label>
                        <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={edu.school} onChange={e => updateEducationItem(edu.id, 'school', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Degree</label>
                          <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={edu.degree} onChange={e => updateEducationItem(edu.id, 'degree', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Dates</label>
                          <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500" value={edu.date} onChange={e => updateEducationItem(edu.id, 'date', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addEducation} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 text-sm font-semibold">
                    <Plus size={16} /> Add Education
                  </button>
                </div>
              )}
            </div>

            {['Skills', 'Certifications'].map((sectionName) => {
              const key = sectionName.toLowerCase() as 'skills' | 'certifications';
              return (
                <div key={key} className="border-b border-gray-100">
                  <button onClick={() => toggleSection(key)} className="w-full flex items-center justify-between p-4 font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                    {sectionName}
                    {openSections[key] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                  {openSections[key] && (
                    <div className="p-4 pt-0">
                      <textarea
                        rows={4}
                        placeholder={`Comma-separated list or bullet points of your ${key}...`}
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:border-indigo-500"
                        value={data[key] || ""}
                        onChange={(e) => update(key, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div className="p-5 space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                <LayoutTemplate size={16} className="text-gray-400" /> Layout Gallery
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => updateThemeLayout(l.value)}
                    className={`p-4 text-center rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                      data.theme?.layout === l.value
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-bold block">{l.label}</span>
                    <span className="text-[10px] text-gray-500 font-medium mt-1 leading-tight">{l.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}