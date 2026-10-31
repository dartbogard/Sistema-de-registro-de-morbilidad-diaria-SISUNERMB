const { Client } = require('pg');

const client = new Client({ connectionString: 'postgres://postgres:Tormentadefuego4.*@100.99.19.74:5432/Sistema_Sisunermb' });

async function testOptions() {
  await client.connect();

  const u = await client.query('SELECT id_usuario FROM public."USUARIO" LIMIT 1');
  const uid = String(u.rows[0].id_usuario);

  // Test Option A: $1::uuid
  try {
    await client.query('PREPARE opt_a(text) AS SELECT id_usuario FROM public."USUARIO" WHERE id_usuario = $1::uuid');
    const r = await client.query(`EXECUTE opt_a('${uid}')`);
    console.log('✅ Option A (id_usuario = $1::uuid) SUCCESS! Rows:', r.rows.length);
    await client.query('DEALLOCATE opt_a');
  } catch (err) {
    console.log('❌ Option A failed:', err.message);
  }

  // Test Option B: id_usuario::text = $1
  try {
    await client.query('PREPARE opt_b(text) AS SELECT id_usuario FROM public."USUARIO" WHERE id_usuario::text = $1');
    const r = await client.query(`EXECUTE opt_b('${uid}')`);
    console.log('✅ Option B (id_usuario::text = $1) SUCCESS! Rows:', r.rows.length);
    await client.query('DEALLOCATE opt_b');
  } catch (err) {
    console.log('❌ Option B failed:', err.message);
  }

  // Also test UPDATE with Option A:
  try {
    await client.query('PREPARE opt_upd(text, text) AS UPDATE public."USUARIO" SET nombre_usuario = $1 WHERE id_usuario = $2::uuid');
    console.log('✅ Prepared UPDATE opt_upd(text, text) with $2::uuid SUCCESS!');
    await client.query('DEALLOCATE opt_upd');
  } catch (err) {
    console.log('❌ UPDATE Option A failed:', err.message);
  }

  // Also test UPDATE with Option B (id_usuario::text = $2):
  try {
    await client.query('PREPARE opt_upd_b(text, text) AS UPDATE public."USUARIO" SET nombre_usuario = $1 WHERE id_usuario::text = $2');
    console.log('✅ Prepared UPDATE opt_upd_b(text, text) with id_usuario::text = $2 SUCCESS!');
    await client.query('DEALLOCATE opt_upd_b');
  } catch (err) {
    console.log('❌ UPDATE Option B failed:', err.message);
  }

  await client.end();
}

testOptions().catch(console.error);
