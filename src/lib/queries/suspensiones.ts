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
      e.tipo_especialidad,
      p.ci_beneficiario_paciente,
      p.nombre_completo_paciente
     FROM public."SUSPENSION" s
     INNER JOIN public."DOCTOR" d ON s.doctor_suspension = d.id_doctor
     INNER JOIN public."ESPECIALIDAD" e ON s.especialidad_suspension = e.id_especialidad
     LEFT JOIN public."CONSULTA" c ON s.consulta_suspension = c.id_consulta
     LEFT JOIN public."PACIENTE" p ON c.paciente_consulta = p.id_paciente
     WHERE s.fecha_eliminacion_suspension IS NULL
       AND CURRENT_DATE BETWEEN s.fecha_inicio_suspension AND s.fecha_final_suspension`
  );
}

export async function obtenerSuspensionesPorCedula(cedula: string) {
  const db = await getDb();
  const cedulaLimpiada = String(cedula).trim();
  return await db.select(
    `SELECT 
      s.id_suspension,
      s.fecha_inicio_suspension,
      s.fecha_final_suspension,
      d.nombre_doctor || ' ' || d.apellido_doctor AS doctor,
      e.tipo_especialidad,
      p.ci_beneficiario_paciente,
      p.nombre_completo_paciente
     FROM public."SUSPENSION" s
     INNER JOIN public."DOCTOR" d ON s.doctor_suspension = d.id_doctor
     INNER JOIN public."ESPECIALIDAD" e ON s.especialidad_suspension = e.id_especialidad
     INNER JOIN public."CONSULTA" c ON s.consulta_suspension = c.id_consulta
     INNER JOIN public."PACIENTE" p ON c.paciente_consulta = p.id_paciente
     WHERE s.fecha_eliminacion_suspension IS NULL
       AND (TRIM(CAST(p.ci_beneficiario_paciente AS TEXT)) = TRIM($1) OR TRIM(CAST(p.ci_titular_paciente AS TEXT)) = TRIM($1))`,
    [cedulaLimpiada]
  );
}