export interface Paciente{
    id_paciente:number;
    nombre_completo_paciente:string;
    nombre_titular_paciente:string;
    ci_titular_paciente:string | null;
    ci_beneficiario_paciente:string | null;
    fecha_nacimiento_paciente:string;
    sexo_paciente:string;
    tipo_personal_paciente:string;
    categoria_trabajador_paciente:string;
    parentesco_paciente:string | null;
    fecha_creacion_paciente:string;
    fecha_actualización_paciente:string | null;
    fecha_eliminacion_paciente:string | null;
}

// Tipo para el formulario de registro de paciente
export type CrearPacienteInput = Omit<
  Paciente,
  'id_paciente' | 'fecha_creacion_paciente' | 'fecha_actualizacion_paciente' | 'fecha_eliminacion_paciente'
>;

// Tipo para actualizar (todos los campos opcionales por si solo se edita uno)
export type ActualizarPacienteInput = Partial<CrearPacienteInput>;