<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { obtenerHistorialPorCedula } from '$lib/queries/consultas';

  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;
  let moduloActivo = 'inicio';

  let cedula = '';
  let historial: any[] = [];
  let mensaje = '';

  onMount(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
    } else {
      goto('/');
    }
  });

  function cerrarSesion() {
    localStorage.removeItem('usuario_sesion');
    goto('/');
  }

  async function buscarHistorial() {
    if (!cedula.trim()) {
      mensaje = 'Por favor ingrese una cédula válida.';
      historial = [];
      return;
    }

    try {
      const resultado = await obtenerHistorialPorCedula(cedula);
      historial = resultado as any[];
      mensaje = historial.length === 0 ? 'No se encontraron registros médicos para esta cédula.' : '';
    } catch (error) {
      console.error(error);
      mensaje = 'Ocurrió un error al consultar la base de datos.';
    }
  }
</script>

<svelte:head>
  <title>SISUNERMB - Panel Principal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=calendar_clock,history,logout,medication,patient_list,person,search" />
</svelte:head>

<nav class="nav-landing-user">
  <div class="div-inner-nav">
    <a href="https://unermb.web.ve" class="image-wrapper">
      <img class="img-nav-login" src="/cintillo-unermb.png" alt="Cintillo UNERMB" />
    </a>
    <div class="image-wrapper">
      <img class="img-nav-login" src="/sisunermb.png" alt="Logo SISUNERMB" />
    </div>
  </div>
  <h1>BIENVENIDO AL REGISTRO MEDICO SISUNERMB</h1>
</nav>

<div class="div-grid-wrapper">
  
  <aside class="sidebar-landing-user">
    <div class="div-img-sidebar-wrapper" style="background-image: url('/background.jpg');">
      <h3>{usuarioActual ? usuarioActual.nombre : 'Cargando...'}</h3>
    </div>

    <div class="div-modulos-wrapper">
      <p>Modulos</p>
      
      <ul class="ul-sidebar">
        <a href="/landing_page_user/crear-paciente">
          <li>
            <span class="material-symbols-outlined">person</span>
            Registrar Paciente
          </li>
        </a>

        <button type="button" on:click={() => moduloActivo = 'consulta'} class="btn-menu-link">
          <li>
            <span class="material-symbols-outlined">medication</span>
            Consulta Diagnóstico
          </li>
        </button>

        <button type="button" on:click={() => moduloActivo = 'historial'} class="btn-menu-link">
          <li>
            <span class="material-symbols-outlined">history</span>
            Historial Paciente
          </li>
        </button>

        <a href="/landing_page_user/buscar-paciente">
          <li>
            <span class="material-symbols-outlined">search</span>
            Búsqueda Paciente
          </li>
        </a>

        <button type="button" on:click={cerrarSesion} class="btn-logout-link">
          <li>
            <span class="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </li>
        </button>
      </ul>
    </div>
  </aside>

  <main class="main-landing-user">
    {#if moduloActivo === 'inicio'}
      <div class="contenido-modulo">
        <h2>Seleccione un módulo en el menú lateral</h2>
        <p>Utilice las opciones de la izquierda para navegar por el sistema.</p>
      </div>
    {:else if moduloActivo === 'historial'}
      <div class="contenido-modulo">
        <h2>Historial de Paciente</h2>
        
        <div class="buscador-container">
          <input 
            type="text" 
            bind:value={cedula} 
            placeholder="Ingrese la cédula del paciente..." 
          />
          <button type="button" on:click={buscarHistorial}>
            Buscar
          </button>
        </div>

        {#if mensaje}
          <p class="mensaje-info">{mensaje}</p>
        {/if}

        {#if historial.length > 0}
          <div class="tabla-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Paciente</th>
                  <th>Cédula</th>
                  <th>Especialidad</th>
                  <th>Doctor</th>
                  <th>Diagnóstico</th>
                </tr>
              </thead>
              <tbody>
                {#each historial as item}
                  <tr>
                    <td>{item.fecha_consulta}</td>
                    <td>{item.nombre_completo_paciente}</td>
                    <td>{item.ci_titular_paciente || item.ci_beneficiario_paciente}</td>
                    <td>{item.tipo_especialidad}</td>
                    <td>{item.nombre_doctor}</td>
                    <td>{item.diagnostico_consulta}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {:else if moduloActivo === 'consulta'}
      <div class="contenido-modulo">
        <h2>Módulo de Consulta Diagnóstico</h2>
        <p>Próximamente disponible aquí.</p>
      </div>
    {/if}
  </main>

</div>

<footer class="footer-landing-user">
  <p>Créditos: Miguel Contreras, Arturo Pérez, Omar Oberto Big 2026</p>
</footer>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(html, body) {
    height: 100%;
    font-family: 'Google Sans', sans-serif;
    background-color: ghostwhite;
  }

  :global(body) {
    display: grid;
    grid-template-rows: 8% 1fr auto;
    grid-template-areas: 
      "header"
      "body"
      "footer";
  }

  nav {
    background-color: #007aff;
    grid-area: header;    
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .div-inner-nav {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 25%;
    height: 100%;
  }

  .image-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 50%;
    height: 100%;
  }

  .img-nav-login {    
    display: block;
    width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  h1 {
    color: #fff;
    text-align: right;
    font-family: 'Montserrat', sans-serif;
    font-weight: 400;
    letter-spacing: -1px;
    padding-right: 20px;
  }

  .div-grid-wrapper {
    grid-area: body;
    display: grid;
    grid-template-columns: 20% 1fr;
    grid-template-areas: "sidebar main";
    height: 100%;
  }

  .sidebar-landing-user {
    grid-area: sidebar;
    background-color: #2c3e50;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: 100%;
    color: #fff;
    overflow-y: auto;
  }

  .div-img-sidebar-wrapper {
    width: 100%;
    height: 25%;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 15px;
  }

  .div-img-sidebar-wrapper h3 {
    background-color: rgba(0, 0, 0, 0.6);
    padding: 5px 15px;
    border-radius: 4px;
    font-size: 1.1rem;
  }

  .div-modulos-wrapper {
    width: 100%;
    padding: 20px 0;
  }

  .div-modulos-wrapper p {
    padding-left: 20px;
    font-size: 0.85rem;
    text-transform: uppercase;
    color: #bdc3c7;
    margin-bottom: 10px;
  }

  .ul-sidebar {
    list-style: none;
    width: 100%;
  }

  .ul-sidebar a,
  .btn-menu-link,
  .btn-logout-link {
    text-decoration: none;
    color: #ecf0f1;
    display: block;
    width: 100%;
    background: none;
    border: none;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }

  .ul-sidebar li {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    transition: background-color 0.3s ease;
    gap: 12px;
  }

  .ul-sidebar li:hover {
    background-color: #34495e;
    color: #3498db;
  }

  .main-landing-user {
    grid-area: main;
    background-color: #f4f6f7;
    padding: 25px;
    overflow-y: auto;
  }

  /* ESTILOS DE LOS MÓDULOS INTERNOS */
  .contenido-modulo h2 {
    font-size: 1.75rem;
    color: #2c3e50;
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .contenido-modulo p {
    color: #555;
  }

  .buscador-container {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .buscador-container input {
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    width: 320px;
    font-size: 1rem;
    background-color: #fff;
    outline: none;
  }

  .buscador-container input:focus {
    border-color: #007aff;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
  }

  .buscador-container button {
    background-color: #007aff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .buscador-container button:hover {
    background-color: #005bb5;
  }

  .mensaje-info {
    margin-bottom: 15px;
    font-weight: 500;
    color: #475569;
  }

  .tabla-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  th {
    background-color: #f1f5f9;
    color: #334155;
    padding: 12px 16px;
    font-weight: 600;
    border-bottom: 1px solid #e2e8f0;
  }

  td {
    padding: 12px 16px;
    color: #1e293b;
    border-bottom: 1px solid #e2e8f0;
  }

  tr:hover td {
    background-color: #f8fafc;
  }

  .footer-landing-user {
    grid-area: footer;
    background-color: #007aff;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.85rem;
  }
</style>