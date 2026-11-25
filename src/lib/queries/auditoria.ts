import { getDb } from '$lib/database';
import type { RegistroAuditoria } from '$lib/types/auditoria';

/**
 * Asegura que la tabla HISTORIAL_AUDITORIA exista en la base de datos PostgreSQL.
 */
export async function asegurarTablaAuditoria(): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS public."HISTORIAL_AUDITORIA" (
        id_auditoria UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        usuario_auditoria TEXT NOT NULL,
        accion_auditoria TEXT NOT NULL,
        entidad_auditoria TEXT NOT NULL,
        detalle_auditoria TEXT NOT NULL,
        fecha_auditoria TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Caracas') NOT NULL
      );
    `);
  } catch (err) {
    console.error('Error al asegurar tabla HISTORIAL_AUDITORIA:', err);
  }
}

/**
 * Registra una acción de auditoría en la base de datos (alta, modificación o borrado lógico).
 */
export async function registrarAuditoria(
  usuario: string,
  accion: 'AGREGÓ' | 'EDITÓ' | 'ELIMINÓ',
  entidad: 'DOCTOR' | 'PACIENTE' | 'USUARIO' | 'ESPECIALIDAD' | 'CONSULTA',
  detalle: string
): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(
      `INSERT INTO public."HISTORIAL_AUDITORIA" (
        usuario_auditoria,
        accion_auditoria,
        entidad_auditoria,
        detalle_auditoria,
        fecha_auditoria
      ) VALUES ($1, $2, $3, $4, (NOW() AT TIME ZONE 'America/Caracas'))`,
      [usuario || 'Administrador', accion, entidad, detalle]
    );
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
  }
}

/**
 * Obtiene el historial cronológico de acciones realizadas por los usuarios.
 */
export async function obtenerHistorialAuditoria(limite = 200): Promise<RegistroAuditoria[]> {
  await asegurarTablaAuditoria();
  const db = await getDb();
  return await db.select<RegistroAuditoria[]>(
    `SELECT 
       id_auditoria,
       usuario_auditoria,
       accion_auditoria,
       entidad_auditoria,
       detalle_auditoria,
       fecha_auditoria,
       TO_CHAR(fecha_auditoria, 'DD/MM/YYYY hh:MI:SS AM') as fecha_formateada
     FROM public."HISTORIAL_AUDITORIA"
     ORDER BY fecha_auditoria DESC
     LIMIT $1`,
    [limite]
  );
}

