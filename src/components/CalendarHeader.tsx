import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarHeaderProps {
    currentMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
    onNewBooking: () => void;
}

export default function CalendarHeader({ currentMonth, onPrevMonth, onNextMonth, onToday, onNewBooking }: CalendarHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 capitalize w-40 text-left">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <div className="flex items-center border rounded-md dark:border-gray-700">
                        <button onClick={onPrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-md"><ChevronLeft size={20} className="dark:text-gray-300" /></button>
                        <button onClick={onToday} className="p-2 px-4 border-l border-r text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-300">Hoy</button>
                        <button onClick={onNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-md"><ChevronRight size={20} className="dark:text-gray-300" /></button>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={onNewBooking} className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow">
                    <Plus size={18} />
                    <span className="hidden sm:inline">Reservar</span>
                </button>
            </div>
        </div>
    );
}
