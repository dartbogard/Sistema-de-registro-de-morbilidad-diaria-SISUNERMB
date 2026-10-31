import { getDb } from '$lib/database';
import type { Usuario, CrearUsuarioInput } from '$lib/types/usuario';
import { registrarAuditoria } from './auditoria';

export interface UsuarioDetallado {
  id_usuario: string;
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

export async function crearUsuario(
  datos: CrearUsuarioInput,
  usuarioResponsable: string = 'Administrador'
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO public."USUARIO" (
      nombre_usuario,
      password_usuario,
      rol_usuario
    ) VALUES ($1, $2, $3)`,
    [
      datos.nombre_usuario.trim(),
      datos.password_usuario.trim(),
      datos.rol_usuario.trim()
    ]
  );

  await registrarAuditoria(
    usuarioResponsable,
    'AGREGÓ',
    'USUARIO',
    `Creó la cuenta de usuario "${datos.nombre_usuario.trim()}" con rol "${datos.rol_usuario.trim()}".`
  );
}

export async function editarUsuario(
  idUsuario: string,
  datos: { nombre_usuario: string; password_usuario?: string; rol_usuario: string },
  usuarioResponsable: string = 'Administrador'
): Promise<void> {
  const db = await getDb();

  if (datos.password_usuario && datos.password_usuario.trim()) {
    await db.execute(
      `UPDATE public."USUARIO"
       SET nombre_usuario = $1,
           password_usuario = $2,
           rol_usuario = $3,
           fecha_actualizacion_usuario = (NOW() AT TIME ZONE 'America/Caracas')
       WHERE id_usuario = $4::uuid`,
      [datos.nombre_usuario.trim(), datos.password_usuario.trim(), datos.rol_usuario.trim(), idUsuario]
    );
  } else {
    await db.execute(
      `UPDATE public."USUARIO"
       SET nombre_usuario = $1,
           rol_usuario = $2,
           fecha_actualizacion_usuario = (NOW() AT TIME ZONE 'America/Caracas')
       WHERE id_usuario = $3::uuid`,
      [datos.nombre_usuario.trim(), datos.rol_usuario.trim(), idUsuario]
    );
  }

  await registrarAuditoria(
    usuarioResponsable,
    'EDITÓ',
    'USUARIO',
    `Modificó la cuenta del usuario "${datos.nombre_usuario.trim()}" (Rol: ${datos.rol_usuario.trim()}${datos.password_usuario?.trim() ? ', actualizó contraseña' : ''}).`
  );
}

export async function eliminarUsuario(
  idUsuario: string,
  nombreUsuario: string,
  usuarioResponsable: string = 'Administrador'
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE public."USUARIO"
     SET fecha_eliminacion_usuario = (NOW() AT TIME ZONE 'America/Caracas')
     WHERE id_usuario = $1::uuid`,
    [idUsuario]
  );

  await registrarAuditoria(
    usuarioResponsable,
    'ELIMINÓ',
    'USUARIO',
    `Desactivó (ocultamiento lógico) la cuenta del usuario "${nombreUsuario}".`
  );
}
