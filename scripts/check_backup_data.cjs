const fs = require('fs');

const sql = fs.readFileSync('backup_base_de_datos_sisunermb.sql', 'utf8');
console.log('Size:', (sql.length / 1024 / 1024).toFixed(2), 'MB');

// Check row counts in backup_base_de_datos_sisunermb.sql
const tables = ['PACIENTE', 'DOCTOR', 'ESPECIALIDAD', 'USUARIO', 'CONSULTA', 'REPOSO'];
tables.forEach(t => {
  const insertMatches = sql.match(new RegExp(`INSERT INTO public\\."${t}"`, 'g'));
  console.log(`Table ${t}: ${insertMatches ? insertMatches.length : 0} INSERT statements`);
});

