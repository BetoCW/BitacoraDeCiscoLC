import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { Material } from '@/types';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (materials: Material[]) => void;
  initialMaterials?: Material[];
  studentName: string;
}

const materialCategories = [
  'Cables',
  'Routers', 
  'Servidores',
  'Firewall',
  'Otros'
] as const;

const commonMaterials = {
  'Cables': [
    'Cable Ethernet',
    'Cable Consola',
    'Cable Serial'
  ],
  'Routers': [
    'N900',
    'AC1200'
    
  ],
  'Servidores': [
    'Servidor PC'
  ],
  'Firewall': [
    'Fortinet'
  ],
  'Otros': [
    'Switch',
    'Access Point',
    'Patch Panel'
  ]
};

export default function MaterialModal({ isOpen, onClose, onSave, initialMaterials = [], studentName }: MaterialModalProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [selectedCategory, setSelectedCategory] = useState<typeof materialCategories[number]>('Cables');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);

  const addMaterial = () => {
    const materialName = selectedMaterial || customMaterial;
    if (!materialName.trim()) return;

    const newMaterial: Material = {
      id: crypto.randomUUID(),
      name: materialName,
      quantity: quantity,
      category: selectedCategory
    };

    setMaterials([...materials, newMaterial]);
    setSelectedMaterial('');
    setCustomMaterial('');
    setQuantity(1);
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleSave = () => {
    onSave(materials);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Materiales de Laboratorio
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Para: {studentName}
                  </p>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Add Material Form */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Agregar Material
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría
                    </label>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value as typeof materialCategories[number]);
                        setSelectedMaterial('');
                      }}
                      className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {materialCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cantidad
                    </label>
                    <input 
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Material
                  </label>
                  <select 
                    value={selectedMaterial}
                    onChange={(e) => {
                      setSelectedMaterial(e.target.value);
                      if (e.target.value) setCustomMaterial('');
                    }}
                    className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar material común...</option>
                    {commonMaterials[selectedCategory].map(material => (
                      <option key={material} value={material}>{material}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    O escribir material personalizado
                  </label>
                  <input 
                    type="text"
                    value={customMaterial}
                    onChange={(e) => {
                      setCustomMaterial(e.target.value);
                      if (e.target.value) setSelectedMaterial('');
                    }}
                    placeholder="Ej: Cisco 2960, Cable UTP Cat6, etc."
                    className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button 
                  onClick={addMaterial}
                  disabled={!selectedMaterial && !customMaterial.trim()}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  Agregar Material
                </button>
              </div>

              {/* Materials List */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Materiales Solicitados ({materials.length})
                </h3>
                
                {materials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    No se han agregado materiales aún
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materials.map((material) => (
                      <div 
                        key={material.id}
                        className="flex items-center justify-between bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            material.category === 'Cables' ? 'bg-blue-100 text-blue-800' :
                            material.category === 'Routers' ? 'bg-green-100 text-green-800' :
                            material.category === 'Servidores' ? 'bg-purple-100 text-purple-800' :
                            material.category === 'Firewall' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {material.category}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {material.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Cantidad: {material.quantity}
                            </p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => removeMaterial(material.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4 flex justify-end space-x-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Guardar Materiales
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}