import { models, STATUSES } from '../../types';
import { DroppableColumn } from './DroppableColumn';
import './Board.css';

interface BoardProps {
    projects: models.Project[];
    onEdit: (project: models.Project) => void;
}

export function Board({ projects, onEdit }: BoardProps) {
    return (
        <div className="board">
            {STATUSES.map(status => (
                <DroppableColumn 
                    key={status}
                    id={status}
                    title={status}
                    projects={projects.filter(p => p.status === status)}
                    onEdit={onEdit}
                />
            ))}
        </div>
    );
}
