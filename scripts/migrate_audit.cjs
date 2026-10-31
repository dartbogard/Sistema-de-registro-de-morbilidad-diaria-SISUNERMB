const { Client } = require('pg');

const client = new Client({ connectionString: 'postgres://postgres:Tormentadefuego4.*@100.99.19.74:5432/Sistema_Sisunermb' });

async function createAuditTable() {
  await client.connect();
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS public."HISTORIAL_AUDITORIA" (
      id_auditoria UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      usuario_auditoria TEXT NOT NULL,
      accion_auditoria TEXT NOT NULL,
      entidad_auditoria TEXT NOT NULL,
      detalle_auditoria TEXT NOT NULL,
      fecha_auditoria TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Caracas') NOT NULL
    );
  `);
  console.log('✅ Tabla HISTORIAL_AUDITORIA creada exitosamente en 100.99.19.74');

  await client.end();
}

createAuditTable().catch(console.error);

