import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Booking } from '@/types';
import { cn } from '@/lib/utils';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  bookings: Booking[];
  onNewBooking: (date: Date) => void;
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

export default function DayDetailModal({ isOpen, onClose, date, bookings, onNewBooking }: DayDetailModalProps) {
  if (!date) return null;

  const startHour = 7;
  const endHour = 21;
  const hourHeight = 64; // h-16

  const timeSlots = Array.from({ length: endHour - startHour }, (_, i) => `${String(i + startHour).padStart(2, '0')}:00`);

  const handleBookClick = () => {
    onNewBooking(date);
    onClose();
  }

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
                        "absolute left-2 right-2 p-2 rounded-lg text-white text-xs flex flex-col overflow-hidden shadow",
                        booking.professor === 'Miguel Ángel' ? 'bg-amber-500 border-amber-600' : 'bg-blue-500 border-blue-600'
                      )}
                      style={getBookingStyle(booking, hourHeight, startHour)}
                    >
                      <p className="font-bold truncate">{booking.title}</p>
                      <p className="truncate">{booking.professor}</p>
                      <p className="mt-auto">{booking.startTime} - {booking.endTime}</p>
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
    </AnimatePresence>
  );
}
