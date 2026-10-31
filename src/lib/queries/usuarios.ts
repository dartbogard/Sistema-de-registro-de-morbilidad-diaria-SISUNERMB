import { getDb } from '$lib/database';
import type { Usuario, CrearUsuarioInput } from '$lib/types/usuario';

export interface UsuarioDetallado {
  id_usuario: number | string;
  nombre_usuario: string;
  rol_usuario: string;
  fecha_creacion_usuario: string;
}

/**
 * Obtiene todos los usuarios del sistema en existencia (sin exponer passwords).
 */
export async function obtenerUsuariosExistentes(): Promise<UsuarioDetallado[]> {
  const db = await getDb();
  return await db.select<UsuarioDetallado[]>(
    `SELECT 
       id_usuario,
       nombre_usuario,
       rol_usuario,
       TO_CHAR(fecha_creacion_usuario AT TIME ZONE 'America/Caracas', 'DD/MM/YYYY HH12:MI AM') as fecha_creacion_usuario
     FROM public."USUARIO"
     WHERE fecha_eliminacion_usuario IS NULL
     ORDER BY nombre_usuario ASC`
  );
}

export async function obtenerUsuarioPorNombre(nombreUsuario: string): Promise<Usuario | null> {
  const db = await getDb();
  const usuarios = await db.select<Usuario[]>(
    `SELECT * FROM public."USUARIO" 
     WHERE nombre_usuario = $1 AND fecha_eliminacion_usuario IS NULL`,
    [nombreUsuario]
  );
  return usuarios[0] || null;
}

export async function crearUsuario(datos: CrearUsuarioInput): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO public."USUARIO" (
      nombre_usuario,
      password_usuario,
      rol_usuario
    ) VALUES ($1, $2, $3)`,
    [
      datos.nombre_usuario,
      datos.password_usuario,
      datos.rol_usuario
    ]
  );
}
