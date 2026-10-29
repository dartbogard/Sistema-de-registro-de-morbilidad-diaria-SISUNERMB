
export interface Doctor {
    id_doctor: string; // o number según tu base de datos
    nombre_doctor: string;
    apellido_doctor: string;
    ci_profesional_doctor: string;
    ci_doctor: string;
    fecha_creacion_doctor: string;
    fecha_actualización_doctor: string | null;
    fecha_eliminacion_doctor: string | null;
}

// Asegúrate de omitir todos los campos de auditoría y el ID
export type CrearDoctorInput = Omit<
    Doctor,
    | 'id_doctor' 
    | 'fecha_creacion_doctor' 
    | 'fecha_actualización_doctor' 
    | 'fecha_eliminacion_doctor'
>;