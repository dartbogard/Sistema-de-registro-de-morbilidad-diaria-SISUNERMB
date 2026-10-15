<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getDb } from '$lib/db/database'; // Asumo que database.ts está en src/lib/db/

  onMount(async () => {
    try {
      const db = await getDb();
      // Nota: Cambia 'paciente' por una tabla que sepas que existe en tu BD
      const result = await db.select<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM public."PACIENTE"'
      );
      console.log('📊 Pacientes en BD:', result[0].count);
    } catch (error) {
      console.error('❌ Error conectando a PostgreSQL:', error);
    }
  });
</script>

<h1>Morbilidad SISUNERMB</h1>
<p>Abre la consola (F12) para verificar la conexión.</p>