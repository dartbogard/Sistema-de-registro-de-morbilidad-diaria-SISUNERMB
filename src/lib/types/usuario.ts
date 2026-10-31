export interface Usuario {
  id_usuario: string;
  nombre_usuario: string;
  password_usuario: string;
  rol_usuario: string;
  fecha_creacion_usuario: string;
  fecha_actualizacion_usuario?: string | null;
  fecha_eliminacion_usuario?: string | null;
}

export type CrearUsuarioInput = Omit<
  Usuario,
  | 'id_usuario' 
  | 'fecha_creacion_usuario' 
  | 'fecha_actualizacion_usuario' 
  | 'fecha_eliminacion_usuario'
>;
