import fs from 'fs';

const files = [
  'src/components/AdminDashboard.tsx',
  'src/components/TeacherManager.tsx',
  'src/components/ReportsManager.tsx',
  'src/components/BackupRestore.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = `import { ConfirmDialog } from "./ConfirmDialog";\n` + content;
  fs.writeFileSync(file, content);
});
