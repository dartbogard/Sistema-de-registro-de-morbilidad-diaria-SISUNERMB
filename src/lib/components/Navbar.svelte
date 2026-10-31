<script lang="ts">
  // Componente Navbar Institucional SISUNERMB
  export let esLogin: boolean = false;
</script>

<nav class="nav-landing-user">
  <div class="nav-brand-container">
    <div class="nav-logos-pill">
      <a href="https://unermb.web.ve" target="_blank" rel="noreferrer" class="logo-link brand-unermb" title="Portal Oficial UNERMB">
        <img class="img-nav-escudo" src="/unermb-logo.png" alt="Escudo Oficial UNERMB" />
        <img class="img-nav-unermb" src="/cintillo-unermb.png" alt="Cintillo Institucional UNERMB" />
      </a>
      <div class="nav-logos-divider"></div>
      <a href={esLogin ? '/' : '/landing_page_user'} class="logo-link brand-sisunermb" title="Inicio SISUNERMB">
        <img class="img-nav-sisunermb" src="/sisunermb.png" alt="Logo Oficial SISUNERMB" />
      </a>
    </div>
  </div>
  <div class="nav-title-group">
    <span class="nav-system-title">SISTEMA INTEGRAL DE SALUD – SISUNERMB</span>
    <span class="nav-university-sub">UNIVERSIDAD NACIONAL EXPERIMENTAL "RAFAEL MARÍA BARALT"</span>
  </div>
</nav>

