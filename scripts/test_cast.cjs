const { Client } = require('pg');

const client = new Client({ connectionString: 'postgres://postgres:Tormentadefuego4.*@100.99.19.74:5432/Sistema_Sisunermb' });

async function testCasts() {
  await client.connect();

  // Get a user
  const u = await client.query('SELECT id_usuario, nombre_usuario FROM public."USUARIO" LIMIT 1');
  const uid = String(u.rows[0].id_usuario);
  console.log('Testing with id_usuario:', uid);

  // Test without cast (see what happens)
  try {
    await client.query('SELECT * FROM public."USUARIO" WHERE id_usuario = $1', [uid]);
    console.log('Without cast in node-pg: works because pg driver infers or handles it');
  } catch (err) {
    console.log('Without cast in node-pg failed:', err.message);
  }

  // But in Tauri SQL (which uses sqlx rust), text is sent as TEXT parameter, so $1 is TEXT.
  // When $1 is TEXT, postgres cannot compare UUID with TEXT without explicit cast:
  try {
    // Simulate what sqlx does: PREPARE stmt(text) AS SELECT ... WHERE id_usuario = $1
    await client.query('PREPARE test_uuid(text) AS SELECT id_usuario FROM public."USUARIO" WHERE id_usuario = $1');
  } catch (err) {
    console.log('Expected error with text param:', err.message);
  }

  // Now test with ::uuid:
  try {
    await client.query('PREPARE test_uuid_cast(text) AS SELECT id_usuario FROM public."USUARIO" WHERE id_usuario = $1::uuid');
    const r = await client.query('EXECUTE test_uuid_cast($1)', [uid]);
    console.log('✅ With ::uuid cast works perfectly! Found:', r.rows.length);
  } catch (err) {
    console.log('With ::uuid cast failed:', err.message);
  }

  await client.end();
}

testCasts().catch(console.error);

