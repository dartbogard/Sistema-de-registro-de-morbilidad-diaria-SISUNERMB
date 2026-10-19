import { getDb } from '$lib/database';
import type { Usuario, CrearUsuarioInput } from '$lib/types/usuario';

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