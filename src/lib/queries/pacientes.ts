
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

  // Si la fecha viene vacía (""), se convierte en null para evitar cadenas inválidas
  const fechaNacimiento = datos.fecha_nacimiento_paciente?.trim() || null;

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
    ) VALUES ($1, $2, $3, $4, $5::DATE, $6, $7, $8, $9)`, // <-- $5::DATE realiza el casteo explícito
    [
      datos.nombre_completo_paciente,
      datos.nombre_titular_paciente,
      datos.ci_titular_paciente,
      datos.ci_beneficiario_paciente,
      fechaNacimiento,
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


// para mas tarde 2. En la interfaz gráfica (src/routes/pacientes/+page.svelte)
// Vincularás un campo de texto <input> mediante bind:value para capturar la cédula ingresada por el usuario y llamarás a la función al presionar un botón o enviar el formulario:

// Svelte
// <script lang="ts">
//   import { buscarPacientePorCedula } from '$lib/queries/pacientes';
//   import type { Paciente } from '$lib/types/paciente';

//   // Variable en lazada al <input> del HTML
//   let cedulaBusqueda: string = '';
  
//   // Lista de resultados
//   let resultadosPacientes: Paciente[] = [];
  
//   // Control de estados de interfaz
//   let cargando: boolean = false;
//   let mensajeError: string = '';

//   async function manejarBusqueda() {
//     if (!cedulaBusqueda.trim()) {
//       mensajeError = 'Por favor ingrese un número de cédula válido.';
//       return;
//     }

//     cargando = true;
//     mensajeError = '';

//     try {
//       resultadosPacientes = await buscarPacientePorCedula(cedulaBusqueda);
      
//       if (resultadosPacientes.length === 0) {
//         mensajeError = 'No se encontró ningún paciente registrado con esa cédula.';
//       }
//     } catch (error) {
//       console.error('Error al realizar la búsqueda:', error);
//       mensajeError = 'Ocurrió un error al consultar la base de datos.';
//     } finally {
//       cargando = false;
//     }
//   }
// </script>

// <!-- Formulario de Búsqueda -->
// <form on:submit|preventDefault={manejarBusqueda} class="flex gap-2 mb-4">
//   <input 
//     type="text" 
//     placeholder="Ingrese número de cédula..." 
//     bind:value={cedulaBusqueda}
//     class="border p-2 rounded"
//   />
//   <button 
//     type="submit" 
//     disabled={cargando}
//     class="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
//   >
//     {cargando ? 'Buscando...' : 'Buscar Paciente'}
//   </button>
// </form>

// <!-- Mensajes de Error o Alertas -->
// {#if mensajeError}
//   <p class="text-red-500 font-semibold mb-4">{mensajeError}</p>
// {/if}

// <!-- Tabla de Resultados -->
// {#if resultadosPacientes.length > 0}
//   <table class="w-full border-collapse border border-gray-300">
//     <thead>
//       <tr class="bg-gray-100">
//         <th class="border p-2">Nombre Completo</th>
//         <th class="border p-2">Cédula Titular</th>
//         <th class="border p-2">Cédula Beneficiario</th>
//         <th class="border p-2">Parentesco</th>
//       </tr>
//     </thead>
//     <tbody>
//       {#each resultadosPacientes as paciente}
//         <tr>
//           <td class="border p-2">{paciente.nombre_completo_paciente}</td>
//           <td class="border p-2">{paciente.ci_titular_paciente}</td>
//           <td class="border p-2">{paciente.ci_beneficiario_paciente ?? 'Es Titular'}</td>
//           <td class="border p-2">{paciente.parentesco_paciente ?? 'N/A'}</td>
//         </tr>
//       {/each}
//     </tbody>
//   </table>
// {/if}