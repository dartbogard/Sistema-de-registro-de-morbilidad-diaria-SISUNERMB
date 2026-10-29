import { getDb } from '$lib/database';
import type { Consulta, CrearConsultaInput } from '$lib/types/consulta';

/**
 * Registra una consulta médica vinculando paciente, doctor, especialidad y usuario.
 */
export async function crearConsulta(datos: CrearConsultaInput): Promise<void> {
  const db = await getDb();
  
  // Asegurarnos de formatear las fechas o campos si fuera necesario
  const fechaConsulta = datos.fecha_consulta?.trim() || null;

  await db.execute(
    `INSERT INTO public."CONSULTA" (
      especialidad_consulta,
      usuario_consulta,
      paciente_consulta,
      doctor_consulta,
      fecha_consulta,
      diagnostico_consulta
    ) VALUES (
      $1, 
      $2, 
      (SELECT id_paciente FROM public."PACIENTE" WHERE ci_beneficiario_paciente = $3), 
      $4, 
      $5::DATE, 
      $6
    )`,
    [
      datos.especialidad_consulta,
      datos.usuario_consulta,
      datos.ci_beneficiario_paciente, // <--- Aquí pasas la cédula en lugar del ID
      datos.doctor_consulta,
      fechaConsulta,
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
/**
 * Obtiene el reporte de morbilidad agrupado por diagnóstico y especialidad en un rango de fechas.
 */
export async function obtenerReporteMorbilidad(fechaInicio: string, fechaFin: string) {
  const db = await getDb();
  
  if (!fechaInicio || !fechaFin) return [];

  return await db.select(
    `SELECT 
      c.diagnostico_consulta AS diagnostico,
      COUNT(c.id_consulta)::INTEGER AS total_casos,
      e.tipo_especialidad AS especialidad
     FROM public."CONSULTA" c
     INNER JOIN public."ESPECIALIDAD" e ON c.especialidad_consulta = e.id_especialidad
     WHERE c.fecha_consulta::DATE BETWEEN $1::DATE AND $2::DATE
       AND c.fecha_eliminacion_consulta IS NULL
     GROUP BY c.diagnostico_consulta, e.tipo_especialidad
     ORDER BY total_casos DESC`,
    [fechaInicio, fechaFin]
  );
}
export async function obtenerEspecialidades() {
  const db = await getDb();
  return await db.select(
    `SELECT id_especialidad, tipo_especialidad 
     FROM public."ESPECIALIDAD" 
     WHERE fecha_eliminacion_especialidad IS NULL 
     ORDER BY tipo_especialidad ASC`
  );
}

export async function obtenerDoctoresPorEspecialidad(idEspecialidad?: number) {
  const db = await getDb();
  if (idEspecialidad) {
    return await db.select(
      `SELECT id_doctor, nombre_doctor || ' ' || apellido_doctor AS nombre_completo 
       FROM public."DOCTOR" 
       WHERE especialidad_doctor = $1 AND fecha_eliminacion_doctor IS NULL 
       ORDER BY nombre_doctor ASC`,
      [idEspecialidad]
    );
  }
  return await db.select(
    `SELECT id_doctor, nombre_doctor || ' ' || apellido_doctor AS nombre_completo 
     FROM public."DOCTOR" 
     WHERE fecha_eliminacion_doctor IS NULL 
     ORDER BY nombre_doctor ASC`
  );
}