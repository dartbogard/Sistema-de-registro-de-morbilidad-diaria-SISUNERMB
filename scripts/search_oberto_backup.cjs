const fs = require('fs');

const sql = fs.readFileSync('backup_base_de_datos_sisunermb.sql', 'utf8');
const lines = sql.split('\n');

const obertoLines = lines.filter(l => l.toUpperCase().includes('OBERTO') && l.includes('PACIENTE'));
console.log('Found OBERTO lines:', obertoLines.length);
obertoLines.slice(0, 10).forEach(l => console.log(l));

