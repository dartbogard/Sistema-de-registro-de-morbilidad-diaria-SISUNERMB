import { getDb } from '$lib/database';
import type { CrearConsultaInput } from '$lib/types/consulta';
import { verificarReposoActivoConDoctor } from '$lib/queries/suspensiones';

interface CrearConsultaConReposoInput extends CrearConsultaInput {
  tiene_reposo?: boolean;
  fecha_inicio_suspension?: string;
  fecha_final_suspension?: string;
}

export async function crearConsulta(datos: CrearConsultaConReposoInput): Promise<void> {
  const db = await getDb();
  
  const fechaConsulta = datos.fecha_consulta?.trim() || null;
  const cedulaPaciente = String(datos.ci_beneficiario_paciente).trim();
  const diagnosticoConsulta = (datos.diagnostico_consulta || '').trim().toUpperCase();

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
      CASE 
        WHEN $5::DATE = (CURRENT_DATE AT TIME ZONE 'America/Caracas') 
          THEN (NOW() AT TIME ZONE 'America/Caracas')
        ELSE ($5::DATE + (NOW() AT TIME ZONE 'America/Caracas')::TIME)
      END, 
      UPPER(TRIM($6))
    ) RETURNING id_consulta`,
    [
      datos.especialidad_consulta,
      datos.usuario_consulta,
      cedulaPaciente,
      datos.doctor_consulta,
      fechaConsulta,
      diagnosticoConsulta
    ]
  );

  const idConsultaCreada = resultadoConsulta[0]?.id_consulta;
  if (!idConsultaCreada) {
    throw new Error("No se pudo obtener el ID de la consulta creada.");
  }

  // 2. Si marcó que aplica reposo, verificamos y guardamos la suspensión
  const tieneReposo = Boolean(datos.tiene_reposo);
  const inicioSusp = datos.fecha_inicio_suspension?.trim();
  const finSusp = datos.fecha_final_suspension?.trim();

  if (tieneReposo && inicioSusp && finSusp) {
    // Validar rigurosamente que el paciente no tenga ya un reposo activo con el mismo doctor
    const verificacion = await verificarReposoActivoConDoctor(
      cedulaPaciente,
      datos.doctor_consulta,
      inicioSusp
    );

    if (verificacion.tieneReposoActivo && verificacion.reposoActivo) {
      throw new Error(
        `Control de reposos: El paciente ya cuenta con un reposo activo emitido por el doctor ${verificacion.reposoActivo.doctor} vigente hasta el ${verificacion.reposoActivo.fecha_final_suspension}. No se permite superponer un nuevo reposo con el mismo médico tratante.`
      );
    }

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
      UPPER(TRIM(c.diagnostico_consulta)) AS diagnostico_consulta,
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

export async function obtenerHistorialPorCedula(terminoBusqueda: string) {
  const db = await getDb();
  const terminoLimpio = (terminoBusqueda || '').trim();
  
  if (!terminoLimpio) return [];

  const soloNumeros = terminoLimpio.replace(/^[VvEeJjGg]-?/, '').trim();
  const conPrefijoV = 'V-' + soloNumeros;
  const conPrefijoE = 'E-' + soloNumeros;

  return await db.select(
    `SELECT 
      c.id_consulta,
      c.fecha_consulta,
      c.fecha_creacion_consulta,
      TO_CHAR(COALESCE(c.fecha_creacion_consulta, c.fecha_consulta) AT TIME ZONE 'America/Caracas', 'DD/MM/YYYY') AS fecha_formateada,
      TO_CHAR(COALESCE(c.fecha_creacion_consulta, c.fecha_consulta) AT TIME ZONE 'America/Caracas', 'HH12:MI AM') AS hora_formateada,
      UPPER(TRIM(c.diagnostico_consulta)) AS diagnostico_consulta,
      p.nombre_completo_paciente,
      p.ci_titular_paciente,
      p.ci_beneficiario_paciente,
      d.nombre_doctor || ' ' || d.apellido_doctor AS nombre_doctor,
      e.tipo_especialidad
     FROM public."CONSULTA" c
     INNER JOIN public."PACIENTE" p ON c.paciente_consulta = p.id_paciente
     INNER JOIN public."DOCTOR" d ON c.doctor_consulta = d.id_doctor
     INNER JOIN public."ESPECIALIDAD" e ON c.especialidad_consulta = e.id_especialidad
     WHERE (
       p.ci_titular_paciente = $1 OR p.ci_beneficiario_paciente = $1
       OR p.ci_titular_paciente = $2 OR p.ci_beneficiario_paciente = $2
       OR p.ci_titular_paciente = $3 OR p.ci_beneficiario_paciente = $3
       OR p.ci_titular_paciente = $4 OR p.ci_beneficiario_paciente = $4
       OR CAST(p.ci_beneficiario_paciente AS TEXT) ILIKE '%' || $1 || '%'
       OR CAST(p.ci_titular_paciente AS TEXT) ILIKE '%' || $1 || '%'
       OR p.nombre_completo_paciente ILIKE '%' || $1 || '%'
       OR p.nombre_titular_paciente ILIKE '%' || $1 || '%'
     )
       AND c.fecha_eliminacion_consulta IS NULL
     ORDER BY COALESCE(c.fecha_creacion_consulta, c.fecha_consulta) DESC`,
    [terminoLimpio, soloNumeros, conPrefijoV, conPrefijoE] 
  );
}

export const obtenerHistorialPorPaciente = obtenerHistorialPorCedula;

/**
 * Obtiene el reporte de morbilidad agrupado por diagnóstico y especialidad en un rango de fechas,
 * con soporte para filtrar por cédula o nombre/apellido del paciente.
 */
export async function obtenerReporteMorbilidad(fechaInicio?: string, fechaFin?: string, filtroPaciente?: string) {
  const db = await getDb();
  
  let query = `
    SELECT 
      UPPER(TRIM(c.diagnostico_consulta)) AS diagnostico,
      COUNT(c.id_consulta)::INTEGER AS total_casos,
      e.tipo_especialidad AS especialidad,
      COALESCE(STRING_AGG(DISTINCT p.nombre_completo_paciente, ', '), 'Sin paciente asignado') AS paciente
    FROM public."CONSULTA" c
    LEFT JOIN public."PACIENTE" p ON c.paciente_consulta = p.id_paciente
    INNER JOIN public."ESPECIALIDAD" e ON c.especialidad_consulta = e.id_especialidad
    WHERE c.fecha_eliminacion_consulta IS NULL
  `;
  const params: any[] = [];

  if (fechaInicio?.trim()) {
    params.push(fechaInicio.trim());
    query += ` AND c.fecha_consulta::DATE >= $${params.length}::DATE `;
  }

  if (fechaFin?.trim()) {
    params.push(fechaFin.trim());
    query += ` AND c.fecha_consulta::DATE <= $${params.length}::DATE `;
  }

  if (filtroPaciente?.trim()) {
    params.push(filtroPaciente.trim());
    const idx = params.length;
    query += ` AND (
      p.nombre_completo_paciente ILIKE '%' || $${idx} || '%'
      OR p.nombre_titular_paciente ILIKE '%' || $${idx} || '%'
      OR CAST(p.ci_beneficiario_paciente AS TEXT) ILIKE '%' || $${idx} || '%'
      OR CAST(p.ci_titular_paciente AS TEXT) ILIKE '%' || $${idx} || '%'
    ) `;
  }

  query += ` GROUP BY UPPER(TRIM(c.diagnostico_consulta)), e.tipo_especialidad ORDER BY total_casos DESC `;

  return await db.select(query, params);
}

/**
 * Obtiene el detalle individual de cada consulta en el rango de fechas con datos del paciente y doctor,
 * con soporte para filtrar por cédula o nombre/apellido del paciente.
 */
export async function obtenerConsultasDetalladas(fechaInicio?: string, fechaFin?: string, filtroPaciente?: string) {
  const db = await getDb();
  
  let query = `
    SELECT 
      c.id_consulta,
      TO_CHAR(COALESCE(c.fecha_creacion_consulta, c.fecha_consulta) AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD') AS fecha_consulta,
      TO_CHAR(COALESCE(c.fecha_creacion_consulta, c.fecha_consulta) AT TIME ZONE 'America/Caracas', 'HH12:MI AM') AS hora_consulta,
      UPPER(TRIM(c.diagnostico_consulta)) AS diagnostico,
      COALESCE(p.nombre_completo_paciente, 'Sin registrar') AS paciente,
      COALESCE(p.ci_beneficiario_paciente, p.ci_titular_paciente, 'S/C') AS cedula,
      e.tipo_especialidad AS especialidad,
      COALESCE(d.nombre_doctor || ' ' || d.apellido_doctor, 'No asignado') AS doctor
    FROM public."CONSULTA" c
    LEFT JOIN public."PACIENTE" p ON c.paciente_consulta = p.id_paciente
    INNER JOIN public."ESPECIALIDAD" e ON c.especialidad_consulta = e.id_especialidad
    LEFT JOIN public."DOCTOR" d ON c.doctor_consulta = d.id_doctor
    WHERE c.fecha_eliminacion_consulta IS NULL
  `;
  const params: any[] = [];

  if (fechaInicio?.trim()) {
    params.push(fechaInicio.trim());
    query += ` AND c.fecha_consulta::DATE >= $${params.length}::DATE `;
  }

  if (fechaFin?.trim()) {
    params.push(fechaFin.trim());
    query += ` AND c.fecha_consulta::DATE <= $${params.length}::DATE `;
  }

  if (filtroPaciente?.trim()) {
    params.push(filtroPaciente.trim());
    const idx = params.length;
    query += ` AND (
      p.nombre_completo_paciente ILIKE '%' || $${idx} || '%'
      OR p.nombre_titular_paciente ILIKE '%' || $${idx} || '%'
      OR CAST(p.ci_beneficiario_paciente AS TEXT) ILIKE '%' || $${idx} || '%'
      OR CAST(p.ci_titular_paciente AS TEXT) ILIKE '%' || $${idx} || '%'
    ) `;
  }

  query += ` ORDER BY COALESCE(c.fecha_creacion_consulta, c.fecha_consulta) DESC, c.id_consulta DESC `;

  return await db.select(query, params);
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

export async function obtenerDoctoresPorEspecialidad(idEspecialidad?: number | string) {
  const db = await getDb();
  if (idEspecialidad) {
    return await db.select(
      `SELECT DISTINCT d.id_doctor, d.nombre_doctor || ' ' || d.apellido_doctor AS nombre_completo 
       FROM public."DOCTOR" d
       JOIN public."DOCTOR_ESPECIALIDAD" de ON d.id_doctor = de.id_doctor
       WHERE de.id_especialidad::text = $1::text AND d.fecha_eliminacion_doctor IS NULL 
       ORDER BY nombre_completo ASC`,
      [String(idEspecialidad)]
    );
  }
  return await db.select(
    `SELECT d.id_doctor, d.nombre_doctor || ' ' || d.apellido_doctor AS nombre_completo 
     FROM public."DOCTOR" d
     WHERE d.fecha_eliminacion_doctor IS NULL 
     ORDER BY nombre_completo ASC`
  );
}
