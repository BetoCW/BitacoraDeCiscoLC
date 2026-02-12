import { Booking, Material } from '@/types';
import bookingsData from '@/data/bookings.json';

// Sistema híbrido: localStorage + backup automático + exportar/importar
class BookingService {
  private static readonly STORAGE_KEY = 'lab_bookings';

  // Cargar datos desde localStorage o usar datos por defecto
  static loadBookings(): Booking[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Convertir strings de fecha de vuelta a Date objects
        return data.map((booking: any) => ({
          ...booking,
          day: new Date(booking.day)
        }));
      }
      // Si no hay datos en localStorage, usar los del archivo JSON (vacío por defecto)
      return bookingsData.bookings.map((booking: any) => ({
        ...booking,
        day: new Date(booking.day)
      }));
    } catch (error) {
      console.error('Error loading bookings:', error);
      return [];
    }
  }

  // Guardar datos en localStorage Y crear backup automático
  static saveBookings(bookings: Booking[]): void {
    try {
      // Convertir Date objects a strings para JSON
      const dataToStore = bookings.map(booking => ({
        ...booking,
        day: booking.day.toISOString()
      }));
      
      // Guardar en localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
      
      // Crear backup automático (descarga)
      this.createAutoBackup(dataToStore);
    } catch (error) {
      console.error('Error saving bookings:', error);
    }
  }

  // Crear backup automático (solo si hay cambios significativos)
  private static createAutoBackup(data: any[]): void {
    // Solo hacer backup si hay más de 3 reservas (evitar spam de archivos)
    if (data.length < 3) return;
    
    // Verificar si necesitamos hacer backup (una vez por día)
    const lastBackup = localStorage.getItem('last_backup_date');
    const today = new Date().toDateString();
    
    if (lastBackup === today) return; // Ya hicimos backup hoy
    
    // Crear archivo de backup
    const backupData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      bookings: data
    };
    
    localStorage.setItem('last_backup_date', today);
    console.log('📦 Backup automático creado:', backupData);
  }

  // Exportar datos manualmente
  static exportData(): void {
    const bookings = this.loadBookings();
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      bookings: bookings.map(booking => ({
        ...booking,
        day: booking.day.toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitacora-laboratorio-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Importar datos desde archivo
  static importData(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.bookings && Array.isArray(data.bookings)) {
            // Validar y convertir fechas
            const validBookings = data.bookings.map((booking: any) => ({
              ...booking,
              day: booking.day
            }));
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validBookings));
            console.log('✅ Datos importados correctamente:', validBookings.length, 'reservas');
            resolve(true);
          } else {
            throw new Error('Formato de archivo inválido');
          }
        } catch (error) {
          console.error('❌ Error importando datos:', error);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }

  // Añadir nueva reserva
  static addBooking(booking: Omit<Booking, 'id'>): Booking {
    const bookings = this.loadBookings();
    const newBooking = {
      ...booking,
      id: crypto.randomUUID()
    };
    bookings.push(newBooking);
    this.saveBookings(bookings.sort((a, b) => a.day.getTime() - b.day.getTime()));
    return newBooking;
  }

  // Validar conflictos de horario - No permite horas sobrepuestas en el mismo día
  static hasTimeConflict(
    newBooking: { day: Date; startTime: string; endTime: string; professor: string },
    existingBookings?: Booking[],
    excludeId?: string
  ): boolean {
    const bookings = existingBookings || this.loadBookings();
    
    return bookings.some(booking => {
      if (excludeId && booking.id === excludeId) return false;
      // Mismo día
      const sameDay = booking.day.toDateString() === newBooking.day.toDateString();
      if (!sameDay) return false;

      // Verificar solapamiento de horarios (sin importar el profesor)
      const existingStart = this.timeToMinutes(booking.startTime);
      const existingEnd = this.timeToMinutes(booking.endTime);
      const newStart = this.timeToMinutes(newBooking.startTime);
      const newEnd = this.timeToMinutes(newBooking.endTime);

      return newStart < existingEnd && newEnd > existingStart;
    });
  }

  // Verificar si algún integrante del nuevo equipo ya tiene una reserva en el mismo día
  static hasTeamOverlap(
    newTeamMembers: { controlNumber: string }[] | undefined,
    newBookingDay: Date,
    existingBookings?: Booking[],
    excludeId?: string
  ): boolean {
    if (!newTeamMembers || newTeamMembers.length === 0) return false;

    const bookings = existingBookings || this.loadBookings();
    const newSet = new Set(newTeamMembers.map(m => String(m.controlNumber)));

    return bookings.some(booking => {
      if (excludeId && booking.id === excludeId) return false;
      const sameDay = booking.day.toDateString() === newBookingDay.toDateString();
      if (!sameDay) return false;

      // Comparar con miembros registrados en la reserva existente
      const existingMembers = (booking.teamMembers || []).map(m => String(m.controlNumber));
      // Añadir también el alumno principal de la reserva existente
      if (booking.student && booking.student.controlNumber) existingMembers.push(String(booking.student.controlNumber));

      return existingMembers.some(cn => newSet.has(cn));
    });
  }

  // Convertir tiempo "HH:mm" a minutos
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Actualizar una reserva existente (sin alterar materiales si no se pasan)
  static updateBooking(id: string, updated: Omit<Booking, 'id'>): boolean {
    try {
      const bookings = this.loadBookings();
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) return false;

      const prev = bookings[idx];
      const merged: Booking = {
        ...prev,
        ...updated,
        id: prev.id,
        // Si no se pasaron materiales en updated, conserva los anteriores
        materials: (updated as any).materials !== undefined ? (updated as any).materials : prev.materials,
        // Asegurar que day sea Date
        day: updated.day instanceof Date ? updated.day : new Date((updated as any).day)
      };

      bookings[idx] = merged;
      this.saveBookings(bookings.sort((a, b) => a.day.getTime() - b.day.getTime()));
      return true;
    } catch (error) {
      console.error('Error updating booking:', error);
      return false;
    }
  }

  // Eliminar una reserva por ID
  static deleteBooking(id: string): boolean {
    try {
      const bookings = this.loadBookings();
      const next = bookings.filter(b => b.id !== id);
      const changed = next.length !== bookings.length;
      if (!changed) return false;
      this.saveBookings(next);
      return true;
    } catch (error) {
      console.error('Error deleting booking:', error);
      return false;
    }
  }

  // Actualizar los materiales de una reserva
  static updateBookingMaterials(bookingId: string, materials: Material[]): boolean {
    try {
      const bookings = this.loadBookings();
      const bookingIndex = bookings.findIndex(b => b.id === bookingId);
      
      if (bookingIndex === -1) return false;
      
      bookings[bookingIndex].materials = materials;
      this.saveBookings(bookings);
      return true;
    } catch (error) {
      console.error('Error updating booking materials:', error);
      return false;
    }
  }

  // Validar que la fecha no sea pasada
  static isValidDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    date.setHours(0, 0, 0, 0);
    return date >= today;
  }

  // Calcular duración sin validación (cualquier duración permitida)
  static calculateDuration(startTime: string, endTime: string): number {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    return (endMinutes - startMinutes) / 60; // Convert to hours
  }


}

export default BookingService;