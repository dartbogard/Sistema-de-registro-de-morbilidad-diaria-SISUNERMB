const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:Tormentadefuego4.*@100.99.19.74:5432/Sistema_Sisunermb' });
async function check() {
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='DOCTOR'");
  console.log('DOCTOR cols:', res.rows.map(r => r.column_name));
  await client.end();
}
check().catch(console.error);
