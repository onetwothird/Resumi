import { useState } from "react";
import { ResumeData, ExperienceItem, EducationItem } from "@/types";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export default function BuilderSidebar({ data, onChange }: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    summary: true,
    experience: true,
    education: true,
    skills: false,
    certifications: false
  });
  
  const [isRewriting, setIsRewriting] = useState(false);
  const [, setRewriteError] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const update = (field: keyof ResumeData, value: unknown) => {
    onChange({ ...data, [field]: value });
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
      <div className="p-4 border-b border-gray-100">
        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
          <button className="flex-1 bg-white shadow-sm rounded-md py-1.5 text-indigo-700">Builder</button>
          <button className="flex-1 text-gray-500 py-1.5 hover:text-gray-700">Templates</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
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
                className="w-full p-3 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                value={data.summary}
                onChange={(e) => update("summary", e.target.value)}
              />
              <button onClick={rewriteWithAI} disabled={isRewriting} className="w-full bg-indigo-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-700">
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
              {(data.experience || []).map((exp) => (
                <div key={exp.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3 relative group">
                  <button onClick={() => removeExperience(exp.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Company</label>
                    <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none" value={exp.company} onChange={e => updateExperienceItem(exp.id, 'company', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Role</label>
                      <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none" value={exp.role} onChange={e => updateExperienceItem(exp.id, 'role', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Dates</label>
                      <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none" value={exp.date} onChange={e => updateExperienceItem(exp.id, 'date', e.target.value)} />
                    </div>
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
              {(data.education || []).map((edu) => (
                <div key={edu.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3 relative group">
                  <button onClick={() => removeEducation(edu.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">School</label>
                    <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none" value={edu.school} onChange={e => updateEducationItem(edu.id, 'school', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Degree</label>
                      <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none" value={edu.degree} onChange={e => updateEducationItem(edu.id, 'degree', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Dates</label>
                      <input className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none" value={edu.date} onChange={e => updateEducationItem(edu.id, 'date', e.target.value)} />
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
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                    value={data[key] || ""}
                    onChange={(e) => update(key, e.target.value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}