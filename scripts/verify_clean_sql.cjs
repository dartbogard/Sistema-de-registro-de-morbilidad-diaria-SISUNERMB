const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\Esthefani Laguna\\Desktop\\SISUNERMB_INSTALADOR\\backup_base_de_datos_sisunermb.sql';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split(/\r?\n/);

let countUsuarios = 0;
let usuariosList = [];
let countDoctores = 0;
let countConsultas = 0;
let countSuspensiones = 0;
let countPacientes = 0;
let countAuditoria = 0;

lines.forEach(l => {
  if (l.startsWith('INSERT INTO public."USUARIO"')) {
    countUsuarios++;
    usuariosList.push(l);
  }
  if (l.startsWith('INSERT INTO public."DOCTOR"')) {
    countDoctores++;
  }
  if (l.startsWith('INSERT INTO public."CONSULTA"')) {
    countConsultas++;
  }
  if (l.startsWith('INSERT INTO public."SUSPENSION"')) {
    countSuspensiones++;
  }
  if (l.startsWith('INSERT INTO public."PACIENTE"')) {
    countPacientes++;
  }
  if (l.startsWith('INSERT INTO public."HISTORIAL_AUDITORIA"')) {
    countAuditoria++;
  }
});

console.log('--- REPORTE DE VERIFICACIÓN DE BASE DE DATOS LIMPIA ---');
console.log('Total pacientes oficiales:', countPacientes);
console.log('Total usuarios:', countUsuarios);
console.log('Usuarios en el archivo:', usuariosList);
console.log('Total doctores de prueba:', countDoctores);
console.log('Total consultas de prueba:', countConsultas);
console.log('Total reposos/suspensiones de prueba:', countSuspensiones);
console.log('Total auditorías de prueba:', countAuditoria);

