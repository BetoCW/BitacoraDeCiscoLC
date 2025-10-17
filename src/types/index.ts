export type Professor = 'Olivares' | 'Bernabé' | 'Miguel Ángel';

// Horarios:
// Olivares & Bernabé: 7am - 5pm
// Miguel Ángel: 5pm - 9pm

export interface Booking {
  id: string;
  professor: Professor;
  day: Date;
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "11:00"
  title: string;
}
