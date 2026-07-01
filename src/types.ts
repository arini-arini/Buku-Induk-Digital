/**
 * Types for Buku Induk SD (Elementary School Student Registry Information System)
 */

export type UserRole = 'admin' | 'guru' | 'siswa';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  classId?: string; // Optional class for Guru or Siswa
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P';
  agama: string;
  alamat: string;
  namaAyah: string;
  namaIbu: string;
  nomorHpOrangTua: string;
  kelas: string;
  tahunAjaran: string;
  statusSiswa: 'Aktif' | 'Lulus' | 'Pindah' | 'Keluar';
  foto?: string; // Base64 image
}

export interface Teacher {
  id: string;
  nip: string;
  nama: string;
  kelasDiampu: string; // Class they supervise
  username: string;
}

export interface Report {
  id: string;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  tahunAjaran: string;
  semester: 'Ganjil' | 'Genap';
  fileUrl: string; // Base64 PDF or mock PDF data URL
  fileName: string;
  keterangan: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  role: UserRole;
  action: string;
  details: string;
}

export interface SystemStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalReports: number;
  studentsPerClass: { name: string; value: number }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
