import React from 'react';
import { Bell, RefreshCw, X, FileText, Users, User, Activity, Building2 } from 'lucide-react';

interface NotificationBannerProps {
  hasNewPrescriptions: boolean;
  hasUpdatedPrescriptions: boolean;
  hasNewPatients: boolean;
  hasNewDoctors: boolean;
  hasNewPractices: boolean;
  hasNewSocialWorks: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
}

export function NotificationBanner({
  hasNewPrescriptions,
  hasUpdatedPrescriptions,
  hasNewPatients,
  hasNewDoctors,
  hasNewPractices,
  hasNewSocialWorks,
  onRefresh,
  onDismiss
}: NotificationBannerProps) {
  const notifications = [];

  if (hasNewPrescriptions) {
    notifications.push({ icon: FileText, text: 'nuevas recetas', color: 'text-blue-600' });
  }
  if (hasUpdatedPrescriptions) {
    notifications.push({ icon: FileText, text: 'recetas actualizadas', color: 'text-green-600' });
  }
  if (hasNewPatients) {
    notifications.push({ icon: Users, text: 'nuevos pacientes', color: 'text-green-600' });
  }
  if (hasNewDoctors) {
    notifications.push({ icon: User, text: 'nuevos médicos', color: 'text-primary-600' });
  }
  if (hasNewPractices) {
    notifications.push({ icon: Activity, text: 'nuevas prácticas', color: 'text-purple-600' });
  }
  if (hasNewSocialWorks) {
    notifications.push({ icon: Building2, text: 'nuevas obras sociales', color: 'text-blue-600' });
  }

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-b border-blue-700">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 animate-pulse" />
              <span className="font-medium">Hay cambios disponibles:</span>
            </div>
            <div className="flex items-center gap-4">
              {notifications.map((notification, index) => {
                const Icon = notification.icon;
                return (
                  <div key={index} className="flex items-center gap-1 text-sm">
                    <Icon className="h-4 w-4" />
                    <span>{notification.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <button
              onClick={onDismiss}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Descartar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}