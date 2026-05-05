import { create } from 'zustand';

export type Page = 'editor' | 'resumes' | 'history';
export type AppState = 'idle' | 'processing' | 'results';

export interface CustomSection {
  id: string;
  title: string;
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
  skills: string[];
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
}

export interface OptimizationRun {
  id: string;
  resumeId: string;
  resumeTitle: string;
  beforeScore: number;
  afterScore: number;
  timestamp: number;
}

interface ResumeStore {
  currentPage: Page;
  appState: AppState;
  resumes: Resume[];
  currentResumeId: string | null;
  resumeData: ResumeData | null;
  history: OptimizationRun[];
  
  setCurrentPage: (page: Page) => void;
  setAppState: (state: AppState) => void;
  createResume: () => void;
  goToUpload: () => void;
  uploadResume: (data: ResumeData, filename?: string) => void;
  openResume: (id: string) => void;
  deleteResume: (id: string) => void;
  updateResumeField: (path: (string | number)[], value: any) => void;
  addBullet: (sectionType: string, sectionIndex: number, customItemIndex?: number) => void;
  deleteBullet: (sectionType: string, sectionIndex: number, bulletIndex: number, customItemIndex?: number) => void;
  addSection: (type: string) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  startOptimization: () => void;
  completeOptimization: (optimizedData: ResumeData, newScore: number) => void;
}

const emptyResumeData: ResumeData = {
  personalInfo: { name: "", email: "", phone: "", location: "" },
  summary: "",
  experience: [],
  education: [],
  skills: []
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  currentPage: 'editor',
  appState: 'idle',
  resumes: [],
  currentResumeId: null,
  resumeData: null,
  history: [],

  setCurrentPage: (page) => set({ currentPage: page }),
  
  setAppState: (state) => set({ appState: state }),
  
  goToUpload: () => {
    set({
      currentResumeId: null,
      resumeData: null,
      currentPage: 'editor',
      appState: 'idle'
    });
  },

  createResume: () => {
    const newId = generateId();
    const newData = JSON.parse(JSON.stringify(emptyResumeData));
    const newResume: Resume = {
      id: newId,
      title: 'Untitled Resume',
      data: newData,
      latestScore: null,
      lastUpdated: Date.now()
    };
    
    set((state) => ({
      resumes: [...state.resumes, newResume],
      currentResumeId: newId,
      resumeData: newData,
      currentPage: 'editor',
      appState: 'idle'
    }));
  },
  
  uploadResume: (data, filename = 'Uploaded Resume') => {
    const newId = generateId();
    const newResume: Resume = {
      id: newId,
      title: filename.replace(/\.[^/.]+$/, ""), // remove extension
      data,
      latestScore: null,
      lastUpdated: Date.now()
    };
    
    set((state) => ({
      resumes: [...state.resumes, newResume],
      currentResumeId: newId,
      resumeData: data,
      currentPage: 'editor',
      appState: 'idle'
    }));
  },
  
  openResume: (id) => {
    const resume = get().resumes.find(r => r.id === id);
    if (resume) {
      set({
        currentResumeId: id,
        resumeData: JSON.parse(JSON.stringify(resume.data)),
        currentPage: 'editor',
        appState: 'idle'
      });
    }
  },
  
  deleteResume: (id) => {
    set((state) => {
      const newResumes = state.resumes.filter(r => r.id !== id);
      const isCurrent = state.currentResumeId === id;
      return {
        resumes: newResumes,
        ...(isCurrent ? { currentResumeId: null, resumeData: null } : {})
      };
    });
  },
  
  updateResumeField: (path, value) => {
    set((state) => {
      if (!state.resumeData || !state.currentResumeId) return state;
      
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      
      const updatedResumes = state.resumes.map(r => 
        r.id === state.currentResumeId 
          ? { ...r, data: newData, lastUpdated: Date.now(), title: newData.personalInfo.name || r.title }
          : r
      );
      
      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  addBullet: (sectionType, sectionIndex, customItemIndex) => {
    set((state) => {
      if (!state.resumeData || !state.currentResumeId) return state;
      
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      if (sectionType === 'customSections' && typeof customItemIndex === 'number') {
        if (newData.customSections?.[sectionIndex]?.items?.[customItemIndex]) {
          if (!newData.customSections[sectionIndex].items[customItemIndex].bullets) {
            newData.customSections[sectionIndex].items[customItemIndex].bullets = [];
          }
          newData.customSections[sectionIndex].items[customItemIndex].bullets.push("");
        }
      } else {
        if (newData[sectionType] && newData[sectionType][sectionIndex]) {
          if (!newData[sectionType][sectionIndex].bullets) {
             newData[sectionType][sectionIndex].bullets = [];
          }
          newData[sectionType][sectionIndex].bullets.push("");
        }
      }
      
      const updatedResumes = state.resumes.map(r => 
        r.id === state.currentResumeId 
          ? { ...r, data: newData, lastUpdated: Date.now() }
          : r
      );
      
      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  deleteBullet: (sectionType, sectionIndex, bulletIndex, customItemIndex) => {
    set((state) => {
      if (!state.resumeData || !state.currentResumeId) return state;
      
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
      
      const updatedResumes = state.resumes.map(r => 
        r.id === state.currentResumeId 
          ? { ...r, data: newData, lastUpdated: Date.now() }
          : r
      );
      
      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  addSection: (type) => {
    set((state) => {
      if (!state.resumeData || !state.currentResumeId) return state;
      
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      
      if (type === 'experience') {
        newData.experience.push({ id: generateId(), role: "New Role", company: "Company", date: "Date", bullets: [""] });
      } else if (type === 'education') {
        newData.education.push({ id: generateId(), degree: "Degree", school: "School", date: "Date" });
      } else if (type === 'skills') {
        newData.skills.push("New Skill");
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
        if (newData.sectionOrder) {
          // insert it before 'skills' if skills is at the end, else push
          const skillsIdx = newData.sectionOrder.indexOf('skills');
          if (skillsIdx >= 0) {
            newData.sectionOrder.splice(skillsIdx, 0, customId);
          } else {
            newData.sectionOrder.push(customId);
          }
        }
      }
      
      const updatedResumes = state.resumes.map(r => 
        r.id === state.currentResumeId 
          ? { ...r, data: newData, lastUpdated: Date.now() }
          : r
      );
      
      return { resumeData: newData, resumes: updatedResumes };
    });
  },

  reorderSections: (startIndex, endIndex) => {
    set((state) => {
      if (!state.resumeData || !state.currentResumeId) return state;
      
      const newData = JSON.parse(JSON.stringify(state.resumeData));
      
      let order = newData.sectionOrder;
      if (!order) {
        order = ['summary', 'experience', 'education'];
        if (newData.customSections) {
          order.push(...newData.customSections.map((s: any) => s.id));
        }
        order.push('skills');
      }
      
      const result = Array.from(order);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      newData.sectionOrder = result;
      
      const updatedResumes = state.resumes.map(r => 
        r.id === state.currentResumeId 
          ? { ...r, data: newData, lastUpdated: Date.now() }
          : r
      );
      
      return { resumeData: newData, resumes: updatedResumes };
    });
  },
  
  startOptimization: () => set({ appState: 'processing' }),
  
  completeOptimization: (optimizedData, newScore) => set((state) => {
    if (!state.currentResumeId) return state;

    const currentResume = state.resumes.find(r => r.id === state.currentResumeId);
    const beforeScore = currentResume?.latestScore || Math.floor(Math.random() * 16) + 50;
    
    const newRun: OptimizationRun = {
      id: generateId(),
      resumeId: state.currentResumeId,
      resumeTitle: currentResume?.title || 'Unknown',
      beforeScore,
      afterScore: newScore,
      timestamp: Date.now()
    };
    
    const updatedResumes = state.resumes.map(r => 
      r.id === state.currentResumeId 
        ? { ...r, data: optimizedData, latestScore: newScore, lastUpdated: Date.now() }
        : r
    );
    
    return {
      appState: 'results',
      resumeData: optimizedData,
      resumes: updatedResumes,
      history: [newRun, ...state.history]
    };
  })
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
  skills: ["Figma", "React", "User Research"]
};
