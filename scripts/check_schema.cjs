const fs = require('fs');

const sql = fs.readFileSync('backup_base_de_datos_sisunermb.sql', 'utf8');

const regex = /CREATE TABLE (?:IF NOT EXISTS )?public\."?([a-zA-Z0-9_]+)"?\s*\(([\s\S]*?)\);/g;
let match;
while ((match = regex.exec(sql)) !== null) {
  const tableName = match[1];
  if (['DOCTOR', 'ESPECIALIDAD', 'DOCTOR_ESPECIALIDAD', 'USUARIO', 'PACIENTE', 'CONSULTA', 'REPOSO'].includes(tableName.toUpperCase())) {
    console.log(`=== TABLE: ${tableName} ===`);
    console.log(match[2].trim());
    console.log('\n');
  }
}
