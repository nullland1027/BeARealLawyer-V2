import { useState } from 'react';
import { ThemeMode } from '../../hooks/useTheme';
import { ImportProjectsFromFile } from '../../../wailsjs/go/main/App';
import './Settings.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: ThemeMode;
    onThemeChange: (theme: ThemeMode) => void;
    onImportComplete: (count: number) => void;
    showToast: (message: string, type: 'error' | 'success') => void;
}

export function SettingsModal({ 
    isOpen, 
    onClose, 
    theme, 
    onThemeChange,
    onImportComplete,
    showToast
}: SettingsModalProps) {
    const [isImporting, setIsImporting] = useState(false);

    if (!isOpen) return null;

    const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
        { value: 'light', label: '日间模式', icon: '☀️' },
        { value: 'dark', label: '夜间模式', icon: '🌙' },
        { value: 'system', label: '跟随系统', icon: '💻' },
    ];

    const handleImport = async () => {
        setIsImporting(true);
        try {
            console.log('Starting import...');
            const count = await ImportProjectsFromFile();
            console.log('Import returned:', count);
            
            if (count > 0) {
                showToast(`成功导入 ${count} 个项目`, 'success');
                onImportComplete(count);
            } else if (count === 0) {
                // User cancelled or no new projects to import
                showToast('没有新项目需要导入（可能已存在或已取消）', 'success');
            }
        } catch (err: any) {
            console.error('Import failed:', err);
            const errorMessage = typeof err === 'string' ? err : (err?.message || '导入失败');
            showToast(errorMessage, 'error');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h3>⚙️ 设置</h3>
                    <button className="secondary close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="settings-section">
                    <label className="settings-label">主题模式</label>
                    <div className="theme-options">
                        {themeOptions.map(option => (
                            <button
                                key={option.value}
                                className={`theme-option ${theme === option.value ? 'active' : ''}`}
                                onClick={() => onThemeChange(option.value)}
                            >
                                <span className="theme-icon">{option.icon}</span>
                                <span className="theme-label">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-section">
                    <label className="settings-label">数据管理</label>
                    <div className="data-actions">
                        <button 
                            className="import-btn"
                            onClick={handleImport}
                            disabled={isImporting}
                        >
                            <span className="import-icon">📥</span>
                            <span>{isImporting ? '导入中...' : '导入旧版数据'}</span>
                        </button>
                        <p className="data-hint">
                            从 JSON 文件导入项目数据，已存在的项目会被跳过
                        </p>
                    </div>
                </div>

                <div className="settings-section">
                    <label className="settings-label">关于</label>
                    <div className="about-info">
                        <p><strong>律师案件管理系统</strong></p>
                        <p>版本: 2.0.0</p>
                        <p className="about-copyright">© 2026 Be a Real Lawyer</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
