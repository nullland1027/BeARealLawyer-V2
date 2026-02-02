// Re-export types from wailsjs for convenience
export { models } from '../../wailsjs/go/models';

// Status constants
export const STATUSES = ["等待接手", "正在处理", "已交付", "已结案"] as const;
export type StatusType = typeof STATUSES[number];

// Toast types
export type ToastType = 'error' | 'success' | 'info';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}
