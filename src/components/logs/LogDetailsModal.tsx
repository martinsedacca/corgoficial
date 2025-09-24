import React from 'react';
import { LogEntry } from '../../types/logs';
import { Practice } from '../../types';
import DataDiffViewer from './DataDiffViewer';


interface LogDetailsModalProps {
  log: LogEntry | null;
  onClose: () => void;
  practices: Practice[];
}

const LogDetailsModal: React.FC<LogDetailsModalProps> = ({ log, onClose, practices }) => {
  if (!log) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold">Detalles del Registro</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        
        <div className="space-y-2 text-sm mb-6">
          <p><strong>Usuario:</strong> {log.user_email}</p>
          <p><strong>Acción:</strong> <span className={`font-semibold ${log.action === 'CREATE' ? 'text-green-600' : log.action === 'DELETE' ? 'text-red-600' : 'text-blue-600'}`}>{log.action}</span></p>
          <p><strong>Entidad:</strong> {log.entity} (ID: {log.entity_id})</p>
          <p><strong>Fecha:</strong> {new Date(log.timestamp).toLocaleString()}</p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-lg">Cambios Realizados</h3>
          <DataDiffViewer previousData={log.previous_data} newData={log.new_data} practices={practices} />
        </div>
      </div>
    </div>
  );
};

export default LogDetailsModal;
