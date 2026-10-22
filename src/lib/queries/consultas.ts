import { getDb } from '$lib/database';
import type { Consulta, CrearConsultaInput } from '$lib/types/consulta';

/**
 * Registra una consulta médica vinculando paciente, doctor, especialidad y usuario.
 */
export async function crearConsulta(datos: CrearConsultaInput): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO public."CONSULTA" (
      especialidad_consulta,
      usuario_consulta,
      paciente_consulta,
      doctor_consulta,
      fecha_consulta,
      diagnostico_consulta
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      datos.especialidad_consulta,
      datos.usuario_consulta,
      datos.paciente_consulta,
      datos.doctor_consulta,
      datos.fecha_consulta,
      datos.diagnostico_consulta
    ]
  );
}

/**
 * Consulta de listado enriquecido con nombres reales mediante JOINs.
 */
export async function obtenerHistorialConsultas() {
  const db = await getDb();
  return await db.select(
    `SELECT 
      c.id_consulta,
      c.fecha_consulta,
      c.diagnostico_consulta,
      p.nombre_completo_paciente,
      p.ci_titular_paciente,
      d.nombre_doctor || ' ' || d.apellido_doctor AS nombre_doctor,
      e.tipo_especialidad
     FROM public."CONSULTA" c
     INNER JOIN public."PACIENTE" p ON c.paciente_consulta = p.id_paciente
     INNER JOIN public."DOCTOR" d ON c.doctor_consulta = d.id_doctor
     INNER JOIN public."ESPECIALIDAD" e ON c.especialidad_consulta = e.id_especialidad
     WHERE c.fecha_eliminacion_consulta IS NULL
     ORDER BY c.fecha_consulta DESC`
  );
}
export async function obtenerHistorialPorCedula(cedula: string) {
  const db = await getDb();
  const cedulaLimpia = cedula.trim();
  
  if (!cedulaLimpia) return [];

  return await db.select(
    `SELECT 
      c.id_consulta,
      c.fecha_consulta,
      c.diagnostico_consulta,
      p.nombre_completo_paciente,
      p.ci_titular_paciente,
      p.ci_beneficiario_paciente,
      d.nombre_doctor || ' ' || d.apellido_doctor AS nombre_doctor,
      e.tipo_especialidad
     FROM public."CONSULTA" c
     INNER JOIN public."PACIENTE" p ON c.paciente_consulta = p.id_paciente
     INNER JOIN public."DOCTOR" d ON c.doctor_consulta = d.id_doctor
     INNER JOIN public."ESPECIALIDAD" e ON c.especialidad_consulta = e.id_especialidad
     WHERE (p.ci_titular_paciente = $1 OR p.ci_beneficiario_paciente = $1)
       AND c.fecha_eliminacion_consulta IS NULL
     ORDER BY c.fecha_consulta DESC`,
    [cedulaLimpia]
  );
}