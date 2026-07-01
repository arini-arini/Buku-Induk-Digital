import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, Upload, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Student } from "../types";

interface ExcelImportHelperProps {
  existingStudents: Student[];
  onImportComplete: (importedData: any[]) => void;
  isDark: boolean;
  onClose: () => void;
}

export default function ExcelImportHelper({
  existingStudents,
  onImportComplete,
  isDark,
  onClose
}: ExcelImportHelperProps) {
  const [fileData, setFileData] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ row: number; msg: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [fileName, setFileName] = useState<string>("");

  // Download a clean Excel template pre-populated with Indonesian sample rows
  const downloadTemplate = () => {
    const headers = [
      "nis",
      "nisn",
      "namaLengkap",
      "tempatLahir",
      "tanggalLahir",
      "jenisKelamin",
      "agama",
      "alamat",
      "namaAyah",
      "namaIbu",
      "nomorHpOrangTua",
      "kelas",
      "tahunAjaran",
      "statusSiswa"
    ];

    const sampleRows = [
      {
        nis: "12201",
        nisn: "0161234567",
        namaLengkap: "Dian Saputra",
        tempatLahir: "Jakarta",
        tanggalLahir: "2016-03-15",
        jenisKelamin: "L",
        agama: "Islam",
        alamat: "Jl. Pemuda No. 12, Senayan, Jakarta Pusat",
        namaAyah: "Rudi Saputra",
        namaIbu: "Sari Dewi",
        nomorHpOrangTua: "081211112222",
        kelas: "1-A",
        tahunAjaran: "2026/2027",
        statusSiswa: "Aktif"
      },
      {
        nis: "12202",
        nisn: "0167654321",
        namaLengkap: "Maria Handayani",
        tempatLahir: "Yogyakarta",
        tanggalLahir: "2016-07-22",
        jenisKelamin: "P",
        agama: "Kristen",
        alamat: "Jl. Malioboro Gg. Melati No. 5, Sleman",
        namaAyah: "Yosef Handoyo",
        namaIbu: "Martha Setyowati",
        nomorHpOrangTua: "085633334444",
        kelas: "1-A",
        tahunAjaran: "2026/2027",
        statusSiswa: "Aktif"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Siswa Baru");

    // Generate buffer and trigger standard file download
    XLSX.writeFile(workbook, "Template_Buku_Induk_Siswa_SD.xlsx");
  };

  // Handle uploaded Excel/CSV files via drag or browser upload dialog
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);
    setIsProcessing(true);
    setProgress(10);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        setProgress(40);
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        setProgress(70);

        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        setProgress(90);
        validateImportData(data);
      } catch (err) {
        setErrors([{ row: 0, msg: "Format berkas tidak terbaca. Pastikan Anda menggunakan file Excel (.xlsx) atau CSV yang valid." }]);
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Automated offline validation logic to detect empty values, invalid gender formats, or duplicates
  const validateImportData = (rows: any[]) => {
    const rowErrors: { row: number; msg: string }[] = [];
    const validatedRows: any[] = [];

    if (rows.length === 0) {
      rowErrors.push({ row: 0, msg: "Berkas tidak berisi baris data siswa apa pun." });
      setErrors(rowErrors);
      setFileData([]);
      setIsProcessing(false);
      return;
    }

    // Capture temporary sets to verify local duplicates within the uploaded file itself
    const localNisSet = new Set<string>();
    const localNisnSet = new Set<string>();

    rows.forEach((row, index) => {
      const rowNum = index + 2; // spreadsheet index starts at 2 (excluding header)
      
      const nis = row.nis ? row.nis.toString().trim() : "";
      const nisn = row.nisn ? row.nisn.toString().trim() : "";
      const nama = row.namaLengkap ? row.namaLengkap.toString().trim() : "";
      const kelas = row.kelas ? row.kelas.toString().trim() : "";
      const jk = row.jenisKelamin ? row.jenisKelamin.toString().toUpperCase().trim() : "";

      // Check required fields
      if (!nis) {
        rowErrors.push({ row: rowNum, msg: "NIS kosong" });
      }
      if (!nisn) {
        rowErrors.push({ row: rowNum, msg: "NISN kosong" });
      }
      if (!nama) {
        rowErrors.push({ row: rowNum, msg: "Nama Lengkap kosong" });
      }
      if (!kelas) {
        rowErrors.push({ row: rowNum, msg: "Kelas kosong" });
      }

      // Gender verification
      if (jk !== "L" && jk !== "P") {
        rowErrors.push({ row: rowNum, msg: `Format Jenis Kelamin salah (wajib 'L' atau 'P', tertulis: '${jk || "kosong"}')` });
      }

      // Check duplicates within Excel file
      if (nis && localNisSet.has(nis)) {
        rowErrors.push({ row: rowNum, msg: `NIS ganda dalam berkas unggahan: ${nis}` });
      }
      if (nisn && localNisnSet.has(nisn)) {
        rowErrors.push({ row: rowNum, msg: `NISN ganda dalam berkas unggahan: ${nisn}` });
      }

      if (nis) localNisSet.add(nis);
      if (nisn) localNisnSet.add(nisn);

      // Check duplicate against active system registry database
      const isExistNis = existingStudents.some(s => s.nis === nis);
      if (isExistNis) {
        rowErrors.push({ row: rowNum, msg: `NIS sudah terdaftar di Buku Induk: ${nis}` });
      }

      const isExistNisn = existingStudents.some(s => s.nisn === nisn);
      if (isExistNisn) {
        rowErrors.push({ row: rowNum, msg: `NISN sudah terdaftar di Buku Induk (Akun ganda): ${nisn}` });
      }

      // Standardize the row layout
      validatedRows.push({
        nis: nis,
        nisn: nisn,
        namaLengkap: nama,
        tempatLahir: row.tempatLahir ? row.tempatLahir.toString().trim() : "",
        tanggalLahir: row.tanggalLahir ? row.tanggalLahir.toString().trim() : "",
        jenisKelamin: jk === "P" ? "P" : "L",
        agama: row.agama ? row.agama.toString().trim() : "Islam",
        alamat: row.alamat ? row.alamat.toString().trim() : "",
        namaAyah: row.namaAyah ? row.namaAyah.toString().trim() : "",
        namaIbu: row.namaIbu ? row.namaIbu.toString().trim() : "",
        nomorHpOrangTua: row.nomorHpOrangTua ? row.nomorHpOrangTua.toString().trim() : "",
        kelas: kelas,
        tahunAjaran: row.tahunAjaran ? row.tahunAjaran.toString().trim() : "2026/2027",
        statusSiswa: row.statusSiswa ? row.statusSiswa.toString().trim() : "Aktif"
      });
    });

    setErrors(rowErrors);
    setFileData(validatedRows);
    setProgress(100);
    setTimeout(() => setIsProcessing(false), 300);
  };

  const handleApplyImport = () => {
    if (fileData.length === 0 || errors.length > 0) return;
    onImportComplete(fileData);
  };

  return (
    <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-bold text-lg text-blue-600 dark:text-blue-400">Import Data Siswa Masal</h2>
          <p className="text-xs text-slate-500 mt-1">Impor berkas buku induk secara kolektif menggunakan format file .xlsx atau .csv.</p>
        </div>
        
        <button
          onClick={downloadTemplate}
          className="mt-3 md:mt-0 flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer"
          title="Unduh Template Excel"
          id="btn-download-template"
        >
          <Download size={14} />
          <span>Unduh Template (.xlsx)</span>
        </button>
      </div>

      {/* Upload Box Drop area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col justify-center">
          <label 
            className={`h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer text-center group transition-colors
              ${isDark 
                ? "border-slate-700 bg-slate-800/20 hover:bg-slate-800/50 hover:border-blue-500" 
                : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-600"}
            `}
            id="excel-drop-area"
          >
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileUpload}
              className="hidden" 
              disabled={isProcessing}
            />
            <FileSpreadsheet size={40} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs">Pilih File Buku Induk</span>
            <span className="text-[10px] text-slate-400 mt-1">Mendukung format .xlsx, .xls, .csv</span>
            {fileName && (
              <span className="mt-3 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium rounded text-[10px] truncate max-w-full">
                {fileName}
              </span>
            )}
          </label>
        </div>

        {/* Validation and Previews container */}
        <div className="md:col-span-2">
          {/* Progress Bar Loader */}
          {isProcessing && (
            <div className="h-48 flex flex-col justify-center items-center">
              <RefreshCw size={24} className="animate-spin text-blue-500 mb-2" />
              <span className="text-xs font-medium">Memproses data excel...</span>
              <div className="w-48 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {!isProcessing && fileData.length === 0 && errors.length === 0 && (
            <div className={`h-48 rounded-2xl border border-dashed flex flex-col items-center justify-center p-4 text-center
              ${isDark ? "bg-slate-800/10 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"}
            `}>
              <Upload size={24} className="mb-2 text-slate-400" />
              <p className="text-xs">Silakan unggah atau seret berkas Buku Induk siswa Anda untuk melihat pratinjau data.</p>
            </div>
          )}

          {/* Validation Report Alerts */}
          {!isProcessing && (fileData.length > 0 || errors.length > 0) && (
            <div className="space-y-4">
              {errors.length > 0 ? (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle size={16} />
                    <span className="font-bold text-xs">Kesalahan Validasi ({errors.length} masalah)</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto text-[11px] font-mono space-y-1">
                    {errors.map((err, i) => (
                      <div key={i} className="leading-relaxed">
                        • {err.row > 0 ? `Baris ${err.row}: ` : ""}{err.msg}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] mt-2 text-red-500 font-medium">Perbaiki file Excel Anda lalu unggah ulang berkas untuk melanjutkan.</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 size={16} />
                    <span className="font-bold text-xs">Semua Data Valid!</span>
                  </div>
                  <p className="text-[11px] mt-1">Sebanyak {fileData.length} data siswa baru siap diimpor ke dalam Buku Induk Sekolah Dasar.</p>
                </div>
              )}

              {/* Excel Preview Grid */}
              {fileData.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs mb-2">Pratinjau Data ({fileData.length} baris)</h4>
                  <div className="border rounded-xl overflow-hidden max-h-36 overflow-y-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className={`sticky top-0 z-10 font-bold
                        ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}
                      `}>
                        <tr>
                          <th className="p-2 text-[10px]">NIS</th>
                          <th className="p-2 text-[10px]">NISN</th>
                          <th className="p-2 text-[10px]">Nama Lengkap</th>
                          <th className="p-2 text-[10px]">L/P</th>
                          <th className="p-2 text-[10px]">Kelas</th>
                          <th className="p-2 text-[10px]">Tahun Ajaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {fileData.slice(0, 10).map((row, i) => (
                          <tr key={i} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                            <td className="p-2 font-mono text-[11px]">{row.nis}</td>
                            <td className="p-2 font-mono text-[11px]">{row.nisn}</td>
                            <td className="p-2 truncate max-w-[120px] font-medium">{row.namaLengkap}</td>
                            <td className="p-2">{row.jenisKelamin}</td>
                            <td className="p-2 font-semibold">{row.kelas}</td>
                            <td className="p-2 text-slate-500 font-mono text-[11px]">{row.tahunAjaran}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {fileData.length > 10 && (
                    <p className="text-[10px] text-slate-400 mt-1 text-right">Menampilkan 10 dari {fileData.length} data siswa.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors
            ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
          `}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleApplyImport}
          disabled={fileData.length === 0 || errors.length > 0 || isProcessing}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Simpan dan Masukkan Data
        </button>
      </div>
    </div>
  );
}
