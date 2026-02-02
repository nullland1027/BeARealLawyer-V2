import { useState, useEffect, useCallback } from 'react';
import { models } from '../types';
import { OnFileDrop, OnFileDropOff, Show } from '../../wailsjs/runtime/runtime';
import { CheckPath } from '../../wailsjs/go/main/App';

interface UseFileDropReturn {
    isDragOverDropZone: boolean;
    droppedProject: models.Project | null;
    clearDroppedProject: () => void;
}

export function useFileDrop(): UseFileDropReturn {
    const [isDragOverDropZone, setIsDragOverDropZone] = useState(false);
    const [droppedProject, setDroppedProject] = useState<models.Project | null>(null);

    const clearDroppedProject = useCallback(() => {
        setDroppedProject(null);
    }, []);

    useEffect(() => {
        let isDragging = false;
        let lastOverDropZone = false;

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'copy';
            }
            
            if (!isDragging) {
                isDragging = true;
                Show();
            }
            
            const target = e.target as HTMLElement;
            const isOverDropZone = !!target.closest('.drop-zone-hint');
            
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

        const handleDragEnd = () => {
            isDragging = false;
            lastOverDropZone = false;
            setIsDragOverDropZone(false);
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            const relatedTarget = e.relatedTarget as HTMLElement;
            
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

        OnFileDrop(async (x, y, paths) => {
            console.log("File dropped:", paths);
            setIsDragOverDropZone(false);
            if (paths && paths.length > 0) {
                const path = paths[0];
                try {
                    const info = await CheckPath(path);
                    const newProject = new models.Project();
                    newProject.status = "等待接手";
                    newProject.name = info.name;
                    newProject.files = [info];
                    setDroppedProject(newProject);
                } catch (e) {
                    console.error("Failed to check path:", e);
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

    return {
        isDragOverDropZone,
        droppedProject,
        clearDroppedProject,
    };
}
