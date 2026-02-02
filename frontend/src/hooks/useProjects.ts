import { useState, useCallback } from 'react';
import { models } from '../types';
import { GetProjects, SaveProject, DeleteProject, UpdateProjects } from '../../wailsjs/go/main/App';

interface UseProjectsReturn {
    projects: models.Project[];
    loading: boolean;
    loadProjects: () => Promise<void>;
    saveProject: (project: models.Project) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    updateProjects: (projects: models.Project[]) => Promise<void>;
    setProjects: React.Dispatch<React.SetStateAction<models.Project[]>>;
}

export function useProjects(): UseProjectsReturn {
    const [projects, setProjects] = useState<models.Project[]>([]);
    const [loading, setLoading] = useState(false);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await GetProjects();
            setProjects(data || []);
        } catch (err) {
            console.error('Failed to load projects:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveProject = useCallback(async (project: models.Project) => {
        try {
            await SaveProject(project);
            await loadProjects();
        } catch (err) {
            console.error('Failed to save project:', err);
            throw err;
        }
    }, [loadProjects]);

    const deleteProject = useCallback(async (id: string) => {
        try {
            await DeleteProject(id);
            await loadProjects();
        } catch (err) {
            console.error('Failed to delete project:', err);
            throw err;
        }
    }, [loadProjects]);

    const updateProjects = useCallback(async (updatedProjects: models.Project[]) => {
        try {
            setProjects(updatedProjects);
            await UpdateProjects(updatedProjects);
        } catch (err) {
            console.error('Failed to update projects:', err);
            throw err;
        }
    }, []);

    return {
        projects,
        loading,
        loadProjects,
        saveProject,
        deleteProject,
        updateProjects,
        setProjects,
    };
}
