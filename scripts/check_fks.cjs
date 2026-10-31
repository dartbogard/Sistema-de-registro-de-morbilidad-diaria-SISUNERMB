const fs = require('fs');
const sql = fs.readFileSync('backup_base_de_datos_sisunermb.sql', 'utf8');
const lines = sql.split('\n');
lines.forEach((l, i) => {
  if (l.includes('DOCTOR_ESPECIALIDAD')) console.log(`${i+1}: ${l}`);
});
