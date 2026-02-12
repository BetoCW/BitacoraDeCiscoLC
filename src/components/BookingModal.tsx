import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
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

export default function BookingModal({ isOpen, onClose, onAddBooking, onUpdateBooking, existingBookings, selectedDate, mode = 'create', initialBooking = null }: BookingModalProps) {
  const [professors, setProfessors] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [studentName, setStudentName] = useState('');
  const [controlNumber, setControlNumber] = useState('');
  const [teamSize, setTeamSize] = useState<number | ''>('');
  const [teamMembersText, setTeamMembersText] = useState('');
  const [subject, setSubject] = useState('');
  const [professor, setProfessor] = useState('');
  const [date, setDate] = useState(format(selectedDate || new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración dinámica
  useEffect(() => {
    const loadedProfessors = ConfigService.loadProfessors();
    const loadedSubjects = ConfigService.loadSubjects();
    setProfessors(loadedProfessors);
    setSubjects(loadedSubjects);
    
    // Set defaults if empty
    if (!subject && loadedSubjects.length > 0) setSubject(loadedSubjects[0]);
    if (!professor && loadedProfessors.length > 0) setProfessor(loadedProfessors[0]);
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate && mode === 'create') {
      setDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate, isOpen, mode]);

  useEffect(() => {
    // Set fields when modal opens
    if (isOpen) {
      const loadedProfessors = ConfigService.loadProfessors();
      const loadedSubjects = ConfigService.loadSubjects();
      
      if (mode === 'edit' && initialBooking) {
        setStudentName(initialBooking.student.name);
        setControlNumber(initialBooking.student.controlNumber);
        setTeamSize(initialBooking.teamSize ?? '');
        setTeamMembersText((initialBooking.teamMembers || []).map(m => m.controlNumber).join(', '));
        setSubject(initialBooking.subject);
        setProfessor(initialBooking.professor);
        setDate(format(initialBooking.day, 'yyyy-MM-dd'));
        setStartTime(initialBooking.startTime);
        setEndTime(initialBooking.endTime);
      } else {
        setStudentName('');
        setControlNumber('');
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

  // Todos los horarios disponibles para seleccionar (la validación se hace al enviar)
  const availableTimeSlots = useMemo(() => {
    return generateTimeSlots(7, 21);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar campos obligatorios
    if (!studentName.trim()) {
      setError('El nombre del alumno es obligatorio.');
      return;
    }

    if (!controlNumber.trim()) {
      setError('El número de control es obligatorio.');
      return;
    }

    // Validar formato de número de control (8 dígitos)
    if (!/^\d{8}$/.test(controlNumber)) {
      setError('El número de control debe tener exactamente 8 dígitos.');
      return;
    }

    const newBookingDate = parse(date, 'yyyy-MM-dd', new Date());
    
    // Validar que la fecha no sea pasada
    if (!BookingService.isValidDate(newBookingDate)) {
      setError('No se pueden hacer reservas en fechas pasadas.');
      return;
    }

    // Calcular duración (sin límites)
    const duration = BookingService.calculateDuration(startTime, endTime);
    
    if (duration <= 0) {
      setError('La hora de fin debe ser mayor que la hora de inicio.');
      return;
    }



    // Validar conflictos (no horas sobrepuestas)
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

    // Validación de equipo: si se indica un tamaño de equipo, se deben proporcionar los números de control
    let parsedTeamMembers: { name?: string; controlNumber: string }[] | undefined = undefined;
    const ts = teamSize === '' ? 0 : Number(teamSize);
    if (ts > 0) {
      const tokens = teamMembersText.split(/[,\n;]+/).map(t => t.trim()).filter(Boolean);
      if (tokens.length !== ts) {
        setError(`Se indicó un equipo de ${ts} integrantes, pero se proporcionaron ${tokens.length}.`);
        return;
      }

      // Validar formato y unicidad
      const unique = new Set<string>();
      for (const t of tokens) {
        if (!/^\d{8}$/.test(t)) {
          setError('Cada número de control del equipo debe tener exactamente 8 dígitos.');
          return;
        }
        if (unique.has(t)) {
          setError('Los números de control del equipo deben ser únicos.');
          return;
        }
        unique.add(t);
      }

      parsedTeamMembers = tokens.map(t => ({ controlNumber: t }));

      // Evitar que miembros del equipo reserven el mismo día en otra reserva
      if (BookingService.hasTeamOverlap(parsedTeamMembers, newBookingDate, existingBookings, excludeId)) {
        setError('Algún miembro del equipo ya tiene una reserva en ese día. Evita duplicados.');
        return;
      }
    }

    const payload: Omit<Booking, 'id'> = {
      student: {
        name: studentName,
        controlNumber: controlNumber
      },
      subject,
      professor,
      day: newBookingDate,
      startTime,
      endTime,
      duration,
      teamSize: ts > 0 ? ts : undefined,
      teamMembers: parsedTeamMembers as any,
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
          className={`fixed inset-0 bg-black/50 ${mode === 'edit' ? 'z-[70]' : 'z-50'} flex items-center justify-center p-4`}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative ${mode === 'edit' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{mode === 'edit' ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={20} />
              </button>
            </div>
            <form id="booking-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Información del Alumno */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Alumno *
                  </label>
                  <input 
                    type="text" 
                    id="studentName" 
                    value={studentName} 
                    onChange={(e) => setStudentName(e.target.value)} 
                    className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <label htmlFor="controlNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Control *
                  </label>
                  <input 
                    type="text" 
                    id="controlNumber" 
                    value={controlNumber} 
                    onChange={(e) => setControlNumber(e.target.value)} 
                    className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="20400798"
                    maxLength={8}
                  />
                </div>
              </div>

              {/* Información del Equipo (opcional) */}
              <div>
                <label htmlFor="teamSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tamaño del equipo (opcional)
                </label>
                <input
                  type="number"
                  id="teamSize"
                  value={teamSize === '' ? '' : String(teamSize)}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') setTeamSize('');
                    else setTeamSize(Math.max(0, Number(v)));
                  }}
                  min={1}
                  className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 4"
                />
                <p className="text-xs text-gray-500 mt-1">Si indicas el tamaño, debes proporcionar los números de control de los integrantes.</p>
              </div>

              <div>
                <label htmlFor="teamMembers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Números de control del equipo (coma o nueva línea separados)
                </label>
                <textarea
                  id="teamMembers"
                  value={teamMembersText}
                  onChange={(e) => setTeamMembersText(e.target.value)}
                  className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="20401234, 20405678, 20400999"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Incluye los números de control completos (8 dígitos) de cada integrante.</p>
              </div>

              {/* Materia */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Materia *
                </label>
                <select 
                  id="subject" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Profesor */}
              <div>
                <label htmlFor="professor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Profesor *
                </label>
                <select 
                  id="professor" 
                  value={professor} 
                  onChange={(e) => setProfessor(e.target.value)} 
                  className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {professors.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha *
                </label>
                <input 
                  type="date" 
                  id="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hora de Inicio *
                  </label>
                  <select 
                    id="startTime" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                    className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableTimeSlots.map((t: string) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hora de Fin *
                  </label>
                  <select 
                    id="endTime" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableTimeSlots.map((t: string) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Información de duración */}
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <p><strong>Reglas de reserva:</strong></p>
                <ul className="list-disc list-inside ml-2 text-xs">
                  <li>No se puede apartar más de 1 vez si en esa hora y día ya está apartado</li>
                  <li>No debe existir horas sobrepuestas</li>
                  <li>Sin límite de duración (1, 2, 3, 4+ horas permitidas)</li>
                </ul>
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  {error}
                </div>
              )}
            </form>
            
            {/* Botón sticky en la parte inferior */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
              <button 
                type="submit" 
                form="booking-form"
                className="w-full bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {mode === 'edit' ? 'Guardar Cambios' : 'Confirmar Reserva'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
