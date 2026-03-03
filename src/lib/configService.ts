import { DEFAULT_PROFESSORS, DEFAULT_SUBJECTS } from '@/types';

// Colores por defecto para profesores (hex)
export const DEFAULT_PROFESSOR_COLORS: Record<string, string> = {
  'Bernab\u00e9': '#3b82f6',  // Azul (Bernabé con acento)
  'Bernabe': '#3b82f6',    // Alias sin acento
  'Olivares': '#f97316',   // Naranja
  'Miguel': '#22c55e',     // Verde
  'Miguel Angel': '#22c55e',
  'Miguel \u00c1ngel': '#22c55e',
};

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

  // ── Colores de Profesores ──────────────────────────────────────────────

  private static readonly COLORS_KEY = 'lab_professor_colors';

  static loadProfessorColors(): Record<string, string> {
    try {
      const stored = localStorage.getItem(this.COLORS_KEY);
      if (stored) {
        return { ...DEFAULT_PROFESSOR_COLORS, ...JSON.parse(stored) };
      }
      return { ...DEFAULT_PROFESSOR_COLORS };
    } catch {
      return { ...DEFAULT_PROFESSOR_COLORS };
    }
  }

  static saveProfessorColor(name: string, color: string): void {
    try {
      const current = this.loadProfessorColors();
      current[name] = color;
      localStorage.setItem(this.COLORS_KEY, JSON.stringify(current));
    } catch (error) {
      console.error('Error saving professor color:', error);
    }
  }

  static removeProfessorColor(name: string): void {
    try {
      const stored = localStorage.getItem(this.COLORS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      delete current[name];
      localStorage.setItem(this.COLORS_KEY, JSON.stringify(current));
    } catch (error) {
      console.error('Error removing professor color:', error);
    }
  }

  static getProfessorColor(name: string): string {
    const colors = this.loadProfessorColors();
    return colors[name] || '#6b7280'; // gris por defecto
  }

  // Restaurar valores por defecto
  static resetToDefaults(): void {
    this.saveProfessors(DEFAULT_PROFESSORS);
    this.saveSubjects(DEFAULT_SUBJECTS);
    localStorage.removeItem(this.COLORS_KEY);
  }
}

export default ConfigService;
