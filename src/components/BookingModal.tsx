import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Trash2, Users } from 'lucide-react';
import { Booking } from '@/types';
import { format, parse } from 'date-fns';
import BookingService from '@/lib/bookingService';
import ConfigService from '@/lib/configService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBooking?: (booking: Omit<Booking, 'id'>) => void;
  onUpdateBooking?: (id: string, booking: Omit<Booking, 'id'>) => void;
  existingBookings: Booking[];
  selectedDate: Date | null;
  mode?: 'create' | 'edit';
  initialBooking?: Booking | null;
}

interface TeamMemberInput {
  id: string;
  name: string;
  controlNumber: string;
}

export default function BookingModal({ isOpen, onClose, onAddBooking, onUpdateBooking, existingBookings, selectedDate, mode = 'create', initialBooking = null }: BookingModalProps) {
  const [professors, setProfessors] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMemberInput[]>([
    { id: crypto.randomUUID(), name: '', controlNumber: '' }
  ]);

  const [subject, setSubject] = useState('');
  const [professor, setProfessor] = useState('');
  const [date, setDate] = useState(format(selectedDate || new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [error, setError] = useState<string | null>(null);

  // Load configuration
  useEffect(() => {
    const loadedProfessors = ConfigService.loadProfessors();
    const loadedSubjects = ConfigService.loadSubjects();
    setProfessors(loadedProfessors);
    setSubjects(loadedSubjects);

    if (!subject && loadedSubjects.length > 0) setSubject(loadedSubjects[0]);
    if (!professor && loadedProfessors.length > 0) setProfessor(loadedProfessors[0]);
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate && mode === 'create') {
      setDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate, isOpen, mode]);

  // Initialize fields
  useEffect(() => {
    if (isOpen) {
      const loadedProfessors = ConfigService.loadProfessors();
      const loadedSubjects = ConfigService.loadSubjects();

      if (mode === 'edit' && initialBooking) {
        // Reconstruct team from booking
        const members: TeamMemberInput[] = [];

        // Add main student (leader)
        members.push({
          id: crypto.randomUUID(),
          name: initialBooking.student.name,
          controlNumber: initialBooking.student.controlNumber
        });

        // Add other team members
        if (initialBooking.teamMembers) {
          initialBooking.teamMembers.forEach(m => {
            members.push({
              id: crypto.randomUUID(),
              name: m.name || '', // Handle potential missing name in old data
              controlNumber: m.controlNumber
            });
          });
        }

        setTeamMembers(members);
        setSubject(initialBooking.subject);
        setProfessor(initialBooking.professor);
        setDate(format(initialBooking.day, 'yyyy-MM-dd'));
        setStartTime(initialBooking.startTime);
        setEndTime(initialBooking.endTime);
      } else {
        // Reset for create mode
        setTeamMembers([{ id: crypto.randomUUID(), name: '', controlNumber: '' }]);
        setSubject(loadedSubjects[0] || '');
        setProfessor(loadedProfessors[0] || '');
        setStartTime('09:00');
        setEndTime('11:00');
        if (selectedDate) setDate(format(selectedDate, 'yyyy-MM-dd'));
      }
      setError(null);
    }
  }, [isOpen, mode, initialBooking, selectedDate]);

  const generateTimeSlots = (startHour: number, endHour: number) => {
    const slots = [];
    for (let i = startHour; i < endHour; i++) {
      slots.push(`${String(i).padStart(2, '0')}:00`);
      slots.push(`${String(i).padStart(2, '0')}:30`);
    }
    slots.push(`${String(endHour).padStart(2, '0')}:00`);
    return slots;
  };

  const availableTimeSlots = useMemo(() => {
    return generateTimeSlots(7, 21);
  }, []);

  // Team management
  const addTeamMember = () => {
    if (teamMembers.length >= 8) return; // Limit team size
    setTeamMembers([...teamMembers, { id: crypto.randomUUID(), name: '', controlNumber: '' }]);
  };

  const removeTeamMember = (id: string) => {
    if (teamMembers.length <= 1) return; // Minimum 1 member
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const updateTeamMember = (id: string, field: keyof TeamMemberInput, value: string) => {
    setTeamMembers(teamMembers.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Team
    const validMembers: { name: string; controlNumber: string }[] = [];
    const controlNumbers = new Set<string>();

    for (let i = 0; i < teamMembers.length; i++) {
      const member = teamMembers[i];
      const name = member.name.trim();
      const control = member.controlNumber.trim();

      if (!name || !control) {
        setError(`Faltan datos en el integrante #${i + 1}.`);
        return;
      }

      if (!/^\d{8}$/.test(control)) {
        setError(`El número de control de ${name || 'integrante #' + (i + 1)} debe tener 8 dígitos.`);
        return;
      }

      if (controlNumbers.has(control)) {
        setError(`El número de control ${control} está duplicado en el equipo.`);
        return;
      }
      controlNumbers.add(control);
      validMembers.push({ name, controlNumber: control });
    }

    const newBookingDate = parse(date, 'yyyy-MM-dd', new Date());

    // Validate Date
    if (!BookingService.isValidDate(newBookingDate)) {
      setError('No se pueden hacer reservas en fechas pasadas.');
      return;
    }

    // Validate Time
    const duration = BookingService.calculateDuration(startTime, endTime);
    if (duration <= 0) {
      setError('La hora de fin debe ser mayor que la hora de inicio.');
      return;
    }

    // Validate Time Conflict
    const excludeId = mode === 'edit' && initialBooking ? initialBooking.id : undefined;
    if (BookingService.hasTimeConflict({
      day: newBookingDate,
      startTime,
      endTime,
      professor
    }, existingBookings, excludeId)) {
      setError('Ya existe una reserva en ese horario. No se permiten horas sobrepuestas.');
      return;
    }

    // Validate Team Overlap (check ALL members)
    const membersToCheck = validMembers.map(m => ({ controlNumber: m.controlNumber }));
    if (BookingService.hasTeamOverlap(membersToCheck, newBookingDate, existingBookings, excludeId)) {
      setError('Uno o más miembros del equipo ya tienen una reserva registrada para este día.');
      return;
    }

    // Prepare Payload
    // First member is the "Student" (Leader/Responsible)
    const leader = validMembers[0];
    // Rest are "Team Members"
    const restOfTeam = validMembers.slice(1);

    const payload: Omit<Booking, 'id'> = {
      student: leader,
      subject,
      professor,
      day: newBookingDate,
      startTime,
      endTime,
      duration,
      teamSize: validMembers.length,
      teamMembers: restOfTeam,
    };

    if (mode === 'edit' && initialBooking && onUpdateBooking) {
      onUpdateBooking(initialBooking.id, payload);
    } else if (onAddBooking) {
      onAddBooking(payload);
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm ${mode === 'edit' ? 'z-[70]' : 'z-50'} flex items-center justify-center p-4`}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ${mode === 'edit' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  {mode === 'edit' ? 'Editar Equipo' : 'Nueva Reserva de Equipo'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Registra a todos los integrantes del equipo para apartar el laboratorio.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Cerrar (Esc)"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <form id="booking-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Sección de Integrantes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Integrantes del Equipo
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                    {teamMembers.length} {teamMembers.length === 1 ? 'Miembro' : 'Miembros'}
                  </span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {teamMembers.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={`group relative grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-lg border transition-all duration-200 ${index === 0 ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-700/30 dark:border-gray-700'}`}>

                          {/* Indicator for Leader vs Member */}
                          <div className={`absolute -left-[1px] top-4 w-1 h-8 rounded-r transition-colors ${index === 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400'}`} />

                          <div className="md:col-span-1 flex items-center justify-center">
                            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm ${index === 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-white text-gray-600 dark:bg-gray-600 dark:text-gray-200'}`}>
                              {index + 1}
                            </span>
                          </div>

                          <div className="md:col-span-6">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              {index === 0 ? 'Responsable del Equipo' : 'Nombre del Integrante'}
                            </label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                              placeholder="Nombre Completo"
                              className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm p-2 hover:border-gray-400"
                            />
                          </div>

                          <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              No. Control
                            </label>
                            <input
                              type="text"
                              value={member.controlNumber}
                              onChange={(e) => updateTeamMember(member.id, 'controlNumber', e.target.value)}
                              placeholder="20400798"
                              maxLength={8}
                              className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm font-mono p-2 hover:border-gray-400"
                            />
                          </div>

                          <div className="md:col-span-1 flex items-end justify-center pb-1">
                            {teamMembers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTeamMember(member.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                title="Eliminar integrante"
                              >
                                <Trash2 size={18} />
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
                  onClick={addTeamMember}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-3 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full justify-center border border-dashed border-blue-200 dark:border-blue-800"
                >
                  <Plus size={18} />
                  Agregar otro integrante
                </button>
              </div>

              <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />

              {/* Detalles de la Reserva */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Materia
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow p-2.5"
                  >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profesor
                  </label>
                  <select
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow p-2.5"
                  >
                    {professors.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de la Reserva
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow p-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Inicio
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow p-2.5"
                    >
                      {availableTimeSlots.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fin
                    </label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow p-2.5"
                    >
                      {availableTimeSlots.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 items-start border border-blue-100 dark:border-blue-900/30">
                <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Reglas de Operación:</p>
                  <ul className="list-disc list-inside space-y-1 opacity-90 text-xs text-blue-700 dark:text-blue-300">
                    <li>Es <strong>obligatorio</strong> registrar a todos los integrantes del equipo.</li>
                    <li>El sistema valida que ningún integrante tenga otra reserva a la misma hora.</li>
                    <li>El primer integrante de la lista será el <strong>Responsable</strong> del equipo.</li>
                  </ul>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-lg text-sm flex items-center gap-2 animate-pulse shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 backdrop-blur flex gap-3 justify-between items-center">
              <div className="text-xs text-gray-500 hidden sm:block">
                * Todos los campos son obligatorios
              </div>
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 shadow-sm hover:shadow"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="booking-form"
                  className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {mode === 'edit' ? 'Guardar Cambios' : 'Confirmar Reserva'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
