import { getDb } from '$lib/database';
import type { Suspension, CrearSuspensionInput } from '$lib/types/suspension';

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

export async function obtenerSuspensionesActivas() {
  const db = await getDb();
  return await db.select(
    `SELECT 
      s.id_suspension,
      s.fecha_inicio_suspension,
      s.fecha_final_suspension,
      d.nombre_doctor || ' ' || d.apellido_doctor AS doctor,
      e.tipo_especialidad
     FROM public."SUSPENSION" s
     INNER JOIN public."DOCTOR" d ON s.doctor_suspension = d.id_doctor
     INNER JOIN public."ESPECIALIDAD" e ON s.especialidad_suspension = e.id_especialidad
     WHERE s.fecha_eliminacion_suspension IS NULL
       AND CURRENT_DATE BETWEEN s.fecha_inicio_suspension AND s.fecha_final_suspension`
  );
}



export interface AlertaMorbilidadPaciente {
  ci_beneficiario_paciente: string;
  nombre_completo_paciente: string;
  tipo_especialidad: string;
  total_dias_suspendido: number;
}

export async function obtenerAlertasMorbilidad(
  limiteDias: number = 15,
  intervaloTexto: string = '30 days'
): Promise<AlertaMorbilidadPaciente[]> {
  const db = await getDb();

  // Consulta analítica PostgreSQL ajustada exactamente al DER
  const query = `
    SELECT 
        p.ci_beneficiario_paciente,
        p.nombre_completo_paciente,
        e.tipo_especialidad,
        -- Cálculo de la diferencia de días entre la fecha final e inicio de la suspensión
        SUM(s.fecha_final_suspension - s.fecha_inicio_suspension) AS total_dias_suspendido
    FROM public."SUSPENSION" s
    INNER JOIN public."CONSULTA" c 
        ON s.consulta_suspension = c.id_consulta
    INNER JOIN public."PACIENTE" p 
        ON c.paciente_consulta = p.id_paciente
    INNER JOIN public."ESPECIALIDAD" e 
        ON s.especialidad_suspension = e.id_especialidad
    WHERE 
        s.fecha_inicio_suspension >= NOW() - CAST($1 AS INTERVAL)
        -- Excluir registros eliminados por Soft Delete
        AND s.fecha_eliminacion_suspension IS NULL
        AND c.fecha_eliminacion_consulta IS NULL
        AND p.fecha_eliminacion_paciente IS NULL
    GROUP BY 
        p.ci_beneficiario_paciente, 
        p.nombre_completo_paciente, 
        e.tipo_especialidad
    HAVING 
        SUM(s.fecha_final_suspension - s.fecha_inicio_suspension) > $2
    ORDER BY 
        total_dias_suspendido DESC;
  `;

  return await db.select<AlertaMorbilidadPaciente[]>(query, [intervaloTexto, limiteDias]);
}