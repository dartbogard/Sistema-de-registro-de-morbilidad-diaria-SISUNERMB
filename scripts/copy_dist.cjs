const fs = require('fs');
const path = require('path');

const setupSrc = path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle', 'nsis', 'SISUNERMB_1.0.0_x64-setup.exe');
const appSrc = path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'app.exe');
const sqlSrc = path.join(__dirname, '..', 'backup_base_de_datos_sisunermb.sql');

const destFinal = path.join(__dirname, '..', 'INSTALADOR_FINAL');
const destDesktop = 'C:\\Users\\Esthefani Laguna\\Desktop\\SISUNERMB_INSTALADOR';

[destFinal, destDesktop].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

fs.copyFileSync(setupSrc, path.join(destFinal, 'SISUNERMB_Instalador.exe'));
fs.copyFileSync(appSrc, path.join(destFinal, 'SISUNERMB_Portable.exe'));
fs.copyFileSync(sqlSrc, path.join(destFinal, 'backup_base_de_datos_sisunermb.sql'));

fs.copyFileSync(setupSrc, path.join(destDesktop, 'SISUNERMB_Instalador.exe'));
fs.copyFileSync(appSrc, path.join(destDesktop, 'SISUNERMB_Portable.exe'));
fs.copyFileSync(sqlSrc, path.join(destDesktop, 'backup_base_de_datos_sisunermb.sql'));

console.log('✅ Archivos copiados exitosamente a:');
console.log('1. ', destFinal);
console.log('2. ', destDesktop);

console.log('\nArchivos en el Escritorio:');
fs.readdirSync(destDesktop).forEach(file => {
  const stat = fs.statSync(path.join(destDesktop, file));
  console.log(` - ${file} (${(stat.size / 1024 / 1024).toFixed(2)} MB, ${stat.mtime.toLocaleString()})`);
});

