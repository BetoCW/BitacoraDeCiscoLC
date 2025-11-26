import { useState, useEffect } from 'react';
import { startOfMonth, addMonths, subMonths, format } from 'date-fns';
import CalendarHeader from './CalendarHeader';
import MonthlyCalendar from './MonthlyCalendar';
import BookingModal from './BookingModal';
import DayDetailModal from './DayDetailModal';
import DataManager from './DataManager';
import { Booking } from '@/types';
import BookingService from '@/lib/bookingService';

const today = new Date();

export default function Calendar() {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDateForNewBooking, setSelectedDateForNewBooking] = useState<Date | null>(null);
    const [selectedDateForDetail, setSelectedDateForDetail] = useState<Date | null>(null);
    const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);

    // Cargar datos al inicializar
    useEffect(() => {
        const loadBookings = () => {
            try {
                const loadedBookings = BookingService.loadBookings();
                setBookings(loadedBookings);
            } catch (error) {
                console.error('Error loading bookings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadBookings();
    }, []);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const handleToday = () => setCurrentMonth(startOfMonth(today));

    const handleOpenNewBooking = (date?: Date) => {
      setSelectedDateForNewBooking(date || new Date());
      setIsBookingModalOpen(true);
    };

    const handleAddBooking = (newBooking: Omit<Booking, 'id'>) => {
        try {
            BookingService.addBooking(newBooking);
            const updatedBookings = BookingService.loadBookings();
            setBookings(updatedBookings);
            setIsBookingModalOpen(false);
        } catch (error) {
            console.error('Error adding booking:', error);
        }
    };

    const handleUpdateBooking = (id: string, updated: Omit<Booking, 'id'>) => {
        try {
            BookingService.updateBooking(id, updated);
            const updatedBookings = BookingService.loadBookings();
            setBookings(updatedBookings);
            setIsEditModalOpen(false);
            setBookingToEdit(null);
        } catch (error) {
            console.error('Error updating booking:', error);
        }
    };

    const handleDeleteBooking = (id: string) => {
        try {
            const ok = BookingService.deleteBooking(id);
            if (ok) {
                const updatedBookings = BookingService.loadBookings();
                setBookings(updatedBookings);
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
        }
    };

    const handleSelectDay = (day: Date) => {
        setSelectedDateForDetail(day);
    };

    const handleEditRequest = (booking: Booking) => {
        setBookingToEdit(booking);
        setIsEditModalOpen(true);
    };

    const handleBookingUpdate = () => {
        // Recargar las reservas cuando se actualicen los materiales
        const updatedBookings = BookingService.loadBookings();
        setBookings(updatedBookings);
    };

    if (isLoading) {
        return (
            <div className="p-8 max-w-screen-2xl mx-auto flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600 dark:text-gray-400">
                    Cargando calendario...
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 sm:p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto space-y-6">
            <CalendarHeader 
                currentMonth={currentMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={handleToday}
                onNewBooking={() => handleOpenNewBooking()}
            />
            
            {/* Gestor de Datos */}
            <DataManager onDataChange={handleBookingUpdate} />
            
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
            <BookingModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setBookingToEdit(null); }}
                onUpdateBooking={handleUpdateBooking}
                existingBookings={bookings}
                selectedDate={bookingToEdit ? bookingToEdit.day : null}
                mode="edit"
                initialBooking={bookingToEdit}
            />
            <DayDetailModal
                isOpen={!!selectedDateForDetail}
                onClose={() => setSelectedDateForDetail(null)}
                date={selectedDateForDetail}
                bookings={bookings.filter(b => selectedDateForDetail && format(b.day, 'yyyy-MM-dd') === format(selectedDateForDetail, 'yyyy-MM-dd'))}
                onNewBooking={handleOpenNewBooking}
                onBookingUpdate={handleBookingUpdate}
                onEditBooking={handleEditRequest}
                onDeleteBooking={handleDeleteBooking}
            />
        </div>
    );
}
