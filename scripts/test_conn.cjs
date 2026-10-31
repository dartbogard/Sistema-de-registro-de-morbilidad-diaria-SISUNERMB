const { Client } = require('pg');

async function testConnection(url, name) {
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 3000 });
  try {
    await client.connect();
    console.log(`✅ Conexión exitosa a ${name}`);
    await client.end();
  } catch (err) {
    console.log(`❌ No se pudo conectar a ${name}: ${err.message}`);
  }
}

async function main() {
  await testConnection('postgres://postgres:Tormentadefuego4.*@100.99.19.74:5432/Sistema_Sisunermb', 'Remoto (100.99.19.74)');
  await testConnection('postgres://postgres:Tormentadefuego4.*@localhost:5432/Sistema_Sisunermb', 'Localhost');
  await testConnection('postgres://postgres:miguel1234@localhost:5432/SISUNERMB_MORBILIDAD', 'Localhost (miguel1234)');
}

main();

