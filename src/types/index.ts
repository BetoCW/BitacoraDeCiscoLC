export type Professor = 'Olivares' | 'Bernabé' | 'Miguel';

// Horarios:
// Olivares & Bernabé: 7am - 5pm (día) - COMPARTEN HORAS
// Olivares: 5pm - 9pm (noche)
// Miguel: 5pm - 9pm - NO COMPARTE HORAS CON NADIE

export type Subject = 'Redes' | 'Conmutación' | 'Administración';

export interface Student {
  name: string;
  controlNumber: string; // e.g., "20400798"
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  category: 'Cables' | 'Routers' | 'Servidores' | 'Firewall' | 'Otros';
}

export interface Booking {
  id: string;
  professor: Professor;
  student: Student;
  subject: Subject;
  day: Date;
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "11:00"
  duration: number; // hours (2-3)
  materials?: Material[]; // Optional materials list
}
