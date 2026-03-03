import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Trash2, Settings, RotateCcw, Users } from 'lucide-react';
import ConfigService from '@/lib/configService';
import TeamsModal from './TeamsModal';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: () => void;
}

type Tab = 'config' | 'teams';

export default function AdminPanel({ isOpen, onClose, onConfigChange }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [professors, setProfessors] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [professorColors, setProfessorColors] = useState<Record<string, string>>({});
  const [newProfessor, setNewProfessor] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = () => {
    setProfessors(ConfigService.loadProfessors());
    setSubjects(ConfigService.loadSubjects());
    setProfessorColors(ConfigService.loadProfessorColors());
    setError(null);
  };

  const handleAddProfessor = () => {
    if (!newProfessor.trim()) {
      setError('El nombre del profesor no puede estar vacío');
      return;
    }

    if (ConfigService.addProfessor(newProfessor)) {
      setNewProfessor('');
      loadConfig();
      onConfigChange();
      setError(null);
    } else {
      setError('El profesor ya existe o el nombre es inválido');
    }
  };

  const handleRemoveProfessor = (name: string) => {
    if (professors.length <= 1) {
      setError('Debe haber al menos un profesor');
      return;
    }

    if (window.confirm(`¿Eliminar profesor "${name}"?`)) {
      if (ConfigService.removeProfessor(name)) {
        ConfigService.removeProfessorColor(name);
        loadConfig();
        onConfigChange();
        setError(null);
      }
    }
  };

  const handleColorChange = (name: string, color: string) => {
    ConfigService.saveProfessorColor(name, color);
    setProfessorColors(prev => ({ ...prev, [name]: color }));
    onConfigChange();
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) {
      setError('El nombre de la materia no puede estar vacío');
      return;
    }

    if (ConfigService.addSubject(newSubject)) {
      setNewSubject('');
      loadConfig();
      onConfigChange();
      setError(null);
    } else {
      setError('La materia ya existe o el nombre es inválido');
    }
  };

  const handleRemoveSubject = (name: string) => {
    if (subjects.length <= 1) {
      setError('Debe haber al menos una materia');
      return;
    }

    if (window.confirm(`¿Eliminar materia "${name}"?`)) {
      if (ConfigService.removeSubject(name)) {
        loadConfig();
        onConfigChange();
        setError(null);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Restaurar profesores, materias y colores por defecto? Esta acción no se puede deshacer.')) {
      ConfigService.resetToDefaults();
      loadConfig();
      onConfigChange();
      setError(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-center gap-2">
                  <Settings size={24} />
                  <h2 className="text-xl font-bold">Administración</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button
                  onClick={() => { setActiveTab('config'); setError(null); }}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'config'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  <Settings size={16} />
                  Configuración
                </button>
                <button
                  onClick={() => { setActiveTab('teams'); setError(null); }}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'teams'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  <Users size={16} />
                  Equipos
                </button>
              </div>

              {/* Content */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    {error}
                  </div>
                )}

                {/* ── TAB: CONFIGURACIÓN ─────────────────────────────────── */}
                {activeTab === 'config' && (
                  <>
                    {/* Profesores Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        Profesores
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                        {/* Add Professor */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newProfessor}
                            onChange={(e) => setNewProfessor(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddProfessor()}
                            placeholder="Nombre del profesor"
                            className="flex-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                          />
                          <button
                            onClick={handleAddProfessor}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                          >
                            <Plus size={18} />
                            Agregar
                          </button>
                        </div>

                        {/* Professors List */}
                        <div className="space-y-2">
                          {professors.map((prof) => {
                            const color = professorColors[prof] || '#6b7280';
                            return (
                              <div
                                key={prof}
                                className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm gap-3"
                              >
                                {/* Color indicator bar */}
                                <div
                                  className="w-3 h-8 rounded-full shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="font-medium text-gray-900 dark:text-gray-100 flex-1">{prof}</span>
                                {/* Color picker */}
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-500 dark:text-gray-400">Color:</label>
                                  <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => handleColorChange(prof, e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0.5 bg-transparent"
                                    title={`Cambiar color de ${prof}`}
                                  />
                                </div>
                                <button
                                  onClick={() => handleRemoveProfessor(prof)}
                                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"
                                  disabled={professors.length <= 1}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          💡 Haz clic en el cuadro de color para cambiar el color del profesor en el calendario.
                        </p>
                      </div>
                    </div>

                    {/* Materias Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        Materias
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                        {/* Add Subject */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                            placeholder="Nombre de la materia"
                            className="flex-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                          />
                          <button
                            onClick={handleAddSubject}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                          >
                            <Plus size={18} />
                            Agregar
                          </button>
                        </div>

                        {/* Subjects List */}
                        <div className="space-y-2">
                          {subjects.map((subj) => (
                            <div
                              key={subj}
                              className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm"
                            >
                              <span className="font-medium text-gray-900 dark:text-gray-100">{subj}</span>
                              <button
                                onClick={() => handleRemoveSubject(subj)}
                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"
                                disabled={subjects.length <= 1}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <div className="pt-4 border-t dark:border-gray-700">
                      <button
                        onClick={handleReset}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
                      >
                        <RotateCcw size={18} />
                        Restaurar valores por defecto
                      </button>
                    </div>
                  </>
                )}

                {/* ── TAB: EQUIPOS ──────────────────────────────────────────── */}
                {activeTab === 'teams' && (
                  <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Users size={40} className="text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gestión de Equipos</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                        Pre-registra los equipos del semestre. Al apartar horas, solo busca el nombre del equipo y los integrantes se autocompletan.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsTeamsModalOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Users size={18} />
                      Abrir Gestor de Equipos
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teams Modal (se abre desde la pestaña Equipos) */}
      <TeamsModal
        isOpen={isTeamsModalOpen}
        onClose={() => setIsTeamsModalOpen(false)}
      />
    </>
  );
}
