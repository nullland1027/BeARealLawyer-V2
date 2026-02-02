import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { models } from '../../types';
import { SortableItem } from './SortableItem';
import './Board.css';

interface DroppableColumnProps {
    id: string;
    title: string;
    projects: models.Project[];
    onEdit: (project: models.Project) => void;
}

export function DroppableColumn({ id, title, projects, onEdit }: DroppableColumnProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="column">
            <div className="column-header">
                {title}
                <span className="column-count">{projects.length}</span>
            </div>
            <div ref={setNodeRef} className="card-list">
                <SortableContext 
                    id={id}
                    items={projects.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {projects.map(project => (
                        <SortableItem 
                            key={project.id} 
                            project={project} 
                            onClick={() => onEdit(project)} 
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
