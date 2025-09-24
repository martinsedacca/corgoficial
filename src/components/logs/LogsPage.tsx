import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import LogDetailsModal from './LogDetailsModal';
import { LogEntry } from '../../types/logs';

const PAGE_SIZE = 100;

import { useData } from '../../contexts/DataContext';

const LogsPage = () => {
  const { practices } = useData();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = useCallback(async (currentPage: number, search: string) => {
    setLoading(true);
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('logs')
      .select('*') // No need for count here, we determine 'hasMore' from the result length
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`user_email.ilike.%${search}%,entity_description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      setError('No tienes permiso para ver los logs o ha ocurrido un error.');
      console.error('Error fetching logs:', error);
      setLogs([]);
    } else {
      setLogs(data || []);
      setError(null);
      setHasMore((data?.length || 0) === PAGE_SIZE);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLogs(page, searchTerm);
    }, 500); // Debounce search input

    return () => {
      clearTimeout(handler);
    };
  }, [page, searchTerm, fetchLogs]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page on new search
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Registro de Actividad del Sistema</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por email o descripción..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {loading && <div className="text-center p-8 text-gray-500">Cargando registros...</div>}
      {error && <p className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</p>}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidad</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Detalles</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length > 0 ? logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.user_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' : log.action === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.entity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{log.entity_description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => setSelectedLog(log)} className="text-primary-600 hover:text-primary-900">Ver Datos</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      No hay registros que coincidan con tu búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">Página {page + 1}</span>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} practices={practices} />
    </div>
  );
};

export default LogsPage;
