import { useState, useEffect } from 'react';
import './styles/index.css';
import { models, STATUSES } from './types';

// Components
import { Sidebar } from './components/Sidebar';
import { Board } from './components/Board';
import { ProjectModal } from './components/Modal';
import { Toast } from './components/Toast';
import { SettingsModal } from './components/Settings';

// Hooks
import { useToast, useProjects, useFileDrop, useTheme } from './hooks';

// DnD Kit
import {
    DndContext, 
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

function App() {
    // Custom Hooks
    const { toastMessage, toastType, showToast, hideToast } = useToast();
    const { projects, loadProjects, saveProject, deleteProject, updateProjects, setProjects } = useProjects();
    const { isDragOverDropZone, droppedProject, clearDroppedProject } = useFileDrop();
    const { theme, setTheme } = useTheme();

    // DnD State
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeProject, setActiveProject] = useState<models.Project | null>(null);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<models.Project | null>(null);

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Sidebar State
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load projects on mount
    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    // Handle dropped file
    useEffect(() => {
        if (droppedProject) {
            setEditingProject(droppedProject);
            setIsModalOpen(true);
            clearDroppedProject();
        }
    }, [droppedProject, clearDroppedProject]);

    // Sidebar Resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = Math.max(150, Math.min(e.clientX, 600));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // --- DnD Handlers ---
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        const p = projects.find(p => p.id === active.id);
        if (p) setActiveProject(p);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveProject = active.data.current?.project;
        const isOverProject = over.data.current?.project;

        let overStatus = "";
        if (STATUSES.includes(overId as any)) {
            overStatus = overId as string;
        } else if (isOverProject) {
            overStatus = isOverProject.status;
        }

        if (!overStatus) return;

        if (isActiveProject && isActiveProject.status !== overStatus) {
            setProjects((items) => {
                const activeIndex = items.findIndex((p) => p.id === activeId);
                const newItems = [...items];
                newItems[activeIndex] = new models.Project({ 
                    ...newItems[activeIndex], 
                    status: overStatus 
                });
                return arrayMove(newItems, activeIndex, activeIndex);
            });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveProject(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        let currentProjects = [...projects];
        const activeIndex = currentProjects.findIndex(p => p.id === activeId);
        if (activeIndex === -1) return;

        let newStatus = currentProjects[activeIndex].status;
        if (STATUSES.includes(overId as any)) {
            newStatus = overId;
        } else {
            const overProject = currentProjects.find(p => p.id === overId);
            if (overProject) {
                newStatus = overProject.status;
            }
        }

        if (currentProjects[activeIndex].status !== newStatus) {
            currentProjects[activeIndex] = new models.Project({
                ...currentProjects[activeIndex],
                status: newStatus
            });
        }

        if (activeId !== overId && !STATUSES.includes(overId as any)) {
            const overIndex = currentProjects.findIndex(p => p.id === overId);
            if (overIndex !== -1) {
                currentProjects = arrayMove(currentProjects, activeIndex, overIndex);
            }
        }

        currentProjects.forEach((p, index) => {
            p.sort_order = index;
        });

        await updateProjects(currentProjects);
    };

    // --- UI Handlers ---
    const handleAdd = () => {
        const newProject = new models.Project();
        newProject.status = STATUSES[0];
        setEditingProject(newProject);
        setIsModalOpen(true);
    };

    const handleEdit = (p: models.Project) => {
        setEditingProject(new models.Project({ ...p }));
        setIsModalOpen(true);
    };

    const handleSave = async (p: models.Project) => {
        await saveProject(p);
        showToast('项目已保存', 'success');
    };

    const handleDelete = async (p: models.Project) => {
        if (p.id) {
            await deleteProject(p.id);
            showToast('项目已删除', 'success');
        }
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.5' } },
        }),
    };

    return (
        <div className="app-container">
            <div 
                className="sidebar-wrapper" 
                style={{ 
                    width: isCollapsed ? 0 : sidebarWidth,
                    overflow: 'hidden',
                    transition: isResizing ? 'none' : 'width 0.3s ease'
                }}
            >
                <Sidebar 
                    projects={projects} 
                    isDragOver={isDragOverDropZone} 
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />
            </div>
            
            <div 
                className={`resize-handle ${isResizing ? 'active' : ''}`}
                onMouseDown={() => setIsResizing(true)}
            >
                <button 
                    className="collapse-btn" 
                    onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                >
                    {isCollapsed ? '❯' : '❮'}
                </button>
            </div>
            
            <div className="main-content">
                <div className="toolbar">
                    <h3>项目看板</h3>
                    <button onClick={handleAdd}>+ 新建项目</button>
                </div>

                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <Board projects={projects} onEdit={handleEdit} />
                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeProject ? (
                            <div className="card">
                                <div className="card-title">{activeProject.name}</div>
                                <div className="card-detail">👤 当事人: {activeProject.client}</div>
                                <div className="card-detail">⚖️ 律师: {activeProject.lawyer}</div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {isModalOpen && editingProject && (
                <ProjectModal
                    project={editingProject}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    showToast={showToast}
                />
            )}

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                theme={theme}
                onThemeChange={setTheme}
            />

            <Toast 
                message={toastMessage} 
                type={toastType} 
                onClose={hideToast} 
            />
        </div>
    );
}

export default App;
