import React from 'react';

import { Practice } from '../../types';

interface DataDiffViewerProps {
  previousData: any;
  newData: any;
  practices: Practice[];
}

interface Item {
  id: string;
  practice_id: string;
  ao: string;
}

const DataDiffViewer: React.FC<DataDiffViewerProps> = ({ previousData, newData, practices }) => {
  const prevPrescription = previousData?.prescription || {};
  const newPrescription = newData?.prescription || {};
  const prevItems: Item[] = previousData?.items || [];
  const newItems: Item[] = newData?.items || [];

  // Find changes in the main prescription object, ignoring metadata fields
  const ignoredKeys = ['created_at', 'updated_at', 'id'];
  const prescriptionChanges = Object.keys({ ...prevPrescription, ...newPrescription })
    .filter(key => !ignoredKeys.includes(key))
    .map(key => {
      const oldValue = prevPrescription[key];
      const newValue = newPrescription[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        return { key, oldValue, newValue };
      }
      return null;
    })
    .filter(Boolean);

  // Find changes in the items array
  const itemChanges = [];
  const allItemIds = new Set([...prevItems.map(i => i.id), ...newItems.map(i => i.id)]);

  for (const id of allItemIds) {
    const oldItem = prevItems.find(i => i.id === id);
    const newItem = newItems.find(i => i.id === id);

        const getPracticeName = (id: string) => practices.find(p => p.id === id)?.name || id;

    if (!oldItem && newItem) { // Item was added
      itemChanges.push({ key: `Estudio añadido: ${getPracticeName(newItem.practice_id)}`, oldValue: 'N/A', newValue: `Ojo: ${newItem.ao}` });
    } else if (!newItem && oldItem) { // Item was deleted
      itemChanges.push({ key: `Estudio eliminado: ${getPracticeName(oldItem.practice_id)}`, oldValue: `Ojo: ${oldItem.ao}`, newValue: 'N/A' });
    } else if (oldItem && newItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) { // Item was modified
      itemChanges.push({ key: `Estudio modificado: ${getPracticeName(newItem.practice_id)}`, oldValue: `Ojo: ${oldItem.ao}`, newValue: `Ojo: ${newItem.ao}` });
    }
  }

  const allChanges = [...prescriptionChanges, ...itemChanges];

  if (allChanges.length === 0) {
    return <p className="text-gray-500 italic">No se detectaron cambios.</p>;
  }

  const renderValue = (value: any) => {
    if (value === null) return <span className="text-gray-400 italic">null</span>;
    if (value === undefined || value === 'N/A') return <span className="text-gray-400 italic">N/A</span>;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left font-semibold p-2">Campo</th>
            <th className="text-left font-semibold p-2">Valor Anterior</th>
            <th className="text-left font-semibold p-2">Valor Nuevo</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {allChanges.map((change, index) => (
            <tr key={change!.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="p-2 font-mono font-medium">{change!.key}</td>
              <td className="p-2 font-mono text-red-600 bg-red-50">{renderValue(change!.oldValue)}</td>
              <td className="p-2 font-mono text-green-600 bg-green-50">{renderValue(change!.newValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataDiffViewer;
