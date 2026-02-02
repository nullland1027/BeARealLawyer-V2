import { ThemeMode } from '../../hooks/useTheme';
import './Settings.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: ThemeMode;
    onThemeChange: (theme: ThemeMode) => void;
}

export function SettingsModal({ isOpen, onClose, theme, onThemeChange }: SettingsModalProps) {
    if (!isOpen) return null;

    const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
        { value: 'light', label: '日间模式', icon: '☀️' },
        { value: 'dark', label: '夜间模式', icon: '🌙' },
        { value: 'system', label: '跟随系统', icon: '💻' },
    ];

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
                    <label className="settings-label">关于</label>
                    <div className="about-info">
                        <p><strong>律师案件管理系统</strong></p>
                        <p>版本: 2.0.0 (Go + React)</p>
                        <p className="about-copyright">© 2024 Be a Real Lawyer</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
