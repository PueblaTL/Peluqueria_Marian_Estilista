/** Página pública. Solo el inicio de inscripción requiere autenticación. */
document.addEventListener("DOMContentLoaded", () => {
  const start = document.getElementById("btn-inscribirme-curso");
  const panel = document.getElementById("inscripcion");
  const form = document.getElementById("form-inscripcion-curso");
  const status = document.getElementById("course-status");
  const submit = document.getElementById("btn-confirmar-inscripcion");
  let saved = false;
  const login = () => { window.location.href = "login.html?redirect=curso.html&action=inscripcion"; };

  async function begin() {
    if (saved) return;
    start.disabled = true;
    status.textContent = "Comprobando sesión…";
    try {
      const response = await window.requestApi("/auth/me.php");
      const user = response.data;
      if (!user) { login(); return; }
      form.elements.nombre.value = user.nombre || "";
      form.elements.apellido.value = user.apellido || "";
      form.elements.email.value = user.email || "";
      form.elements.telefono.value = user.telefono || "";
      panel.hidden = false;
      status.textContent = "Revisá tus datos y confirmá tu inscripción.";
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
      form.elements.telefono.focus({ preventScroll: true });
    } catch (error) {
      if (error.status === 401) login();
      else status.textContent = error.message || "No pudimos comprobar la sesión. Intentá nuevamente.";
    } finally { start.disabled = saved; }
  }

  start.addEventListener("click", begin);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (saved || submit.disabled || !form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = "Registrando…";
    status.textContent = "";
    try {
      const data = Object.fromEntries(new FormData(form));
      await window.apiCreateInscripcion({ ...data, curso_id: "cur-1" });
      saved = true;
      panel.hidden = true;
      start.disabled = true;
      start.textContent = "Inscripción registrada";
      status.textContent = "¡Tu inscripción quedó registrada! Está pendiente de contacto del salón para coordinar los próximos pasos.";
      status.focus();
      history.replaceState({}, "", window.location.pathname);
    } catch (error) {
      if (error.status === 401) { login(); return; }
      status.textContent = error.message || "No pudimos guardar la inscripción. Intentá nuevamente.";
      status.focus();
    } finally {
      submit.disabled = saved;
      submit.textContent = "Confirmar inscripción";
    }
  });
  if (new URLSearchParams(window.location.search).get("action") === "inscripcion") begin();
});
