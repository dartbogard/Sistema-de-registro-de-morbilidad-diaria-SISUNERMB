export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  // Spanish locale format dd/MM/yyyy – hh:mm a
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

