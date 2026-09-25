(() => {
  const title = document.getElementById('titulo');
  const message = document.getElementById('mensaje');
  const details = document.getElementById('datos');
  const invalid = () => {
    title.textContent = 'Certificado no válido';
    message.textContent = 'No encontramos un certificado válido con este enlace. Puede ser incorrecto o haber sido revocado. Consultá con Marian Estilista.';
    document.getElementById('resultado').className = 'invalid';
  };
  const token = new URLSearchParams(window.location.search).get('token') || '';
  if (!/^[a-f0-9]{64}$/.test(token)) { invalid(); return; }

  const date = value => {
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };
  async function validate() {
    try {
      const endpoint = new URL('backend/api/certificados/validar.php', window.location.href);
      endpoint.searchParams.set('token', token);
      const response = await fetch(endpoint, { credentials: 'omit', cache: 'no-store' });
      if (response.status === 404) { invalid(); return; }
      if (!response.ok) throw new Error('unavailable');
      const result = await response.json();
      if (!result.success || result.data?.estado !== 'valido') { invalid(); return; }
      const cert = result.data;
      title.textContent = 'Certificado válido';
      document.getElementById('resultado').className = 'valid';
      message.textContent = `Este certificado acredita que ${cert.nombre_alumno} completó satisfactoriamente el ${cert.nombre_curso}, capacitación privada impartida por Marian Estilista.`;
      const fields = [
        ['Código del certificado', cert.codigo_certificado],
        ['Alumno', cert.nombre_alumno], ['Curso', cert.nombre_curso],
        ['Fecha de finalización', date(cert.fecha_finalizacion)],
        ['Fecha de emisión', date(cert.fecha_emision)],
        ['Profesional / instructor', cert.instructor], ['Estado', 'Válido']
      ];
      for (const [label, value] of fields) {
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = label;
        description.textContent = value;
        details.append(term, description);
      }
      details.hidden = false;
    } catch {
      title.textContent = 'No pudimos verificar el certificado';
      message.textContent = 'El servicio no está disponible en este momento. Intentá nuevamente más tarde.';
    }
  }
  validate();
})();
