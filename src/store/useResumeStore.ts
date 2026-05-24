import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export type Page = 'editor' | 'resumes' | 'history';
export type AppState = 'idle' | 'processing' | 'results';

export interface CustomSection {
  id: string;
  title: string;
  layout?: 'cards' | 'pills';
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    date: string;
    bullets: string[];
  }>;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    links?: string[];
  };
  summary: string;
  experience: Array<{
    id: string;
    role: string;
    company: string;
    date: string;
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    school: string;
    date: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
  };
  projects?: Array<{
    id: string;
    title: string;
    date: string;
    bullets: string[];
    description?: string;
    technologies?: string[];
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer?: string;
    date?: string;
  }>;
  languages?: Array<{
    id: string;
    name: string;
    proficiency?: string;
  }>;
  awards?: Array<{
    id: string;
    title: string;
    issuer?: string;
    date?: string;
  }>;
  hobbies?: string[];
  interests?: string[];
  volunteer?: string[];
  customSections?: CustomSection[];
  sectionOrder?: string[];
  [key: string]: any; // Allow custom sections
}

export interface Resume {
  id: string;
  title: string;
  data: ResumeData;
  latestScore: number | null;
  lastUpdated: number;
  targetRole?: string;
}

export interface OptimizationRun {
  id: string;
  resumeId: string;
  resumeTitle: string;
  beforeScore: number;
  afterScore: number;
  timestamp: number;
}

export interface OptimizationResult {
  initialScore: number;
  finalScore: number;
  breakdown: any;
  beforeBreakdown?: any;
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  startedAt?: number;
  completedAt?: number;
  category?: string;
  suggestions?: string[];
  targetRole?: string;
}

export interface IterationStep {
  iteration: number;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
}

interface ResumeStore {
  currentPage: Page;
  appState: AppState;
  resumes: Resume[];
  currentResumeId: string | null;
  resumeData: ResumeData | null;
  history: OptimizationRun[];
  optimizationResult: OptimizationResult | null;
  preOptimizationSnapshot: ResumeData | null;
  iterationTrail: IterationStep[];
  jdText: string;
  optimizationMode: string;
  liveScore: number | null;
  liveScoring: boolean;

  setCurrentPage: (page: Page) => void;
  setAppState: (state: AppState) => void;
  createResume: () => void;
  goToUpload: () => void;
  uploadResume: (data: ResumeData, filename?: string) => void;
  openResume: (id: string) => void;
  deleteResume: (id: string) => void;
  setLiveScore: (score: number | null) => void;
  setLiveScoring: (busy: boolean) => void;
  clearOptimizationContext: () => void;
  updateResumeField: (path: (string | number)[], value: any) => void;
  addBullet: (sectionType: string, sectionIndex: number, customItemIndex?: number) => void;
  deleteBullet: (sectionType: string, sectionIndex: number, bulletIndex: number, customItemIndex?: number) => void;
  addSection: (type: string) => void;
  removeSection: (sectionId: string) => void;
  removeItem: (sectionType: string, itemIndex: number, customSectionIndex?: number) => void;
  addItem: (sectionType: string, customSectionIndex?: number) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  startOptimization: () => void;
  completeOptimization: (optimizedData: ResumeData, resultPayload: any) => void;
  recordIterationStep: (step: IterationStep) => void;
  refreshFinalScore: () => Promise<void>;
  setJdText: (text: string) => void;
  saveJdText: (text: string) => Promise<void>;
  setOptimizationMode: (mode: string) => void;
  fetchResumes: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  exportToPdf: () => Promise<void>;
}

const emptyResumeData: ResumeData = {
  personalInfo: { name: "", email: "", phone: "", location: "" },
  summary: "",
  experience: [],
  education: [],
  skills: { technical: [], soft: [], tools: [] },
  projects: []
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Backend may ship `skills` as either `string[]` (after convertToFrontend)
 * or `{technical, soft, tools}` object (raw optimizer output). Mutation
 * actions assume array — flatten defensively before mutating.
 */
function ensureSkillsCategorized(data: any): void {
  if (!data) return;
  if (Array.isArray(data.skills)) {
    data.skills = {
      technical: data.skills,
      soft: [],
      tools: [],
    };
  } else if (!data.skills) {
    data.skills = { technical: [], soft: [], tools: [] };
  } else {
    data.skills.technical = data.skills.technical || [];
    data.skills.soft = data.skills.soft || [];
    data.skills.tools = data.skills.tools || [];
  }
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  currentPage: 'editor',
  appState: 'idle',
  resumes: [],
  currentResumeId: null,
  resumeData: null,
  history: [],
  optimizationResult: null,
  preOptimizationSnapshot: null,
  iterationTrail: [],
  jdText: '',
  optimizationMode: 'balanced',
  liveScore: null,
  liveScoring: false,

  setLiveScore: (score) => set({ liveScore: score }),
  setLiveScoring: (busy) => set({ liveScoring: busy }),
  clearOptimizationContext: () => set({ optimizationResult: null, liveScore: null, liveScoring: false }),

  setCurrentPage: (page) => set({ currentPage: page }),
  
  setAppState: (state) => set({ appState: state }),

  setJdText: (text) => set({ jdText: text }),
  setOptimizationMode: (mode) => set({ optimizationMode: mode }),
  
  fetchResumes: async () => {
    try {
      const data = await fetchApi('/resumes/');
      // Map backend format to frontend format.
      // backend returns array of { id, title, original_data, ats_score, updated_at }
      const parsedResumes: Resume[] = data.map((r: any) => ({
        id: r.id,
        title: r.title,
        data: r.optimized_data || r.original_data,
        latestScore: r.ats_score,
        lastUpdated: new Date(r.updated_at).getTime(),
        targetRole: r.target_role
      }));
      set({ resumes: parsedResumes });
    } catch (e) {
      console.error("Failed to fetch resumes", e);
    }
  },

  fetchHistory: async () => {
    try {
      const data = await fetchApi('/optimize/history'); 
      const parsedHistory: OptimizationRun[] = data.map((r: any) => ({
        id: r.id,
        resumeId: r.resume_id,
        resumeTitle: r.resumes?.title || 'Unknown',
        beforeScore: r.ats_score, // Or calculate difference
        afterScore: r.ats_score,
        timestamp: new Date(r.created_at).getTime()
      }));
      set({ history: parsedHistory });
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  },

  exportToPdf: async () => {
    const state = get();
    if (!state.resumeData) return;
    try {
      const backendData = convertToBackend(state.resumeData);
      const response = await fetch('http://localhost:8000/api/v1/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_json: backendData,
          format: 'pdf'
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = state.resumeData.personalInfo?.name || 'resume';
      a.download = `${name.replace(/ /g, '_')}_optimized.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export PDF", e);
      alert("Failed to export PDF: " + (e as Error).message);
    }
  },

  goToUpload: () => {
    set({
      currentResumeId: null,
      resumeData: null,
      currentPage: 'editor',
      appState: 'idle',
      optimizationResult: null,
      liveScore: null,
      liveScoring: false,
      jdText: ''
    });
  },

  createResume: async () => {
    const newId = generateId();
    const newData = JSON.parse(JSON.stringify(emptyResumeData));
    
    set((state) => ({
      resumes: [...state.resumes, {
        id: newId,
        title: 'Untitled Resume',
        data: newData,
        latestScore: null,
        lastUpdated: Date.now()
      }],
      currentResumeId: newId,
      resumeData: newData,
      currentPage: 'editor',
      appState: 'idle',
      optimizationResult: null,
      liveScore: null,
      liveScoring: false,
      jdText: ''
    }));

    try {
      const response = await fetchApi('/resumes/', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Untitled Resume',
          original_data: newData
        })
      });
      // Assuming response contains the real DB id, but since we optimistically created it,
      // we might need to update the id. For simplicity, let's just let it be or update it.
      if (response && response[0] && response[0].id) {
         set((state) => ({
           resumes: state.resumes.map(r => r.id === newId ? { ...r, id: response[0].id } : r),
           currentResumeId: state.currentResumeId === newId ? response[0].id : state.currentResumeId
         }));
      }
    } catch (e) {
      console.error("Failed to create resume on backend", e);
    }
  },
  
  uploadResume: async (data, filename = 'Uploaded Resume') => {
    let rawTitle = filename.replace(/\.[^/.]+$/, "");
    rawTitle = rawTitle.replace(/\s*\(\d+\)$/, "");
    rawTitle = rawTitle.replace(/_optimized$/i, "");
    const title = rawTitle.replace(/_/g, " ").trim();

    const existing = get().resumes.find(
      r => r.title.toLowerCase() === title.toLowerCase() || 
           r.title.replace(/ /g, '_').toLowerCase() === title.replace(/ /g, '_').toLowerCase()
    );

    if (existing) {
      const existingId = existing.id;
      set((state) => ({
        resumes: state.resumes.map(r => r.id === existingId ? { ...r, data, lastUpdated: Date.now() } : r),
        currentResumeId: existingId,
        resumeData: data,
        currentPage: 'editor',
        appState: 'idle',
        optimizationResult: null,
        liveScore: null,
        liveScoring: false,
        jdText: existing.targetRole || ''
      }));

      try {
        await fetchApi(`/resumes/${existingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            original_data: data,
            optimized_data: null
          })
        });
      } catch (e) {
        console.error("Failed to update existing resume", e);
      }
      return;
    }

    const newId = generateId();
    
    set((state) => ({
      resumes: [...state.resumes, {
        id: newId,
        title,
        data,
        latestScore: null,
        lastUpdated: Date.now()
      }],
      currentResumeId: newId,
      resumeData: data,
      currentPage: 'editor',
      appState: 'idle',
      optimizationResult: null,
      liveScore: null,
      liveScoring: false,
      jdText: ''
    }));

    try {
      const response = await fetchApi('/resumes/', {
        method: 'POST',
        body: JSON.stringify({
          title,
          original_data: data
        })
      });
      if (response && response[0] && response[0].id) {
         set((state) => ({
           resumes: state.resumes.map(r => r.id === newId ? { ...r, id: response[0].id } : r),
           currentResumeId: state.currentResumeId === newId ? response[0].id : state.currentResumeId
         }));
      }
    } catch (e) {
      console.error("Failed to upload resume to backend", e);
    }
  },
  
  openResume: (id) => {
    const resume = get().resumes.find(r => r.id === id);
    if (resume) {
      set({
        currentResumeId: id,
        resumeData: JSON.parse(JSON.stringify(resume.data)),
        currentPage: 'editor',
        appState: 'idle',
        optimizationResult: null,
        liveScore: null,
        liveScoring: false,
        jdText: resume.targetRole || ''
      });
    }
  },
  
  deleteResume: async (id) => {
    set((state) => {
      const newResumes = state.resumes.filter(r => r.id !== id);
      const isCurrent = state.currentResumeId === id;
      return {
        resumes: newResumes,
        ...(isCurrent ? { currentResumeId: null, resumeData: null } : {})
      };
    });
    
    try {
      await fetchApi(`/resumes/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Failed to delete resume on backend", e);
      // We could add the resume back to state on failure, but for simplicity we ignore.
    }
  },
  
  updateResumeField: (path, value) => {
    set((state) => {
      if (!state.resumeData) return state;

      const newData = JSON.parse(JSON.stringify(state.resumeData));

      // If touching skills, ensure flat-array shape before mutation.
      if (path[0] === 'skills') ensureSkillsCategorized(newData);

      // Defensive traversal: auto-create missing intermediates so freshly-added
      // sections can be edited before any data exists. Infer array vs object
      // from the next path segment's type.
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (current[key] == null) {
          const nextKey = path[i + 1];
          current[key] = typeof nextKey === 'number' ? [] : {};
        }
        current = current[key];
      }
      if (current && typeof current === 'object') {
        current[path[path.length - 1]] = value;
      }

      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId
              ? { ...r, data: newData, lastUpdated: Date.now(), title: newData.personalInfo?.name || r.title }
              : r
          )
        : state.resumes;

      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  addBullet: (sectionType, sectionIndex, customItemIndex) => {
    set((state) => {
      if (!state.resumeData) return state;
      
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      if (sectionType === 'customSections' && typeof customItemIndex === 'number') {
        if (newData.customSections?.[sectionIndex]?.items?.[customItemIndex]) {
          if (!newData.customSections[sectionIndex].items[customItemIndex].bullets) {
            newData.customSections[sectionIndex].items[customItemIndex].bullets = [];
          }
          newData.customSections[sectionIndex].items[customItemIndex].bullets.push("");
        } else {
          console.warn(`addBullet: Custom section at index ${sectionIndex} or item at index ${customItemIndex} not found.`);
        }
      } else {
        if (newData[sectionType] && newData[sectionType][sectionIndex]) {
          if (!newData[sectionType][sectionIndex].bullets) {
             newData[sectionType][sectionIndex].bullets = [];
          }
          newData[sectionType][sectionIndex].bullets.push("");
        } else {
          console.warn(`addBullet: Section ${sectionType} or item at index ${sectionIndex} not found.`);
        }
      }
      
      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId
              ? { ...r, data: newData, lastUpdated: Date.now() }
              : r
          )
        : state.resumes;
      
      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  deleteBullet: (sectionType, sectionIndex, bulletIndex, customItemIndex) => {
    set((state) => {
      if (!state.resumeData) return state;
      
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      
      if (sectionType === 'customSections' && typeof customItemIndex === 'number') {
        if (newData.customSections?.[sectionIndex]?.items?.[customItemIndex]?.bullets) {
          newData.customSections[sectionIndex].items[customItemIndex].bullets.splice(bulletIndex, 1);
        }
      } else {
        if (newData[sectionType] && newData[sectionType][sectionIndex] && newData[sectionType][sectionIndex].bullets) {
          newData[sectionType][sectionIndex].bullets.splice(bulletIndex, 1);
        }
      }
      
      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId
              ? { ...r, data: newData, lastUpdated: Date.now() }
              : r
          )
        : state.resumes;
      
      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  addSection: (type) => {
    set((state) => {
      if (!state.resumeData) return state;

      const newData = JSON.parse(JSON.stringify(state.resumeData));
      ensureSkillsCategorized(newData);

      if (!newData.sectionOrder) {
        newData.sectionOrder = ['summary', 'experience', 'education'];
        if (newData.projects?.length) newData.sectionOrder.push('projects');
        if (newData.customSections) newData.sectionOrder.push(...newData.customSections.map((s: any) => s.id));
        newData.sectionOrder.push('skills');
      }

      // Generic config: key -> {ensureField, defaultItem, insertBefore?}
      const SIMPLE_SECTIONS: Record<string, {
        field: keyof ResumeData | 'skills';
        defaultItem: any;
        insertBefore?: string;
      }> = {
        experience:     { field: 'experience',     defaultItem: () => ({ id: generateId(), role: "New Role", company: "Company", date: "Date", bullets: [""] }) },
        education:      { field: 'education',      defaultItem: () => ({ id: generateId(), degree: "Degree", school: "School", date: "Date" }) },
        projects:       { field: 'projects',       defaultItem: () => ({ id: generateId(), title: "New Project", date: "Date", bullets: [""] }), insertBefore: 'skills' },

        certifications: { field: 'certifications', defaultItem: () => ({ id: generateId(), name: "Certification Name", issuer: "Issuer", date: "" }), insertBefore: 'skills' },
        languages:      { field: 'languages',      defaultItem: () => ({ id: generateId(), name: "English", proficiency: "Fluent" }), insertBefore: 'skills' },
        awards:         { field: 'awards',         defaultItem: () => ({ id: generateId(), title: "Award Name", issuer: "", date: "" }), insertBefore: 'skills' },
        hobbies:        { field: 'hobbies',        defaultItem: () => "New Hobby" },
        interests:      { field: 'interests',      defaultItem: () => "New Interest" },
        volunteer:      { field: 'volunteer',      defaultItem: () => "Volunteer Activity" },
      };

      if (type === 'summary') {
        if (!newData.sectionOrder.includes('summary')) newData.sectionOrder.unshift('summary');
      } else if (type in SIMPLE_SECTIONS) {
        const cfg = SIMPLE_SECTIONS[type];
        const fieldKey = cfg.field as string;
        // Ensure section in order (insert before anchor if specified).
        if (!newData.sectionOrder.includes(type)) {
          if (cfg.insertBefore) {
            const idx = newData.sectionOrder.indexOf(cfg.insertBefore);
            newData.sectionOrder.splice(idx >= 0 ? idx : newData.sectionOrder.length, 0, type);
          } else {
            newData.sectionOrder.push(type);
          }
        }
        // Ensure array exists.
        if (!Array.isArray(newData[fieldKey])) newData[fieldKey] = [];
        // Append placeholder only if section is empty (first-time add).
        if (newData[fieldKey].length === 0) {
          newData[fieldKey].push(cfg.defaultItem());
        }
      } else if (type === 'custom') {
        if (!newData.customSections) newData.customSections = [];
        const customId = generateId();
        newData.customSections.push({
          id: customId,
          title: "Custom Section",
          items: [{
            id: generateId(),
            title: "Project / Role",
            subtitle: "Organization",
            date: "Date",
            bullets: [""]
          }]
        });
        const skillsIdx = newData.sectionOrder.indexOf('skills');
        if (skillsIdx >= 0) {
          newData.sectionOrder.splice(skillsIdx, 0, customId);
        } else {
          newData.sectionOrder.push(customId);
        }
      }
      
      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId
              ? { ...r, data: newData, lastUpdated: Date.now() }
              : r
          )
        : state.resumes;
      
      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  removeSection: (sectionId) => {
    set((state) => {
      if (!state.resumeData) return state;
      const newData = JSON.parse(JSON.stringify(state.resumeData));

      // Materialize sectionOrder if absent so the filter has something to act on.
      // Without this, fallback in ResumePreview keeps rendering built-in
      // sections (summary/experience/education) even after delete.
      if (!Array.isArray(newData.sectionOrder)) {
        newData.sectionOrder = ['summary', 'experience', 'education'];
        if (Array.isArray(newData.projects) && newData.projects.length > 0) newData.sectionOrder.push('projects');
        if (Array.isArray(newData.certifications) && newData.certifications.length > 0) newData.sectionOrder.push('certifications');
        if (Array.isArray(newData.awards) && newData.awards.length > 0) newData.sectionOrder.push('awards');
        if (Array.isArray(newData.languages) && newData.languages.length > 0) newData.sectionOrder.push('languages');
        if (Array.isArray(newData.volunteer) && newData.volunteer.length > 0) newData.sectionOrder.push('volunteer');
        if (Array.isArray(newData.customSections)) {
          newData.sectionOrder.push(...newData.customSections.map((s: any) => s.id));
        }
        newData.sectionOrder.push('skills');
        if (Array.isArray(newData.hobbies) && newData.hobbies.length > 0) newData.sectionOrder.push('hobbies');
        if (Array.isArray(newData.interests) && newData.interests.length > 0) newData.sectionOrder.push('interests');
      }

      // Drop from order.
      newData.sectionOrder = newData.sectionOrder.filter((id: string) => id !== sectionId);

      // Clear backing data so re-adding the section doesn't surface old items.
      const ARRAY_SECTIONS = new Set([
        'experience', 'education', 'projects', 'skills',
        'certifications', 'languages', 'awards',
        'hobbies', 'interests', 'volunteer',
      ]);
      if (sectionId === 'summary') {
        newData.summary = '';
      } else if (ARRAY_SECTIONS.has(sectionId)) {
        (newData as any)[sectionId] = [];
      } else if (Array.isArray(newData.customSections)) {
        // Custom section — drop matching entry.
        newData.customSections = newData.customSections.filter((s: any) => s.id !== sectionId);
      }

      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId ? { ...r, data: newData, lastUpdated: Date.now() } : r
          )
        : state.resumes;
      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  removeItem: (sectionType, itemIndex, customSectionIndex) => {
    set((state) => {
      if (!state.resumeData) return state;
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      if (sectionType === 'skills') ensureSkillsCategorized(newData);

      if (sectionType === 'customSections' && typeof customSectionIndex === 'number') {
        if (newData.customSections?.[customSectionIndex]?.items) {
          newData.customSections[customSectionIndex].items.splice(itemIndex, 1);
        }
      } else if (newData[sectionType] && Array.isArray(newData[sectionType])) {
        newData[sectionType].splice(itemIndex, 1);
      }

      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId ? { ...r, data: newData, lastUpdated: Date.now() } : r
          )
        : state.resumes;
      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  addItem: (sectionType, customSectionIndex) => {
    set((state) => {
      if (!state.resumeData) return state;
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      if (sectionType === 'skills') ensureSkillsCategorized(newData);

      const SIMPLE_SECTIONS: Record<string, () => any> = {
        experience:     () => ({ id: generateId(), role: "New Role", company: "Company", date: "Date", bullets: [""] }),
        education:      () => ({ id: generateId(), degree: "Degree", school: "School", date: "Date" }),
        projects:       () => ({ id: generateId(), title: "New Project", date: "Date", bullets: [""] }),
        certifications: () => ({ id: generateId(), name: "Certification Name", issuer: "Issuer", date: "" }),
        languages:      () => ({ id: generateId(), name: "English", proficiency: "Fluent" }),
        awards:         () => ({ id: generateId(), title: "Award Name", issuer: "", date: "" }),

        hobbies:        () => "New Hobby",
        interests:      () => "New Interest",
        volunteer:      () => "Volunteer Activity",
      };

      if (sectionType === 'customSections' && typeof customSectionIndex === 'number') {
        if (Array.isArray(newData.customSections) && newData.customSections[customSectionIndex]) {
          const sec = newData.customSections[customSectionIndex];
          if (!sec.items) sec.items = [];
          sec.items.push({
            id: generateId(),
            title: "Project / Role",
            subtitle: "Organization",
            date: "Date",
            bullets: [""]
          });
        }
      } else if (sectionType in SIMPLE_SECTIONS) {
        if (!Array.isArray(newData[sectionType])) {
          newData[sectionType] = [];
        }
        newData[sectionType].push(SIMPLE_SECTIONS[sectionType]());
      }

      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId ? { ...r, data: newData, lastUpdated: Date.now() } : r
          )
        : state.resumes;
      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  reorderSections: (startIndex, endIndex) => {
    set((state) => {
      if (!state.resumeData) return state;
      
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      
      let order = newData.sectionOrder;
      if (!order) {
        order = ['summary', 'experience', 'education'];
        if (newData.projects) {
          order.push('projects');
        }
        if (newData.customSections) {
          order.push(...newData.customSections.map((s: any) => s.id));
        }
        order.push('skills');
      }
      
      const result = Array.from(order);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      newData.sectionOrder = result;
      
      const updatedResumes = state.currentResumeId
        ? state.resumes.map(r =>
            r.id === state.currentResumeId
              ? { ...r, data: newData, lastUpdated: Date.now() }
              : r
          )
        : state.resumes;
      
      return { resumeData: newData, resumes: updatedResumes };
    });
  },
  
  startOptimization: () => set((state) => ({
    appState: 'processing',
    // Snapshot current resume before optimizer mutates it (for diff viewer).
    preOptimizationSnapshot: state.resumeData ? JSON.parse(JSON.stringify(state.resumeData)) : null,
    iterationTrail: [],
  })),

  recordIterationStep: (step) => set((state) => ({
    iterationTrail: [...state.iterationTrail.filter((s) => s.iteration !== step.iteration), step]
      .sort((a, b) => a.iteration - b.iteration),
  })),
  
  completeOptimization: (optimizedData, resultPayload) => set((state) => {
    if (!state.currentResumeId) return state;

    const currentResume = state.resumes.find(r => r.id === state.currentResumeId);
    const beforeScore = resultPayload.initial_score || currentResume?.latestScore || Math.floor(Math.random() * 16) + 50;
    
    const newRun: OptimizationRun = {
      id: generateId(),
      resumeId: state.currentResumeId,
      resumeTitle: currentResume?.title || 'Unknown',
      beforeScore,
      afterScore: resultPayload.final_score,
      timestamp: Date.now()
    };
    
    const updatedResumes = state.resumes.map(r => 
      r.id === state.currentResumeId 
        ? { ...r, data: optimizedData, latestScore: resultPayload.final_score, lastUpdated: Date.now() }
        : r
    );
    
    return {
      appState: 'results',
      resumeData: optimizedData,
      resumes: updatedResumes,
      history: [newRun, ...state.history],
      optimizationResult: {
        initialScore: beforeScore,
        finalScore: resultPayload.final_score,
        breakdown: resultPayload.breakdown || {},
        beforeBreakdown: resultPayload.before_breakdown || resultPayload.initial_breakdown || undefined,
        missingKeywords: resultPayload.missing_keywords || [],
        strengths: resultPayload.strengths || [],
        weaknesses: resultPayload.weaknesses || [],
        startedAt: resultPayload._startedAt,
        completedAt: Date.now(),
        category: resultPayload.category,
        suggestions: resultPayload.suggestions || [],
        targetRole: state.jdText ? state.jdText : undefined,
      }
    };
  }),

  saveJdText: async (jdText: string) => {
    const state = get();
    if (!state.currentResumeId) return;
    try {
      await fetchApi(`/resumes/${state.currentResumeId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          target_role: jdText
        })
      });
      set((s) => ({
        resumes: s.resumes.map(r => r.id === s.currentResumeId ? { ...r, targetRole: jdText } : r)
      }));
    } catch (e) {
      console.error("Failed to save JD text", e);
    }
  },

  refreshFinalScore: async () => {
    const state = get();
    if (!state.resumeData || !state.optimizationResult) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/optimize/score-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_json: convertToBackend(state.resumeData),
          jd_text: state.jdText || '',
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const score = typeof data?.score === 'number' ? Math.round(data.score) : null;
      if (score === null) return;
      set((s) => {
        if (!s.optimizationResult) return s;
        return {
          optimizationResult: {
            ...s.optimizationResult,
            finalScore: score,
            breakdown: data.breakdown || s.optimizationResult.breakdown,
          },
        };
      });
    } catch {
      // Silent — snapshot stays visible on failure.
    }
  },
}));

export const mockResumeData: ResumeData = {
  personalInfo: {
    name: "Alex Designer",
    email: "alex@example.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
  },
  summary: "Creative and detail-oriented product designer with 5+ years of experience building delightful user experiences.",
  experience: [
    {
      id: "exp1",
      role: "Senior Product Designer",
      company: "Tech Corp",
      date: "2021 - Present",
      bullets: [
        "Led the redesign of the core product dashboard.",
        "Collaborated with engineering to deliver features.",
      ]
    }
  ],
  education: [
    {
      id: "edu1",
      degree: "B.S. Interaction Design",
      school: "Design University",
      date: "2014 - 2018"
    }
  ],
  projects: [
    {
      id: "proj1",
      title: "Portfolio Website",
      date: "2023",
      bullets: [
        "Designed and developed a responsive portfolio website using React and TailwindCSS.",
        "Optimized page load speed and implemented modern animations."
      ]
    }
  ],
  skills: {
    technical: ["React", "Figma"],
    soft: ["User Research"],
    tools: []
  }
};

export function convertToBackend(frontendData: ResumeData): any {
  const personalInfo = frontendData.personalInfo || { name: "", email: "", phone: "", location: "", links: [] };
  const links = personalInfo.links || [];
  
  return {
    basics: {
      name: personalInfo.name || "",
      email: personalInfo.email || "",
      phone: personalInfo.phone || "",
      location: personalInfo.location || "",
      // Derived legacy fields (engine + LLM prompts still read these).
      linkedin: links.find(l => l.includes("linkedin")) || "",
      github: links.find(l => l.includes("github")) || "",
      // Full link list — preserves arbitrary URLs (portfolio, Behance, Twitter, etc.)
      links,
    },
    summary: frontendData.summary || "",
    experience: (frontendData.experience || []).map((exp: any) => {
      const [startDate = "", endDate = ""] = (exp.date || "").split("-").map((s: string) => s.trim());
      return {
        company: exp.company || "",
        job_title: exp.role || "",
        start_date: startDate,
        end_date: endDate,
        location: "",
        bullets: exp.bullets || [],
        technologies: []
      };
    }),
    education: (frontendData.education || []).map((edu: any) => {
      const [startDate = "", endDate = ""] = (edu.date || "").split("-").map((s: string) => s.trim());
      return {
        institution: edu.school || "",
        degree: edu.degree || "",
        start_date: startDate,
        end_date: endDate,
        gpa: "",
        location: ""
      };
    }),
    projects: (frontendData.projects || []).map((proj: any) => {
      return {
        title: proj.title || "",
        date: proj.date || "",
        description: proj.description || "",
        bullets: proj.bullets || [],
        technologies: proj.technologies || []
      };
    }),
    certifications: (frontendData.certifications || []).map(c =>
      [c.name, c.issuer, c.date].filter(Boolean).join(" | ")
    ).filter(Boolean),
    languages: (frontendData.languages || []).map(l =>
      [l.name, l.proficiency].filter(Boolean).join(" | ")
    ).filter(Boolean),
    awards: (frontendData.awards || []).map(a =>
      [a.title, a.issuer, a.date].filter(Boolean).join(" | ")
    ).filter(Boolean),
    hobbies: frontendData.hobbies || [],
    interests: frontendData.interests || [],
    volunteer: frontendData.volunteer || [],
    skills: {
      technical: frontendData.skills?.technical || [],
      soft: frontendData.skills?.soft || [],
      tools: frontendData.skills?.tools || []
    },
    custom_sections: frontendData.customSections || [],
    other: ""
  };
}

export function convertToFrontend(backendData: any): ResumeData {
  const basics = backendData?.basics || {};
  // Prefer full `links` array when backend ships it. Fall back to
  // legacy linkedin/github fields for older payloads.
  const rawLinks: string[] = Array.isArray(basics.links) && basics.links.length > 0
    ? basics.links.filter((l: any) => typeof l === 'string' && l.trim())
    : [basics.linkedin, basics.github].filter((l: any) => typeof l === 'string' && l.trim());
  // Dedupe while preserving order.
  const seen = new Set<string>();
  const links: string[] = [];
  for (const l of rawLinks) {
    if (!seen.has(l)) {
      seen.add(l);
      links.push(l);
    }
  }

  return {
    personalInfo: {
      name: basics.name || "",
      email: basics.email || "",
      phone: basics.phone || "",
      location: basics.location || "",
      links
    },
    summary: backendData?.summary || "",
    experience: (backendData?.experience || []).map((exp: any, idx: number) => ({
      id: exp.id || `exp_${idx}_${Date.now()}`,
      role: exp.job_title || "",
      company: exp.company || "",
      date: exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : (exp.start_date || exp.end_date || ""),
      bullets: exp.bullets || []
    })),
    education: (backendData?.education || []).map((edu: any, idx: number) => ({
      id: edu.id || `edu_${idx}_${Date.now()}`,
      degree: edu.degree || "",
      school: edu.institution || "",
      date: edu.start_date && edu.end_date ? `${edu.start_date} - ${edu.end_date}` : (edu.start_date || edu.end_date || "")
    })),
    projects: (backendData?.projects || []).map((proj: any, idx: number) => ({
      id: proj.id || `proj_${idx}_${Date.now()}`,
      title: proj.title || "",
      date: proj.date || "",
      bullets: proj.bullets || [],
      description: proj.description || "",
      technologies: proj.technologies || []
    })),
    skills: {
      technical: backendData?.skills?.technical || [],
      soft: backendData?.skills?.soft || [],
      tools: backendData?.skills?.tools || []
    },
    certifications: (backendData?.certifications || []).map((c: any, idx: number) => {
      if (typeof c === 'string') {
        const parts = c.split('|').map((s: string) => s.trim());
        return { id: `cert_${idx}_${Date.now()}`, name: parts[0] || '', issuer: parts[1] || '', date: parts[2] || '' };
      }
      return { id: c.id || `cert_${idx}_${Date.now()}`, name: c.name || '', issuer: c.issuer || '', date: c.date || '' };
    }),
    languages: (backendData?.languages || []).map((l: any, idx: number) => {
      if (typeof l === 'string') {
        const parts = l.split('|').map((s: string) => s.trim());
        return { id: `lang_${idx}_${Date.now()}`, name: parts[0] || '', proficiency: parts[1] || '' };
      }
      return { id: l.id || `lang_${idx}_${Date.now()}`, name: l.name || '', proficiency: l.proficiency || '' };
    }),
    awards: (backendData?.awards || []).map((a: any, idx: number) => {
      if (typeof a === 'string') {
        const parts = a.split('|').map((s: string) => s.trim());
        return { id: `award_${idx}_${Date.now()}`, title: parts[0] || '', issuer: parts[1] || '', date: parts[2] || '' };
      }
      return { id: a.id || `award_${idx}_${Date.now()}`, title: a.title || '', issuer: a.issuer || '', date: a.date || '' };
    }),
    hobbies: backendData?.hobbies || [],
    interests: backendData?.interests || [],
    volunteer: backendData?.volunteer || [],
    customSections: backendData?.custom_sections || []
  };
}
