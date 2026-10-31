import { getDb } from '$lib/database';
import type { Doctor, CrearDoctorInput } from '$lib/types/doctor';

export interface DoctorDetallado {
  id_doctor: string;
  nombre_doctor: string;
  apellido_doctor: string;
  nombre_completo: string;
  ci_doctor: string;
  ci_profesional_doctor: string;
  especialidades: string;
  total_consultas: number;
}

/**
 * Obtiene todos los doctores en existencia con sus especialidades vinculadas y total de consultas atendidas.
 */
export async function obtenerDoctoresDetallados(): Promise<DoctorDetallado[]> {
  const db = await getDb();
  return await db.select<DoctorDetallado[]>(
    `SELECT 
       d.id_doctor,
       d.nombre_doctor,
       d.apellido_doctor,
       d.nombre_doctor || ' ' || d.apellido_doctor AS nombre_completo,
       COALESCE(d.ci_doctor, 'S/C') AS ci_doctor,
       COALESCE(d.ci_profesional_doctor, 'S/N') AS ci_profesional_doctor,
       COALESCE(STRING_AGG(DISTINCT e.tipo_especialidad, ', '), 'General / Sin vincular') AS especialidades,
       COUNT(DISTINCT c.id_consulta)::int AS total_consultas
     FROM public."DOCTOR" d
     LEFT JOIN public."DOCTOR_ESPECIALIDAD" de ON d.id_doctor = de.id_doctor
     LEFT JOIN public."ESPECIALIDAD" e ON de.id_especialidad = e.id_especialidad AND e.fecha_eliminacion_especialidad IS NULL
     LEFT JOIN public."CONSULTA" c ON d.id_doctor = c.doctor_consulta AND c.fecha_eliminacion_consulta IS NULL
     WHERE d.fecha_eliminacion_doctor IS NULL
     GROUP BY d.id_doctor, d.nombre_doctor, d.apellido_doctor, d.ci_doctor, d.ci_profesional_doctor
     ORDER BY d.apellido_doctor ASC, d.nombre_doctor ASC`
  );
}

/**
 * Obtiene todos los doctores activos.
 */
export async function obtenerDoctores(): Promise<Doctor[]> {
  const db = await getDb();
  return await db.select<Doctor[]>(
    `SELECT * FROM public."DOCTOR" 
     WHERE fecha_eliminacion_doctor IS NULL 
     ORDER BY apellido_doctor, nombre_doctor`
  );
}

/**
 * Crea un nuevo doctor.
 */
export async function crearDoctor(datos: CrearDoctorInput): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO public."DOCTOR" (
      nombre_doctor, 
      apellido_doctor, 
      ci_profesional_doctor, 
      ci_doctor
    ) VALUES ($1, $2, $3, $4)`,
    [
      datos.nombre_doctor,
      datos.apellido_doctor,
      datos.ci_profesional_doctor,
      datos.ci_doctor
    ]
  );
}

/**
 * Vincula un doctor con una especialidad en la tabla intermedia DOCTOR_ESPECIALIDAD.
 */
export async function asignarEspecialidadADoctor(
  idDoctor: string, 
  idEspecialidad: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO public."DOCTOR_ESPECIALIDAD" (id_doctor, id_especialidad)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [idDoctor, idEspecialidad]
  );
}

/**
 * Elimina la vinculación entre un doctor y una especialidad.
 */
export async function removerEspecialidadDeDoctor(
  idDoctor: string, 
  idEspecialidad: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `DELETE FROM public."DOCTOR_ESPECIALIDAD" 
     WHERE id_doctor = $1 AND id_especialidad = $2`,
    [idDoctor, idEspecialidad]
  );
}
