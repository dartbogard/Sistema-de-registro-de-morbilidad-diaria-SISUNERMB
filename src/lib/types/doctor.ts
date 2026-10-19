
export interface Doctor {
    id_doctor:number;
    nombre_doctor:string;
    apellido_doctor:string;
    ci_profesional_doctor:string | null;
    ci_doctor:string;
    fecha_creacion_doctor:string;
    fecha_actualización_doctor:string | null;
    fecha_eliminacion_doctor:string | null;
}

// Omit toma la interfaz 'Doctor' y le quita el ID y las fechas,
// ya que PostgreSQL las genera automáticamente al insertar.
export type CrearDoctorInput = Omit<
  Doctor, 
  'id_doctor' | 'fecha_creacion_doctor' | 'fecha_actualizacion_doctor' | 'fecha_eliminacion_doctor'
>;