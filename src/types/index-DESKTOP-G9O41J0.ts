// Tipos dinámicos - se gestionan desde la interfaz de administración
export type Professor = string;
export type Subject = string;

// Configuración por defecto (se puede modificar)
export const DEFAULT_PROFESSORS: string[] = ['Olivares', 'Bernabé', 'Miguel'];
export const DEFAULT_SUBJECTS: string[] = ['Redes', 'Conmutación', 'Administración'];

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
  duration: number; // hours (sin límite)
  materials?: Material[]; // Optional materials list
}
