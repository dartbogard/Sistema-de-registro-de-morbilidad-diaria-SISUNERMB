const fs = require('fs');

const sql = fs.readFileSync('backup_base_de_datos_sisunermb.sql', 'utf8');

// Find all patients whose name has both 'OMAR' and 'OBERTO'
const lines = sql.split('\n');
const matched = lines.filter(l => {
  const upper = l.toUpperCase();
  return upper.includes('PACIENTE') && upper.includes('OMAR') && upper.includes('OBERTO');
});

console.log('Matches with both OMAR and OBERTO in line:', matched.length);
matched.forEach(m => {
  // extract name
  const match = m.match(/VALUES \([^,]+,\s*'([^']+)'/);
  if (match) console.log(' ->', match[1]);
});

