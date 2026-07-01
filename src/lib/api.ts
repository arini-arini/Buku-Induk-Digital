import { AuthResponse, Student, Teacher, Report, AuditLog, SystemStats, User } from "../types";

const API_BASE = "/api";

// Save and retrieve tokens
export function setToken(token: string) {
  localStorage.setItem("buku_induk_token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("buku_induk_token");
}

export function clearToken() {
  localStorage.removeItem("buku_induk_token");
  localStorage.removeItem("buku_induk_user");
}

export function setUser(user: User) {
  localStorage.setItem("buku_induk_user", JSON.stringify(user));
}

export function getUser(): User | null {
  const saved = localStorage.getItem("buku_induk_user");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

// Global fetch helper that automatically appends the Bearer token
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // Session expired or unauthorized, trigger a custom logout event
    clearToken();
    window.dispatchEvent(new Event("session-expired"));
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Sesi berakhir. Silakan login kembali.");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Terjadi kesalahan pada server.");
  }

  return response.json();
}

// API Services
export const api = {
  // Authentication
  async login(username: string, password: string): Promise<AuthResponse> {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    return apiFetch("/auth/me");
  },

  // Dashboard Stats
  async getStats(): Promise<SystemStats> {
    return apiFetch("/stats");
  },

  // Students (Siswa) Management
  async getStudents(q = "", kelas = "all", page = 1): Promise<{ students: Student[]; total: number; page: number; totalPages: number }> {
    return apiFetch(`/students?q=${encodeURIComponent(q)}&kelas=${kelas}&page=${page}`);
  },

  async getStudent(id: string): Promise<Student> {
    return apiFetch(`/students/${id}`);
  },

  async createStudent(student: Omit<Student, "id">): Promise<Student> {
    return apiFetch("/students", {
      method: "POST",
      body: JSON.stringify(student),
    });
  },

  async updateStudent(id: string, student: Partial<Student>): Promise<Student> {
    return apiFetch(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(student),
    });
  },

  async deleteStudent(id: string): Promise<{ success: boolean }> {
    return apiFetch(`/students/${id}`, {
      method: "DELETE",
    });
  },

  async importStudents(students: Omit<Student, "id">[]): Promise<{ success: boolean; addedCount: number; duplicateCount: number; errors: string[] }> {
    return apiFetch("/students/import", {
      method: "POST",
      body: JSON.stringify({ students }),
    });
  },

  async resetStudentPassword(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/students/${id}/reset-password`, {
      method: "POST",
    });
  },

  // Teachers (Guru) Management
  async getTeachers(): Promise<Teacher[]> {
    return apiFetch("/teachers");
  },

  async createTeacher(teacher: Omit<Teacher, "id" | "username">): Promise<Teacher> {
    return apiFetch("/teachers", {
      method: "POST",
      body: JSON.stringify(teacher),
    });
  },

  async updateTeacher(id: string, teacher: Partial<Teacher>): Promise<Teacher> {
    return apiFetch(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(teacher),
    });
  },

  async deleteTeacher(id: string): Promise<{ success: boolean }> {
    return apiFetch(`/teachers/${id}`, {
      method: "DELETE",
    });
  },

  async resetTeacherPassword(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/teachers/${id}/reset-password`, {
      method: "POST",
    });
  },

  // Reports (Rapor) Management
  async getReports(filters: { sId?: string; kelas?: string; sem?: string; ta?: string }): Promise<Report[]> {
    const params = new URLSearchParams();
    if (filters.sId) params.append("sId", filters.sId);
    if (filters.kelas) params.append("kelas", filters.kelas);
    if (filters.sem) params.append("sem", filters.sem);
    if (filters.ta) params.append("ta", filters.ta);
    return apiFetch(`/reports?${params.toString()}`);
  },

  async uploadReport(report: Omit<Report, "id" | "uploadedAt" | "uploadedBy" | "namaSiswa">): Promise<{ success: boolean; report: Report; message: string }> {
    return apiFetch("/reports", {
      method: "POST",
      body: JSON.stringify(report),
    });
  },

  async deleteReport(id: string): Promise<{ success: boolean }> {
    return apiFetch(`/reports/${id}`, {
      method: "DELETE",
    });
  },

  // Audit Logs
  async getLogs(): Promise<AuditLog[]> {
    return apiFetch("/logs");
  },

  // Database Backup/Restore
  async backupDatabase(): Promise<any> {
    return apiFetch("/db/backup", {
      method: "POST",
    });
  },

  async restoreDatabase(backupData: any): Promise<{ success: boolean; message: string }> {
    return apiFetch("/db/restore", {
      method: "POST",
      body: JSON.stringify({ backupData }),
    });
  }
};
