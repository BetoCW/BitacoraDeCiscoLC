import { DEFAULT_PROFESSORS, DEFAULT_SUBJECTS } from '@/types';

// Servicio para gestionar configuración dinámica de profesores y materias
class ConfigService {
  private static readonly PROFESSORS_KEY = 'lab_professors';
  private static readonly SUBJECTS_KEY = 'lab_subjects';

  // Cargar profesores
  static loadProfessors(): string[] {
    try {
      const stored = localStorage.getItem(this.PROFESSORS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return Array.isArray(data) && data.length > 0 ? data : DEFAULT_PROFESSORS;
      }
      return DEFAULT_PROFESSORS;
    } catch (error) {
      console.error('Error loading professors:', error);
      return DEFAULT_PROFESSORS;
    }
  }

  // Guardar profesores
  static saveProfessors(professors: string[]): void {
    try {
      localStorage.setItem(this.PROFESSORS_KEY, JSON.stringify(professors));
    } catch (error) {
      console.error('Error saving professors:', error);
    }
  }

  // Añadir profesor
  static addProfessor(name: string): boolean {
    const professors = this.loadProfessors();
    const trimmed = name.trim();
    
    if (!trimmed || professors.includes(trimmed)) {
      return false;
    }
    
    professors.push(trimmed);
    this.saveProfessors(professors);
    return true;
  }

  // Eliminar profesor
  static removeProfessor(name: string): boolean {
    const professors = this.loadProfessors();
    const filtered = professors.filter(p => p !== name);
    
    if (filtered.length === professors.length) {
      return false; // No se encontró
    }
    
    if (filtered.length === 0) {
      return false; // No se puede eliminar el último
    }
    
    this.saveProfessors(filtered);
    return true;
  }

  // Cargar materias
  static loadSubjects(): string[] {
    try {
      const stored = localStorage.getItem(this.SUBJECTS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return Array.isArray(data) && data.length > 0 ? data : DEFAULT_SUBJECTS;
      }
      return DEFAULT_SUBJECTS;
    } catch (error) {
      console.error('Error loading subjects:', error);
      return DEFAULT_SUBJECTS;
    }
  }

  // Guardar materias
  static saveSubjects(subjects: string[]): void {
    try {
      localStorage.setItem(this.SUBJECTS_KEY, JSON.stringify(subjects));
    } catch (error) {
      console.error('Error saving subjects:', error);
    }
  }

  // Añadir materia
  static addSubject(name: string): boolean {
    const subjects = this.loadSubjects();
    const trimmed = name.trim();
    
    if (!trimmed || subjects.includes(trimmed)) {
      return false;
    }
    
    subjects.push(trimmed);
    this.saveSubjects(subjects);
    return true;
  }

  // Eliminar materia
  static removeSubject(name: string): boolean {
    const subjects = this.loadSubjects();
    const filtered = subjects.filter(s => s !== name);
    
    if (filtered.length === subjects.length) {
      return false; // No se encontró
    }
    
    if (filtered.length === 0) {
      return false; // No se puede eliminar la última
    }
    
    this.saveSubjects(filtered);
    return true;
  }

  // Restaurar valores por defecto
  static resetToDefaults(): void {
    this.saveProfessors(DEFAULT_PROFESSORS);
    this.saveSubjects(DEFAULT_SUBJECTS);
  }
}

export default ConfigService;
