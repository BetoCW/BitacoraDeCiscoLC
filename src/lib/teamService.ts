import { Team, Student } from '@/types';

class TeamService {
    private static readonly STORAGE_KEY = 'lab_teams';

    // ── Cargar ────────────────────────────────────────────────────────────────
    static loadTeams(): Team[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                return Array.isArray(data) ? data : [];
            }
            return [];
        } catch (error) {
            console.error('Error loading teams:', error);
            return [];
        }
    }

    // ── Guardar ───────────────────────────────────────────────────────────────
    static saveTeams(teams: Team[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(teams));
        } catch (error) {
            console.error('Error saving teams:', error);
        }
    }

    // ── Agregar ───────────────────────────────────────────────────────────────
    static addTeam(data: Omit<Team, 'id'>): Team {
        const teams = this.loadTeams();
        const newTeam: Team = { ...data, id: crypto.randomUUID() };
        teams.push(newTeam);
        this.saveTeams(teams);
        return newTeam;
    }

    // ── Actualizar ────────────────────────────────────────────────────────────
    static updateTeam(id: string, data: Omit<Team, 'id'>): boolean {
        const teams = this.loadTeams();
        const idx = teams.findIndex(t => t.id === id);
        if (idx === -1) return false;
        teams[idx] = { ...data, id };
        this.saveTeams(teams);
        return true;
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────
    static deleteTeam(id: string): boolean {
        const teams = this.loadTeams();
        const next = teams.filter(t => t.id !== id);
        if (next.length === teams.length) return false;
        this.saveTeams(next);
        return true;
    }

    // ── Buscar por nombre (para autocompletado) ────────────────────────────────
    static findByName(query: string): Team[] {
        if (!query.trim()) return this.loadTeams();
        const lower = query.toLowerCase();
        return this.loadTeams().filter(t =>
            t.name.toLowerCase().includes(lower)
        );
    }

    // ── Validar que los miembros sean válidos ─────────────────────────────────
    static validateMembers(members: Student[]): string | null {
        if (members.length === 0) return 'El equipo debe tener al menos un integrante.';
        const seen = new Set<string>();
        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            if (!m.name.trim()) return `Falta el nombre del integrante #${i + 1}.`;
            if (!/^\d{8}$/.test(m.controlNumber.trim()))
                return `El número de control del integrante #${i + 1} debe tener 8 dígitos.`;
            if (seen.has(m.controlNumber.trim()))
                return `El número de control ${m.controlNumber} está duplicado.`;
            seen.add(m.controlNumber.trim());
        }
        return null;
    }
}

export default TeamService;
