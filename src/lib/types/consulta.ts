export interface Consulta {
  id_consulta: number | string;
  especialidad_consulta: string;
  usuario_consulta: number | string;
  paciente_consulta: number | string;
  doctor_consulta: number | string;
  fecha_consulta: string;
  diagnostico_consulta: string;
  fecha_creacion_consulta: string;
  fecha_actualizacion_consulta: string | null;
  fecha_eliminacion_consulta: string | null;
}

// Tipo para registrar una nueva consulta desde el formulario
export type CrearConsultaInput = Omit<
  Consulta,
  | 'id_consulta' 
  | 'paciente_consulta'
  | 'fecha_creacion_consulta' 
  | 'fecha_actualizacion_consulta' 
  | 'fecha_eliminacion_consulta'
> & {
  ci_beneficiario_paciente: string;
};

// Tipo para visualización completa de consultas en el directorio administrativo
export interface ConsultaDetalladaAdmin {
  id_consulta: string;
  fecha_consulta: string;
  fecha_consulta_raw?: string;
  fecha_formateada?: string;
  hora_formateada?: string;
  diagnostico_consulta: string;
  id_paciente: string;
  nombre_completo_paciente: string;
  ci_titular_paciente: string;
  ci_beneficiario_paciente: string | null;
  cedula_paciente: string;
  parentesco_paciente: string | null;
  id_doctor: string;
  nombre_doctor: string;
  id_especialidad: string;
  tipo_especialidad: string;
  id_suspension?: string | null;
  tiene_reposo?: boolean;
  fecha_inicio_suspension?: string | null;
  fecha_final_suspension?: string | null;
}

// Tipo para edición administrativa de una consulta
export interface EditarConsultaAdminInput {
  diagnostico_consulta: string;
  fecha_consulta: string;
  doctor_consulta: string;
  especialidad_consulta: string;
  tiene_reposo?: boolean;
  fecha_inicio_suspension?: string;
  fecha_final_suspension?: string;
}
