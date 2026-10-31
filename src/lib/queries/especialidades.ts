import { getDb } from '$lib/database';
import type { Especialidad, CrearEspecialidadInput } from '$lib/types/especialidad';
import { registrarAuditoria } from './auditoria';

export interface EspecialidadDetallada {
  id_especialidad: number | string;
  tipo_especialidad: string;
  total_doctores: number;
  total_consultas: number;
}

/**
 * Obtiene todas las especialidades activas con conteo de doctores asociados y consultas realizadas.
 */
export async function obtenerEspecialidadesDetalladas(): Promise<EspecialidadDetallada[]> {
  const db = await getDb();
  return await db.select<EspecialidadDetallada[]>(
    `SELECT 
       e.id_especialidad,
       e.tipo_especialidad,
       COUNT(DISTINCT de.id_doctor)::int AS total_doctores,
       COUNT(DISTINCT c.id_consulta)::int AS total_consultas
     FROM public."ESPECIALIDAD" e
     LEFT JOIN public."DOCTOR_ESPECIALIDAD" de ON e.id_especialidad = de.id_especialidad
     LEFT JOIN public."CONSULTA" c ON e.id_especialidad = c.especialidad_consulta AND c.fecha_eliminacion_consulta IS NULL
     WHERE e.fecha_eliminacion_especialidad IS NULL
     GROUP BY e.id_especialidad, e.tipo_especialidad
     ORDER BY e.tipo_especialidad ASC`
  );
}

export async function obtenerEspecialidades(): Promise<Especialidad[]> {
  const db = await getDb();
  return await db.select<Especialidad[]>(
    `SELECT * FROM public."ESPECIALIDAD" 
     WHERE fecha_eliminacion_especialidad IS NULL 
     ORDER BY tipo_especialidad ASC`
  );
}

export async function crearEspecialidad(
  datos: CrearEspecialidadInput,
  usuarioResponsable: string = 'Administrador'
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO public."ESPECIALIDAD" (tipo_especialidad) 
     VALUES ($1)`,
    [datos.tipo_especialidad.trim()]
  );

  await registrarAuditoria(
    usuarioResponsable,
    'AGREGÓ',
    'ESPECIALIDAD',
    `Registró la nueva área o especialidad médica: ${datos.tipo_especialidad.trim()}.`
  );
}

export async function editarEspecialidad(
  idEspecialidad: string | number,
  nuevoNombre: string,
  usuarioResponsable: string = 'Administrador'
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE public."ESPECIALIDAD"
     SET tipo_especialidad = $1,
         fecha_actualizacion_especialidad = (NOW() AT TIME ZONE 'America/Caracas')
     WHERE id_especialidad = $2::uuid`,
    [nuevoNombre.trim(), String(idEspecialidad)]
  );

  await registrarAuditoria(
    usuarioResponsable,
    'EDITÓ',
    'ESPECIALIDAD',
    `Modificó el nombre de la especialidad clínica a: ${nuevoNombre.trim()}.`
  );
}

export async function eliminarEspecialidad(
  idEspecialidad: string | number,
  nombreEspecialidad: string,
  usuarioResponsable: string = 'Administrador'
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE public."ESPECIALIDAD"
     SET fecha_eliminacion_especialidad = (NOW() AT TIME ZONE 'America/Caracas')
     WHERE id_especialidad = $1::uuid`,
    [String(idEspecialidad)]
  );

  await registrarAuditoria(
    usuarioResponsable,
    'ELIMINÓ',
    'ESPECIALIDAD',
    `Dio de baja (ocultamiento lógico) a la especialidad médica: ${nombreEspecialidad}.`
  );
}
