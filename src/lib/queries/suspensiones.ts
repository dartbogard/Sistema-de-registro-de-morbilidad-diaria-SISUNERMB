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

export async function obtenerSuspensionesPorCedula(cedula: string): Promise<SuspensionDetallada[]> {
  const db = await getDb();
  const cedulaLimpiada = String(cedula).trim();
  const query = `${BASE_QUERY_SUSPENSIONES} 
    AND (TRIM(CAST(p.ci_beneficiario_paciente AS TEXT)) = TRIM($1) OR TRIM(CAST(p.ci_titular_paciente AS TEXT)) = TRIM($1))
    ORDER BY s.fecha_inicio_suspension DESC`;
  return await db.select<SuspensionDetallada[]>(query, [cedulaLimpiada]);
}
