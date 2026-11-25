const { Client } = require('pg');

const client = new Client({ connectionString: 'postgres://postgres:Tormentadefuego4.*@100.99.19.74:5432/Sistema_Sisunermb' });

async function checkRemoteCounts() {
  await client.connect();
  console.log('Connected to remote DB!');
  for (const t of ['PACIENTE', 'DOCTOR', 'ESPECIALIDAD', 'USUARIO', 'CONSULTA', 'REPOSO', 'HISTORIAL_AUDITORIA']) {
    const res = await client.query(`SELECT COUNT(*) FROM public."${t}"`);
    console.log(`Remote table ${t}: ${res.rows[0].count} rows`);
  }
  await client.end();
}

checkRemoteCounts().catch(console.error);

