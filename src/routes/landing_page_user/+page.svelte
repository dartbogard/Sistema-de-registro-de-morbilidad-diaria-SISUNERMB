<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;
  
  const fechaHoy = new Date().toLocaleDateString('es-VE', {
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });

  onMount(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
    } else {
      goto('/');
    }
  });

  const modulos = [
    { 
      href: '/landing_page_user/crear-consulta',      
      icono: 'stethoscope',    
      titulo: 'Consulta Diagnóstica',  
      desc: 'Atención médica diaria, asignación de diagnóstico y reposos laborales.' 
    },
    { 
      href: '/landing_page_user/historial-paciente',  
      icono: 'history',        
      titulo: 'Historial de Paciente', 
      desc: 'Búsqueda y consulta de expedientes de atenciones previas por cédula.' 
    },
    { 
      href: '/landing_page_user/reposos-suspensiones',
      icono: 'event_busy',     
      titulo: 'Reposos / Suspensiones',
      desc: 'Control y seguimiento de suspensiones médicas activas y acumuladas.' 
    },
    { 
      href: '/landing_page_user/reporte-morbilidad',  
      icono: 'bar_chart_4_bars',
      titulo: 'Reporte de Morbilidad', 
      desc: 'Estadísticas epidemiológicas, filtrado por fechas y exportación a PDF.' 
    },
    { 
      href: '/landing_page_user/buscar-paciente',     
      icono: 'manage_search',  
      titulo: 'Búsqueda de Paciente',  
      desc: 'Localización rápida de datos patronales y filiación universitaria.' 
    },
    { 
      href: '/landing_page_user/modulo-creación',     
      icono: 'admin_panel_settings',  
      titulo: 'Módulo Administrativo', 
      desc: 'Gestión y registro de pacientes, especialistas médicos, especialidades y usuarios.' 
    }
  ];
</script>

<svelte:head>
  <title>Panel Principal – SISUNERMB</title>
</svelte:head>

<Navbar />

<div class="div-grid-wrapper">
  <Sidebar moduloActivo="inicio" {usuarioActual} />

  <main class="main-landing-user">
    <div class="contenido-modulo dashboard-area">

      <!-- Banner Institucional de Bienvenida -->
      <div class="banner-bienvenida">
        <div class="banner-texto">
          <span class="banner-sub">SISTEMA INTEGRAL DE SALUD UNIVERSITARIO</span>
          <h2>Bienvenido, {usuarioActual ? usuarioActual.nombre : 'Personal Administrativo'}</h2>
          <p class="banner-fecha">{fechaHoy}</p>
        </div>
        <div class="banner-emblema">
          <img src="/sisunermb.png" alt="SISUNERMB" class="banner-logo-img" />
          <div class="banner-badge-info">
            <span class="badge-org">UNERMB</span>
            <span class="badge-status">Servicio Activo</span>
          </div>
        </div>
      </div>

      <!-- Cabecera de la sección de módulos -->
      <div class="seccion-intro">
        <div>
          <h3>Módulos del Sistema</h3>
          <p class="seccion-sub">Seleccione un módulo a continuación o utilice el menú lateral para acceder directamente.</p>
        </div>
      </div>

      <!-- Grid de Módulos -->
      <div class="grid-modulos-cards">
        {#each modulos as mod}
          <a href={mod.href} class="card-modulo">
            <div class="card-icono-wrapper">
              <span class="material-symbols-outlined">{mod.icono}</span>
            </div>
            <div class="card-info">
              <h4>{mod.titulo}</h4>
              <p>{mod.desc}</p>
            </div>
            <span class="material-symbols-outlined card-flecha">arrow_forward</span>
          </a>
        {/each}
      </div>

      <!-- Barra informativa institucional -->
      <div class="nota-institucional">
        <img src="/unermb-logo.png" alt="Escudo UNERMB" class="nota-unermb-logo" />
        <div class="nota-texto">
          <strong>Sistema Integral de Salud de la UNERMB (SISUNERMB)</strong>
          <p>Para soporte técnico o asistencia en el registro de morbilidad diaria, comuníquese con la Dirección de Informática.</p>
        </div>
      </div>

    </div>
  </main>
</div>

<Footer />

<style>
  .dashboard-area {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Banner de Bienvenida */
  .banner-bienvenida {
    background: linear-gradient(135deg, #0b2545 0%, #134074 50%, #0066cc 100%);
    border-radius: 16px;
    padding: 28px 32px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 6px 20px rgba(11, 37, 69, 0.2);
  }

  .banner-sub {
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: #38bdf8;
    text-transform: uppercase;
  }

  .banner-texto h2 {
    font-family: 'Montserrat', sans-serif;
    font-size: 1.7rem;
    font-weight: 700;
    margin: 4px 0 6px 0;
    letter-spacing: -0.3px;
  }

  .banner-fecha {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.85);
    text-transform: capitalize;
  }

  .banner-emblema {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 10px 18px;
    border-radius: 14px;
    backdrop-filter: blur(8px);
  }

  .banner-logo-img {
    height: 48px;
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
  }

  .banner-badge-info {
    display: flex;
    flex-direction: column;
    text-align: right;
  }

  .badge-org {
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.5px;
  }

  .badge-status {
    font-size: 0.72rem;
    color: #86efac;
  }

  /* Sección de Módulos */
  .seccion-intro h3 {
    font-size: 1.25rem;
    color: #0f172a;
    font-weight: 700;
    font-family: 'Montserrat', sans-serif;
  }

  .seccion-sub {
    font-size: 0.88rem;
    color: #64748b;
    margin-top: 2px;
  }

  /* Grid de Cards */
  .grid-modulos-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .card-modulo {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 20px 22px;
    display: flex;
    align-items: center;
    gap: 16px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  }

  .card-modulo:hover {
    border-color: #007aff;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 122, 255, 0.14);
  }

  .card-icono-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 1px solid #bfdbfe;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .card-modulo:hover .card-icono-wrapper {
    background: linear-gradient(135deg, #0055b3 0%, #007aff 100%);
    border-color: #007aff;
  }

  .card-icono-wrapper .material-symbols-outlined {
    font-size: 24px;
    color: #0066cc;
    transition: color 0.2s ease;
  }

  .card-modulo:hover .card-icono-wrapper .material-symbols-outlined {
    color: #ffffff;
  }

  .card-info {
    flex: 1;
  }

  .card-info h4 {
    font-size: 0.98rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 4px;
  }

  .card-info p {
    font-size: 0.82rem;
    color: #64748b;
    line-height: 1.4;
  }

  .card-flecha {
    color: #94a3b8;
    font-size: 20px;
    flex-shrink: 0;
    transition: transform 0.2s ease, color 0.2s ease;
  }

  .card-modulo:hover .card-flecha {
    transform: translateX(4px);
    color: #007aff;
  }

  /* Nota Institucional */
  .nota-institucional {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #007aff;
    border-radius: 10px;
    padding: 16px 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  }

  .nota-unermb-logo {
    height: 40px;
    width: auto;
    object-fit: contain;
    flex-shrink: 0;
  }

  .nota-texto strong {
    font-size: 0.9rem;
    color: #0f172a;
    display: block;
    margin-bottom: 2px;
  }

  .nota-texto p {
    font-size: 0.83rem;
    color: #64748b;
  }
</style>
