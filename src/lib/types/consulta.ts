export interface Consulta{
    id_consulta:number;
    especialidad_consulta:string;
    usuario_consulta:number;
    paciente_consulta:number;
    doctor_consulta:number;
    fecha_consulta:string;
    diagnostico_consulta:string;
    fecha_creacion_doctor:string;
    fecha_actualización_doctor:string | null;
    fecha_eliminacion_doctor:string | null;
}