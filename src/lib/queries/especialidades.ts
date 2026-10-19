import { getDb } from '$lib/database';
import type { Especialidad, CrearEspecialidadInput } from '$lib/types/especialidad';

export async function obtenerEspecialidades(): Promise<Especialidad[]> {
  const db = await getDb();
  return await db.select<Especialidad[]>(
    `SELECT * FROM public."ESPECIALIDAD" 
     WHERE fecha_eliminacion_especialidad IS NULL 
     ORDER BY tipo_especialidad ASC`
  );
}

export async function crearEspecialidad(datos: CrearEspecialidadInput): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO public."ESPECIALIDAD" (tipo_especialidad) 
     VALUES ($1)`,
    [datos.tipo_especialidad]
  );
}