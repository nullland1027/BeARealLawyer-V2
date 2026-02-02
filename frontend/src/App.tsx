import { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import { GetProjects, SaveProject, DeleteProject, UpdateProjects, SelectFiles, SelectFolder, OpenFile, CheckPath } from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';
import { OnFileDrop, OnFileDropOff, LogInfo, Show } from '../wailsjs/runtime/runtime';
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
    useDroppable
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const STATUSES = ["等待接手", "正在处理", "已交付", "已结案"];

// --- Components ---

function SortableItem({ project, onClick }: { project: main.Project; onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: project.id, data: { project } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="card" {...attributes} {...listeners} onClick={onClick}>
            <div className="card-title">{project.name}</div>
            <div className="card-detail">👤 当事人: {project.client}</div>
            <div className="card-detail">⚖️ 律师: {project.lawyer}</div>
        </div>
    );
}

function DroppableColumn({ id, title, projects, onEdit }: { id: string, title: string, projects: main.Project[], onEdit: (p: main.Project) => void }) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div className="column">
            <div className="column-header">
                {title}
                <span style={{opacity: 0.5, fontSize: '0.9em'}}>{projects.length}</span>
            </div>
            <div ref={setNodeRef} className="card-list">
                <SortableContext 
                    id={id}
                    items={projects.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {projects.map(project => (
                        <SortableItem key={project.id} project={project} onClick={() => onEdit(project)} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

function Sidebar({ projects, isDragOver }: { projects: main.Project[], isDragOver: boolean }) {
    const metrics = useMemo(() => {
        return {
            total: projects.length,
            waiting: projects.filter(p => p.status === "等待接手").length,
            processing: projects.filter(p => p.status === "正在处理").length,
            delivered: projects.filter(p => p.status === "已交付").length,
            closed: projects.filter(p => p.status === "已结案").length,
        };
    }, [projects]);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>律师案件管理</h2>
                <div style={{fontSize: '0.8rem', opacity: 0.6, marginTop: '5px'}}>Version 2.0 (Go+React)</div>
            </div>
            
            <div className="metrics-panel">
                <div className="metric-card">
                    <div className="metric-number">{metrics.total}</div>
                    <div className="metric-label">全部案件</div>
                </div>
                <div className="metric-card">
                    <div className="metric-number" style={{color: '#ffc107'}}>{metrics.waiting}</div>
                    <div className="metric-label">等待接手</div>
                </div>
                <div className="metric-card">
                    <div className="metric-number" style={{color: '#17a2b8'}}>{metrics.processing}</div>
                    <div className="metric-label">正在处理</div>
                </div>
                <div className="metric-card">
                    <div className="metric-number" style={{color: '#6610f2'}}>{metrics.delivered}</div>
                    <div className="metric-label">已交付</div>
                </div>
                <div className="metric-card">
                    <div className="metric-number" style={{color: '#28a745'}}>{metrics.closed}</div>
                    <div className="metric-label">已结案</div>
                </div>
            </div>

            <div 
                className={`drop-zone-hint ${isDragOver ? 'drag-over' : ''}`}
            >
                <div className={`drop-zone-icon ${isDragOver ? 'bounce' : ''}`}>📂</div>
                <div className="drop-zone-text">{isDragOver ? '松开以创建项目' : '拖动文件夹到此处'}</div>
                <div className="drop-zone-subtext">{isDragOver ? '将使用文件夹名作为项目名称' : '快速创建新项目'}</div>
            </div>
        </div>
    );
}


// --- Main App Component ---
function App() {
    const [projects, setProjects] = useState<main.Project[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeProject, setActiveProject] = useState<main.Project | null>(null);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<main.Project | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Sidebar State
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Drag and Drop Visual State
    const [isDragOverDropZone, setIsDragOverDropZone] = useState(false);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags when clicking
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        // Track if we're in a drag session to avoid calling Show() multiple times
        let isDragging = false;
        let lastOverDropZone = false;

        // Use dragover to continuously check position - more reliable than dragenter/dragleave
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'copy';
            }
            
            // Activate window on first drag over (only once per drag session)
            if (!isDragging) {
                isDragging = true;
                Show();
            }
            
            // Check if we're over the drop zone
            const target = e.target as HTMLElement;
            const isOverDropZone = !!target.closest('.drop-zone-hint');
            
            // Only update state if it changed (for performance)
            if (isOverDropZone !== lastOverDropZone) {
                lastOverDropZone = isOverDropZone;
                setIsDragOverDropZone(isOverDropZone);
            }
        };
        
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            isDragging = false;
            lastOverDropZone = false;
            setIsDragOverDropZone(false);
        };

        // Handle drag end (when drag is cancelled or leaves window)
        const handleDragEnd = () => {
            isDragging = false;
            lastOverDropZone = false;
            setIsDragOverDropZone(false);
        };

        // Handle drag leave window entirely
        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            const relatedTarget = e.relatedTarget as HTMLElement;
            
            // Reset when leaving the window entirely
            if (!relatedTarget || !document.body.contains(relatedTarget)) {
                isDragging = false;
                lastOverDropZone = false;
                setIsDragOverDropZone(false);
            }
        };

        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);
        window.addEventListener('dragend', handleDragEnd);
        window.addEventListener('dragleave', handleDragLeave);

        loadProjects();

        OnFileDrop(async (x, y, paths) => {
            LogInfo("Frontend OnFileDrop triggered with: " + JSON.stringify(paths));
            console.log("File dropped:", paths);
            setIsDragOverDropZone(false);
            if (paths && paths.length > 0) {
                const path = paths[0];
                try {
                    const info = await CheckPath(path);
                    const newProject = new main.Project();
                    newProject.status = "等待接手";
                    newProject.name = info.name;
                    newProject.files = [info];
                    
                    setEditingProject(newProject);
                    setIsModalOpen(true);
                } catch (e) {
                    console.error("Failed to check path:", e);
                    LogInfo("Frontend CheckPath error: " + e);
                }
            }
        }, true);

        return () => {
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
            window.removeEventListener('dragend', handleDragEnd);
            window.removeEventListener('dragleave', handleDragLeave);
            OnFileDropOff();
        };
    }, []);

    useEffect(() => {
        if (!isModalOpen) {
            setShowDeleteConfirm(false);
        }
    }, [isModalOpen]);

    // Sidebar Resizing Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            // Limit min/max width
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
            document.body.style.userSelect = 'none'; // Prevent text selection
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const startResizing = () => {
        setIsResizing(true);
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const loadProjects = async () => {
        try {
            const data = await GetProjects();
            setProjects(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Drag and Drop Handlers ---

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

        // Find the container (status) we are over
        let overStatus = "";
        
        if (STATUSES.includes(overId as string)) {
            // We are directly over the container column
            overStatus = overId as string;
        } else if (isOverProject) {
            // We are over another card, get its status
            overStatus = isOverProject.status;
        }

        if (!overStatus) return;

        // If we are moving to a different status column, update the status optimistically
        if (isActiveProject && isActiveProject.status !== overStatus) {
             setProjects((items) => {
                 const activeIndex = items.findIndex((p) => p.id === activeId);
                 const newItems = [...items];
                 // Create a new instance to trigger re-render
                 newItems[activeIndex] = new main.Project({ 
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

        // Determine new status
        let newStatus = currentProjects[activeIndex].status;
        if (STATUSES.includes(overId)) {
            newStatus = overId;
        } else {
            const overProject = currentProjects.find(p => p.id === overId);
            if (overProject) {
                newStatus = overProject.status;
            }
        }

        // Update status locally
        if (currentProjects[activeIndex].status !== newStatus) {
            currentProjects[activeIndex] = new main.Project({
                ...currentProjects[activeIndex],
                status: newStatus
            });
        }

        // Handle Reordering
        if (activeId !== overId && !STATUSES.includes(overId)) {
             const overIndex = currentProjects.findIndex(p => p.id === overId);
             if (overIndex !== -1) {
                 currentProjects = arrayMove(currentProjects, activeIndex, overIndex);
             }
        }

        // Update sort_order based on the new linear order
        currentProjects.forEach((p, index) => {
            p.sort_order = index;
        });

        // Update State & Backend
        setProjects(currentProjects);
        await UpdateProjects(currentProjects);
    };

    // --- CRUD ---

    const handleAdd = () => {
        const newProject = new main.Project();
        newProject.status = "等待接手";
        setEditingProject(newProject);
        setIsModalOpen(true);
    };

    const handleEdit = (p: main.Project) => {
        setEditingProject(new main.Project({ ...p }));
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (editingProject) {
            await SaveProject(editingProject);
            setIsModalOpen(false);
            setEditingProject(null);
            loadProjects();
        }
    };

    const handleDelete = async () => {
        if (editingProject && editingProject.id) {
            if (showDeleteConfirm) {
                await DeleteProject(editingProject.id);
                setIsModalOpen(false);
                setEditingProject(null);
                loadProjects();
            } else {
                setShowDeleteConfirm(true);
            }
        }
    };

    const handleAddFiles = async () => {
        if (!editingProject) return;
        try {
            const newFiles = await SelectFiles();
            if (newFiles && newFiles.length > 0) {
                const currentFiles = editingProject.files || [];
                setEditingProject(new main.Project({
                    ...editingProject,
                    files: [...currentFiles, ...newFiles]
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddFolder = async () => {
        if (!editingProject) return;
        try {
            const newFolder = await SelectFolder();
            if (newFolder && newFolder.length > 0) {
                const currentFiles = editingProject.files || [];
                setEditingProject(new main.Project({
                    ...editingProject,
                    files: [...currentFiles, ...newFolder]
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenFile = async (path: string) => {
        try {
            await OpenFile(path);
        } catch (err) {
            console.error("Failed to open file:", err);
        }
    };

    const handleRemoveFile = (index: number) => {
        if (!editingProject || !editingProject.files) return;
        const newFiles = [...editingProject.files];
        newFiles.splice(index, 1);
        setEditingProject(new main.Project({
            ...editingProject,
            files: newFiles
        }));
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
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
                <Sidebar projects={projects} isDragOver={isDragOverDropZone} />
            </div>
            
            <div 
                className={`resize-handle ${isResizing ? 'active' : ''}`}
                onMouseDown={startResizing}
            >
                <button className="collapse-btn" onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}>
                    {isCollapsed ? '❯' : '❮'}
                </button>
            </div>
            
            <div className="main-content">
                <div className="toolbar">
                    <h3 style={{margin: 0}}>项目看板</h3>
                    <button onClick={handleAdd}>+ 新建项目</button>
                </div>

                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="board">
                        {STATUSES.map(status => (
                            <DroppableColumn 
                                key={status}
                                id={status}
                                title={status}
                                projects={projects.filter(p => p.status === status)}
                                onEdit={handleEdit}
                            />
                        ))}
                    </div>
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
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                            <h3 style={{margin: 0}}>{editingProject.id ? '编辑项目' : '新建项目'}</h3>
                            <button className="secondary" onClick={() => setIsModalOpen(false)} style={{padding: '4px 8px'}}>✕</button>
                        </div>
                        
                        <label>项目名称</label>
                        <input 
                            value={editingProject.name} 
                            onChange={e => setEditingProject(new main.Project({...editingProject, name: e.target.value}))}
                            placeholder="如：张三诉李四民间借贷纠纷"
                        />
                        
                        <div style={{display: 'flex', gap: '10px'}}>
                            <div style={{flex: 1}}>
                                <label>当事人</label>
                                <input 
                                    value={editingProject.client} 
                                    onChange={e => setEditingProject(new main.Project({...editingProject, client: e.target.value}))}
                                />
                            </div>
                            <div style={{flex: 1}}>
                                <label>相对人</label>
                                <input 
                                    value={editingProject.opponent} 
                                    onChange={e => setEditingProject(new main.Project({...editingProject, opponent: e.target.value}))}
                                />
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: '10px'}}>
                            <div style={{flex: 1}}>
                                <label>承办律师</label>
                                <input 
                                    value={editingProject.lawyer} 
                                    onChange={e => setEditingProject(new main.Project({...editingProject, lawyer: e.target.value}))}
                                />
                            </div>
                            <div style={{flex: 1}}>
                                <label>状态</label>
                                <select 
                                    value={editingProject.status}
                                    onChange={e => setEditingProject(new main.Project({...editingProject, status: e.target.value}))}
                                >
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <label>阶段</label>
                        <input 
                            value={editingProject.stage} 
                            onChange={e => setEditingProject(new main.Project({...editingProject, stage: e.target.value}))}
                            placeholder="如：一审、二审、执行..."
                        />
                        
                        <label>备注</label>
                        <textarea 
                            rows={4}
                            value={editingProject.notes} 
                            onChange={e => setEditingProject(new main.Project({...editingProject, notes: e.target.value}))}
                        />

                        <label>引用文件</label>
                        <div className="file-list">
                            {editingProject.files && editingProject.files.length > 0 ? (
                                editingProject.files.map((file, index) => (
                                    <div key={index} className="file-item">
                                        <span onClick={() => handleOpenFile(file.path)} className="file-name" title={file.path}>
                                            {file.is_folder ? '📂' : '📄'} {file.name}
                                        </span>
                                        <span className="file-remove" onClick={() => handleRemoveFile(index)}>✕</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{padding: '10px', color: '#999', fontSize: '0.9em', textAlign: 'center'}}>无引用文件</div>
                            )}
                            <div style={{textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                <button className="secondary small-btn" onClick={handleAddFolder}>+ 添加文件夹</button>
                                <button className="secondary small-btn" onClick={handleAddFiles}>+ 添加文件</button>
                            </div>
                        </div>

                        <div className="modal-buttons">
                            {editingProject.id && (
                                <button 
                                    className="delete-btn" 
                                    onClick={handleDelete}
                                    style={showDeleteConfirm ? {backgroundColor: '#a71d2a'} : {}}
                                >
                                    {showDeleteConfirm ? '确认删除?' : '删除'}
                                </button>
                            )}
                            <button className="secondary" onClick={() => setIsModalOpen(false)}>取消</button>
                            <button onClick={handleSave}>保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
