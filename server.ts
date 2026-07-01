import express from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { Student, Teacher, Report, AuditLog } from "./src/types";

// JWT Secret Key (In a real app, this should come from process.env.JWT_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || "buku-induk-sd-super-secret-key-2026";

// Path to file-based database
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

// Interface for User record inside DB
interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'guru' | 'siswa';
  name: string;
  classId?: string; // class supervised for teacher, class enrolled for student
}

// Interface for DB file structure
interface DatabaseSchema {
  users: UserRecord[];
  students: Student[];
  teachers: Teacher[];
  reports: Report[];
  logs: AuditLog[];
}

// Ensure database directories exist and initialize database if needed
function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  let db: DatabaseSchema;

  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      console.error("Error reading database, resetting...", e);
      db = getEmptySchema();
    }
  } else {
    db = getEmptySchema();
    seedDefaultData(db);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }

  return db;
}

function getEmptySchema(): DatabaseSchema {
  return {
    users: [],
    students: [],
    teachers: [],
    reports: [],
    logs: []
  };
}

function seedDefaultData(db: DatabaseSchema) {
  // Pre-hashed passwords for simplicity during initialization
  // Password is 'admin123'
  const adminHash = bcrypt.hashSync("admin123", 10);
  // Password is 'guru123'
  const guruHash = bcrypt.hashSync("guru123", 10);
  // Password is 'siswa123'
  const siswaHash = bcrypt.hashSync("siswa123", 10);

  // Seed Admin Account
  db.users.push({
    id: "admin-1",
    username: "admin",
    passwordHash: adminHash,
    role: "admin",
    name: "Admin Operator Utama"
  });

  // Seed Teachers (Guru)
  const teacher1: Teacher = {
    id: "t-1",
    nip: "198503122010011003",
    nama: "Budi Santoso, S.Pd.",
    kelasDiampu: "1-A",
    username: "198503122010011003"
  };
  const teacher2: Teacher = {
    id: "t-2",
    nip: "198904152015022001",
    nama: "Siti Rahma, S.Pd.",
    kelasDiampu: "2-B",
    username: "198904152015022001"
  };

  db.teachers.push(teacher1, teacher2);

  // Seed accounts for teachers
  db.users.push({
    id: "user-t-1",
    username: teacher1.nip,
    passwordHash: guruHash,
    role: "guru",
    name: teacher1.nama,
    classId: teacher1.kelasDiampu
  });

  db.users.push({
    id: "user-t-2",
    username: teacher2.nip,
    passwordHash: guruHash,
    role: "guru",
    name: teacher2.nama,
    classId: teacher2.kelasDiampu
  });

  // Seed Students (Siswa)
  const studentsList: Student[] = [
    {
      id: "s-1",
      nis: "12001",
      nisn: "0145239201",
      namaLengkap: "Ahmad Fauzi",
      tempatLahir: "Jakarta",
      tanggalLahir: "2015-08-12",
      jenisKelamin: "L",
      agama: "Islam",
      alamat: "Jl. Raya Sungai Bangek, Kel. Balai Gadang, Kec. Koto Tangah, Kota Padang",
      namaAyah: "Prasetyo Fauzi",
      namaIbu: "Siti Aminah",
      nomorHpOrangTua: "081234567890",
      kelas: "1-A",
      tahunAjaran: "2026/2027",
      statusSiswa: "Aktif"
    },
    {
      id: "s-2",
      nis: "12002",
      nisn: "0145239202",
      namaLengkap: "Putri Amanda",
      tempatLahir: "Bandung",
      tanggalLahir: "2015-11-20",
      jenisKelamin: "P",
      agama: "Islam",
      alamat: "Perumahan Indah Lestari Blok B2 No. 8, Jakarta Pusat",
      namaAyah: "Irwan Amanda",
      namaIbu: "Lilis Hartati",
      nomorHpOrangTua: "085698765432",
      kelas: "1-A",
      tahunAjaran: "2026/2027",
      statusSiswa: "Aktif"
    },
    {
      id: "s-3",
      nis: "12003",
      nisn: "0145239203",
      namaLengkap: "Rian Hidayat",
      tempatLahir: "Surabaya",
      tanggalLahir: "2015-05-04",
      jenisKelamin: "L",
      agama: "Islam",
      alamat: "Kost Green Griya No. 12, Senen, Jakarta Pusat",
      namaAyah: "Sudirman Hidayat",
      namaIbu: "Rahmawati",
      nomorHpOrangTua: "081987654321",
      kelas: "1-A",
      tahunAjaran: "2026/2027",
      statusSiswa: "Aktif"
    },
    {
      id: "s-4",
      nis: "12101",
      nisn: "0151122334",
      namaLengkap: "Christian Wijaya",
      tempatLahir: "Semarang",
      tanggalLahir: "2014-04-18",
      jenisKelamin: "L",
      agama: "Kristen",
      alamat: "Jl. Diponegoro No. 102, Menteng, Jakarta Pusat",
      namaAyah: "Hendry Wijaya",
      namaIbu: "Dewi Christiani",
      nomorHpOrangTua: "082155443322",
      kelas: "2-B",
      tahunAjaran: "2026/2027",
      statusSiswa: "Aktif"
    },
    {
      id: "s-5",
      nis: "12102",
      nisn: "0151122335",
      namaLengkap: "Ni Made Arianti",
      tempatLahir: "Denpasar",
      tanggalLahir: "2014-09-02",
      jenisKelamin: "P",
      agama: "Hindu",
      alamat: "Jl. Hayam Wuruk Gg. IX No. 4, Jakarta Pusat",
      namaAyah: "I Ketut Ariawan",
      namaIbu: "Ni Luh Putu",
      nomorHpOrangTua: "081399887766",
      kelas: "2-B",
      tahunAjaran: "2026/2027",
      statusSiswa: "Aktif"
    }
  ];

  db.students.push(...studentsList);

  // Seed accounts for students based on NISN
  studentsList.forEach(student => {
    db.users.push({
      id: `user-${student.id}`,
      username: student.nisn,
      passwordHash: siswaHash,
      role: "siswa",
      name: student.namaLengkap,
      classId: student.kelas
    });
  });

  // Seed some default reports
  db.reports.push({
    id: "rep-1",
    siswaId: "s-1",
    namaSiswa: "Ahmad Fauzi",
    kelas: "1-A",
    tahunAjaran: "2026/2027",
    semester: "Ganjil",
    fileUrl: "data:application/pdf;base64,JVBERi0xLjQKJSDii6YKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+CmVuZG9iagozIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKICA8PCAvTGVuZ3RoIDY4ID4+CnN0cmVhbQogIEJUCiAgICAvRjEgMTIgVGYKICAgIDcwIDcwMCBUZAogICAgKFJhcG9yIFNpZXdhIEFobWFkIEZhdXppIC0gU2VtZXN0ZXIgR2FuanlsKSBUagogIEVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMjEyIDAwMDAwIG4gCnRyYWlsZXIKICA8PCAvU2l6ZSA1IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgogIDM0OQolJUVPRgo=",
    fileName: "Rapor_Ahmad_Fauzi_Ganjil_2026.pdf",
    keterangan: "Laporan Hasil Belajar Penilaian Tengah Semester (PTS)",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Budi Santoso, S.Pd."
  });

  // Log creation
  db.logs.push({
    id: "log-initial",
    timestamp: new Date().toISOString(),
    userId: "system",
    username: "system",
    role: "admin",
    action: "SEED",
    details: "Inisialisasi basis data default Sistem Buku Induk Sekolah Dasar."
  });
}

// Global active database state loaded on startup
const db = initDatabase();

// Save state back to DB
function saveDatabase() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// Log audit activities
function logActivity(userId: string, username: string, role: 'admin' | 'guru' | 'siswa', action: string, details: string) {
  const newLog: AuditLog = {
    id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    userId,
    username,
    role,
    action,
    details
  };
  db.logs.unshift(newLog); // prepend
  // Keep logs to a maximum of 500 records
  if (db.logs.length > 500) {
    db.logs.pop();
  }
  saveDatabase();
}

// Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Sesi tidak ditemukan. Silakan login kembali." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decodedUser: any) => {
    if (err) {
      return res.status(403).json({ error: "Sesi telah kedaluwarsa. Silakan login kembali." });
    }
    req.user = decodedUser;
    next();
  });
}

// Role Authorization Middleware
function requireRole(roles: ('admin' | 'guru' | 'siswa')[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Anda tidak memiliki hak akses untuk halaman ini." });
    }
    next();
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limits for larger JSON payload (student photos base64 and PDF uploads)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // ==================== AUTH ENDPOINTS ====================

  // Login Endpoint
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Nama pengguna dan kata sandi wajib diisi." });
    }

    const user = db.users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: "Kombinasi nama pengguna atau kata sandi salah." });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Kombinasi nama pengguna atau kata sandi salah." });
    }

    // Generate JWT Token
    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      classId: user.classId
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "4h" });

    // Log Activity
    logActivity(user.id, user.username, user.role, "LOGIN", `Pengguna ${user.name} berhasil masuk ke sistem.`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        classId: user.classId
      }
    });
  });

  // Verify Current User Session
  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  // ==================== STATS ENDPOINTS ====================

  // Statistics for Dashboard
  app.get("/api/stats", authenticateToken, (req: any, res) => {
    const totalStudents = db.students.length;
    const totalTeachers = db.teachers.length;
    const totalReports = db.reports.length;

    // Calculate unique classes
    const classesSet = new Set<string>();
    db.students.forEach(s => {
      if (s.kelas) classesSet.add(s.kelas);
    });
    db.teachers.forEach(t => {
      if (t.kelasDiampu) classesSet.add(t.kelasDiampu);
    });
    const totalClasses = classesSet.size || 6; // Fallback to standard 6 grades if empty

    // Calculate Students per Class
    const classCounts: { [key: string]: number } = {};
    db.students.forEach(s => {
      if (s.kelas) {
        classCounts[s.kelas] = (classCounts[s.kelas] || 0) + 1;
      }
    });

    const studentsPerClass = Object.keys(classCounts).map(className => ({
      name: className,
      value: classCounts[className]
    })).sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      totalReports,
      studentsPerClass
    });
  });

  // ==================== MANAGEMENT STUDENTS (SISWA) ====================

  // Get Students List
  app.get("/api/students", authenticateToken, (req: any, res) => {
    const { q, kelas, page = 1, limit = 100 } = req.query;
    let filtered = [...db.students];

    // Search query: NIS, NISN, Name, Class
    if (q) {
      const query = q.toString().toLowerCase();
      filtered = filtered.filter(s =>
        s.namaLengkap.toLowerCase().includes(query) ||
        s.nis.includes(query) ||
        s.nisn.includes(query) ||
        (s.kelas && s.kelas.toLowerCase().includes(query))
      );
    }

    // Filter by Class
    if (kelas && kelas !== "all") {
      filtered = filtered.filter(s => s.kelas === kelas);
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;

    const totalResults = filtered.length;
    const paginated = filtered.slice(startIndex, endIndex);

    res.json({
      students: paginated,
      total: totalResults,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalResults / limitNum)
    });
  });

  // Get Single Student (for profile screen or details)
  app.get("/api/students/:id", authenticateToken, (req: any, res) => {
    const student = db.students.find(s => s.id === req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }
    res.json(student);
  });

  // Create Student
  app.post("/api/students", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const s = req.body;

    // Validate inputs
    if (!s.nis || !s.nisn || !s.namaLengkap || !s.kelas) {
      return res.status(400).json({ error: "NIS, NISN, Nama Lengkap, dan Kelas wajib diisi." });
    }

    // Check duplicate NIS / NISN
    const duplicateNIS = db.students.some(item => item.nis === s.nis);
    const duplicateNISN = db.students.some(item => item.nisn === s.nisn);

    if (duplicateNIS) {
      return res.status(400).json({ error: `Siswa dengan NIS ${s.nis} sudah terdaftar.` });
    }
    if (duplicateNISN) {
      return res.status(400).json({ error: `Siswa dengan NISN ${s.nisn} sudah terdaftar.` });
    }

    const studentId = "s-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5);

    const newStudent: Student = {
      id: studentId,
      nis: s.nis,
      nisn: s.nisn,
      namaLengkap: s.namaLengkap,
      tempatLahir: s.tempatLahir || "",
      tanggalLahir: s.tanggalLahir || "",
      jenisKelamin: s.jenisKelamin || "L",
      agama: s.agama || "Islam",
      alamat: s.alamat || "",
      namaAyah: s.namaAyah || "",
      namaIbu: s.namaIbu || "",
      nomorHpOrangTua: s.nomorHpOrangTua || "",
      kelas: s.kelas,
      tahunAjaran: s.tahunAjaran || "2026/2027",
      statusSiswa: s.statusSiswa || "Aktif",
      foto: s.foto || ""
    };

    db.students.push(newStudent);

    // Auto-create student user account based on NISN
    const defaultPasswordHash = bcrypt.hashSync(s.nisn + "123", 10);
    db.users.push({
      id: `user-${studentId}`,
      username: s.nisn,
      passwordHash: defaultPasswordHash,
      role: "siswa",
      name: s.namaLengkap,
      classId: s.kelas
    });

    logActivity(req.user.id, req.user.username, req.user.role, "STUDENT_CREATE", `Menambahkan siswa baru: ${s.namaLengkap} (NISN: ${s.nisn}).`);

    res.status(201).json(newStudent);
  });

  // Edit Student Details
  app.put("/api/students/:id", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const studentIdx = db.students.findIndex(s => s.id === req.params.id);
    if (studentIdx === -1) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }

    const currentStudent = db.students[studentIdx];
    const updatedFields = req.body;

    // NISN update verification
    if (updatedFields.nisn && updatedFields.nisn !== currentStudent.nisn) {
      const duplicateNISN = db.students.some(s => s.id !== req.params.id && s.nisn === updatedFields.nisn);
      if (duplicateNISN) {
        return res.status(400).json({ error: `Siswa dengan NISN ${updatedFields.nisn} sudah terdaftar.` });
      }
    }

    // NIS update verification
    if (updatedFields.nis && updatedFields.nis !== currentStudent.nis) {
      const duplicateNIS = db.students.some(s => s.id !== req.params.id && s.nis === updatedFields.nis);
      if (duplicateNIS) {
        return res.status(400).json({ error: `Siswa dengan NIS ${updatedFields.nis} sudah terdaftar.` });
      }
    }

    const previousNISN = currentStudent.nisn;

    db.students[studentIdx] = {
      ...currentStudent,
      ...updatedFields,
      id: currentStudent.id // preserve ID
    };

    // Update Student Account Username if NISN changed
    if (updatedFields.nisn && updatedFields.nisn !== previousNISN) {
      const userIdx = db.users.findIndex(u => u.id === `user-${currentStudent.id}` || u.username === previousNISN);
      if (userIdx !== -1) {
        db.users[userIdx].username = updatedFields.nisn;
      }
    }

    // Update Name & Class in user accounts as well
    const associatedUserIdx = db.users.findIndex(u => u.id === `user-${currentStudent.id}` || u.username === currentStudent.nisn);
    if (associatedUserIdx !== -1) {
      if (updatedFields.namaLengkap) db.users[associatedUserIdx].name = updatedFields.namaLengkap;
      if (updatedFields.kelas) db.users[associatedUserIdx].classId = updatedFields.kelas;
    }

    logActivity(req.user.id, req.user.username, req.user.role, "STUDENT_UPDATE", `Memperbarui data siswa: ${db.students[studentIdx].namaLengkap}.`);

    res.json(db.students[studentIdx]);
  });

  // Delete Student
  app.delete("/api/students/:id", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const studentIdx = db.students.findIndex(s => s.id === req.params.id);
    if (studentIdx === -1) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }

    const student = db.students[studentIdx];

    // Remove Student Record
    db.students.splice(studentIdx, 1);

    // Remove User Account
    const userIdx = db.users.findIndex(u => u.id === `user-${req.params.id}` || u.username === student.nisn);
    if (userIdx !== -1) {
      db.users.splice(userIdx, 1);
    }

    // Remove Student Reports
    db.reports = db.reports.filter(r => r.siswaId !== req.params.id);

    logActivity(req.user.id, req.user.username, req.user.role, "STUDENT_DELETE", `Menghapus data siswa: ${student.namaLengkap} (NISN: ${student.nisn}) beserta akun dan rapornya.`);

    res.json({ success: true, message: "Siswa berhasil dihapus." });
  });

  // Bulk Import Students
  app.post("/api/students/import", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: "Data siswa kosong atau format tidak valid." });
    }

    let addedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    students.forEach((s: any, index: number) => {
      const lineNum = index + 1;

      // Basic validates
      if (!s.nis || !s.nisn || !s.namaLengkap || !s.kelas) {
        errors.push(`Baris ${lineNum}: NIS, NISN, Nama Lengkap, dan Kelas wajib diisi.`);
        return;
      }

      // Check duplicate NIS/NISN in existing DB
      const existNIS = db.students.some(item => item.nis === s.nis.toString().trim());
      const existNISN = db.students.some(item => item.nisn === s.nisn.toString().trim());

      if (existNIS || existNISN) {
        duplicateCount++;
        errors.push(`Baris ${lineNum}: Data ganda terdeteksi (NIS atau NISN sudah terdaftar).`);
        return;
      }

      const studentId = "s-imp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5);
      const cleanStudent: Student = {
        id: studentId,
        nis: s.nis.toString().trim(),
        nisn: s.nisn.toString().trim(),
        namaLengkap: s.namaLengkap.toString().trim(),
        tempatLahir: (s.tempatLahir || "").toString().trim(),
        tanggalLahir: (s.tanggalLahir || "").toString().trim(),
        jenisKelamin: s.jenisKelamin === "P" ? "P" : "L",
        agama: (s.agama || "Islam").toString().trim(),
        alamat: (s.alamat || "").toString().trim(),
        namaAyah: (s.namaAyah || "").toString().trim(),
        namaIbu: (s.namaIbu || "").toString().trim(),
        nomorHpOrangTua: (s.nomorHpOrangTua || "").toString().trim(),
        kelas: s.kelas.toString().trim(),
        tahunAjaran: (s.tahunAjaran || "2026/2027").toString().trim(),
        statusSiswa: (s.statusSiswa || "Aktif").toString().trim() as any,
        foto: ""
      };

      db.students.push(cleanStudent);

      // Create associated user account
      const defaultPasswordHash = bcrypt.hashSync(cleanStudent.nisn + "123", 10);
      db.users.push({
        id: `user-${studentId}`,
        username: cleanStudent.nisn,
        passwordHash: defaultPasswordHash,
        role: "siswa",
        name: cleanStudent.namaLengkap,
        classId: cleanStudent.kelas
      });

      addedCount++;
    });

    logActivity(
      req.user.id,
      req.user.username,
      req.user.role,
      "STUDENT_IMPORT",
      `Mengimpor data siswa secara masal. Berhasil: ${addedCount}, Duplikat: ${duplicateCount}, Error: ${errors.length}.`
    );

    res.json({
      success: true,
      addedCount,
      duplicateCount,
      errors
    });
  });

  // ==================== RESET PASSWORD ENDPOINTS ====================

  // Reset Student Password (set to nisn + 123)
  app.post("/api/students/:id/reset-password", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const student = db.students.find(s => s.id === req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }

    const userIdx = db.users.findIndex(u => u.id === `user-${student.id}` || u.username === student.nisn);
    if (userIdx === -1) {
      // Re-create user account if missing
      const newHash = bcrypt.hashSync(student.nisn + "123", 10);
      db.users.push({
        id: `user-${student.id}`,
        username: student.nisn,
        passwordHash: newHash,
        role: "siswa",
        name: student.namaLengkap,
        classId: student.kelas
      });
    } else {
      const newHash = bcrypt.hashSync(student.nisn + "123", 10);
      db.users[userIdx].passwordHash = newHash;
    }

    logActivity(req.user.id, req.user.username, req.user.role, "PASSWORD_RESET_SISWA", `Mereset kata sandi siswa: ${student.namaLengkap} ke default (NISN + '123').`);

    res.json({ success: true, message: `Kata sandi siswa ${student.namaLengkap} berhasil direset ke standar: ${student.nisn}123` });
  });

  // Reset Teacher Password (set to nip + 123)
  app.post("/api/teachers/:id/reset-password", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const teacher = db.teachers.find(t => t.id === req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: "Guru tidak ditemukan." });
    }

    const userIdx = db.users.findIndex(u => u.username === teacher.nip);
    if (userIdx !== -1) {
      const newHash = bcrypt.hashSync(teacher.nip + "123", 10);
      db.users[userIdx].passwordHash = newHash;
      logActivity(req.user.id, req.user.username, req.user.role, "PASSWORD_RESET_GURU", `Mereset kata sandi guru: ${teacher.nama} ke default.`);
      return res.json({ success: true, message: `Kata sandi guru ${teacher.nama} berhasil direset ke standar: ${teacher.nip}123` });
    } else {
      return res.status(404).json({ error: "Akun login guru tidak ditemukan." });
    }
  });

  // ==================== MANAGEMENT GURU (TEACHERS) ====================

  // Get Teachers list
  app.get("/api/teachers", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    res.json(db.teachers);
  });

  // Create Teacher
  app.post("/api/teachers", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const t = req.body;

    if (!t.nip || !t.nama || !t.kelasDiampu) {
      return res.status(400).json({ error: "NIP, Nama Lengkap, dan Kelas yang Diampu wajib diisi." });
    }

    // Check duplicate NIP
    const duplicateNIP = db.teachers.some(item => item.nip === t.nip);
    if (duplicateNIP) {
      return res.status(400).json({ error: `Guru dengan NIP ${t.nip} sudah terdaftar.` });
    }

    const teacherId = "t-" + Date.now();
    const newTeacher: Teacher = {
      id: teacherId,
      nip: t.nip,
      nama: t.nama,
      kelasDiampu: t.kelasDiampu,
      username: t.nip
    };

    db.teachers.push(newTeacher);

    // Create user account for teacher (standard password: nip + "123")
    const hash = bcrypt.hashSync(t.nip + "123", 10);
    db.users.push({
      id: `user-${teacherId}`,
      username: t.nip,
      passwordHash: hash,
      role: "guru",
      name: t.nama,
      classId: t.kelasDiampu
    });

    logActivity(req.user.id, req.user.username, req.user.role, "TEACHER_CREATE", `Menambahkan guru baru: ${t.nama} (NIP: ${t.nip}).`);

    res.status(201).json(newTeacher);
  });

  // Edit Teacher
  app.put("/api/teachers/:id", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const teacherIdx = db.teachers.findIndex(t => t.id === req.params.id);
    if (teacherIdx === -1) {
      return res.status(404).json({ error: "Guru tidak ditemukan." });
    }

    const currentTeacher = db.teachers[teacherIdx];
    const { nip, nama, kelasDiampu } = req.body;

    if (nip && nip !== currentTeacher.nip) {
      const duplicateNIP = db.teachers.some(t => t.id !== req.params.id && t.nip === nip);
      if (duplicateNIP) {
        return res.status(400).json({ error: `Guru dengan NIP ${nip} sudah terdaftar.` });
      }
    }

    const previousNIP = currentTeacher.nip;

    db.teachers[teacherIdx] = {
      ...currentTeacher,
      nip: nip || currentTeacher.nip,
      nama: nama || currentTeacher.nama,
      kelasDiampu: kelasDiampu || currentTeacher.kelasDiampu,
      username: nip || currentTeacher.nip
    };

    // Update login credentials
    const userIdx = db.users.findIndex(u => u.username === previousNIP);
    if (userIdx !== -1) {
      if (nip) db.users[userIdx].username = nip;
      if (nama) db.users[userIdx].name = nama;
      if (kelasDiampu) db.users[userIdx].classId = kelasDiampu;
    }

    logActivity(req.user.id, req.user.username, req.user.role, "TEACHER_UPDATE", `Memperbarui data guru: ${db.teachers[teacherIdx].nama}.`);

    res.json(db.teachers[teacherIdx]);
  });

  // Delete Teacher
  app.delete("/api/teachers/:id", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const teacherIdx = db.teachers.findIndex(t => t.id === req.params.id);
    if (teacherIdx === -1) {
      return res.status(404).json({ error: "Guru tidak ditemukan." });
    }

    const teacher = db.teachers[teacherIdx];

    // Remove Teacher Record
    db.teachers.splice(teacherIdx, 1);

    // Remove login user
    const userIdx = db.users.findIndex(u => u.username === teacher.nip);
    if (userIdx !== -1) {
      db.users.splice(userIdx, 1);
    }

    logActivity(req.user.id, req.user.username, req.user.role, "TEACHER_DELETE", `Menghapus data guru: ${teacher.nama} (NIP: ${teacher.nip}).`);

    res.json({ success: true, message: "Guru berhasil dihapus." });
  });

  // ==================== RAPOR (REPORTS) MANAGEMENT ====================

  // Get Reports List
  app.get("/api/reports", authenticateToken, (req: any, res) => {
    const { sId, kelas, sem, ta } = req.query;
    let filtered = [...db.reports];

    // Siswa filters (for students dashboard viewing their own reports)
    if (sId) {
      filtered = filtered.filter(r => r.siswaId === sId);
    }

    // Class filters (for teacher viewing reports of their assigned class)
    if (kelas && kelas !== "all") {
      filtered = filtered.filter(r => r.kelas === kelas);
    }

    // Semester filters
    if (sem && sem !== "all") {
      filtered = filtered.filter(r => r.semester === sem);
    }

    // Tahun Ajaran filters
    if (ta && ta !== "all") {
      filtered = filtered.filter(r => r.tahunAjaran === ta);
    }

    // Sort by uploaded time descending
    filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    res.json(filtered);
  });

  // Upload or Update Report PDF
  app.post("/api/reports", authenticateToken, requireRole(["admin", "guru"]), (req: any, res) => {
    const { id, siswaId, tahunAjaran, semester, kelas, fileUrl, fileName, keterangan } = req.body;

    if (!siswaId || !tahunAjaran || !semester || !kelas || !fileUrl || !fileName) {
      return res.status(400).json({ error: "Semua isian rapor (Siswa, Tahun Ajaran, Semester, Kelas, Berkas PDF) wajib dilengkapi." });
    }

    // Find student details
    const student = db.students.find(s => s.id === siswaId);
    if (!student) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }

    // Check if report already exists for this specific student/class/academic year/semester
    const existingIdx = db.reports.findIndex(r =>
      r.siswaId === siswaId &&
      r.tahunAjaran === tahunAjaran &&
      r.semester === semester &&
      r.kelas === kelas
    );

    if (existingIdx !== -1) {
      // Replaces/Updates the existing PDF file (Revisi Rapor)
      const oldReport = db.reports[existingIdx];
      db.reports[existingIdx] = {
        ...oldReport,
        fileUrl,
        fileName,
        keterangan: keterangan || oldReport.keterangan,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user.name
      };

      logActivity(req.user.id, req.user.username, req.user.role, "REPORT_REVISE", `Merevisi file rapor siswa: ${student.namaLengkap} - Semester ${semester} T.A ${tahunAjaran}.`);
      return res.json({ success: true, report: db.reports[existingIdx], message: "Rapor berhasil diperbarui (Revisi)." });
    } else {
      // Create new Report Record
      const newReport: Report = {
        id: "rep-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
        siswaId,
        namaSiswa: student.namaLengkap,
        kelas,
        tahunAjaran,
        semester,
        fileUrl,
        fileName,
        keterangan: keterangan || "",
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user.name
      };

      db.reports.push(newReport);
      logActivity(req.user.id, req.user.username, req.user.role, "REPORT_UPLOAD", `Mengunggah file rapor baru siswa: ${student.namaLengkap} - Semester ${semester} T.A ${tahunAjaran}.`);
      return res.status(201).json({ success: true, report: newReport, message: "Rapor berhasil diunggah." });
    }
  });

  // Delete Report
  app.delete("/api/reports/:id", authenticateToken, requireRole(["admin", "guru"]), (req: any, res) => {
    const reportIdx = db.reports.findIndex(r => r.id === req.params.id);
    if (reportIdx === -1) {
      return res.status(404).json({ error: "Rapor tidak ditemukan." });
    }

    const report = db.reports[reportIdx];
    db.reports.splice(reportIdx, 1);

    logActivity(req.user.id, req.user.username, req.user.role, "REPORT_DELETE", `Menghapus rapor siswa: ${report.namaSiswa} untuk Semester ${report.semester} T.A ${report.tahunAjaran}.`);

    res.json({ success: true, message: "File rapor berhasil dihapus." });
  });

  // ==================== AUDIT LOGS ENDPOINTS ====================

  app.get("/api/logs", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    res.json(db.logs);
  });

  // ==================== SYSTEM BACKUP ENDPOINTS ====================

  // Generate Backup JSON Download file
  app.post("/api/db/backup", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const backupContent = {
      backupDate: new Date().toISOString(),
      databaseVersion: "1.0.0",
      data: db
    };

    logActivity(req.user.id, req.user.username, req.user.role, "DATABASE_BACKUP", "Melakukan ekspor backup database sistem.");

    res.json(backupContent);
  });

  // Restore Database backup from JSON
  app.post("/api/db/restore", authenticateToken, requireRole(["admin"]), (req: any, res) => {
    const { backupData } = req.body;

    if (!backupData || !backupData.data || !backupData.data.users || !backupData.data.students) {
      return res.status(400).json({ error: "Format berkas restore tidak valid atau rusak." });
    }

    // Set active db with restored data
    db.users = backupData.data.users;
    db.students = backupData.data.students;
    db.teachers = backupData.data.teachers || [];
    db.reports = backupData.data.reports || [];
    db.logs = backupData.data.logs || [];

    logActivity(req.user.id, req.user.username, req.user.role, "DATABASE_RESTORE", "Memulihkan database sistem dari berkas cadangan (Restore).");

    res.json({ success: true, message: "Database berhasil dipulihkan secara penuh." });
  });

  // ==================== VITE SERVING MIDDLEWARE ====================

  // Vite middleware for development vs static asset serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
