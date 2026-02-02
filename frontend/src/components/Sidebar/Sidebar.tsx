import { useMemo } from 'react';
import { models, STATUSES } from '../../types';
import './Sidebar.css';

interface SidebarProps {
    projects: models.Project[];
    isDragOver: boolean;
}

export function Sidebar({ projects, isDragOver }: SidebarProps) {
    const metrics = useMemo(() => {
        return {
            total: projects.length,
            waiting: projects.filter(p => p.status === STATUSES[0]).length,
            processing: projects.filter(p => p.status === STATUSES[1]).length,
            delivered: projects.filter(p => p.status === STATUSES[2]).length,
            closed: projects.filter(p => p.status === STATUSES[3]).length,
        };
    }, [projects]);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>律师案件管理</h2>
                <div className="sidebar-version">Version 2.0 (Go+React)</div>
            </div>
            
            <div className="metrics-panel">
                <div className="metric-card metric-card-full">
                    <div className="metric-number">{metrics.total}</div>
                    <div className="metric-label">全部案件</div>
                </div>
                <div className="metric-card">
                    <div className="metric-number metric-waiting">{metrics.waiting}</div>
                    <div className="metric-label">等待接手</div>
                </div>
                <div className="metric-card">
                    <div className="metric-number metric-processing">{metrics.processing}</div>
                    <div className="metric-label">正在处理</div>
                </div>
                <div className="metric-card">
                    <div className="metric-number metric-delivered">{metrics.delivered}</div>
                    <div className="metric-label">已交付</div>
                </div>
                <div className="metric-card">
                    <div className="metric-number metric-closed">{metrics.closed}</div>
                    <div className="metric-label">已结案</div>
                </div>
            </div>

            <div className={`drop-zone-hint ${isDragOver ? 'drag-over' : ''}`}>
                <div className={`drop-zone-icon ${isDragOver ? 'bounce' : ''}`}>📂</div>
                <div className="drop-zone-text">
                    {isDragOver ? '松开以创建项目' : '拖动文件夹到此处'}
                </div>
                <div className="drop-zone-subtext">
                    {isDragOver ? '将使用文件夹名作为项目名称' : '快速创建新项目'}
                </div>
            </div>
        </div>
    );
}
