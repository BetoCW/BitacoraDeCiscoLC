import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Booking, Professor } from '@/types';
import { format, parse } from 'date-fns';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBooking: (booking: Omit<Booking, 'id'>) => void;
  existingBookings: Booking[];
  selectedDate: Date | null;
}

const professors: Professor[] = ['Olivares', 'Bernabé', 'Miguel Ángel'];

const generateTimeSlots = (startHour: number, endHour: number) => {
  const slots = [];
  for (let i = startHour; i < endHour; i++) {
    slots.push(`${String(i).padStart(2, '0')}:00`);
    slots.push(`${String(i).padStart(2, '0')}:30`);
  }
  slots.push(`${String(endHour).padStart(2, '0')}:00`);
  return slots;
};

const timeSlotsOB = generateTimeSlots(7, 17);
const timeSlotsMA = generateTimeSlots(17, 21);

export default function BookingModal({ isOpen, onClose, onAddBooking, existingBookings, selectedDate }: BookingModalProps) {
  const [title, setTitle] = useState('');
  const [professor, setProfessor] = useState<Professor>('Olivares');
  const [date, setDate] = useState(format(selectedDate || new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate, isOpen]);

  useEffect(() => {
    if (professor === 'Miguel Ángel') {
      setStartTime('17:00');
      setEndTime('18:00');
    } else { // Olivares or Bernabé
      setStartTime('09:00');
      setEndTime('10:00');
    }
  }, [professor]);

  const availableTimeSlots = useMemo(() => {
    return professor === 'Miguel Ángel' ? timeSlotsMA : timeSlotsOB;
  }, [professor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('El título de la reserva es obligatorio.');
      return;
    }

    const newBookingDate = parse(date, 'yyyy-MM-dd', new Date());
    const newBookingStart = parse(startTime, 'HH:mm', newBookingDate);
    const newBookingEnd = parse(endTime, 'HH:mm', newBookingDate);

    if (newBookingStart >= newBookingEnd) {
      setError('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const isConflict = existingBookings.some(booking => {
      const existingDate = booking.day;
      if (format(existingDate, 'yyyy-MM-dd') !== date) return false;

      const existingStart = parse(booking.startTime, 'HH:mm', existingDate);
      const existingEnd = parse(booking.endTime, 'HH:mm', existingDate);

      return (newBookingStart < existingEnd && newBookingEnd > existingStart);
    });

    if (isConflict) {
      setError('El horario seleccionado entra en conflicto con otra reserva.');
      return;
    }

    onAddBooking({
      title,
      professor,
      day: newBookingDate,
      startTime,
      endTime,
    });
    
    setTitle('');
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nueva Reserva</h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título de la Reserva</label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="professor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profesor</label>
                <select id="professor" value={professor} onChange={(e) => setProfessor(e.target.value as Professor)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  {professors.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora de Inicio</label>
                  <select id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    {availableTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora de Fin</label>
                  <select id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    {availableTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex justify-end pt-4">
                <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
