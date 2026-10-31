const { Client } = require('pg');

const client = new Client({ connectionString: 'postgres://postgres:Tormentadefuego4.*@100.99.19.74:5432/Sistema_Sisunermb' });

async function verifyAllCasts() {
  await client.connect();
  console.log('Testing SQL Prepared Statements with explicit TEXT parameter types...');

  // 1. USUARIO EDIT & ELIMINAR
  const uRes = await client.query('SELECT id_usuario FROM public."USUARIO" LIMIT 1');
  const testUserId = String(uRes.rows[0].id_usuario);
  await client.query(`
    PREPARE p_edit_user(text, text, text, text) AS
    UPDATE public."USUARIO"
    SET nombre_usuario = $1, password_usuario = $2, rol_usuario = $3
    WHERE id_usuario = $4::uuid
  `);
  await client.query(`
    PREPARE p_del_user(text) AS
    UPDATE public."USUARIO"
    SET fecha_eliminacion_usuario = NULL
    WHERE id_usuario = $1::uuid
  `);
  console.log('✅ Usuario prepared statements compiled successfully!');

  // 2. ESPECIALIDAD EDIT & ELIMINAR
  const espRes = await client.query('SELECT id_especialidad FROM public."ESPECIALIDAD" LIMIT 1');
  const testEspId = String(espRes.rows[0].id_especialidad);
  await client.query(`
    PREPARE p_edit_esp(text, text) AS
    UPDATE public."ESPECIALIDAD"
    SET tipo_especialidad = $1
    WHERE id_especialidad = $2::uuid
  `);
  await client.query(`
    PREPARE p_del_esp(text) AS
    UPDATE public."ESPECIALIDAD"
    SET fecha_eliminacion_especialidad = NULL
    WHERE id_especialidad = $1::uuid
  `);
  console.log('✅ Especialidad prepared statements compiled successfully!');

  // 3. DOCTOR EDIT & ELIMINAR
  await client.query(`
    PREPARE p_edit_doc(text, text, text, text, text) AS
    UPDATE public."DOCTOR"
    SET nombre_doctor = $1, apellido_doctor = $2, ci_profesional_doctor = $3, ci_doctor = $4
    WHERE id_doctor = $5::uuid
  `);
  await client.query(`
    PREPARE p_del_doc(text) AS
    UPDATE public."DOCTOR"
    SET fecha_eliminacion_doctor = NULL
    WHERE id_doctor = $1::uuid
  `);
  await client.query(`
    PREPARE p_del_doc_esp(text) AS
    DELETE FROM public."DOCTOR_ESPECIALIDAD" WHERE id_doctor = $1::uuid
  `);
  console.log('✅ Doctor prepared statements compiled successfully!');

  // 4. PACIENTE EDIT & ELIMINAR
  await client.query(`
    PREPARE p_edit_pac(text, text, text, text, text, text, text, text, text, text) AS
    UPDATE public."PACIENTE"
    SET nombre_completo_paciente = $1, nombre_titular_paciente = $2, ci_titular_paciente = $3, ci_beneficiario_paciente = $4,
        fecha_nacimiento_paciente = $5::DATE, sexo_paciente = $6, tipo_personal_paciente = $7, categoria_trabajador_paciente = $8,
        parentesco_paciente = $9
    WHERE id_paciente = $10::uuid
  `);
  await client.query(`
    PREPARE p_del_pac(text) AS
    UPDATE public."PACIENTE"
    SET fecha_eliminacion_paciente = NULL
    WHERE id_paciente = $1::uuid
  `);
  console.log('✅ Paciente prepared statements compiled successfully!');

  console.log('\n🎉 ¡TODAS LAS CONSULTAS COMPILARON CON ÉXITO SIN ERROR DE uuid = text!');
  await client.end();
}

verifyAllCasts().catch(console.error);

