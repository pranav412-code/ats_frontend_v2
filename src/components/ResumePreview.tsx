import React, { useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { InlineEditableText } from './InlineEditableText';
import { Plus, GripVertical, X, Trash2, Sparkles, ChevronDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { StringPillSection } from './editor/StringPillSection';
import { ObjectCardSection } from './editor/ObjectCardSection';
import { StructuredDateInput } from './editor/StructuredDateInput';
import { ConfirmModal } from './shared/ConfirmModal';

// Backend sometimes ships certifications/awards/languages as pipe-joined
// strings instead of objects. Normalize defensively so editor always sees
// shaped items.
function coerceCertOrAward(arr: any[], primaryKey: 'name' | 'title'): any[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item, idx) => {
    if (typeof item === 'string') {
      const parts = item.split('|').map((s) => s.trim());
      return {
        id: `coerced_${primaryKey}_${idx}`,
        [primaryKey]: parts[0] || '',
        issuer: parts[1] || '',
        date: parts[2] || '',
      };
    }
    return item;
  });
}

function coerceLanguages(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item, idx) => {
    if (typeof item === 'string') {
      const parts = item.split('|').map((s) => s.trim());
      return {
        id: `coerced_lang_${idx}`,
        name: parts[0] || '',
        proficiency: parts[1] || '',
      };
    }
    return item;
  });
}

export function ResumePreview() {
  const { resumeData, updateResumeField, addBullet, deleteBullet, addSection, removeSection, removeItem, addItem, reorderSections, optimizationResult } = useResumeStore();
  const [pendingSectionDelete, setPendingSectionDelete] = useState<string | null>(null);
  const [pendingItemDelete, setPendingItemDelete] = useState<{
    sectionType: string;
    itemIndex: number;
    customSectionIndex?: number;
    label?: string;
  } | null>(null);
  const [editingCount, setEditingCount] = useState(0);

  const handleEditStateChange = (isEditing: boolean) => {
    setEditingCount((prev) => (isEditing ? prev + 1 : Math.max(0, prev - 1)));
  };

  if (!resumeData) return null;

  const personalInfo = resumeData.personalInfo || { name: '', email: '', phone: '', location: '', links: [] };
  const { summary, experience, education, customSections, projects } = resumeData;
  const certifications = coerceCertOrAward(resumeData.certifications || [], 'name');
  const awards = coerceCertOrAward(resumeData.awards || [], 'title');
  const languages = coerceLanguages(resumeData.languages || []);
  const hobbies: string[] = Array.isArray(resumeData.hobbies) ? resumeData.hobbies : [];
  const interests: string[] = Array.isArray(resumeData.interests) ? resumeData.interests : [];
  const volunteer: string[] = Array.isArray(resumeData.volunteer) ? resumeData.volunteer : [];

  // Normalize skills — backend may emit { technical, soft, tools } dict; UI expects flat array.
  const rawSkills = resumeData.skills;
  const skills: string[] = Array.isArray(rawSkills)
    ? rawSkills
    : rawSkills && typeof rawSkills === 'object'
    ? [
        ...((rawSkills as any).technical || []),
        ...((rawSkills as any).soft || []),
        ...((rawSkills as any).tools || []),
      ]
    : [];

  // Detect leftover PDF extraction garbage in any text field.
  const hasGarbage = React.useMemo(() => {
    const probe = JSON.stringify({ summary, experience, education, projects, skills });
    return /\(cid:\s*\d+\s*\)/.test(probe);
  }, [summary, experience, education, projects, skills]);

  const sectionOrder = resumeData.sectionOrder || [
    'summary',
    'experience',
    'education',
    ...(projects && projects.length > 0 ? ['projects'] : []),
    ...(certifications.length > 0 ? ['certifications'] : []),
    ...(awards.length > 0 ? ['awards'] : []),
    ...(languages.length > 0 ? ['languages'] : []),
    ...(volunteer.length > 0 ? ['volunteer'] : []),
    ...(customSections ? customSections.map((s) => s.id) : []),
    'skills',
    ...(hobbies.length > 0 ? ['hobbies'] : []),
    ...(interests.length > 0 ? ['interests'] : []),
  ];

  const KNOWN_SECTIONS = new Set([
    'summary', 'experience', 'education', 'projects', 'skills',
    'certifications', 'languages', 'awards',
    'hobbies', 'interests', 'volunteer',
  ]);

  const getBulletId = (sectionType: string, sectionIndex: number, bulletIndex: number, customItemIndex?: number) => {
    return customItemIndex !== undefined 
      ? `bullet-${sectionType}-${sectionIndex}-${customItemIndex}-${bulletIndex}`
      : `bullet-${sectionType}-${sectionIndex}-${bulletIndex}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent, sectionType: string, sectionIndex: number, bulletIndex: number, currentValue: string, customItemIndex?: number) => {
    if (e.key === 'Backspace' && currentValue === '') {
      e.preventDefault();
      deleteBullet(sectionType, sectionIndex, bulletIndex, customItemIndex);
      setTimeout(() => {
        const prevId = getBulletId(sectionType, sectionIndex, bulletIndex - 1, customItemIndex);
        const prevBullet = document.getElementById(prevId);
        if (prevBullet) {
          const textbox = prevBullet.querySelector('[role="textbox"]') as HTMLElement;
          if (textbox) textbox.click();
        }
      }, 50);
    }
    // Handle Enter to add next bullet
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBullet(sectionType, sectionIndex, customItemIndex);
      setTimeout(() => {
        const nextId = getBulletId(sectionType, sectionIndex, bulletIndex + 1, customItemIndex);
        const nextBullet = document.getElementById(nextId);
        if (nextBullet) {
          const textbox = nextBullet.querySelector('[role="textbox"]') as HTMLElement;
          if (textbox) textbox.click();
        }
      }, 50);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;
    reorderSections(source.index, destination.index);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-8 pb-20 h-full overflow-y-auto w-full font-serif relative text-zinc-900 dark:text-zinc-100">
      {optimizationResult && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 text-[10px] font-mono uppercase tracking-[0.25em] font-bold animate-in fade-in zoom-in duration-300 z-10 pointer-events-none bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
          <Sparkles size={12} />
          AI-Optimized
        </div>
      )}

      {hasGarbage && (
        <div className="mb-4 px-3 py-2 border border-amber-700 dark:border-amber-500 text-amber-900 dark:text-amber-200 text-[11px] font-mono uppercase tracking-wider bg-amber-50/60 dark:bg-amber-950/30">
          Parsing artifacts detected (cid:N / glyph leaks). Re-upload PDF or edit fields manually.
        </div>
      )}
      {/* Header */}
      <div className="text-center mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-6 group relative">
        <InlineEditableText
          value={personalInfo.name}
          onSave={(v) => updateResumeField(['personalInfo', 'name'], v)}
          className="text-3xl font-bold mb-2 font-sans mx-auto text-center block"
          placeholder="Your Name"
          onEditStateChange={handleEditStateChange}
        />
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400 font-sans items-center">
          <InlineEditableText value={personalInfo.email} onSave={(v) => updateResumeField(['personalInfo', 'email'], v)} placeholder="Email" type="email" onEditStateChange={handleEditStateChange} />
          <span>•</span>
          <InlineEditableText value={personalInfo.phone} onSave={(v) => updateResumeField(['personalInfo', 'phone'], v)} placeholder="Phone" type="tel" onEditStateChange={handleEditStateChange} />
          <span>•</span>
          <InlineEditableText value={personalInfo.location} onSave={(v) => updateResumeField(['personalInfo', 'location'], v)} placeholder="Location" onEditStateChange={handleEditStateChange} />
          
          {personalInfo.links?.map((link, linkIndex) => (
            <React.Fragment key={linkIndex}>
              <span>•</span>
              <div className="relative group/link flex items-center">
                <InlineEditableText
                  value={link}
                  onSave={(v) => {
                    const newLinks = [...(personalInfo.links || [])];
                    if (v === '') {
                      newLinks.splice(linkIndex, 1);
                    } else {
                      newLinks[linkIndex] = v;
                    }
                    updateResumeField(['personalInfo', 'links'], newLinks);
                  }}
                  placeholder="Link (e.g. LinkedIn, GitHub)"
                  type="url"
                  onEditStateChange={handleEditStateChange}
                />
                <button 
                  onClick={() => {
                    const newLinks = [...(personalInfo.links || [])];
                    newLinks.splice(linkIndex, 1);
                    updateResumeField(['personalInfo', 'links'], newLinks);
                  }}
                  className="absolute -right-4 opacity-0 group-hover/link:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity"
                  title="Remove link"
                >
                  <X size={12} />
                </button>
              </div>
            </React.Fragment>
          ))}
          
          <button 
            onClick={() => {
              const newLinks = [...(personalInfo.links || []), ""];
              updateResumeField(['personalInfo', 'links'], newLinks);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 ml-2"
            title="Add link"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="resume-sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {sectionOrder.map((sectionId, index) => {
                const customSectionIndex = customSections?.findIndex(s => s.id === sectionId) ?? -1;
                const customSection = customSectionIndex >= 0 ? customSections![customSectionIndex] : null;

                if (!KNOWN_SECTIONS.has(sectionId) && !customSection) {
                  return null;
                }

                return (
                  <React.Fragment key={sectionId}>
                    <Draggable key={sectionId} draggableId={sectionId} index={index} isDragDisabled={editingCount > 0}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group/section relative rounded-lg border border-transparent transition-colors sm:-mx-8 sm:px-8 py-2 -my-2 ${
                            snapshot.isDragging 
                              ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-xl z-50 ring-1 ring-zinc-200 dark:ring-zinc-700' 
                              : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                          }`}
                        >
                        <div
                          {...provided.dragHandleProps}
                          className="absolute left-1 sm:left-2 top-3 p-1 -translate-x-2 opacity-0 group-hover/section:translate-x-0 group-hover/section:opacity-100 transition-all cursor-grab text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
                        >
                          <GripVertical size={16} />
                        </div>
                        
                        <button
                          onClick={() => setPendingSectionDelete(sectionId)}
                          className="absolute right-1 sm:right-2 top-3 p-1 translate-x-2 opacity-0 group-hover/section:translate-x-0 group-hover/section:opacity-100 transition-all cursor-pointer text-zinc-400 hover:text-red-500"
                          title="Delete section"
                        >
                          <Trash2 size={16} />
                        </button>

                        {sectionId === 'summary' && (
                          <div className="font-sans">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-1">Summary</h3>
                            <InlineEditableText
                              value={summary}
                              onSave={(v) => updateResumeField(['summary'], v)}
                              multiline
                              className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed block w-full"
                              placeholder="Professional summary..."
                              onEditStateChange={handleEditStateChange}
                            />
                          </div>
                        )}

                        {sectionId === 'experience' && (
                          <div className="font-sans">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-1">Experience</h3>
                            {experience.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => addItem('experience')}
                                className="w-full text-left inline-flex items-center justify-center gap-2 text-sm italic text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                              >
                                <Plus size={16} />
                                Add Experience
                              </button>
                            ) : (
                                <div className="space-y-6 mt-2">
                                  {experience.map((exp, expIndex) => (
                                    <div key={exp.id} className="group/item relative px-7 sm:-mx-8 sm:px-8 py-2 -my-2 rounded-md hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20">
                                      <button
                                        onClick={() => setPendingItemDelete({ sectionType: 'experience', itemIndex: expIndex, label: 'job' })}
                                        className="absolute right-1 sm:right-2 top-2 opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-1"
                                        title="Delete job"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                      <div className="flex justify-between items-baseline mb-1">
                                      <InlineEditableText
                                        value={exp.role}
                                        onSave={(v) => updateResumeField(['experience', expIndex, 'role'], v)}
                                        className="font-medium flex-1 mr-4"
                                        placeholder="Job Title"
                                        onEditStateChange={handleEditStateChange}
                                      />
                                      <StructuredDateInput
                                        value={exp.date}
                                        onSave={(v) => updateResumeField(['experience', expIndex, 'date'], v)}
                                        className="text-xs text-zinc-500 dark:text-zinc-400 text-right shrink-0 min-w-24 border-b border-transparent"
                                        placeholder="Date Range"
                                        isRange={true}
                                        onEditStateChange={handleEditStateChange}
                                      />
                                    </div>
                                    <InlineEditableText
                                      value={exp.company}
                                      onSave={(v) => updateResumeField(['experience', expIndex, 'company'], v)}
                                      className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 italic block"
                                      placeholder="Company Name"
                                      onEditStateChange={handleEditStateChange}
                                    />
                                    
                                    <div className="mt-2 relative group/bullet">
                                      <InlineEditableText
                                        value={exp.bullets.join('\n')}
                                        onSave={(v) => {
                                          const newBullets = v.split('\n');
                                          updateResumeField(['experience', expIndex, 'bullets'], newBullets);
                                        }}
                                        multiline
                                        className="block w-full text-sm text-zinc-700 dark:text-zinc-300 leading-snug whitespace-pre-wrap"
                                        placeholder="Describe your achievements..."
                                        onEditStateChange={handleEditStateChange}
                                      />
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addItem('experience')}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 px-2 py-1 mt-3 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 rounded-md transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                >
                                  <Plus size={12} /> Add job
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {sectionId === 'education' && (
                          <div className="font-sans">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-1">Education</h3>
                            {education.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => addItem('education')}
                                className="w-full text-left inline-flex items-center justify-center gap-2 text-sm italic text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                              >
                                <Plus size={16} />
                                Add Education
                              </button>
                            ) : (
                              <div className="space-y-4 mt-2">
                                {education.map((edu, eduIndex) => (
                                  <div key={edu.id} className="group/item relative px-7 sm:-mx-8 sm:px-8 py-2 -my-2 rounded-md hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20">
                                    <button
                                      onClick={() => setPendingItemDelete({ sectionType: 'education', itemIndex: eduIndex, label: 'school' })}
                                      className="absolute right-1 sm:right-2 top-2 opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-1"
                                      title="Delete school"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <div className="flex justify-between items-baseline">
                                      <InlineEditableText
                                        value={edu.degree}
                                        onSave={(v) => updateResumeField(['education', eduIndex, 'degree'], v)}
                                        className="font-medium mr-4 flex-1 border-b border-transparent"
                                        placeholder="Degree"
                                        onEditStateChange={handleEditStateChange}
                                      />
                                      <StructuredDateInput
                                        value={edu.date}
                                        onSave={(v) => updateResumeField(['education', eduIndex, 'date'], v)}
                                        className="text-xs text-zinc-500 dark:text-zinc-400 text-right shrink-0 min-w-24 border-b border-transparent"
                                        placeholder="Date Range"
                                        isRange={true}
                                        onEditStateChange={handleEditStateChange}
                                      />
                                    </div>
                                    <InlineEditableText
                                      value={edu.school}
                                      onSave={(v) => updateResumeField(['education', eduIndex, 'school'], v)}
                                      className="text-sm text-zinc-600 dark:text-zinc-400 block border-b border-transparent"
                                      placeholder="School Name"
                                      onEditStateChange={handleEditStateChange}
                                    />
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addItem('education')}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 px-2 py-1 mt-3 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 rounded-md transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                >
                                  <Plus size={12} /> Add school
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {sectionId === 'projects' && (
                          <div className="font-sans">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-1">Projects</h3>
                            {(!projects || projects.length === 0) ? (
                              <button
                                type="button"
                                onClick={() => addItem('projects')}
                                className="w-full text-left inline-flex items-center justify-center gap-2 text-sm italic text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                              >
                                <Plus size={16} />
                                Add Project
                              </button>
                            ) : (
                              <div className="space-y-6 mt-2">
                                {projects.map((proj, projIndex) => (
                                  <div key={proj.id} className="group/item relative px-7 sm:-mx-8 sm:px-8 py-2 -my-2 rounded-md hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20">
                                    <button
                                      onClick={() => setPendingItemDelete({ sectionType: 'projects', itemIndex: projIndex, label: 'project' })}
                                      className="absolute right-1 sm:right-2 top-2 opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-1"
                                      title="Delete project"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <div className="flex justify-between items-baseline mb-1">
                                      <InlineEditableText
                                        value={proj.title}
                                        onSave={(v) => updateResumeField(['projects', projIndex, 'title'], v)}
                                        className="font-medium flex-1 mr-4"
                                        placeholder="Project Title"
                                        onEditStateChange={handleEditStateChange}
                                      />
                                      <StructuredDateInput
                                        value={proj.date}
                                        onSave={(v) => updateResumeField(['projects', projIndex, 'date'], v)}
                                        className="text-xs text-zinc-500 dark:text-zinc-400 text-right shrink-0 min-w-24 border-b border-transparent"
                                        placeholder="Date / Year"
                                        isRange={false}
                                        onEditStateChange={handleEditStateChange}
                                      />
                                    </div>
                                    
                                    <div className="mt-2 relative group/bullet">
                                      <InlineEditableText
                                        value={proj.bullets.join('\n')}
                                        onSave={(v) => {
                                          const newBullets = v.split('\n');
                                          updateResumeField(['projects', projIndex, 'bullets'], newBullets);
                                        }}
                                        multiline
                                        className="block w-full text-sm text-zinc-700 dark:text-zinc-300 leading-snug whitespace-pre-wrap"
                                        placeholder="Describe your project accomplishments..."
                                        onEditStateChange={handleEditStateChange}
                                      />
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addItem('projects')}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 px-2 py-1 mt-3 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 rounded-md transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                >
                                  <Plus size={12} /> Add project
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {customSection && (
                          <div className="font-sans">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="flex-1">
                                <InlineEditableText
                                  value={customSection.title}
                                  onSave={(v) => updateResumeField(['customSections', customSectionIndex, 'title'], v)}
                                  className="text-xs font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1 block w-full text-left bg-transparent"
                                  placeholder="Section Title"
                                  onEditStateChange={handleEditStateChange}
                                />
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-sans border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 select-none shrink-0">
                                <span className="font-bold uppercase tracking-wider">Layout:</span>
                                <button
                                  type="button"
                                  onClick={() => updateResumeField(['customSections', customSectionIndex, 'layout'], 'cards')}
                                  className={`px-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 ${customSection.layout !== 'pills' ? 'text-zinc-900 dark:text-zinc-100 font-bold' : ''}`}
                                >
                                  Cards
                                </button>
                                <span>|</span>
                                <button
                                  type="button"
                                  onClick={() => updateResumeField(['customSections', customSectionIndex, 'layout'], 'pills')}
                                  className={`px-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 ${customSection.layout === 'pills' ? 'text-zinc-900 dark:text-zinc-100 font-bold' : ''}`}
                                >
                                  Pills
                                </button>
                              </div>
                            </div>
                            
                            {customSection.layout === 'pills' ? (
                              <StringPillSection
                                title=""
                                items={(customSection.items || []).map((it) => it.title)}
                                itemPlaceholder="Item"
                                placeholder={`Add to ${customSection.title.toLowerCase()}...`}
                                onAdd={() => addItem('customSections', customSectionIndex)}
                                onRemove={(i) => removeItem('customSections', i, customSectionIndex)}
                                onUpdate={(i, v) => updateResumeField(['customSections', customSectionIndex, 'items', i, 'title'], v)}
                                onAddNewValue={(val) => {
                                  const newItems = [...(customSection.items || [])];
                                  newItems.push({
                                    id: Math.random().toString(36).substring(2, 9),
                                    title: val,
                                    subtitle: '',
                                    date: '',
                                    bullets: []
                                  });
                                  updateResumeField(['customSections', customSectionIndex, 'items'], newItems);
                                }}
                                onEditStateChange={handleEditStateChange}
                              />
                            ) : customSection.items.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => addItem('customSections', customSectionIndex)}
                                className="inline-flex items-center gap-1.5 text-sm italic text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                              >
                                <Plus size={12} />
                                Add Item
                              </button>
                            ) : (
                              <div className="space-y-6 mt-2">
                                {customSection.items.map((item, itemIndex) => (
                                  <div key={item.id} className="group/item relative px-7 sm:-mx-8 sm:px-8 py-2 -my-2 rounded-md hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20">
                                    <button
                                      onClick={() => setPendingItemDelete({ sectionType: 'customSections', itemIndex, customSectionIndex, label: 'item' })}
                                      className="absolute right-1 sm:right-2 top-2 opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-1"
                                      title="Delete item"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <div className="flex justify-between items-baseline mb-1">
                                      <InlineEditableText
                                        value={item.title}
                                        onSave={(v) => updateResumeField(['customSections', customSectionIndex, 'items', itemIndex, 'title'], v)}
                                        className="font-medium flex-1 mr-4"
                                        placeholder="Item Title"
                                        onEditStateChange={handleEditStateChange}
                                      />
                                      <StructuredDateInput
                                        value={item.date}
                                        onSave={(v) => updateResumeField(['customSections', customSectionIndex, 'items', itemIndex, 'date'], v)}
                                        className="text-xs text-zinc-500 dark:text-zinc-400 text-right shrink-0 min-w-24 border-b border-transparent"
                                        placeholder="Date Range"
                                        isRange={true}
                                        onEditStateChange={handleEditStateChange}
                                      />
                                    </div>
                                    <InlineEditableText
                                      value={item.subtitle}
                                      onSave={(v) => updateResumeField(['customSections', customSectionIndex, 'items', itemIndex, 'subtitle'], v)}
                                      className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 italic block"
                                      placeholder="Subtitle (e.g. Organization)"
                                      onEditStateChange={handleEditStateChange}
                                    />
                                    
                                    <div className="mt-2 relative group/bullet">
                                      <InlineEditableText
                                        value={item.bullets.join('\n')}
                                        onSave={(v) => {
                                          const newBullets = v.split('\n');
                                          updateResumeField(['customSections', customSectionIndex, 'items', itemIndex, 'bullets'], newBullets);
                                        }}
                                        multiline
                                        className="block w-full text-sm text-zinc-700 dark:text-zinc-300 leading-snug whitespace-pre-wrap"
                                        placeholder="Describe your achievements..."
                                        onEditStateChange={handleEditStateChange}
                                      />
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addItem('customSections', customSectionIndex)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 px-2 py-1 mt-3 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 rounded-md transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                >
                                  <Plus size={12} /> Add item
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {sectionId === 'skills' && (
                          <div className="font-sans">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                              Skills
                            </h3>
                            <div className="space-y-5">
                              {[
                                { key: 'technical', label: 'Technical', placeholder: 'Add a technical skill…' },
                                { key: 'soft', label: 'Soft Skills', placeholder: 'Add a soft skill…' },
                                { key: 'tools', label: 'Tools', placeholder: 'Add a tool…' }
                              ].map((cat) => {
                                const currentItems = (Array.isArray(rawSkills) ? (cat.key === 'technical' ? rawSkills : []) : ((rawSkills as any)?.[cat.key] || [])) as string[];
                                return (
                                  <div key={cat.key}>
                                    <h4 className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wide">
                                      {cat.label}
                                    </h4>
                                    <StringPillSection
                                      title=""
                                      items={currentItems}
                                      itemPlaceholder="Skill"
                                      placeholder={cat.placeholder}
                                      onAdd={() => addSection('skills')}
                                      onRemove={(i) => {
                                        const next = [...currentItems];
                                        next.splice(i, 1);
                                        updateResumeField(['skills', cat.key], next);
                                      }}
                                      onUpdate={(i, v) => {
                                        const next = [...currentItems];
                                        next[i] = v;
                                        updateResumeField(['skills', cat.key], next);
                                      }}
                                      onAddNewValue={(val) => {
                                        updateResumeField(['skills', cat.key], [...currentItems, val]);
                                      }}
                                      onEditStateChange={handleEditStateChange}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {sectionId === 'certifications' && (
                          <ObjectCardSection
                            title="Certifications"
                            items={certifications}
                            fields={{ primary: 'name', secondary: 'issuer', date: 'date' }}
                            placeholders={{ primary: 'Certification Name', secondary: 'Issuing Organization', date: 'Date' }}
                            addLabel="Add certification"
                            onAdd={() => addSection('certifications')}
                            onRemove={(i) => removeItem('certifications', i)}
                            onFieldUpdate={(i, field, v) => updateResumeField(['certifications', i, field], v)}
                            onEditStateChange={handleEditStateChange}
                          />
                        )}

                        {sectionId === 'awards' && (
                          <ObjectCardSection
                            title="Awards"
                            items={awards}
                            fields={{ primary: 'title', secondary: 'issuer', date: 'date' }}
                            placeholders={{ primary: 'Award Name', secondary: 'Awarding Body', date: 'Date' }}
                            addLabel="Add award"
                            onAdd={() => addSection('awards')}
                            onRemove={(i) => removeItem('awards', i)}
                            onFieldUpdate={(i, field, v) => updateResumeField(['awards', i, field], v)}
                            onEditStateChange={handleEditStateChange}
                          />
                        )}

                        {sectionId === 'languages' && (
                          <div className="font-sans">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                              Languages
                            </h3>
                            {languages.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => addSection('languages')}
                                className="inline-flex items-center gap-1.5 text-sm italic text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                              >
                                <Plus size={12} /> Add language
                              </button>
                            ) : (
                              <div className="space-y-2">
                                {languages.map((lang: any, i: number) => (
                                  <div key={lang.id ?? i} className="group/item flex items-baseline gap-2 relative px-7 sm:px-0">
                                    <button
                                      type="button"
                                      onClick={() => removeItem('languages', i)}
                                      className="absolute right-1 sm:-right-6 top-0.5 opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-1"
                                      title="Remove language"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <InlineEditableText
                                      value={lang.name || ''}
                                      onSave={(v) => updateResumeField(['languages', i, 'name'], v)}
                                      className="text-sm font-medium"
                                      placeholder="Language"
                                      onEditStateChange={handleEditStateChange}
                                    />
                                    <span className="text-zinc-400">·</span>
                                    <InlineEditableText
                                      value={lang.proficiency || ''}
                                      onSave={(v) => updateResumeField(['languages', i, 'proficiency'], v)}
                                      className="text-sm italic text-zinc-600 dark:text-zinc-400"
                                      placeholder="Proficiency"
                                      onEditStateChange={handleEditStateChange}
                                    />
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addSection('languages')}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-1 mt-1 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 rounded-md transition-colors"
                                >
                                  <Plus size={12} /> Add language
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {sectionId === 'volunteer' && (
                          <StringPillSection
                            title="Volunteer"
                            items={volunteer}
                            itemPlaceholder="Volunteer activity"
                            placeholder="Add volunteer experience…"
                            onAdd={() => addSection('volunteer')}
                            onRemove={(i) => removeItem('volunteer', i)}
                            onUpdate={(i, v) => {
                              const next = [...volunteer];
                              next[i] = v;
                              updateResumeField(['volunteer'], next);
                            }}
                            onAddNewValue={(val) => {
                              updateResumeField(['volunteer'], [...volunteer, val]);
                            }}
                            onEditStateChange={handleEditStateChange}
                          />
                        )}

                        {sectionId === 'hobbies' && (
                          <StringPillSection
                            title="Hobbies"
                            items={hobbies}
                            itemPlaceholder="Hobby"
                            placeholder="Add a hobby…"
                            onAdd={() => addSection('hobbies')}
                            onRemove={(i) => removeItem('hobbies', i)}
                            onUpdate={(i, v) => {
                              const next = [...hobbies];
                              next[i] = v;
                              updateResumeField(['hobbies'], next);
                            }}
                            onAddNewValue={(val) => {
                              updateResumeField(['hobbies'], [...hobbies, val]);
                            }}
                            onEditStateChange={handleEditStateChange}
                          />
                        )}

                        {sectionId === 'interests' && (
                          <StringPillSection
                            title="Interests"
                            items={interests}
                            itemPlaceholder="Interest"
                            placeholder="Add an interest…"
                            onAdd={() => addSection('interests')}
                            onRemove={(i) => removeItem('interests', i)}
                            onUpdate={(i, v) => {
                              const next = [...interests];
                              next[i] = v;
                              updateResumeField(['interests'], next);
                            }}
                            onAddNewValue={(val) => {
                              updateResumeField(['interests'], [...interests, val]);
                            }}
                            onEditStateChange={handleEditStateChange}
                          />
                        )}

                      </div>
                    )}
                  </Draggable>
                </React.Fragment>
              );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Section Navigation */}
      <BottomAddNav onAdd={addSection} currentSections={sectionOrder} />

      <ConfirmModal
        open={pendingSectionDelete !== null}
        title="Remove section?"
        body="This clears the section content. You can add it back from the bottom nav."
        confirmLabel="Remove"
        cancelLabel="Keep"
        tone="destructive"
        onConfirm={() => {
          if (pendingSectionDelete) removeSection(pendingSectionDelete);
          setPendingSectionDelete(null);
        }}
        onDismiss={() => setPendingSectionDelete(null)}
      />

      <ConfirmModal
        open={pendingItemDelete !== null}
        title={`Remove ${pendingItemDelete?.label || 'item'}?`}
        body={`Are you sure you want to delete this ${pendingItemDelete?.label || 'item'}? This action cannot be undone.`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        tone="destructive"
        onConfirm={() => {
          if (pendingItemDelete) {
            removeItem(pendingItemDelete.sectionType, pendingItemDelete.itemIndex, pendingItemDelete.customSectionIndex);
          }
          setPendingItemDelete(null);
        }}
        onDismiss={() => setPendingItemDelete(null)}
      />
    </div>
  );
}

function BottomAddNav({ onAdd, currentSections }: { onAdd: (type: string) => void, currentSections: string[] }) {
  const [moreOpen, setMoreOpen] = useState(false);

  const primary: Array<{ key: string; label: string }> = [
    { key: 'summary', label: 'Summary' },
    { key: 'experience', label: 'Experience' },
    { key: 'education', label: 'Education' },
    { key: 'projects', label: 'Projects' },
    { key: 'skills', label: 'Skills' },
  ].filter(p => !currentSections.includes(p.key));

  primary.push({ key: 'custom', label: 'Custom' });

  const extras: Array<{ key: string; label: string }> = [
    { key: 'certifications', label: 'Certifications' },
    { key: 'awards', label: 'Awards' },
    { key: 'languages', label: 'Languages' },
    { key: 'volunteer', label: 'Volunteer' },
    { key: 'hobbies', label: 'Hobbies' },
    { key: 'interests', label: 'Interests' },
  ].filter(p => !currentSections.includes(p.key));

  if (primary.length === 1 && extras.length === 0) {
    return (
      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-zinc-950 dark:via-zinc-950 pt-10 pb-6 mt-8 flex justify-center border-t-0 pointer-events-none z-50">
        <div className="relative pointer-events-auto">
          <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl backdrop-saturate-150 shadow-lg shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-200/50 dark:border-zinc-700/50 rounded-full px-2 py-1.5 flex items-center gap-1 transition-all">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-3 uppercase tracking-[0.2em] select-none">Add</span>
            <button
              onClick={() => onAdd('custom')}
              className="px-4 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-800/80 rounded-full transition-all active:scale-95 hover:shadow-sm"
            >
              Custom Section
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-zinc-950 dark:via-zinc-950 pt-10 pb-6 mt-8 flex justify-center border-t-0 pointer-events-none z-50">
      <div className="relative pointer-events-auto">
        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl backdrop-saturate-150 shadow-lg shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-200/50 dark:border-zinc-700/50 rounded-full px-2 py-1.5 flex items-center gap-1 transition-all">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-3 uppercase tracking-[0.2em] select-none">Add</span>
          {primary.map((p) => (
            <button
              key={p.key}
              onClick={() => onAdd(p.key)}
              className="px-4 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-800/80 rounded-full transition-all active:scale-95 hover:shadow-sm"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all active:scale-95 inline-flex items-center gap-1 ${moreOpen ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-inner' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-800/80 hover:shadow-sm'} ${extras.length === 0 ? 'hidden' : ''}`}
          >
            More
            <ChevronDown size={14} className={`transition-transform duration-300 ${moreOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {moreOpen && (
          <div className="absolute bottom-full mb-3 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-xl shadow-zinc-200/50 dark:shadow-black/50 rounded-2xl p-2 min-w-[200px] flex flex-col origin-bottom-right animate-in fade-in slide-in-from-bottom-2 duration-200">
            {extras.map((e) => (
              <button
                key={e.key}
                onClick={() => {
                  onAdd(e.key);
                  setMoreOpen(false);
                }}
                className="text-left px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 rounded-xl transition-all"
              >
                {e.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
