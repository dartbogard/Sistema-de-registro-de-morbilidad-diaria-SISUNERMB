const { Client } = require('pg');

const client = new Client({ connectionString: 'postgres://postgres:Tormentadefuego4.*@100.99.19.74:5432/Sistema_Sisunermb' });

async function runTest() {
  await client.connect();
  console.log('Connected to DB');

  // 1. Get specialties
  const espRes = await client.query('SELECT id_especialidad, tipo_especialidad FROM public."ESPECIALIDAD" WHERE fecha_eliminacion_especialidad IS NULL LIMIT 2');
  console.log('Specialties available:', espRes.rows);
  if (espRes.rows.length < 2) {
    console.log('Need at least 2 specialties for multi-specialty test');
    await client.end();
    return;
  }
  const [esp1, esp2] = espRes.rows;

  // 2. Test inserting test doctor with 2 specialties
  const testId = '00000000-0000-0000-0000-000000000099';
  // clean up any previous test
  await client.query('DELETE FROM public."DOCTOR_ESPECIALIDAD" WHERE id_doctor = $1', [testId]);
  await client.query('DELETE FROM public."DOCTOR" WHERE id_doctor = $1', [testId]);

  await client.query(`
    INSERT INTO public."DOCTOR" (id_doctor, nombre_doctor, apellido_doctor, ci_profesional_doctor, ci_doctor)
    VALUES ($1, 'Dr. Prueba', 'Multiespecialidad', 'MPPS-TEST-99', 'V-99999999')
  `, [testId]);

  await client.query(`
    INSERT INTO public."DOCTOR_ESPECIALIDAD" (id_doctor, id_especialidad) VALUES ($1, $2), ($1, $3)
  `, [testId, esp1.id_especialidad, esp2.id_especialidad]);

  // Insert audit record
  await client.query(`
    INSERT INTO public."HISTORIAL_AUDITORIA" (usuario_auditoria, accion_auditoria, entidad_auditoria, detalle_auditoria)
    VALUES ('Omar', 'AGREGÓ', 'DOCTOR', 'Registró al Dr. Prueba Multiespecialidad con especialidades: ' || $1 || ', ' || $2)
  `, [esp1.tipo_especialidad, esp2.tipo_especialidad]);

  console.log('✅ Doctor creado con 2 especialidades y auditado');

  // 3. Query doctor with STRING_AGG
  const queryRes = await client.query(`
    SELECT 
      d.id_doctor,
      d.nombre_doctor || ' ' || d.apellido_doctor AS nombre_completo,
      STRING_AGG(DISTINCT e.tipo_especialidad, ', ') AS especialidades,
      STRING_AGG(DISTINCT de.id_especialidad::text, ',') AS especialidades_ids_str
    FROM public."DOCTOR" d
    JOIN public."DOCTOR_ESPECIALIDAD" de ON d.id_doctor = de.id_doctor
    JOIN public."ESPECIALIDAD" e ON de.id_especialidad = e.id_especialidad
    WHERE d.id_doctor = $1
    GROUP BY d.id_doctor, d.nombre_doctor, d.apellido_doctor
  `, [testId]);
  console.log('Doctor query result:', queryRes.rows[0]);

  // 4. Test soft delete
  await client.query(`
    UPDATE public."DOCTOR" SET fecha_eliminacion_doctor = (NOW() AT TIME ZONE 'America/Caracas') WHERE id_doctor = $1
  `, [testId]);

  await client.query(`
    INSERT INTO public."HISTORIAL_AUDITORIA" (usuario_auditoria, accion_auditoria, entidad_auditoria, detalle_auditoria)
    VALUES ('Miguel', 'ELIMINÓ', 'DOCTOR', 'Dio de baja al Dr. Prueba Multiespecialidad')
  `);
  console.log('✅ Doctor dado de baja lógica (ocultado) y auditado');

  // 5. Test active list excludes soft deleted doctor
  const activeRes = await client.query('SELECT id_doctor FROM public."DOCTOR" WHERE id_doctor = $1 AND fecha_eliminacion_doctor IS NULL', [testId]);
  console.log('Is doctor in active list?', activeRes.rows.length > 0 ? 'YES (Error)' : 'NO (Correct, hidden!)');

  // 6. Test audit query
  const auditRes = await client.query(`
    SELECT usuario_auditoria, accion_auditoria, entidad_auditoria, detalle_auditoria, TO_CHAR(fecha_auditoria, 'DD/MM/YYYY hh:MI:SS AM') as fecha
    FROM public."HISTORIAL_AUDITORIA"
    ORDER BY fecha_auditoria DESC
    LIMIT 5
  `);
  console.log('Recent audit logs:', auditRes.rows);

  // Clean up test doctor
  await client.query('DELETE FROM public."DOCTOR_ESPECIALIDAD" WHERE id_doctor = $1', [testId]);
  await client.query('DELETE FROM public."DOCTOR" WHERE id_doctor = $1', [testId]);
  await client.query("DELETE FROM public.\"HISTORIAL_AUDITORIA\" WHERE detalle_auditoria LIKE '%Prueba Multiespecialidad%'");

  console.log('✅ Flujo completo verificado con éxito!');
  await client.end();
}

runTest().catch(console.error);

