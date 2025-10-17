import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Booking } from '@/types';

interface MonthlyCalendarProps {
  month: Date;
  bookings: Booking[];
  onSelectDay: (day: Date) => void;
}

export default function MonthlyCalendar({ month, bookings, onSelectDay }: MonthlyCalendarProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekdays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

  const getBookingsForDay = (day: Date) => {
    return bookings.filter(booking => isSameDay(booking.day, day));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
      <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
        {weekdays.map(day => (
          <div key={day} className="py-3 capitalize">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map(day => {
          const dayBookings = getBookingsForDay(day);
          return (
            <div
              key={day.toString()}
              className={cn(
                'relative border-r border-b dark:border-gray-700 h-24 sm:h-32 flex flex-col p-2 transition-colors',
                !isSameMonth(day, monthStart) && 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-950',
                'hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer'
              )}
              onClick={() => onSelectDay(day)}
            >
              <span className={cn(
                'font-semibold',
                isToday(day) && 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
              )}>
                {format(day, 'd')}
              </span>
              <div className="flex-grow mt-1 flex flex-col gap-1 overflow-hidden">
                {dayBookings.slice(0, 2).map(booking => (
                  <div key={booking.id} className={cn(
                    'w-full h-1.5 rounded-full',
                    booking.professor === 'Miguel Ángel' ? 'bg-amber-500' : 'bg-blue-500'
                  )}></div>
                ))}
                {dayBookings.length > 2 && (
                  <span className="text-xs text-gray-500 mt-auto">+{dayBookings.length - 2} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
