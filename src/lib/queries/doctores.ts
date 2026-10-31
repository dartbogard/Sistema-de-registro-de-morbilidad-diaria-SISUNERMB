import { getDb } from '$lib/database';
import type { Doctor, CrearDoctorInput } from '$lib/types/doctor';
import { registrarAuditoria } from './auditoria';

export interface DoctorDetallado {
  id_doctor: string;
  nombre_doctor: string;
  apellido_doctor: string;
  nombre_completo: string;
  ci_doctor: string;
  ci_profesional_doctor: string;
  especialidades: string;
  especialidades_ids_str?: string;
  especialidades_ids?: string[];
  total_consultas: number;
}

/**
 * Obtiene todos los doctores en existencia con sus especialidades vinculadas y total de consultas atendidas.
 */
export async function obtenerDoctoresDetallados(): Promise<DoctorDetallado[]> {
  const db = await getDb();
  const rows = await db.select<DoctorDetallado[]>(
    `SELECT 
       d.id_doctor,
       d.nombre_doctor,
       d.apellido_doctor,
       d.nombre_doctor || ' ' || d.apellido_doctor AS nombre_completo,
       COALESCE(d.ci_doctor, 'S/C') AS ci_doctor,
       COALESCE(d.ci_profesional_doctor, 'S/N') AS ci_profesional_doctor,
       COALESCE(STRING_AGG(DISTINCT e.tipo_especialidad, ', '), 'General / Sin vincular') AS especialidades,
       COALESCE(STRING_AGG(DISTINCT de.id_especialidad::text, ','), '') AS especialidades_ids_str,
       COUNT(DISTINCT c.id_consulta)::int AS total_consultas
     FROM public."DOCTOR" d
     LEFT JOIN public."DOCTOR_ESPECIALIDAD" de ON d.id_doctor = de.id_doctor
     LEFT JOIN public."ESPECIALIDAD" e ON de.id_especialidad = e.id_especialidad AND e.fecha_eliminacion_especialidad IS NULL
     LEFT JOIN public."CONSULTA" c ON d.id_doctor = c.doctor_consulta AND c.fecha_eliminacion_consulta IS NULL
     WHERE d.fecha_eliminacion_doctor IS NULL
     GROUP BY d.id_doctor, d.nombre_doctor, d.apellido_doctor, d.ci_doctor, d.ci_profesional_doctor
     ORDER BY d.apellido_doctor ASC, d.nombre_doctor ASC`
  );

  return rows.map(r => ({
    ...r,
    especialidades_ids: r.especialidades_ids_str 
      ? r.especialidades_ids_str.split(',').filter(Boolean)
      : []
  }));
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
 * Crea un nuevo doctor asignando una o varias especialidades y registrando en la auditoría.
 */
export async function crearDoctorConEspecialidades(
  datos: CrearDoctorInput,
  especialidadesIds: string[],
  usuarioResponsable: string = 'Administrador',
  nombresEspecialidades: string = ''
): Promise<void> {
  const db = await getDb();
  const nuevoIdDoctor = crypto.randomUUID();

  // 1. Insertar el doctor
  await db.execute(
    `INSERT INTO public."DOCTOR" (
      id_doctor,
      nombre_doctor, 
      apellido_doctor, 
      ci_profesional_doctor, 
      ci_doctor
    ) VALUES ($1::uuid, $2, $3, $4, $5)`,
    [
      nuevoIdDoctor,
      datos.nombre_doctor.trim(),
      datos.apellido_doctor.trim(),
      datos.ci_profesional_doctor.trim(),
      datos.ci_doctor.trim()
    ]
  );

  // 2. Vincular con sus especialidades médicas en DOCTOR_ESPECIALIDAD
  for (const idEspecialidad of especialidadesIds) {
    if (idEspecialidad && idEspecialidad.trim()) {
      await db.execute(
        `INSERT INTO public."DOCTOR_ESPECIALIDAD" (id_doctor, id_especialidad)
         VALUES ($1::uuid, $2::uuid)
         ON CONFLICT DO NOTHING`,
        [nuevoIdDoctor, idEspecialidad.trim()]
      );
    }
  }

  // 3. Registrar acción en el historial de auditoría
  const detalle = `Registró al especialista médico Dr(a). ${datos.nombre_doctor.trim()} ${datos.apellido_doctor.trim()} (C.I. ${datos.ci_doctor.trim()}, MPPS: ${datos.ci_profesional_doctor.trim()}). Especialidad(es): ${nombresEspecialidades || 'Ninguna asignada'}.`;
  await registrarAuditoria(usuarioResponsable, 'AGREGÓ', 'DOCTOR', detalle);
}

/**
 * Modifica los datos de un doctor existente y actualiza sus especialidades.
 */
export async function editarDoctor(
  idDoctor: string,
  datos: CrearDoctorInput,
  especialidadesIds: string[],
  usuarioResponsable: string = 'Administrador',
  nombresEspecialidades: string = ''
): Promise<void> {
  const db = await getDb();

  // 1. Actualizar datos del doctor
  await db.execute(
    `UPDATE public."DOCTOR" 
     SET nombre_doctor = $1, 
         apellido_doctor = $2, 
         ci_profesional_doctor = $3, 
         ci_doctor = $4,
         fecha_actualizacion_doctor = (NOW() AT TIME ZONE 'America/Caracas')
     WHERE id_doctor = $5::uuid`,
    [
      datos.nombre_doctor.trim(),
      datos.apellido_doctor.trim(),
      datos.ci_profesional_doctor.trim(),
      datos.ci_doctor.trim(),
      idDoctor
    ]
  );

  // 2. Reemplazar vinculaciones de especialidad
  await db.execute(
    `DELETE FROM public."DOCTOR_ESPECIALIDAD" WHERE id_doctor = $1::uuid`,
    [idDoctor]
  );

  for (const idEspecialidad of especialidadesIds) {
    if (idEspecialidad && idEspecialidad.trim()) {
      await db.execute(
        `INSERT INTO public."DOCTOR_ESPECIALIDAD" (id_doctor, id_especialidad)
         VALUES ($1::uuid, $2::uuid)
         ON CONFLICT DO NOTHING`,
        [idDoctor, idEspecialidad.trim()]
      );
    }
  }

  // 3. Registrar auditoría
  const detalle = `Modificó los datos del Dr(a). ${datos.nombre_doctor.trim()} ${datos.apellido_doctor.trim()} (C.I. ${datos.ci_doctor.trim()}, MPPS: ${datos.ci_profesional_doctor.trim()}). Nuevas especialidades: ${nombresEspecialidades || 'Sin especialidades'}.`;
  await registrarAuditoria(usuarioResponsable, 'EDITÓ', 'DOCTOR', detalle);
}

/**
 * Realiza un borrado lógico (ocultamiento) de un doctor en el sistema sin eliminar registros históricos.
 */
export async function eliminarDoctor(
  idDoctor: string,
  nombreCompleto: string,
  ciDoctor: string,
  usuarioResponsable: string = 'Administrador'
): Promise<void> {
  const db = await getDb();

  await db.execute(
    `UPDATE public."DOCTOR" 
     SET fecha_eliminacion_doctor = (NOW() AT TIME ZONE 'America/Caracas')
     WHERE id_doctor = $1::uuid`,
    [idDoctor]
  );

  const detalle = `Dio de baja (ocultamiento lógico) al Dr(a). ${nombreCompleto} (C.I. ${ciDoctor}). Sus registros médicos y consultas previas permanecen preservados.`;
  await registrarAuditoria(usuarioResponsable, 'ELIMINÓ', 'DOCTOR', detalle);
}

/**
 * Función legacy de crear doctor simple.
 */
export async function crearDoctor(datos: CrearDoctorInput): Promise<void> {
  await crearDoctorConEspecialidades(datos, []);
}

export async function asignarEspecialidadADoctor(idDoctor: string, idEspecialidad: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO public."DOCTOR_ESPECIALIDAD" (id_doctor, id_especialidad)
     VALUES ($1::uuid, $2::uuid)
     ON CONFLICT DO NOTHING`,
    [idDoctor, idEspecialidad]
  );
}

export async function removerEspecialidadDeDoctor(idDoctor: string, idEspecialidad: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `DELETE FROM public."DOCTOR_ESPECIALIDAD" 
     WHERE id_doctor = $1::uuid AND id_especialidad = $2::uuid`,
    [idDoctor, idEspecialidad]
  );
}
