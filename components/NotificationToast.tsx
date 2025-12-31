
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Notification, NotificationType } from '../types';

interface NotificationToastProps {
    notifications: Notification[];
    onDismiss: (id: string) => void;
}

const typeStyles: Record<NotificationType, string> = {
    success: 'bg-green-400 border-green-600',
    error: 'bg-red-400 border-red-600',
    warning: 'bg-yellow-400 border-yellow-600',
    info: 'bg-blue-400 border-blue-600'
};

const typeIcons: Record<NotificationType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
};

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
    React.useEffect(() => {
        notifications.forEach(notification => {
            if (notification.duration && notification.duration > 0) {
                const timer = setTimeout(() => {
                    onDismiss(notification.id);
                }, notification.duration);

                return () => clearTimeout(timer);
            }
        });
    }, [notifications, onDismiss]);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[500] flex flex-col gap-2 max-w-md">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`${typeStyles[notification.type]} border-4 border-black p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] animate-in slide-in-from-right duration-300`}
                >
                    <div className="flex items-start gap-3">
                        <div className="font-comic text-2xl font-bold flex-shrink-0">
                            {typeIcons[notification.type]}
                        </div>
                        <div className="flex-1 font-comic text-sm text-black">
                            {notification.message}
                        </div>
                        <button
                            onClick={() => onDismiss(notification.id)}
                            className="flex-shrink-0 font-bold text-black hover:text-gray-700 text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
