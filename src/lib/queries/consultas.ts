import { getDb } from '$lib/database';
import type { CrearConsultaInput } from '$lib/types/consulta';

interface CrearConsultaConReposoInput extends CrearConsultaInput {
  tiene_reposo?: boolean;
  fecha_inicio_suspension?: string;
  fecha_final_suspension?: string;
}

export async function crearConsulta(datos: CrearConsultaConReposoInput): Promise<void> {
  const db = await getDb();
  
  const fechaConsulta = datos.fecha_consulta?.trim() || null;
  const cedulaPaciente = String(datos.ci_beneficiario_paciente).trim();

  // 1. Insertamos la consulta y pedimos que nos devuelva el id_consulta generado
  const resultadoConsulta = await db.select<{ id_consulta: string }[]>(
    `INSERT INTO public."CONSULTA" (
      especialidad_consulta,
      usuario_consulta,
      paciente_consulta,
      doctor_consulta,
      fecha_consulta,
      diagnostico_consulta
    ) VALUES (
      $1::uuid, 
      (SELECT id_usuario FROM public."USUARIO" LIMIT 1), 
      (SELECT id_paciente FROM public."PACIENTE" WHERE TRIM(CAST(ci_beneficiario_paciente AS TEXT)) = TRIM($3) OR TRIM(CAST(ci_titular_paciente AS TEXT)) = TRIM($3) LIMIT 1), 
      $4::uuid, 
      $5::DATE, 
      $6
    ) RETURNING id_consulta`,
    [
      datos.especialidad_consulta,
      datos.usuario_consulta,
      cedulaPaciente,
      datos.doctor_consulta,
      fechaConsulta,
      datos.diagnostico_consulta
    ]
  );

  const idConsultaCreada = resultadoConsulta[0]?.id_consulta;
  if (!idConsultaCreada) {
    throw new Error("No se pudo obtener el ID de la consulta creada.");
  }

  // 2. Si marcó que aplica reposo, guardamos la suspensión
  const tieneReposo = Boolean(datos.tiene_reposo);
  const inicioSusp = datos.fecha_inicio_suspension?.trim();
  const finSusp = datos.fecha_final_suspension?.trim();

  if (tieneReposo && inicioSusp && finSusp) {
    await db.execute(
      `INSERT INTO public."SUSPENSION" (
        consulta_suspension,
        especialidad_suspension,
        doctor_suspension,
        fecha_inicio_suspension,
        fecha_final_suspension
      ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::DATE, $5::DATE)`,
      [
        idConsultaCreada,
        datos.especialidad_consulta,
        datos.doctor_consulta,
        inicioSusp,
        finSusp
      ]
    );
  }
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