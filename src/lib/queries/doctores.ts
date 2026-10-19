import { getDb } from '$lib/database';
import type { Doctor, CrearDoctorInput } from '$lib/types/doctor';

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