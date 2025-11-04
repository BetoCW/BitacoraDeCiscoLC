import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Booking, Material } from '@/types';
import { cn } from '@/lib/utils';
import MaterialModal from './MaterialModal';
import BookingService from '@/lib/bookingService';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  bookings: Booking[];
  onNewBooking: (date: Date) => void;
  onBookingUpdate: () => void; // Para refrescar la lista cuando se actualicen materiales
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

export default function DayDetailModal({ isOpen, onClose, date, bookings, onNewBooking, onBookingUpdate }: DayDetailModalProps) {
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  if (!date) return null;

  const startHour = 7;
  const endHour = 21;
  const hourHeight = 64; // h-16

  const timeSlots = Array.from({ length: endHour - startHour }, (_, i) => `${String(i + startHour).padStart(2, '0')}:00`);

  const handleBookClick = () => {
    onNewBooking(date);
    onClose();
  };

  const handleMaterialsClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterials = (materials: Material[]) => {
    if (selectedBooking) {
      BookingService.updateBookingMaterials(selectedBooking.id, materials);
      onBookingUpdate(); // Refrescar la lista en el componente padre
    }
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                {format(date, 'eeee, d \'de\' MMMM', { locale: es })}
              </h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              <div className="relative grid grid-cols-[auto_1fr]">
                {/* Time column */}
                <div className="row-start-1 col-start-1">
                  {timeSlots.map(time => (
                    <div key={time} className="h-16 flex items-start justify-end pr-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 -translate-y-1/2">{time}</span>
                    </div>
                  ))}
                </div>
                {/* Bookings column */}
                <div className="row-start-1 col-start-2 relative">
                  {timeSlots.map((_, timeIndex) => (
                    <div key={timeIndex} className="h-16 border-t dark:border-gray-700"></div>
                  ))}
                  {bookings.map(booking => (
                    <div
                      key={booking.id}
                      className={cn(
                        "absolute left-2 right-2 p-2 rounded-lg text-white text-xs flex flex-col overflow-hidden shadow group cursor-pointer",
                        booking.professor === 'Miguel' ? 'bg-amber-500 border-amber-600 hover:bg-amber-600' : 'bg-blue-500 border-blue-600 hover:bg-blue-600'
                      )}
                      style={getBookingStyle(booking, hourHeight, startHour)}
                      onClick={() => handleMaterialsClick(booking)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{booking.student.name}</p>
                          <p className="truncate text-xs opacity-90">#{booking.student.controlNumber}</p>
                          <p className="truncate text-xs">{booking.subject}</p>
                          <p className="truncate">{booking.professor}</p>
                        </div>
                        <Package size={12} className="opacity-70 group-hover:opacity-100" />
                      </div>
                      
                      {booking.materials && booking.materials.length > 0 && (
                        <div className="mt-1 text-xs opacity-90">
                          📦 {booking.materials.length} material(es)
                        </div>
                      )}
                      
                      <div className="flex justify-between items-end mt-auto">
                        <p className="text-xs">{booking.startTime} - {booking.endTime}</p>
                        <p className="text-xs opacity-70">Click para materiales</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {bookings.length === 0 && (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  No hay reservas para este día.
                </div>
              )}
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
                <button onClick={handleBookClick} className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow">
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
    </AnimatePresence>
  );
}
