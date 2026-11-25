const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'backup_base_de_datos_sisunermb.sql');
const lines = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/);

console.log('Total lines:', lines.length);
for (let i = 12180; i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}

