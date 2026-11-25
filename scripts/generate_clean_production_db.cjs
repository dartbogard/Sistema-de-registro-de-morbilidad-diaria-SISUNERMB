const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'backup_base_de_datos_sisunermb.sql');
const content = fs.readFileSync(srcPath, 'utf8');
const lines = content.split(/\r?\n/);

console.log('Procesando archivo SQL original. Líneas:', lines.length);

const outLines = [];

// 1. Encabezado limpio y DROPs
outLines.push('-- =====================================================================');
outLines.push('-- BASE DE DATOS OFICIAL SISUNERMB - VERSIÓN DE IMPLANTACIÓN LIMPIA');
outLines.push('-- Sistema Integral de Salud UNERMB');
outLines.push('-- Preparada para Pase a Producción Oficial');
outLines.push('-- Incluye: 12.053 pacientes oficiales UNERMB, catálogo de especialidades');
outLines.push('-- Usuario Administrador: Omar');
outLines.push('-- Historial limpio: Doctores, Consultas, Reposos y Auditoría en cero');
outLines.push('-- =====================================================================\n');

outLines.push('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
outLines.push('CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n');

outLines.push('-- Eliminar tablas previas si existen (en orden inverso de dependencias)');
outLines.push('DROP TABLE IF EXISTS public."HISTORIAL_AUDITORIA" CASCADE;');
outLines.push('DROP TABLE IF EXISTS public."DOCTOR_ESPECIALIDAD" CASCADE;');
outLines.push('DROP TABLE IF EXISTS public."SUSPENSION" CASCADE;');
outLines.push('DROP TABLE IF EXISTS public."CONSULTA" CASCADE;');
outLines.push('DROP TABLE IF EXISTS public."PACIENTE" CASCADE;');
outLines.push('DROP TABLE IF EXISTS public."USUARIO" CASCADE;');
outLines.push('DROP TABLE IF EXISTS public."DOCTOR" CASCADE;');
outLines.push('DROP TABLE IF EXISTS public."ESPECIALIDAD" CASCADE;\n');

// 2. Tabla ESPECIALIDAD (desde idxEspecialidad hasta idxDoctor)
const idxEspecialidad = lines.findIndex(l => l.includes('Tabla: ESPECIALIDAD'));
const idxDoctor = lines.findIndex(l => l.includes('Tabla: DOCTOR'));
for (let i = idxEspecialidad; i < idxDoctor; i++) {
  outLines.push(lines[i]);
}

// 3. Tabla DOCTOR (solo definición de tabla, sin datos de prueba)
const idxUsuario = lines.findIndex(l => l.includes('Tabla: USUARIO'));
let inDoctorCreate = true;
for (let i = idxDoctor; i < idxUsuario; i++) {
  const line = lines[i];
  if (line.includes('INSERT INTO public."DOCTOR"')) {
    continue; // Omitir doctores de prueba
  }
  if (line.includes('-- Datos de DOCTOR')) {
    outLines.push('-- Tabla de DOCTOR lista para registrar personal médico oficial (0 registros de prueba)');
    continue;
  }
  outLines.push(line);
}

// 4. Tabla USUARIO (definición de tabla + SOLO usuario Omar)
const idxPaciente = lines.findIndex(l => l.includes('Tabla: PACIENTE'));
for (let i = idxUsuario; i < idxPaciente; i++) {
  const line = lines[i];
  if (line.includes('INSERT INTO public."USUARIO"')) {
    if (line.includes("'Omar'")) {
      outLines.push(line); // Conservar exclusivamente a Omar
    }
    // Omitir miguel u otros
    continue;
  }
  if (line.includes('-- Datos de USUARIO')) {
    outLines.push('-- Datos de USUARIO: Administrador Institucional');
    continue;
  }
  outLines.push(line);
}

// 5. Tabla PACIENTE (definición de tabla + TODOS los 12.053 pacientes)
const idxConsulta = lines.findIndex(l => l.includes('Tabla: CONSULTA'));
for (let i = idxPaciente; i < idxConsulta; i++) {
  outLines.push(lines[i]);
}

// 6. Tabla CONSULTA (solo definición de tabla, sin consultas de prueba)
const idxSuspension = lines.findIndex(l => l.includes('Tabla: SUSPENSION'));
for (let i = idxConsulta; i < idxSuspension; i++) {
  const line = lines[i];
  if (line.includes('INSERT INTO public."CONSULTA"')) {
    continue; // Omitir consultas de prueba
  }
  if (line.includes('-- Datos de CONSULTA')) {
    outLines.push('-- Tabla de CONSULTA lista para atenciones médicas reales (0 registros de prueba)');
    continue;
  }
  outLines.push(line);
}

// 7. Tabla SUSPENSION (solo definición de tabla, sin reposos de prueba)
const idxDoctorEsp = lines.findIndex(l => l.includes('Tabla: DOCTOR_ESPECIALIDAD'));
for (let i = idxSuspension; i < idxDoctorEsp; i++) {
  const line = lines[i];
  if (line.includes('INSERT INTO public."SUSPENSION"')) {
    continue; // Omitir reposos de prueba
  }
  if (line.includes('-- Datos de SUSPENSION')) {
    outLines.push('-- Tabla de SUSPENSION (Reposos) lista para emisión oficial (0 registros de prueba)');
    continue;
  }
  outLines.push(line);
}

// 8. Tabla DOCTOR_ESPECIALIDAD
const idxAuditoria = lines.findIndex(l => l.includes('Tabla: HISTORIAL_AUDITORIA'));
for (let i = idxDoctorEsp; i < idxAuditoria; i++) {
  outLines.push(lines[i]);
}

// 9. Tabla HISTORIAL_AUDITORIA
for (let i = idxAuditoria; i < lines.length; i++) {
  outLines.push(lines[i]);
}
outLines.push('-- Tabla de HISTORIAL_AUDITORIA lista para registrar eventos en producción (0 registros)');

const finalSql = outLines.join('\n');

// Destinos
const destWorkspace = path.join(__dirname, '..', 'backup_base_de_datos_sisunermb.sql');
const destFinal = path.join(__dirname, '..', 'INSTALADOR_FINAL', 'backup_base_de_datos_sisunermb.sql');
const destDesktop = 'C:\\Users\\Esthefani Laguna\\Desktop\\SISUNERMB_INSTALADOR\\backup_base_de_datos_sisunermb.sql';

[destWorkspace, destFinal, destDesktop].forEach(d => {
  fs.writeFileSync(d, finalSql, 'utf8');
  const stat = fs.statSync(d);
  console.log(`✅ Guardado limpio en: ${d} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
});

