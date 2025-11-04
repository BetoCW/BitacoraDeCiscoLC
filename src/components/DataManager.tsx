import { useState } from 'react';
import { Download, Upload, Database, AlertCircle, CheckCircle } from 'lucide-react';
import BookingService from '@/lib/bookingService';

interface DataManagerProps {
  onDataChange?: () => void;
}

export default function DataManager({ onDataChange }: DataManagerProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = () => {
    try {
      BookingService.exportData();
      setMessage({ type: 'success', text: 'Datos exportados correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al exportar datos' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const success = await BookingService.importData(file);
      if (success) {
        setMessage({ type: 'success', text: 'Datos importados correctamente' });
        onDataChange?.(); // Refrescar la aplicación
      } else {
        setMessage({ type: 'error', text: 'Error: Formato de archivo inválido' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al importar el archivo' });
    }
    
    setIsImporting(false);
    // Limpiar el input para permitir reimportar el mismo archivo
    event.target.value = '';
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Database size={20} className="text-blue-600" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Gestión de Datos
        </h3>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p>
          <strong>💾 Almacenamiento:</strong> Los datos se guardan automáticamente en el navegador.
        </p>
        <p>
          <strong>🔄 Transferencia:</strong> Para mover la aplicación a otra PC, exporta e importa los datos.
        </p>
      </div>

      <div className="flex gap-3">
        {/* Exportar */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <Download size={16} />
          Exportar Datos
        </button>

        {/* Importar */}
        <label className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors cursor-pointer text-sm">
          <Upload size={16} />
          {isImporting ? 'Importando...' : 'Importar Datos'}
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
            className="hidden"
          />
        </label>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p><strong>Exportar:</strong> Descarga un archivo .json con todas tus reservas y materiales</p>
        <p><strong>Importar:</strong> Carga datos desde un archivo .json previamente exportado</p>
        <p><strong>Nota:</strong> Al importar se reemplazarán todos los datos actuales</p>
      </div>
    </div>
  );
}