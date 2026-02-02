import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { models } from '../../types';
import './Board.css';

interface SortableItemProps {
    project: models.Project;
    onClick: () => void;
}

export function SortableItem({ project, onClick }: SortableItemProps) {
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
        <div 
            ref={setNodeRef} 
            style={style} 
            className="card" 
            {...attributes} 
            {...listeners} 
            onClick={onClick}
        >
            <div className="card-title">{project.name}</div>
            <div className="card-detail">👤 当事人: {project.client}</div>
            <div className="card-detail">⚖️ 律师: {project.lawyer}</div>
        </div>
    );
}
