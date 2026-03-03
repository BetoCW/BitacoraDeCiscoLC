import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    X, Plus, Trash2, Users, Pencil, ChevronDown, ChevronUp, UserPlus, Save, ArrowLeft
} from 'lucide-react';
import { Team, Student } from '@/types';
import TeamService from '@/lib/teamService';
import ConfigService from '@/lib/configService';

interface TeamsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MemberInput {
    id: string;
    name: string;
    controlNumber: string;
}

type ViewMode = 'list' | 'form';

const emptyMember = (): MemberInput => ({ id: crypto.randomUUID(), name: '', controlNumber: '' });

export default function TeamsModal({ isOpen, onClose }: TeamsModalProps) {
    // ── Vista ─────────────────────────────────────────────────────────────────
    const [view, setView] = useState<ViewMode>('list');
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    // ── Lista ─────────────────────────────────────────────────────────────────
    const [teams, setTeams] = useState<Team[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // ── Formulario ────────────────────────────────────────────────────────────
    const [professors, setProfessors] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [teamName, setTeamName] = useState('');
    const [professor, setProfessor] = useState('');
    const [subject, setSubject] = useState('');
    const [members, setMembers] = useState<MemberInput[]>([emptyMember()]);
    const [error, setError] = useState<string | null>(null);

    // ── Cargar datos ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            refreshTeams();
            const profs = ConfigService.loadProfessors();
            const subs = ConfigService.loadSubjects();
            setProfessors(profs);
            setSubjects(subs);
            setProfessor(profs[0] ?? '');
            setSubject(subs[0] ?? '');
        }
    }, [isOpen]);

    const refreshTeams = () => setTeams(TeamService.loadTeams());

    // ── Abrir formulario ──────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingTeam(null);
        setTeamName('');
        const profs = ConfigService.loadProfessors();
        const subs = ConfigService.loadSubjects();
        setProfessor(profs[0] ?? '');
        setSubject(subs[0] ?? '');
        setMembers([emptyMember()]);
        setError(null);
        setView('form');
    };

    const openEdit = (team: Team) => {
        setEditingTeam(team);
        setTeamName(team.name);
        setProfessor(team.professor);
        setSubject(team.subject);
        setMembers(team.members.map(m => ({ id: crypto.randomUUID(), name: m.name, controlNumber: m.controlNumber })));
        setError(null);
        setView('form');
    };

    const goBack = () => {
        setView('list');
        setEditingTeam(null);
        setError(null);
    };

    // ── Gestión de miembros ───────────────────────────────────────────────────
    const addMember = () => setMembers(prev => [...prev, emptyMember()]);
    const removeMember = (id: string) => {
        if (members.length <= 1) return;
        setMembers(prev => prev.filter(m => m.id !== id));
    };
    const updateMember = (id: string, field: 'name' | 'controlNumber', value: string) => {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    // ── Guardar equipo ────────────────────────────────────────────────────────
    const handleSave = () => {
        setError(null);
        if (!teamName.trim()) { setError('El nombre del equipo no puede estar vacío.'); return; }

        const cleanMembers: Student[] = members.map(m => ({
            name: m.name.trim(),
            controlNumber: m.controlNumber.trim()
        }));

        const validationError = TeamService.validateMembers(cleanMembers);
        if (validationError) { setError(validationError); return; }

        // Verificar nombre duplicado (excepto si editamos el mismo equipo)
        const existing = TeamService.loadTeams().find(
            t => t.name.toLowerCase() === teamName.trim().toLowerCase() && t.id !== editingTeam?.id
        );
        if (existing) { setError(`Ya existe un equipo llamado "${teamName.trim()}".`); return; }

        const data = { name: teamName.trim(), professor, subject, members: cleanMembers };
        if (editingTeam) {
            TeamService.updateTeam(editingTeam.id, data);
        } else {
            TeamService.addTeam(data);
        }
        refreshTeams();
        goBack();
    };

    // ── Eliminar equipo ───────────────────────────────────────────────────────
    const handleDelete = (team: Team) => {
        if (window.confirm(`¿Eliminar el equipo "${team.name}"? Esta acción no se puede deshacer.`)) {
            TeamService.deleteTeam(team.id);
            refreshTeams();
        }
    };

    return (
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
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
                            <div className="flex items-center gap-3">
                                {view === 'form' && (
                                    <button
                                        onClick={goBack}
                                        className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                                        title="Volver a la lista"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                )}
                                <Users size={22} />
                                <div>
                                    <h2 className="text-xl font-bold leading-tight">
                                        {view === 'list' ? 'Equipos Registrados' : editingTeam ? `Editando: ${editingTeam.name}` : 'Nuevo Equipo'}
                                    </h2>
                                    <p className="text-xs text-indigo-100 opacity-90 mt-0.5">
                                        {view === 'list'
                                            ? `${teams.length} equipo${teams.length !== 1 ? 's' : ''} registrado${teams.length !== 1 ? 's' : ''}`
                                            : 'Completa la información del equipo'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                                title="Cerrar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* ── VISTA LISTA ────────────────────────────────────────────────── */}
                        <AnimatePresence mode="wait">
                            {view === 'list' && (
                                <motion.div
                                    key="list"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex-1 overflow-y-auto p-5 space-y-3"
                                >
                                    {teams.length === 0 ? (
                                        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                                            <Users size={40} className="mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">No hay equipos registrados.</p>
                                            <p className="text-sm mt-1">Crea el primer equipo con el botón de abajo.</p>
                                        </div>
                                    ) : (
                                        teams.map(team => (
                                            <div
                                                key={team.id}
                                                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                                            >
                                                {/* Team header row */}
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40">
                                                    <div
                                                        className="flex-1 cursor-pointer select-none"
                                                        onClick={() => setExpandedId(expandedId === team.id ? null : team.id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-900 dark:text-gray-100">{team.name}</span>
                                                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                                {team.members.length} integrante{team.members.length !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {team.subject} · Prof. {team.professor}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => openEdit(team)}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                            title="Editar equipo"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(team)}
                                                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Eliminar equipo"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => setExpandedId(expandedId === team.id ? null : team.id)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                                                        >
                                                            {expandedId === team.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded members */}
                                                <AnimatePresence>
                                                    {expandedId === team.id && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: 'auto' }}
                                                            exit={{ height: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-4 py-3 space-y-1.5 border-t border-gray-100 dark:border-gray-700">
                                                                {team.members.map((m, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 text-sm">
                                                                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold shrink-0">
                                                                            {idx + 1}
                                                                        </span>
                                                                        <span className="flex-1 text-gray-800 dark:text-gray-200">{m.name}</span>
                                                                        <span className="font-mono text-xs text-gray-400 dark:text-gray-500">#{m.controlNumber}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )}

                            {/* ── VISTA FORMULARIO ─────────────────────────────────────────── */}
                            {view === 'form' && (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex-1 overflow-y-auto p-5 space-y-5"
                                >
                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm flex items-center gap-2"
                                            >
                                                <X size={16} className="shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Nombre del equipo */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                            Nombre del Equipo
                                        </label>
                                        <input
                                            type="text"
                                            value={teamName}
                                            onChange={e => setTeamName(e.target.value)}
                                            placeholder='Ej. "Cisqueros.net"'
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                                        />
                                    </div>

                                    {/* Profesor y Materia */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Profesor</label>
                                            <select
                                                value={professor}
                                                onChange={e => setProfessor(e.target.value)}
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                                            >
                                                {professors.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Materia</label>
                                            <select
                                                value={subject}
                                                onChange={e => setSubject(e.target.value)}
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                                            >
                                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Integrantes */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Integrantes
                                            </label>
                                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                {members.length} miembro{members.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <AnimatePresence initial={false} mode="popLayout">
                                                {members.map((m, idx) => (
                                                    <motion.div
                                                        key={m.id}
                                                        layout
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.18 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className={`grid grid-cols-12 gap-2 p-3 rounded-lg border ${idx === 0 ? 'bg-indigo-50/60 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-700/30 dark:border-gray-700'}`}>
                                                            <div className="col-span-1 flex items-center justify-center">
                                                                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-white text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                                                                    {idx + 1}
                                                                </span>
                                                            </div>
                                                            <div className="col-span-6">
                                                                <input
                                                                    type="text"
                                                                    value={m.name}
                                                                    onChange={e => updateMember(m.id, 'name', e.target.value)}
                                                                    placeholder={idx === 0 ? 'Responsable del equipo' : 'Nombre completo'}
                                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div className="col-span-4">
                                                                <input
                                                                    type="text"
                                                                    value={m.controlNumber}
                                                                    onChange={e => updateMember(m.id, 'controlNumber', e.target.value)}
                                                                    placeholder="No. Control"
                                                                    maxLength={8}
                                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-2.5 py-1.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div className="col-span-1 flex items-center justify-center">
                                                                {members.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeMember(m.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={addMember}
                                            className="mt-2 w-full flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                        >
                                            <UserPlus size={16} />
                                            Agregar integrante
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex justify-between items-center gap-3">
                            {view === 'list' ? (
                                <>
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={openCreate}
                                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <Plus size={18} />
                                        Nuevo Equipo
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={goBack}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <Save size={16} />
                                        {editingTeam ? 'Guardar cambios' : 'Registrar Equipo'}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
