export interface Suspension {
    id_suspension:number;
    consulta_suspension:number;
    especialidad_suspension:number;
    doctor_suspension:number;
    fecha_inicio_suspension:string;
    fecha_final_suspension:string;
    fecha_creacion_suspension:string;
    fecha_actualización_suspension:string | null;
    fecha_eliminacion_suspension:string | null;
}

// Tipo para crear un reposo / suspensión médica
export type CrearSuspensionInput = Omit<
  Suspension,
  'id_suspension' | 'fecha_creacion_suspension' | 'fecha_actualizacion_suspension' | 'fecha_eliminacion_suspension'
>;
