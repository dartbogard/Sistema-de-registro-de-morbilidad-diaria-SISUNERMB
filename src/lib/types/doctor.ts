
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