<script lang="ts">
  import { goto } from '$app/navigation';

  export let moduloActivo: string = '';
  export let usuarioActual: { id?: string; nombre?: string; rol?: string } | null = null;

  function cerrarSesion() {
    localStorage.removeItem('usuario_sesion');
    goto('/');
  }
</script>

<aside class="sidebar-landing-user">
  <!-- Perfil institucional del usuario -->
  <div class="sidebar-user-section">
    <div class="user-avatar-badge" title="Universidad Nacional Experimental Rafael María Baralt">
      <img src="/unermb-logo.png" alt="Escudo UNERMB" class="sidebar-user-emblem" />
    </div>
    <div class="user-info-text">
      <span class="user-role-label">PERSONAL ADMINISTRATIVO</span>
      <h3 class="user-display-name">{usuarioActual?.nombre || 'Personal Administrativo'}</h3>
      <div class="user-status-indicator">
        <span class="status-pulse-dot"></span>
        <span class="status-text">En Línea</span>
      </div>
    </div>
  </div>

  <!-- Lista de módulos del sistema -->
  <div class="div-modulos-wrapper">
    <div class="sidebar-menu-header">MÓDULOS DEL SISTEMA</div>
    
    <ul class="ul-sidebar">
      <li>
        <a 
          href="/landing_page_user/crear-consulta" 
          class="btn-menu-item" 
          class:activo={moduloActivo === 'crear-consulta'}
        >
          <span class="material-symbols-outlined">stethoscope</span>
          <span>Consulta Diagnóstico</span>
        </a>
      </li>

      <li>
        <a 
          href="/landing_page_user/historial-paciente" 
          class="btn-menu-item" 
          class:activo={moduloActivo === 'historial-paciente'}
        >
          <span class="material-symbols-outlined">history</span>
          <span>Historial Paciente</span>
        </a>
      </li>

      <li>
        <a 
          href="/landing_page_user/reposos-suspensiones" 
          class="btn-menu-item" 
          class:activo={moduloActivo === 'reposos-suspensiones'}
        >
          <span class="material-symbols-outlined">event_busy</span>
          <span>Reposos / Suspensiones</span>
        </a>
      </li>

      <li>
        <a 
          href="/landing_page_user/reporte-morbilidad" 
          class="btn-menu-item" 
          class:activo={moduloActivo === 'reporte-morbilidad'}
        >
          <span class="material-symbols-outlined">bar_chart_4_bars</span>
          <span>Reporte Morbilidad</span>
        </a>
      </li>

      <li>
        <a 
          href="/landing_page_user/buscar-paciente" 
          class="btn-menu-item" 
          class:activo={moduloActivo === 'buscar-paciente'}
        >
          <span class="material-symbols-outlined">manage_search</span>
          <span>Búsqueda Paciente</span>
        </a>
      </li>

      <li>
        <a 
          href="/landing_page_user/modulo-creación" 
          class="btn-menu-item" 
          class:activo={moduloActivo === 'modulo-creacion'}
        >
          <span class="material-symbols-outlined">admin_panel_settings</span>
          <span>Módulo Administrativo</span>
        </a>
      </li>

      <li class="sidebar-divider"></li>

      <li>
        <a 
          href="/landing_page_user" 
          class="btn-menu-item" 
          class:activo={moduloActivo === 'inicio'}
        >
          <span class="material-symbols-outlined">dashboard</span>
          <span>Panel Principal</span>
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

