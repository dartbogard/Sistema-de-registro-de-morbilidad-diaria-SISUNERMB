export interface Especialidad {
  id_especialidad: string | number;
  tipo_especialidad: string;
  fecha_creacion_especialidad: string;
  fecha_actualizacion_especialidad?: string | null;
  fecha_eliminacion_especialidad?: string | null;
}

export type CrearEspecialidadInput = Omit<
  Especialidad,
  | 'id_especialidad' 
  | 'fecha_creacion_especialidad' 
  | 'fecha_actualizacion_especialidad' 
  | 'fecha_eliminacion_especialidad'
>;
