import React from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { InlineEditableText } from './InlineEditableText';
import { Plus, GripVertical, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export function ResumePreview() {
  const { resumeData, updateResumeField, addBullet, deleteBullet, addSection, reorderSections } = useResumeStore();

  if (!resumeData) return null;

  const { personalInfo, summary, experience, education, skills, customSections } = resumeData;

  const sectionOrder = resumeData.sectionOrder || [
    'summary',
    'experience',
    'education',
    ...(customSections ? customSections.map(s => s.id) : []),
    'skills'
  ];

  const handleKeyDown = (e: React.KeyboardEvent, sectionType: string, sectionIndex: number, bulletIndex: number, currentValue: string, customItemIndex?: number) => {
    if (e.key === 'Backspace' && currentValue === '') {
      e.preventDefault();
      deleteBullet(sectionType, sectionIndex, bulletIndex, customItemIndex);
    }
    // Handle Enter to add next bullet
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBullet(sectionType, sectionIndex, customItemIndex);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;
    reorderSections(source.index, destination.index);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 pb-20 shadow-sm h-full overflow-y-auto w-full font-serif relative text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="text-center mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-6 group relative">
        <InlineEditableText
          value={personalInfo.name}
          onSave={(v) => updateResumeField(['personalInfo', 'name'], v)}
          className="text-3xl font-bold mb-2 font-sans mx-auto text-center block"
          placeholder="Your Name"
        />
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400 font-sans items-center">
          <InlineEditableText value={personalInfo.email} onSave={(v) => updateResumeField(['personalInfo', 'email'], v)} placeholder="Email" />
          <span>•</span>
          <InlineEditableText value={personalInfo.phone} onSave={(v) => updateResumeField(['personalInfo', 'phone'], v)} placeholder="Phone" />
          <span>•</span>
          <InlineEditableText value={personalInfo.location} onSave={(v) => updateResumeField(['personalInfo', 'location'], v)} placeholder="Location" />
          
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

                // Validate if section exists
                if (
                  sectionId !== 'summary' &&
                  sectionId !== 'experience' &&
                  sectionId !== 'education' &&
                  sectionId !== 'skills' &&
                  !customSection
                ) {
                  return null;
                }

                return (
                  <React.Fragment key={sectionId}>
                    <Draggable draggableId={sectionId} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group/section relative rounded-lg border border-transparent transition-colors ${
                            snapshot.isDragging 
                              ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 shadow-lg !m-0 p-4 z-50 ring-1 ring-zinc-200 dark:ring-zinc-700' 
                              : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                          }`}
                        >
                        <div
                          {...provided.dragHandleProps}
                          className="absolute -left-6 top-1 p-1 opacity-0 group-hover/section:opacity-100 transition-opacity cursor-grab text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
                        >
                          <GripVertical size={16} />
                        </div>

                        {sectionId === 'summary' && (
                          <div className="font-sans">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-1">Summary</h3>
                            <InlineEditableText
                              value={summary}
                              onSave={(v) => updateResumeField(['summary'], v)}
                              multiline
                              className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed block w-full"
                              placeholder="Professional summary..."
                            />
                          </div>
                        )}

                        {sectionId === 'experience' && (
                          <div className="font-sans">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-1">Experience</h3>
                            <div className="space-y-6">
                              {experience.map((exp, expIndex) => (
                                <div key={exp.id} className="group/item relative">
                                  <div className="flex justify-between items-baseline mb-1">
                                    <InlineEditableText
                                      value={exp.role}
                                      onSave={(v) => updateResumeField(['experience', expIndex, 'role'], v)}
                                      className="font-medium flex-1 mr-4"
                                      placeholder="Job Title"
                                    />
                                    <InlineEditableText
                                      value={exp.date}
                                      onSave={(v) => updateResumeField(['experience', expIndex, 'date'], v)}
                                      className="text-xs text-zinc-500 dark:text-zinc-400 text-right shrink-0 min-w-24 border-b border-transparent"
                                      placeholder="Date Range"
                                    />
                                  </div>
                                  <InlineEditableText
                                    value={exp.company}
                                    onSave={(v) => updateResumeField(['experience', expIndex, 'company'], v)}
                                    className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 italic block"
                                    placeholder="Company Name"
                                  />
                                  
                                  <ul className="list-disc pl-5 space-y-1.5 marker:text-zinc-400">
                                    {exp.bullets.map((bullet, bulletIndex) => (
                                      <li key={bulletIndex} className="text-sm text-zinc-700 dark:text-zinc-300 pl-1 leading-relaxed relative group/bullet">
                                        <InlineEditableText
                                          value={bullet}
                                          onSave={(v) => {
                                            const newBullets = [...exp.bullets];
                                            newBullets[bulletIndex] = v;
                                            updateResumeField(['experience', expIndex, 'bullets'], newBullets);
                                          }}
                                          onKeyDown={(e, currentValue) => handleKeyDown(e, 'experience', expIndex, bulletIndex, currentValue)}
                                          multiline
                                          className="block w-full"
                                          placeholder="Describe your achievements..."
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                  <button 
                                    onClick={() => addBullet('experience', expIndex)}
                                    className="mt-2 text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity"
                                  >
                                    <Plus size={12} className="mr-1" /> Add bullet
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {sectionId === 'education' && (
                          <div className="font-sans">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-1">Education</h3>
                            
                            <div className="space-y-4">
                              {education.map((edu, eduIndex) => (
                                <div key={edu.id} className="group/item relative">
                                  <div className="flex justify-between items-baseline">
                                    <InlineEditableText
                                      value={edu.degree}
                                      onSave={(v) => updateResumeField(['education', eduIndex, 'degree'], v)}
                                      className="font-medium mr-4 flex-1 border-b border-transparent"
                                      placeholder="Degree"
                                    />
                                    <InlineEditableText
                                      value={edu.date}
                                      onSave={(v) => updateResumeField(['education', eduIndex, 'date'], v)}
                                      className="text-xs text-zinc-500 dark:text-zinc-400 text-right shrink-0 min-w-24 border-b border-transparent"
                                      placeholder="Date Range"
                                    />
                                  </div>
                                  <InlineEditableText
                                    value={edu.school}
                                    onSave={(v) => updateResumeField(['education', eduIndex, 'school'], v)}
                                    className="text-sm text-zinc-600 dark:text-zinc-400 block border-b border-transparent"
                                    placeholder="School Name"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {customSection && (
                          <div className="font-sans">
                            <InlineEditableText
                              value={customSection.title}
                              onSave={(v) => updateResumeField(['customSections', customSectionIndex, 'title'], v)}
                              className="text-xs font-bold uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-1 block w-full text-left bg-transparent"
                              placeholder="Section Title"
                            />
                            
                            <div className="space-y-6">
                              {customSection.items.map((item, itemIndex) => (
                                <div key={item.id} className="group/item relative">
                                  <div className="flex justify-between items-baseline mb-1">
                                    <InlineEditableText
                                      value={item.title}
                                      onSave={(v) => updateResumeField(['customSections', customSectionIndex, 'items', itemIndex, 'title'], v)}
                                      className="font-medium flex-1 mr-4"
                                      placeholder="Item Title"
                                    />
                                    <InlineEditableText
                                      value={item.date}
                                      onSave={(v) => updateResumeField(['customSections', customSectionIndex, 'items', itemIndex, 'date'], v)}
                                      className="text-xs text-zinc-500 dark:text-zinc-400 text-right shrink-0 min-w-24 border-b border-transparent"
                                      placeholder="Date Range"
                                    />
                                  </div>
                                  <InlineEditableText
                                    value={item.subtitle}
                                    onSave={(v) => updateResumeField(['customSections', customSectionIndex, 'items', itemIndex, 'subtitle'], v)}
                                    className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 italic block"
                                    placeholder="Subtitle (e.g. Organization)"
                                  />
                                  
                                  <ul className="list-disc pl-5 space-y-1.5 marker:text-zinc-400">
                                    {item.bullets.map((bullet, bulletIndex) => (
                                      <li key={bulletIndex} className="text-sm text-zinc-700 dark:text-zinc-300 pl-1 leading-relaxed relative group/bullet">
                                        <InlineEditableText
                                          value={bullet}
                                          onSave={(v) => {
                                            const newBullets = [...item.bullets];
                                            newBullets[bulletIndex] = v;
                                            updateResumeField(['customSections', customSectionIndex, 'items', itemIndex, 'bullets'], newBullets);
                                          }}
                                          onKeyDown={(e, currentValue) => handleKeyDown(e, 'customSections', customSectionIndex, bulletIndex, currentValue, itemIndex)}
                                          multiline
                                          className="block w-full"
                                          placeholder="Describe your achievements..."
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                  <button 
                                    onClick={() => addBullet('customSections', customSectionIndex, itemIndex)}
                                    className="mt-2 text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity"
                                  >
                                    <Plus size={12} className="mr-1" /> Add bullet
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {sectionId === 'skills' && (
                          <div className="font-sans">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-1">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {skills.map((skill, skillIndex) => (
                                <div key={skillIndex} className="inline-flex group/skill relative">
                                  <InlineEditableText
                                    value={skill}
                                    onSave={(v) => {
                                      const newSkills = [...skills];
                                      newSkills[skillIndex] = v;
                                      updateResumeField(['skills'], newSkills);
                                    }}
                                    className="text-sm bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300 border-none"
                                    placeholder="Skill"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
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
      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-zinc-900 dark:via-zinc-900 pt-10 pb-4 mt-8 flex justify-center border-t-0 pointer-events-none">
        <div className="bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 rounded-full px-2 py-1 flex items-center space-x-1 pointer-events-auto">
          <span className="text-xs font-medium text-zinc-500 px-3 uppercase tracking-wider">Add</span>
          <button onClick={() => addSection('experience')} className="px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors">Experience</button>
          <button onClick={() => addSection('education')} className="px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors">Education</button>
          <button onClick={() => addSection('skills')} className="px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors">Skills</button>
          <button onClick={() => addSection('custom')} className="px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors">Custom</button>
        </div>
      </div>
    </div>
  );
}
