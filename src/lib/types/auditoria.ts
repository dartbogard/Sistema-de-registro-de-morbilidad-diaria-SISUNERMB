export interface RegistroAuditoria {
  id_auditoria: string;
  usuario_auditoria: string;
  accion_auditoria: 'AGREGÓ' | 'EDITÓ' | 'ELIMINÓ';
  entidad_auditoria: 'DOCTOR' | 'PACIENTE' | 'USUARIO' | 'ESPECIALIDAD' | 'CONSULTA';
  detalle_auditoria: string;
  fecha_auditoria: string;
  fecha_formateada?: string;
}

