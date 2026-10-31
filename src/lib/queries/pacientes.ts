import { getDb } from '../database';
import type { Paciente, CrearPacienteInput } from '$lib/types/paciente'; 
import { registrarAuditoria } from './auditoria';

/**
 * Crea un nuevo paciente institucional y registra la acción en la auditoría.
 */
export async function crearPaciente(
  datos: CrearPacienteInput,
  usuarioResponsable: string = 'Administrador'
): Promise<void> {
  const db = await getDb();

  const fechaNacimiento = datos.fecha_nacimiento_paciente?.trim() || null;

  await db.execute(
    `INSERT INTO public."PACIENTE" (
      nombre_completo_paciente,
      nombre_titular_paciente,
      ci_titular_paciente,
      ci_beneficiario_paciente,
      fecha_nacimiento_paciente,
      sexo_paciente,
      tipo_personal_paciente,
      categoria_trabajador_paciente,
      parentesco_paciente
    ) VALUES ($1, $2, $3, $4, $5::DATE, $6, $7, $8, $9)`,
    [
      datos.nombre_completo_paciente.trim(),
      datos.nombre_titular_paciente.trim(),
      datos.ci_titular_paciente?.trim() || null,
      datos.ci_beneficiario_paciente?.trim() || null,
      fechaNacimiento,
      datos.sexo_paciente,
      datos.tipo_personal_paciente,
      datos.categoria_trabajador_paciente,
      datos.parentesco_paciente
    ]
  );

  const ciDoc = datos.ci_beneficiario_paciente 
    ? `${datos.ci_beneficiario_paciente} (Titular: ${datos.ci_titular_paciente})`
    : datos.ci_titular_paciente || 'S/C';

  await registrarAuditoria(
    usuarioResponsable,
    'AGREGÓ',
    'PACIENTE',
    `Registró al paciente institucional: ${datos.nombre_completo_paciente} (C.I. ${ciDoc}, ${datos.tipo_personal_paciente} - ${datos.categoria_trabajador_paciente}).`
  );
}

/**
 * Modifica los datos de un paciente existente y registra en la auditoría.
 */
export async function editarPaciente(
  idPaciente: string | number,
  datos: CrearPacienteInput,
  usuarioResponsable: string = 'Administrador'
): Promise<void> {
  const db = await getDb();

  const fechaNacimiento = datos.fecha_nacimiento_paciente?.trim() || null;

  await db.execute(
    `UPDATE public."PACIENTE"
     SET nombre_completo_paciente = $1,
         nombre_titular_paciente = $2,
         ci_titular_paciente = $3,
         ci_beneficiario_paciente = $4,
         fecha_nacimiento_paciente = $5::DATE,
         sexo_paciente = $6,
         tipo_personal_paciente = $7,
         categoria_trabajador_paciente = $8,
         parentesco_paciente = $9,
         fecha_actualizacion_paciente = (NOW() AT TIME ZONE 'America/Caracas')
     WHERE id_paciente = $10::uuid`,
    [
      datos.nombre_completo_paciente.trim(),
      datos.nombre_titular_paciente.trim(),
      datos.ci_titular_paciente?.trim() || null,
      datos.ci_beneficiario_paciente?.trim() || null,
      fechaNacimiento,
      datos.sexo_paciente,
      datos.tipo_personal_paciente,
      datos.categoria_trabajador_paciente,
      datos.parentesco_paciente,
      String(idPaciente)
    ]
  );

  const ciDoc = datos.ci_beneficiario_paciente 
    ? `${datos.ci_beneficiario_paciente} (Titular: ${datos.ci_titular_paciente})`
    : datos.ci_titular_paciente || 'S/C';

  await registrarAuditoria(
    usuarioResponsable,
    'EDITÓ',
    'PACIENTE',
    `Modificó los datos del paciente: ${datos.nombre_completo_paciente} (C.I. ${ciDoc}, ${datos.tipo_personal_paciente} - ${datos.categoria_trabajador_paciente}).`
  );
}

/**
 * Realiza un borrado lógico (ocultamiento) de un paciente.
 */
export async function eliminarPaciente(
  idPaciente: string | number,
  nombrePaciente: string,
  ciPaciente: string,
  usuarioResponsable: string = 'Administrador'
): Promise<void> {
  const db = await getDb();

  await db.execute(
    `UPDATE public."PACIENTE"
     SET fecha_eliminacion_paciente = (NOW() AT TIME ZONE 'America/Caracas')
     WHERE id_paciente = $1::uuid`,
    [String(idPaciente)]
  );

  await registrarAuditoria(
    usuarioResponsable,
    'ELIMINÓ',
    'PACIENTE',
    `Dio de baja (ocultamiento lógico) al paciente: ${nombrePaciente} (C.I. ${ciPaciente || 'S/C'}). Sus consultas e historial médico se preservan en el sistema.`
  );
}

/**
 * Obtiene una lista de pacientes recientes bajo demanda.
 */
export async function obtenerPacientesRecientes(limite = 30): Promise<Paciente[]> {
  const db = await getDb();
  return await db.select<Paciente[]>(
    `SELECT 
       id_paciente,
       nombre_completo_paciente,
       nombre_titular_paciente,
       ci_titular_paciente,
       ci_beneficiario_paciente,
       TO_CHAR(fecha_nacimiento_paciente, 'YYYY-MM-DD') as fecha_nacimiento_paciente,
       sexo_paciente,
       tipo_personal_paciente,
       categoria_trabajador_paciente,
       parentesco_paciente,
       fecha_creacion_paciente,
       fecha_actualizacion_paciente,
       fecha_eliminacion_paciente
     FROM public."PACIENTE"
     WHERE fecha_eliminacion_paciente IS NULL
     ORDER BY fecha_creacion_paciente DESC
     LIMIT $1`,
    [limite]
  );
}

/**
 * Busca pacientes por número de cédula (titular o beneficiario) o nombre/apellido.
 */
export async function buscarPacientePorCedula(termino: string): Promise<Paciente[]> {
  const db = await getDb();
  
  const textoLimpio = termino.trim();
  if (!textoLimpio) return [];

  const soloNumeros = textoLimpio.replace(/^[VvEeJjGg]-?/, '').trim();
  const conPrefijoV = 'V-' + soloNumeros;
  const conPrefijoE = 'E-' + soloNumeros;

  return await db.select<Paciente[]>(
    `SELECT 
       id_paciente,
       nombre_completo_paciente,
       nombre_titular_paciente,
       ci_titular_paciente,
       ci_beneficiario_paciente,
       TO_CHAR(fecha_nacimiento_paciente, 'YYYY-MM-DD') as fecha_nacimiento_paciente,
       sexo_paciente,
       tipo_personal_paciente,
       categoria_trabajador_paciente,
       parentesco_paciente,
       fecha_creacion_paciente,
       fecha_actualizacion_paciente,
       fecha_eliminacion_paciente
     FROM public."PACIENTE"
     WHERE (
       ci_titular_paciente = $1 OR ci_beneficiario_paciente = $1
       OR ci_titular_paciente = $2 OR ci_beneficiario_paciente = $2
       OR ci_titular_paciente = $3 OR ci_beneficiario_paciente = $3
       OR ci_titular_paciente = $4 OR ci_beneficiario_paciente = $4
       OR CAST(ci_beneficiario_paciente AS TEXT) ILIKE '%' || $1 || '%'
       OR CAST(ci_titular_paciente AS TEXT) ILIKE '%' || $1 || '%'
       OR nombre_completo_paciente ILIKE '%' || $1 || '%'
       OR nombre_titular_paciente ILIKE '%' || $1 || '%'
     )
     AND fecha_eliminacion_paciente IS NULL
     ORDER BY nombre_completo_paciente ASC`,
    [textoLimpio, soloNumeros, conPrefijoV, conPrefijoE]
  );
}

export const buscarPaciente = buscarPacientePorCedula;
