import { getDb } from '$lib/database';
import type { CrearSuspensionInput } from '$lib/types/suspension';

export interface SuspensionDetallada {
  id_suspension: string | number;
  fecha_inicio_suspension: string;
  fecha_final_suspension: string;
  fecha_creacion_suspension?: string;
  doctor: string;
  tipo_especialidad: string;
  diagnostico_consulta: string;
  fecha_consulta: string;
  id_paciente: string | number;
  nombre_completo_paciente: string;
  nombre_titular_paciente: string;
  ci_titular_paciente: string | null;
  ci_beneficiario_paciente: string | null;
  cedula_paciente: string;
  tipo_personal_paciente: string;
  categoria_trabajador_paciente: string;
  parentesco_paciente: string | null;
  total_suspensiones_historicas: number;
  es_activa: boolean;
  dias_reposo: number;
}

export async function crearSuspension(datos: CrearSuspensionInput): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO public."SUSPENSION" (
      consulta_suspension,
      especialidad_suspension,
      doctor_suspension,
      fecha_inicio_suspension,
      fecha_final_suspension
    ) VALUES ($1, $2, $3, $4, $5)`,
    [
      datos.consulta_suspension,
      datos.especialidad_suspension,
      datos.doctor_suspension,
      datos.fecha_inicio_suspension,
      datos.fecha_final_suspension
    ]
  );
}

const BASE_QUERY_SUSPENSIONES = `
  SELECT 
    s.id_suspension,
    s.fecha_inicio_suspension,
    s.fecha_final_suspension,
    s.fecha_creacion_suspension,
    d.nombre_doctor || ' ' || d.apellido_doctor AS doctor,
    e.tipo_especialidad,
    COALESCE(c.diagnostico_consulta, 'Sin diagnóstico especificado') AS diagnostico_consulta,
    c.fecha_consulta,
    p.id_paciente,
    p.nombre_completo_paciente,
    p.nombre_titular_paciente,
    p.ci_titular_paciente,
    p.ci_beneficiario_paciente,
    COALESCE(NULLIF(TRIM(CAST(p.ci_beneficiario_paciente AS TEXT)), ''), CAST(p.ci_titular_paciente AS TEXT), 'S/C') AS cedula_paciente,
    COALESCE(p.tipo_personal_paciente, 'NO ESPECIFICADO') AS tipo_personal_paciente,
    COALESCE(p.categoria_trabajador_paciente, 'ACTIVO') AS categoria_trabajador_paciente,
    p.parentesco_paciente,
    (
      SELECT COUNT(*) 
      FROM public."SUSPENSION" s2
      INNER JOIN public."CONSULTA" c2 ON s2.consulta_suspension = c2.id_consulta
      WHERE c2.paciente_consulta = p.id_paciente 
        AND s2.fecha_eliminacion_suspension IS NULL
    )::int AS total_suspensiones_historicas,
    CASE 
      WHEN CURRENT_DATE BETWEEN s.fecha_inicio_suspension AND s.fecha_final_suspension THEN true 
      ELSE false 
    END AS es_activa,
    (s.fecha_final_suspension - s.fecha_inicio_suspension + 1)::int AS dias_reposo
  FROM public."SUSPENSION" s
  INNER JOIN public."DOCTOR" d ON s.doctor_suspension = d.id_doctor
  INNER JOIN public."ESPECIALIDAD" e ON s.especialidad_suspension = e.id_especialidad
  INNER JOIN public."CONSULTA" c ON s.consulta_suspension = c.id_consulta
  INNER JOIN public."PACIENTE" p ON c.paciente_consulta = p.id_paciente
  WHERE s.fecha_eliminacion_suspension IS NULL
`;

export async function obtenerTodasLasSuspensiones(filtros?: { fechaInicio?: string; fechaFin?: string }): Promise<SuspensionDetallada[]> {
  const db = await getDb();
  let query = BASE_QUERY_SUSPENSIONES;
  const params: any[] = [];

  if (filtros?.fechaInicio && filtros?.fechaFin) {
    query += ` AND s.fecha_inicio_suspension >= $1::date AND s.fecha_inicio_suspension <= $2::date `;
    params.push(filtros.fechaInicio, filtros.fechaFin);
  } else if (filtros?.fechaInicio) {
    query += ` AND s.fecha_inicio_suspension >= $1::date `;
    params.push(filtros.fechaInicio);
  } else if (filtros?.fechaFin) {
    query += ` AND s.fecha_inicio_suspension <= $1::date `;
    params.push(filtros.fechaFin);
  }

  query += ` ORDER BY s.fecha_inicio_suspension DESC, s.fecha_creacion_suspension DESC `;
  return await db.select<SuspensionDetallada[]>(query, params);
}

export async function obtenerSuspensionesActivas(): Promise<SuspensionDetallada[]> {
  const db = await getDb();
  const query = `${BASE_QUERY_SUSPENSIONES} 
    AND CURRENT_DATE BETWEEN s.fecha_inicio_suspension AND s.fecha_final_suspension 
    ORDER BY s.fecha_final_suspension ASC, p.nombre_completo_paciente ASC`;
  return await db.select<SuspensionDetallada[]>(query);
}

export async function obtenerSuspensionesPorCedula(terminoBusqueda: string): Promise<SuspensionDetallada[]> {
  const db = await getDb();
  const termino = String(terminoBusqueda || '').trim();
  if (!termino) return [];

  const soloNumeros = termino.replace(/^[VvEeJjGg]-?/, '').trim();
  const esCedula = /^[VvEeJjGg]?-?\d+$/.test(termino);

  if (esCedula && soloNumeros.length > 0) {
    const conPrefijoV = 'V-' + soloNumeros;
    const conPrefijoE = 'E-' + soloNumeros;

    const query = `${BASE_QUERY_SUSPENSIONES} 
      AND (
        TRIM(CAST(p.ci_beneficiario_paciente AS TEXT)) = TRIM($1)
        OR TRIM(CAST(p.ci_titular_paciente AS TEXT)) = TRIM($1)
        OR TRIM(CAST(p.ci_beneficiario_paciente AS TEXT)) = TRIM($2)
        OR TRIM(CAST(p.ci_titular_paciente AS TEXT)) = TRIM($2)
        OR TRIM(CAST(p.ci_beneficiario_paciente AS TEXT)) = TRIM($3)
        OR TRIM(CAST(p.ci_titular_paciente AS TEXT)) = TRIM($3)
        OR TRIM(CAST(p.ci_beneficiario_paciente AS TEXT)) = TRIM($4)
        OR TRIM(CAST(p.ci_titular_paciente AS TEXT)) = TRIM($4)
        OR CAST(p.ci_beneficiario_paciente AS TEXT) ILIKE '%' || TRIM($2) || '%'
        OR CAST(p.ci_titular_paciente AS TEXT) ILIKE '%' || TRIM($2) || '%'
      )
      ORDER BY s.fecha_inicio_suspension DESC`;
    return await db.select<SuspensionDetallada[]>(query, [termino, soloNumeros, conPrefijoV, conPrefijoE]);
  }

  // Búsqueda por palabras tolerante a nombres intermedios (ej: "omar oberto")
  const palabras = termino.split(/\s+/).filter(Boolean);
  const params: any[] = [];
  const condiciones: string[] = [];

  palabras.forEach(palabra => {
    params.push(palabra);
    const idx = params.length;
    condiciones.push(`(
      p.nombre_completo_paciente ILIKE '%' || $${idx} || '%'
      OR p.nombre_titular_paciente ILIKE '%' || $${idx} || '%'
      OR CAST(p.ci_beneficiario_paciente AS TEXT) ILIKE '%' || $${idx} || '%'
      OR CAST(p.ci_titular_paciente AS TEXT) ILIKE '%' || $${idx} || '%'
    )`);
  });

  const clausulaWhere = condiciones.length > 0 ? ` AND ` + condiciones.join(' AND ') : '';

  const query = `${BASE_QUERY_SUSPENSIONES} 
    ${clausulaWhere}
    ORDER BY s.fecha_inicio_suspension DESC`;
  return await db.select<SuspensionDetallada[]>(query, params);
}

export const obtenerSuspensionesPorPaciente = obtenerSuspensionesPorCedula;

export interface ReposoActivoInfo {
  id_suspension: string;
  fecha_inicio_suspension: string;
  fecha_final_suspension: string;
  doctor: string;
  diagnostico: string;
  dias_restantes: number;
}

/**
 * Verifica si un paciente ya cuenta con un reposo médico activo o vigente emitido por el mismo doctor.
 * Esto previene la asignación de reposos superpuestos no permitidos.
 */
export async function verificarReposoActivoConDoctor(
  cedulaPaciente: string,
  idDoctor: string | number,
  fechaInicioNueva?: string
): Promise<{
  tieneReposoActivo: boolean;
  reposoActivo?: ReposoActivoInfo;
}> {
  if (!cedulaPaciente || !idDoctor) {
    return { tieneReposoActivo: false };
  }

  const db = await getDb();
  const cedulaLimpiada = String(cedulaPaciente).trim();

  try {
    const params: any[] = [idDoctor, cedulaLimpiada];
    let condicionFecha = `
      AND (
        (CURRENT_DATE AT TIME ZONE 'America/Caracas') BETWEEN s.fecha_inicio_suspension AND s.fecha_final_suspension
        OR s.fecha_final_suspension >= (CURRENT_DATE AT TIME ZONE 'America/Caracas')
    `;

    if (fechaInicioNueva) {
      params.push(fechaInicioNueva);
      condicionFecha += ` OR (s.fecha_inicio_suspension <= $3::date AND s.fecha_final_suspension >= $3::date) `;
    }

    condicionFecha += ` ) `;

    const rows = await db.select<any[]>(
      `SELECT 
         s.id_suspension,
         TO_CHAR(s.fecha_inicio_suspension, 'YYYY-MM-DD') AS fecha_inicio_suspension,
         TO_CHAR(s.fecha_final_suspension, 'YYYY-MM-DD') AS fecha_final_suspension,
         d.nombre_doctor || ' ' || d.apellido_doctor AS doctor,
         COALESCE(c.diagnostico_consulta, 'Sin diagnóstico') AS diagnostico,
         (s.fecha_final_suspension - (CURRENT_DATE AT TIME ZONE 'America/Caracas'))::int AS dias_restantes
       FROM public."SUSPENSION" s
       INNER JOIN public."CONSULTA" c ON s.consulta_suspension = c.id_consulta
       INNER JOIN public."PACIENTE" p ON c.paciente_consulta = p.id_paciente
       INNER JOIN public."DOCTOR" d ON s.doctor_suspension = d.id_doctor
       WHERE s.fecha_eliminacion_suspension IS NULL
         AND s.doctor_suspension = $1::uuid
         AND (
           TRIM(CAST(p.ci_beneficiario_paciente AS TEXT)) = TRIM($2)
           OR TRIM(CAST(p.ci_titular_paciente AS TEXT)) = TRIM($2)
         )
         ${condicionFecha}
       ORDER BY s.fecha_final_suspension DESC
       LIMIT 1`,
      params
    );

    if (rows && rows.length > 0) {
      return {
        tieneReposoActivo: true,
        reposoActivo: rows[0]
      };
    }

    return { tieneReposoActivo: false };
  } catch (err) {
    console.error('Error al verificar reposo activo con doctor:', err);
    return { tieneReposoActivo: false };
  }
}
