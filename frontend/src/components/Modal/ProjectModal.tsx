import { useState } from 'react';
import { models, STATUSES } from '../../types';
import { SelectFiles, SelectFolder, OpenFile } from '../../../wailsjs/go/main/App';
import './Modal.css';

interface ProjectModalProps {
    project: models.Project;
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: models.Project) => void;
    onDelete: (project: models.Project) => void;
    showToast: (message: string, type: 'error' | 'success') => void;
}

export function ProjectModal({ 
    project, 
    isOpen, 
    onClose, 
    onSave, 
    onDelete,
    showToast 
}: ProjectModalProps) {
    const [editingProject, setEditingProject] = useState<models.Project>(project);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Reset state when project changes
    if (project.id !== editingProject.id || project.name !== editingProject.name) {
        setEditingProject(project);
        setShowDeleteConfirm(false);
    }

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(editingProject);
        onClose();
    };

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete(editingProject);
            onClose();
        } else {
            setShowDeleteConfirm(true);
        }
    };

    const handleAddFiles = async () => {
        try {
            const newFiles = await SelectFiles();
            if (newFiles && newFiles.length > 0) {
                const currentFiles = editingProject.files || [];
                setEditingProject(new models.Project({
                    ...editingProject,
                    files: [...currentFiles, ...newFiles]
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddFolder = async () => {
        try {
            const newFolder = await SelectFolder();
            if (newFolder && newFolder.length > 0) {
                const currentFiles = editingProject.files || [];
                setEditingProject(new models.Project({
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
        } catch (err: any) {
            console.error("Failed to open file:", err);
            const message = err?.message || err?.toString() || "无法打开文件";
            showToast(message, 'error');
        }
    };

    const handleRemoveFile = (index: number) => {
        const newFiles = [...(editingProject.files || [])];
        newFiles.splice(index, 1);
        setEditingProject(new models.Project({
            ...editingProject,
            files: newFiles
        }));
    };

    const updateField = (field: string, value: string) => {
        setEditingProject(new models.Project({
            ...editingProject,
            [field]: value
        }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{editingProject.id ? '编辑项目' : '新建项目'}</h3>
                    <button className="secondary close-btn" onClick={onClose}>✕</button>
                </div>
                
                <label>项目名称</label>
                <input 
                    value={editingProject.name} 
                    onChange={e => updateField('name', e.target.value)}
                    placeholder="如：张三诉李四民间借贷纠纷"
                />
                
                <div className="form-row">
                    <div className="form-col">
                        <label>当事人</label>
                        <input 
                            value={editingProject.client} 
                            onChange={e => updateField('client', e.target.value)}
                        />
                    </div>
                    <div className="form-col">
                        <label>相对人</label>
                        <input 
                            value={editingProject.opponent} 
                            onChange={e => updateField('opponent', e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-col">
                        <label>承办律师</label>
                        <input 
                            value={editingProject.lawyer} 
                            onChange={e => updateField('lawyer', e.target.value)}
                        />
                    </div>
                    <div className="form-col">
                        <label>状态</label>
                        <select 
                            value={editingProject.status}
                            onChange={e => updateField('status', e.target.value)}
                        >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <label>阶段</label>
                <input 
                    value={editingProject.stage} 
                    onChange={e => updateField('stage', e.target.value)}
                    placeholder="如：一审、二审、执行..."
                />
                
                <label>备注</label>
                <textarea 
                    rows={4}
                    value={editingProject.notes} 
                    onChange={e => updateField('notes', e.target.value)}
                />

                <label>引用文件</label>
                <div className="file-list">
                    {editingProject.files && editingProject.files.length > 0 ? (
                        editingProject.files.map((file, index) => (
                            <div key={index} className="file-item">
                                <span 
                                    onClick={() => handleOpenFile(file.path)} 
                                    className="file-name" 
                                    title={file.path}
                                >
                                    {file.is_folder ? '📂' : '📄'} {file.name}
                                </span>
                                <span 
                                    className="file-remove" 
                                    onClick={() => handleRemoveFile(index)}
                                >
                                    ✕
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="file-empty">无引用文件</div>
                    )}
                    <div className="file-actions">
                        <button className="secondary small-btn" onClick={handleAddFolder}>
                            + 添加文件夹
                        </button>
                        <button className="secondary small-btn" onClick={handleAddFiles}>
                            + 添加文件
                        </button>
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
                    <button className="secondary" onClick={onClose}>取消</button>
                    <button onClick={handleSave}>保存</button>
                </div>
            </div>
        </div>
    );
}
