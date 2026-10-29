<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { obtenerHistorialPorCedula } from '$lib/queries/consultas';

  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;
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
  <title>SISUNERMB - Historial Paciente</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=calendar_clock,history,logout,medication,patient_list,person,search,info" />
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
      <p>Módulos</p>
      
      <ul class="ul-sidebar">
        <li>
          <a href="/landing_page_user/crear-paciente" class="btn-menu-item">
            <span class="material-symbols-outlined">person</span>
            <span>Registrar Paciente</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/crear-consulta" class="btn-menu-item">
            <span class="material-symbols-outlined">medication</span>
            <span>Consulta Diagnóstico</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/historial-paciente" class="btn-menu-item">
            <span class="material-symbols-outlined">history</span>
            <span>Historial Paciente</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/reposos-suspensiones" class="btn-menu-item">
            <span class="material-symbols-outlined">calendar_clock</span>
            <span>Reposos/Suspensiones</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/reporte-morbilidad" class="btn-menu-item">
            <span class="material-symbols-outlined">patient_list</span>
            <span>Reporte Morbilidad</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/buscar-paciente" class="btn-menu-item">
            <span class="material-symbols-outlined">search</span>
            <span>Búsqueda Paciente</span>
          </a>
        </li>

        <li>
          <button type="button" on:click={cerrarSesion} class="btn-menu-item btn-logout">
            <span class="material-symbols-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </li>
      </ul>
    </div>
  </aside>

  <main class="main-landing-user">
    <div class="contenido-modulo">
      <div class="header-seccion">
        <h2>Historial Médico del Paciente</h2>
        <p class="subtitulo">Consulte los registros de consultas, diagnósticos y especialistas por número de cédula.</p>
      </div>
      
      <div class="buscador-card">
        <div class="buscador-container">
          <div class="input-grupo">
            <span class="material-symbols-outlined icono-input">search</span>
            <input 
              type="text" 
              bind:value={cedula} 
              placeholder="Ingrese la cédula del paciente..." 
            />
          </div>
          <button type="button" on:click={buscarHistorial} class="btn-buscar">
            Consultar Historial
          </button>
        </div>
      </div>

      {#if mensaje}
        <div class="alerta-mensaje">
          <span class="material-symbols-outlined">info</span>
          <p>{mensaje}</p>
        </div>
      {/if}

      {#if historial.length > 0}
        <div class="tabla-container">
          <div class="tabla-header-info">
            <span>Registros encontrados: <strong>{historial.length}</strong></span>
          </div>
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
                  <td>
                    <span class="badge-fecha">{item.fecha_consulta}</span>
                  </td>
                  <td class="texto-bold">{item.nombre_completo_paciente}</td>
                  <td>{item.ci_titular_paciente || item.ci_beneficiario_paciente}</td>
                  <td>
                    <span class="badge-especialidad">{item.tipo_especialidad}</span>
                  </td>
                  <td>{item.nombre_doctor}</td>
                  <td class="td-diagnostico">{item.diagnostico_consulta}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
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
    height: 100vh;
    font-family: 'Google Sans', sans-serif;
    background-color: ghostwhite;
    overflow: hidden;
  }

  :global(body) {
    display: grid;
    grid-template-rows: 60px 1fr 30px;
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
    padding: 0 20px;
  }

  .div-inner-nav {
    display: flex;
    align-items: center;
    gap: 15px;
    height: 100%;
  }

  .image-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .img-nav-login {    
    display: block;
    height: 40px;
    object-fit: contain;
  }

  h1 {
    color: #fff;
    font-family: 'Montserrat', sans-serif;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .div-grid-wrapper {
    grid-area: body;
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-areas: "sidebar main";
    height: 100%;
    overflow: hidden;
  }

  .sidebar-landing-user {
    grid-area: sidebar;
    background-color: #2c3e50;
    display: flex;
    flex-direction: column;
    height: 100%;
    color: #fff;
    overflow-y: auto;
  }

  .div-img-sidebar-wrapper {
    width: 100%;
    height: 120px;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 12px;
    flex-shrink: 0;
  }

  .div-img-sidebar-wrapper h3 {
    background-color: rgba(0, 0, 0, 0.6);
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.95rem;
  }

  .div-modulos-wrapper {
    width: 100%;
    padding: 15px 0;
    flex-grow: 1;
  }

  .div-modulos-wrapper p {
    padding-left: 20px;
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #bdc3c7;
    margin-bottom: 10px;
    font-weight: 600;
  }

  .ul-sidebar {
    list-style: none;
    width: 100%;
  }

  .btn-menu-item {
    text-decoration: none;
    color: #ecf0f1;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 20px;
    background: none;
    border: none;
    font: inherit;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .btn-menu-item:hover {
    background-color: #34495e;
    color: #3498db;
  }

  .btn-menu-item span.material-symbols-outlined {
    font-size: 20px;
    flex-shrink: 0;
  }

  .main-landing-user {
    grid-area: main;
    background-color: #f1f5f9;
    padding: 30px;
    overflow-y: auto;
    height: 100%;
  }

  .contenido-modulo {
    max-width: 1200px;
    margin: 0 auto;
  }

  .header-seccion {
    margin-bottom: 20px;
  }

  .contenido-modulo h2 {
    font-size: 1.8rem;
    color: #1e293b;
    font-weight: 700;
    font-family: 'Montserrat', sans-serif;
  }

  .subtitulo {
    color: #64748b;
    font-size: 0.95rem;
    margin-top: 4px;
  }

  .buscador-card {
    background: #ffffff;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    margin-bottom: 25px;
    border: 1px solid #e2e8f0;
  }

  .buscador-container {
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .input-grupo {
    position: relative;
    flex-grow: 1;
    max-width: 450px;
  }

  .icono-input {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 20px;
  }

  .buscador-container input {
    width: 100%;
    padding: 12px 14px 12px 45px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 1rem;
    background-color: #f8fafc;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
  }

  .buscador-container input:focus {
    border-color: #007aff;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
  }

  .btn-buscar {
    background-color: #007aff;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background-color 0.2s;
    box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
  }

  .btn-buscar:hover {
    background-color: #0062cc;
  }

  .alerta-mensaje {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    padding: 14px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-weight: 500;
  }

  .tabla-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .tabla-header-info {
    padding: 15px 20px;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.9rem;
    color: #475569;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  th {
    background-color: #f8fafc;
    color: #475569;
    padding: 14px 20px;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid #e2e8f0;
  }

  td {
    padding: 16px 20px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.95rem;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background-color: #f8fafc;
  }

  .texto-bold {
    font-weight: 600;
    color: #0f172a;
  }

  .badge-fecha {
    background-color: #f1f5f9;
    color: #475569;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .badge-especialidad {
    background-color: #e0f2fe;
    color: #0369a1;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .td-diagnostico {
    max-width: 300px;
    color: #475569;
  }

  .footer-landing-user {
    grid-area: footer;
    background-color: #007aff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.85rem;
  }
</style>