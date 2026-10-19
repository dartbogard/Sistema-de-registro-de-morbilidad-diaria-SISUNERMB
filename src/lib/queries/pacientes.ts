
import { getDb } from '../database';
import type { Paciente, CrearPacienteInput } from '$lib/types/paciente'; 

// import { getDb } from '../database';: Trae la función helper que inicializa/obtiene
//  la conexión a la base de datos PostgreSQL gestionada por la instancia de Tauri SQL.

// import type { ... }: Usa la palabra clave type para indicarle a TypeScript que estas 
// importaciones son únicamente definiciones de tipos.
//  Esto optimiza el código final en JavaScript, ya que estas líneas se eliminan por completo durante el proceso de compilación de la app.

// CrearPacienteInput: Es el tipo utilitario que define exactamente
//  qué datos necesita recibir la función para insertar un registro 
// (excluyendo campos autogenerados como id_paciente o las fechas de auditoría).



// export: Permite importar esta función en cualquier componente de Svelte
//  (+page.svelte) o script dentro del proyecto.

// async: Marca la función como asíncrona porque la comunicación con 
// PostgreSQL toma tiempo y no debe congelar la interfaz de usuario de la app en Tauri.

// datos: CrearPacienteInput: Define el parámetro de entrada. 
// Garantiza que si intentas llamar a crearPaciente() sin enviar un campo obligatorio
//  (como nombre_completo_paciente), el editor marcará un error de compilación.

// Promise<void>: Indica el valor que retorna la función.
//  Como es un INSERT que no devuelve filas, retorna una Promesa vacía (void).

export async function crearPaciente(datos: CrearPacienteInput): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO public."PACIENTE" (
      nombre_completo_paciente,
      nombre_titular_paciente,
      ci_titular_paciente,
      ci_beneficiario_paciente,
      fecha_nacimiento_paciente,
      sexo_paciente,
      tipo_personal_paciente,
      categoria_trabajador_paciente,
      parentesco_paciente
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      datos.nombre_completo_paciente,
      datos.nombre_titular_paciente,
      datos.ci_titular_paciente,
      datos.ci_beneficiario_paciente,
      datos.fecha_nacimiento_paciente,
      datos.sexo_paciente,
      datos.tipo_personal_paciente,
      datos.categoria_trabajador_paciente,
      datos.parentesco_paciente
    ]
  );
}



// db.execute(...): Método que se utiliza para ejecutar consultas SQL que no devuelven un conjunto de resultados/filas (como INSERT, UPDATE, DELETE). Para consultas SELECT se utiliza db.select().

// public."PACIENTE": Especifica el esquema (public) y el nombre de la tabla entre comillas dobles ("PACIENTE"). Esto es obligatorio en PostgreSQL cuando los nombres de las tablas tienen letras mayúsculas.

// Marcadores de posición ($1, $2, ..., $9): Es la técnica de consultas parametrizadas 
// (Prepared Statements). En lugar de concatenar cadenas directamente en la consulta SQL
//  (lo cual es muy vulnerable a inyecciones SQL), los valores se envían de forma segura
//  a través del segundo argumento (el arreglo de JavaScript).
/**
 * Busca pacientes por número de cédula (titular o beneficiario).
 *
 * @param cedula_paciente - La cédula ingresada desde la interfaz.
 * @returns Promesa con la lista de pacientes coincidentes.
 */
export async function buscarPacientePorCedula(cedula: string): Promise<Paciente[]> {
  const db = await getDb();
  
  // Limpiamos espacios en blanco del texto recibido del input
  const cedulaLimpia = cedula.trim();

  // Si el usuario no escribió nada, retornamos arreglo vacío
  if (!cedulaLimpia) return [];

  return await db.select<Paciente[]>(
    `SELECT * FROM public."PACIENTE"
     WHERE (ci_titular_paciente = $1 OR ci_beneficiario_paciente = $1)
       AND fecha_eliminacion_paciente IS NULL`,
    [cedulaLimpia]
  );
}