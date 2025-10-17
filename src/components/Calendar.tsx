import { useState } from 'react';
import { startOfMonth, addMonths, subMonths, setHours, addDays, startOfWeek, format } from 'date-fns';
import CalendarHeader from './CalendarHeader';
import MonthlyCalendar from './MonthlyCalendar';
import BookingModal from './BookingModal';
import DayDetailModal from './DayDetailModal';
import { Booking } from '@/types';

const today = new Date();
const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday

const initialBookings: Booking[] = [
  {
    id: '1',
    professor: 'Olivares',
    day: setHours(addDays(startOfThisWeek, 0), 0), // Monday
    startTime: '09:00',
    endTime: '11:00',
    title: 'Práctica Equipo A',
  },
  {
    id: '2',
    professor: 'Bernabé',
    day: setHours(addDays(startOfThisWeek, 2), 0), // Wednesday
    startTime: '10:00',
    endTime: '13:00',
    title: 'Práctica Equipo B',
  },
  {
    id: '3',
    professor: 'Miguel Ángel',
    day: setHours(addDays(startOfThisWeek, 1), 0), // Tuesday
    startTime: '17:00',
    endTime: '19:00',
    title: 'Práctica Individual',
  },
  {
    id: '4',
    professor: 'Miguel Ángel',
    day: setHours(addDays(startOfThisWeek, 4), 0), // Friday
    startTime: '18:00',
    endTime: '20:00',
    title: 'Práctica Avanzada',
  },
  {
    id: '5',
    professor: 'Olivares',
    day: setHours(addDays(startOfThisWeek, 3), 0), // Thursday
    startTime: '14:00',
    endTime: '16:00',
    title: 'Práctica Equipo C',
  },
];

export default function Calendar() {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedDateForNewBooking, setSelectedDateForNewBooking] = useState<Date | null>(null);
    const [selectedDateForDetail, setSelectedDateForDetail] = useState<Date | null>(null);


    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const handleToday = () => setCurrentMonth(startOfMonth(today));

    const handleOpenNewBooking = (date?: Date) => {
      setSelectedDateForNewBooking(date || new Date());
      setIsBookingModalOpen(true);
    };

    const handleAddBooking = (newBooking: Omit<Booking, 'id'>) => {
        const bookingWithId = { ...newBooking, id: crypto.randomUUID() };
        setBookings([...bookings, bookingWithId].sort((a, b) => a.day.getTime() - b.day.getTime()));
        setIsBookingModalOpen(false);
    };

    const handleSelectDay = (day: Date) => {
        setSelectedDateForDetail(day);
    };

    return (
        <div className="p-2 sm:p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto">
            <CalendarHeader 
                currentMonth={currentMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={handleToday}
                onNewBooking={() => handleOpenNewBooking()}
            />
            <MonthlyCalendar 
                month={currentMonth}
                bookings={bookings}
                onSelectDay={handleSelectDay}
            />
            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                onAddBooking={handleAddBooking}
                existingBookings={bookings}
                selectedDate={selectedDateForNewBooking}
            />
            <DayDetailModal
                isOpen={!!selectedDateForDetail}
                onClose={() => setSelectedDateForDetail(null)}
                date={selectedDateForDetail}
                bookings={bookings.filter(b => selectedDateForDetail && format(b.day, 'yyyy-MM-dd') === format(selectedDateForDetail, 'yyyy-MM-dd'))}
                onNewBooking={handleOpenNewBooking}
            />
        </div>
    );
}
