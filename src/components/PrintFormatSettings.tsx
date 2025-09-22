import React from 'react';
import { usePrintConfig } from '../contexts/PrintConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { Printer, Shield } from 'lucide-react';

export function PrintFormatSettings() {
  const { printFormat, setPrintFormat } = usePrintConfig();
  const { hasPermission } = useAuth();

  // Solo administradores y secretarias pueden cambiar la configuración
  if (!hasPermission('manage_practices')) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
        <p className="text-gray-600">No tiene permisos para cambiar la configuración de impresión.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Printer className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configuración de Impresión</h2>
          <p className="text-sm text-gray-600">Configure el formato de papel para la impresión de recetas</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Configuración actual */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Printer className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Formato Actual:</span>
          </div>
          <div className="text-lg font-bold text-blue-800">
            {printFormat === 'A4' ? 'Media Hoja A4 (Horizontal)' : 'Hoja A5 Completa (Vertical)'}
          </div>
          <div className="text-sm text-blue-700 mt-1">
            {printFormat === 'A4' 
              ? 'Las recetas se imprimen en media hoja A4 en formato horizontal'
              : 'Las recetas se imprimen en hoja A5 completa en formato vertical'
            }
          </div>
        </div>

        {/* Switch de formato */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Seleccione el formato de papel de su impresora:
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opción A4 */}
            <button
              onClick={() => setPrintFormat('A4')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                printFormat === 'A4'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  printFormat === 'A4' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {printFormat === 'A4' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <span className="font-semibold text-gray-900">Media Hoja A4</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Formato horizontal - La receta ocupa la mitad de una hoja A4
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-8 bg-gray-200 border border-gray-400 rounded flex items-center justify-center">
                  <div className="w-5 h-6 bg-blue-300 border border-blue-400 rounded text-xs flex items-center justify-center text-blue-800">
                    R
                  </div>
                </div>
                <span className="text-xs text-gray-500">297mm × 210mm (mitad utilizada)</span>
              </div>
            </button>

            {/* Opción A5 */}
            <button
              onClick={() => setPrintFormat('A5')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                printFormat === 'A5'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  printFormat === 'A5' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                }`}>
                  {printFormat === 'A5' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <span className="font-semibold text-gray-900">Hoja A5 Completa</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Formato vertical - La receta ocupa toda la hoja A5
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-12 bg-gray-200 border border-gray-400 rounded flex items-center justify-center">
                  <div className="w-6 h-10 bg-green-300 border border-green-400 rounded text-xs flex items-center justify-center text-green-800">
                    R
                  </div>
                </div>
                <span className="text-xs text-gray-500">148mm × 210mm (completa)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Información Importante:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Esta configuración afecta a todos los usuarios del sistema</li>
            <li>• El cambio se aplica inmediatamente a todas las impresiones</li>
            <li>• Asegúrese de que su impresora tenga el papel correcto cargado</li>
            <li>• La configuración se guarda automáticamente</li>
          </ul>
        </div>

        {/* Estado guardado */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Configuración guardada automáticamente</span>
          </div>
        </div>
      </div>
    </div>
  );
}