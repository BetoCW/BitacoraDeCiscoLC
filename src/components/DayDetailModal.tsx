import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Package, AlertTriangle, Check, XCircle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Booking, Material } from '@/types';
import { cn, isBookingMissed, MISSED_COLOR } from '@/lib/utils';
import MaterialModal from './MaterialModal';
import BookingService from '@/lib/bookingService';
import ConfigService from '@/lib/configService';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  bookings: Booking[];
  onNewBooking: (date: Date) => void;
  onBookingUpdate: () => void;
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const getBookingStyle = (booking: Booking, hourHeight: number, startHour: number) => {
  const startTimeInMinutes = timeToMinutes(booking.startTime);
  const endTimeInMinutes = timeToMinutes(booking.endTime);

  const top = ((startTimeInMinutes - startHour * 60) / 60) * hourHeight;
  const height = ((endTimeInMinutes - startTimeInMinutes) / 60) * hourHeight;

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
};

export default function DayDetailModal({
  isOpen, onClose, date, bookings, onNewBooking, onBookingUpdate, onEditBooking, onDeleteBooking
}: DayDetailModalProps) {
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  const [showActions, setShowActions] = useState(false);

  if (!date) return null;

  const professorColors = ConfigService.loadProfessorColors();

  const startHour = 7;
  const endHour = 21;
  const hourHeight = 64; // h-16

  const timeSlots = Array.from(
    { length: endHour - startHour },
    (_, i) => `${String(i + startHour).padStart(2, '0')}:00`
  );

  const cisco1Bookings = bookings.filter(b => !b.classroom || b.classroom === 'Cisco 1');
  const cisco2Bookings = bookings.filter(b => b.classroom === 'Cisco 2');

  const handleBookClick = () => {
    onNewBooking(date);
    onClose();
  };

  const handleMaterialsClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsMaterialModalOpen(true);
  };

  const handleActionsDblClick = (booking: Booking) => {
    setActionBooking(booking);
    setShowActions(true);
  };

  const handleEditClick = () => {
    if (actionBooking && onEditBooking) onEditBooking(actionBooking);
    setShowActions(false);
  };

  const handleDeleteClick = () => {
    if (actionBooking && onDeleteBooking) {
      const ok = window.confirm('¿Seguro que deseas eliminar esta reserva?');
      if (ok) {
        onDeleteBooking(actionBooking.id);
        setShowActions(false);
      }
    }
  };

  const handleSetAttendance = (attended: boolean | undefined) => {
    if (!actionBooking) return;
    BookingService.setBookingAttendance(actionBooking.id, attended);
    onBookingUpdate();
    setShowActions(false);
  };

  const handleSaveMaterials = (materials: Material[]) => {
    if (selectedBooking) {
      BookingService.updateBookingMaterials(selectedBooking.id, materials);
      onBookingUpdate();
    }
  };

  const renderBookingCard = (booking: Booking) => {
    const baseColor = professorColors[booking.professor] || '#6b7280';
    const missed = isBookingMissed(booking);
    const color = missed ? MISSED_COLOR : baseColor;
    const explicitAttended = booking.attended === true;
    const explicitMissed = booking.attended === false;
    return (
      <div
        key={booking.id}
        className={cn(
          'absolute left-1 right-1 p-2 rounded-lg text-white text-xs flex flex-col overflow-hidden shadow group cursor-pointer transition-opacity hover:opacity-90',
          missed && 'opacity-80 ring-1 ring-red-400/60',
          explicitAttended && 'ring-1 ring-emerald-400/70'
        )}
        style={{
          ...getBookingStyle(booking, hourHeight, startHour),
          backgroundColor: color,
        }}
        onDoubleClick={() => handleActionsDblClick(booking)}
        title="Doble clic para opciones (asistencia, editar, eliminar)"
      >
        {missed && (
          <span className="absolute top-1 right-1 flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
            <AlertTriangle size={10} />
            {explicitMissed ? 'FALTÓ' : 'FALTÓ?'}
          </span>
        )}
        {explicitAttended && (
          <span className="absolute top-1 right-1 flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
            <Check size={10} />
            ASISTIÓ
          </span>
        )}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className={cn('font-bold truncate', missed && 'line-through opacity-90')}>{booking.student.name}</p>
            <p className="truncate text-xs opacity-90">#{booking.student.controlNumber}</p>
            <p className="truncate text-xs">{booking.subject}</p>
            <p className="truncate">{booking.professor}</p>
          </div>
          {!missed && !explicitAttended && <Package size={12} className="opacity-70 group-hover:opacity-100 shrink-0" />}
        </div>

        {booking.materials && booking.materials.length > 0 && (
          <div className="mt-1 text-xs opacity-90">
            📦 {booking.materials.length} material(es)
          </div>
        )}

        <div className="flex justify-between items-end mt-auto gap-2">
          <p className="text-xs">{booking.startTime} - {booking.endTime}</p>
          <button
            onClick={() => handleMaterialsClick(booking)}
            className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
          >
            Materiales
          </button>
        </div>
      </div>
    );
  };

  const renderLane = (laneBookings: Booking[]) => (
    <div className="relative flex-1">
      {timeSlots.map((_, timeIndex) => (
        <div key={timeIndex} className="h-16 border-t dark:border-gray-700" />
      ))}
      {laneBookings.map(booking => renderBookingCard(booking))}
    </div>
  );

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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                {format(date, "eeee, d 'de' MMMM", { locale: es })}
              </h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4">
              {/* Column headers */}
              <div className="grid grid-cols-[auto_1fr_1fr] mb-1">
                <div className="w-12" />
                <div className="text-center text-xs font-bold text-blue-600 dark:text-blue-400 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-t-md mx-1">
                  🖥 Cisco 1
                </div>
                <div className="text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-t-md mx-1">
                  🖥 Cisco 2
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr_1fr]">
                {/* Time column */}
                <div className="w-12">
                  {timeSlots.map(time => (
                    <div key={time} className="h-16 flex items-start justify-end pr-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 -translate-y-1/2">{time}</span>
                    </div>
                  ))}
                </div>

                {/* Cisco 1 lane */}
                <div className="mx-1 border border-gray-200 dark:border-gray-700 rounded-b-md overflow-hidden">
                  {renderLane(cisco1Bookings)}
                </div>

                {/* Cisco 2 lane */}
                <div className="mx-1 border border-gray-200 dark:border-gray-700 rounded-b-md overflow-hidden">
                  {renderLane(cisco2Bookings)}
                </div>
              </div>

              {bookings.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay reservas para este día.
                </div>
              )}
            </div>

            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button
                onClick={handleBookClick}
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow"
              >
                <Plus size={18} />
                <span>Reservar para este día</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Material Modal */}
      {selectedBooking && (
        <MaterialModal
          isOpen={isMaterialModalOpen}
          onClose={() => {
            setIsMaterialModalOpen(false);
            setSelectedBooking(null);
          }}
          onSave={handleSaveMaterials}
          initialMaterials={selectedBooking.materials || []}
          studentName={selectedBooking.student.name}
        />
      )}

      {/* Actions Modal for double click */}
      <AnimatePresence>
        {showActions && actionBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
            onClick={() => setShowActions(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Opciones de Reserva</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 truncate">
                {actionBooking.student.name} • {actionBooking.startTime}-{actionBooking.endTime}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                {actionBooking.classroom || 'Cisco 1'} · Prof. {actionBooking.professor}
              </p>

              {/* Registro de asistencia */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Asistencia
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSetAttendance(true)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 text-sm font-semibold px-3 py-2 rounded-md transition-colors border',
                      actionBooking.attended === true
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                    )}
                    title="Marcar que el equipo asistió"
                  >
                    <Check size={16} />
                    Asistió
                  </button>
                  <button
                    onClick={() => handleSetAttendance(false)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 text-sm font-semibold px-3 py-2 rounded-md transition-colors border',
                      actionBooking.attended === false
                        ? 'bg-red-600 text-white border-red-700'
                        : 'bg-white dark:bg-gray-700 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30'
                    )}
                    title="Marcar que el equipo faltó"
                  >
                    <XCircle size={16} />
                    Faltó
                  </button>
                  {actionBooking.attended !== undefined && (
                    <button
                      onClick={() => handleSetAttendance(undefined)}
                      className="flex items-center justify-center gap-1 text-xs font-medium px-2 py-2 rounded-md text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Quitar registro de asistencia"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleEditClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-md">Actualizar</button>
                <button onClick={handleDeleteClick} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-2 rounded-md">Eliminar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
