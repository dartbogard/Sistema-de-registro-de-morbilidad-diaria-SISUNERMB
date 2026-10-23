export interface Consulta{
    id_consulta: number;
    especialidad_consulta: string;
    usuario_consulta: number;
    paciente_consulta: number; // Relación numérica real en la tabla
    doctor_consulta: number;
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
  | 'paciente_consulta' // Se omite el ID numérico porque el formulario enviará la cédula
  | 'fecha_creacion_consulta' 
  | 'fecha_actualizacion_consulta' 
  | 'fecha_eliminacion_consulta'
> & {
  ci_beneficiario_paciente: string; // Se añade la cédula que seleccionas en la interfaz
};