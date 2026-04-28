import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Color que representa una reserva que ya pasó (equipo que faltó)
export const MISSED_COLOR = '#9ca3af';

// Devuelve true si el endTime de la reserva ya pasó respecto a `now`.
function hasEndPassed(
  booking: { day: Date | string; endTime: string },
  now: Date = new Date()
): boolean {
  const [h, m] = booking.endTime.split(':').map(Number);
  const day = booking.day instanceof Date ? booking.day : new Date(booking.day);
  const end = new Date(day);
  end.setHours(h, m, 0, 0);
  return end.getTime() < now.getTime();
}

// Una reserva se considera "faltada" si:
//   - attended === false (marcado manualmente), o
//   - attended es undefined Y el endTime ya pasó (presunción automática).
// Si attended === true (asistió), nunca está "faltada".
export function isBookingMissed(
  booking: { day: Date | string; endTime: string; attended?: boolean },
  now: Date = new Date()
): boolean {
  if (booking.attended === true) return false;
  if (booking.attended === false) return true;
  return hasEndPassed(booking, now);
}
