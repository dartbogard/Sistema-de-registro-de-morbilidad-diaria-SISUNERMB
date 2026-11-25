const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'backup_base_de_datos_sisunermb.sql');
const content = fs.readFileSync(srcPath, 'utf8');
const lines = content.split(/\r?\n/);
console.log('Total de líneas originales:', lines.length);

let idxDoctor = lines.findIndex(l => l.includes('Tabla: DOCTOR'));
let idxUsuario = lines.findIndex(l => l.includes('Tabla: USUARIO'));
let idxPaciente = lines.findIndex(l => l.includes('Tabla: PACIENTE'));
let idxConsulta = lines.findIndex(l => l.includes('Tabla: CONSULTA'));
let idxSuspension = lines.findIndex(l => l.includes('Tabla: SUSPENSION'));
let idxDoctorEsp = lines.findIndex(l => l.includes('Tabla: DOCTOR_ESPECIALIDAD'));
let idxAuditoria = lines.findIndex(l => l.includes('Tabla: HISTORIAL_AUDITORIA'));

console.log({
  idxDoctor,
  idxUsuario,
  idxPaciente,
  idxConsulta,
  idxSuspension,
  idxDoctorEsp,
  idxAuditoria
});

// Let's inspect the sections:
console.log('--- DOCTOR SECTION ---');
for (let i = idxDoctor; i < idxUsuario; i++) {
  console.log(lines[i]);
}

console.log('--- USUARIO SECTION ---');
for (let i = idxUsuario; i < idxPaciente; i++) {
  console.log(lines[i]);
}

console.log('--- CONSULTA & SUSPENSION SECTION (first few lines) ---');
for (let i = idxConsulta; i < Math.min(idxConsulta + 25, lines.length); i++) {
  console.log(lines[i]);
}

