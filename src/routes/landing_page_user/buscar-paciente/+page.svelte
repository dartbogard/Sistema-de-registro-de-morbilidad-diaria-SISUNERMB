<script lang="ts">
 import { buscarPacientePorCedula } from '$lib/queries/pacientes';
 import type { Paciente } from '$lib/types/paciente';

// Variable en lazada al <input> del HTML
let cedulaBusqueda: string = '';
  
// Lista de resultados
let resultadosPacientes: Paciente[] = [];
  
// Control de estados de interfaz
let cargando: boolean = false;
let mensajeError: string = '';

async function manejarBusqueda() {
  if (!cedulaBusqueda.trim()) {
    mensajeError = 'Por favor ingrese un número de cédula válido.';
    return;
  }

  cargando = true;
  mensajeError = '';

  try {
    resultadosPacientes = await buscarPacientePorCedula(cedulaBusqueda);
      
    if (resultadosPacientes.length === 0) {
      mensajeError = 'No se encontró ningún paciente registrado con esa cédula.';
    }
  } catch (error) {
    console.error('Error al realizar la búsqueda:', error);
    mensajeError = 'Ocurrió un error al consultar la base de datos.';
  } finally {
    cargando = false;
  }
}
</script>

 <!-- Formulario de Búsqueda -->
<form on:submit|preventDefault={manejarBusqueda} class="flex gap-2 mb-4">
<input 
  type="text" 
  placeholder="Ingrese número de cédula..." 
  bind:value={cedulaBusqueda}
  class="border p-2 rounded"/>
<button 
  type="submit" 
  disabled={cargando}
  class="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
>
  {cargando ? 'Buscando...' : 'Buscar Paciente'}
</button>
 </form>

 <!-- Mensajes de Error o Alertas -->
{#if mensajeError}
<p class="text-red-500 font-semibold mb-4">{mensajeError}</p>
{/if}

 <!-- Tabla de Resultados -->
{#if resultadosPacientes.length > 0}
<table class="w-full border-collapse border border-gray-300">
  <thead>
    <tr class="bg-gray-100">
      <th class="border p-2">Nombre Completo</th>
      <th class="border p-2">Cédula Titular</th>
      <th class="border p-2">Cédula Beneficiario</th>
      <th class="border p-2">Parentesco</th>
    </tr>
  </thead>
  <tbody>
    {#each resultadosPacientes as paciente}
      <tr>
        <td class="border p-2">{paciente.nombre_completo_paciente}</td>
        <td class="border p-2">{paciente.ci_titular_paciente}</td>
        <td class="border p-2">{paciente.ci_beneficiario_paciente ?? 'Es Titular'}</td>
        <td class="border p-2">{paciente.parentesco_paciente ?? 'N/A'}</td>
      </tr>
    {/each}
  </tbody>
</table>
{/if}