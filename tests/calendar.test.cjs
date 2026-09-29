const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const values = new Map();
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [2026, 8, 29, 10, 15])); }
    static now() { return new FixedDate().getTime(); }
  }
  const document = { addEventListener() {}, querySelectorAll() { return []; } };
  const context = vm.createContext({ Date: FixedDate, URLSearchParams, console, document,
    window: {}, localStorage: { getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value) } });
  vm.runInContext(fs.readFileSync('js/data.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('js/storage.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('js/reservas.js', 'utf8') + '\nwindow.Wizard = BookingWizard;', context);
  const storage = context.window.StorageService;
  storage.init();
  storage._setItem('aura_turnos_v1', []);
  return { storage, context, values };
}

test('No ofrece fechas pasadas, inválidas ni días cerrados', async () => {
  const { storage } = setup();
  for (const date of ['2026-09-28', '2026-10-04', '2026-10-05', '2026-02-31', 'texto']) {
    assert.equal((await storage.getDisponibilidad(date, 60, 'prof-1')).length, 0, date);
  }
});

test('Los cuatro enlaces del equipo preseleccionan servicio y profesional en reservas', async () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const links = [...html.matchAll(/href="([^"]+)" class="team-card-btn"/g)];
  assert.equal(links.length, 4);
  for (const [index, link] of links.entries()) {
    const { context, storage } = setup();
    const url = new URL(link[1].replaceAll('&amp;', '&'), 'http://localhost');
    context.window.location = { search: url.search };
    const wizard = Object.create(context.window.Wizard.prototype);
    Object.assign(wizard, { equipo: await storage.getEquipo(), state: {}, btnNext: {}, professionalSelect: {} });
    await wizard.checkUrlParams();
    assert.equal(wizard.state.profesional.id, `prof-${index + 1}`);
    assert.equal(wizard.professionalSelect.value, wizard.state.profesional.id);
    assert.equal(wizard.state.servicio.id, url.searchParams.get('servicio'));
  }
});

test('Parámetros de profesional inválido o inactivo no generan una selección', async () => {
  for (const id of ['desconocido', 'prof-2']) {
    const { context } = setup();
    context.window.location = { search: `?profesional=${id}` };
    const wizard = Object.create(context.window.Wizard.prototype);
    Object.assign(wizard, { equipo: [{ id: 'prof-2', activo: false }], state: { profesional: null } });
    await wizard.checkUrlParams();
    assert.equal(wizard.state.profesional, null);
  }
});

test('Actualiza el nombre guardado sin borrar reservas ni cambiar otros profesionales', async () => {
  const { storage, values } = setup();
  const equipo = await storage.getEquipo();
  equipo[1].nombre = 'Lucas Morales';
  equipo[1].horarioInicio = '12:00';
  values.set('aura_equipo_v1', JSON.stringify(equipo));
  values.set('aura_turnos_v1', JSON.stringify([
    { id: 'existente', profesionalId: 'prof-2', profesionalNombre: 'Lucas Morales', fecha: '2026-09-30', hora: '12:00' },
    { id: 'otro', profesionalId: 'prof-1', profesionalNombre: 'Valeria Benítez' }
  ]));
  storage.init();
  storage.init();
  const updated = await storage.getEquipo();
  const reservas = JSON.parse(values.get('aura_turnos_v1'));
  assert.equal(updated[1].nombre, 'Mariano Echavarria');
  assert.equal(updated[1].horarioInicio, '12:00');
  assert.equal(reservas.length, 2);
  assert.equal(reservas[0].profesionalNombre, 'Mariano Echavarria');
  assert.equal(reservas[0].id, 'existente');
  assert.equal(reservas[0].hora, '12:00');
  assert.equal(reservas[1].profesionalNombre, 'Valeria Benítez');
});

test('Hoy descarta horarios vencidos y respeta duración y cierre', async () => {
  const { storage } = setup();
  const slots = await storage.getDisponibilidad('2026-09-29', 90, 'prof-1');
  assert.equal(slots.find(s => s.hora === '10:00').disponible, false);
  assert.equal(slots.find(s => s.hora === '10:30').disponible, true);
  assert.equal(slots.at(-1).hora, '17:30');
});

test('Evita solapamientos, permite límites contiguos y libera cancelados', async () => {
  const { storage } = setup();
  storage._setItem('aura_turnos_v1', [{ fecha: '2026-09-30', hora: '11:00', duracionMinutos: '90', estado: 'Pendiente' }]);
  let slots = await storage.getDisponibilidad('2026-09-30', 60, 'prof-1');
  for (const hour of ['10:30', '11:00', '11:30', '12:00']) assert.equal(slots.find(s => s.hora === hour).disponible, false);
  for (const hour of ['10:00', '12:30']) assert.equal(slots.find(s => s.hora === hour).disponible, true);
  storage._setItem('aura_turnos_v1', [{ fecha: '2026-09-30', hora: '11:00', duracionMinutos: 90, estado: 'Cancelado' }]);
  slots = await storage.getDisponibilidad('2026-09-30', 60, 'prof-1');
  assert.equal(slots.find(s => s.hora === '11:00').disponible, true);
});

test('Revalida disponibilidad antes de guardar y rechaza duplicados', async () => {
  const { storage } = setup();
  const dto = { profesionalId: 'prof-1', fecha: '2026-09-30', hora: '11:00', duracionMinutos: 60, cliente: {} };
  await storage.saveTurno(dto);
  await assert.rejects(storage.saveTurno(dto), /ya no está disponible/);
  assert.equal((await storage.getTurnos()).length, 1);
});

test('Cambiar fecha o servicio invalida el horario anterior', () => {
  const { context } = setup();
  const wizard = Object.create(context.window.Wizard.prototype);
  wizard.state = { fecha: '2026-09-30', hora: '11:00', servicio: { id: 'uno' } };
  wizard.btnNext = {};
  wizard.selectDate('2026-10-01');
  assert.equal(wizard.state.hora, null);
  wizard.state.hora = '11:00';
  wizard.selectService({ id: 'dos' });
  assert.equal(wizard.state.hora, null);
});

test('Calendario alinea el mes y permite selección por botones accesibles', () => {
  const { context } = setup();
  const cells = [];
  context.document.createElement = tag => ({ tag, classList: { add() {} }, setAttribute() {}, addEventListener() {} });
  const wizard = Object.create(context.window.Wizard.prototype);
  Object.assign(wizard, { calCurrentDate: new Date(2026, 8, 1), calendarDaysGrid: { appendChild: c => cells.push(c) }, calendarMonthTitle: {}, calPrevBtn: {}, state: { profesional: { id: 'prof-1' } }, negocio: { diasApertura: [2,3,4,5,6] } });
  wizard.renderCalendar();
  assert.equal(cells.length, 32); // Septiembre comienza el martes: dos huecos.
  assert.equal(cells[2].tag, 'button');
  assert.equal(cells[2].disabled, true);
  assert.equal(cells[30].disabled, false); // Martes 29, fecha actual.
  assert.equal(wizard.calPrevBtn.disabled, true);
});

test('Guarda el profesional elegido y separa sus reservas de las de otros profesionales', async () => {
  const { storage, values } = setup();
  const dto = { profesionalId: 'prof-2', fecha: '2026-09-30', hora: '11:00', duracionMinutos: 60, cliente: {} };
  const turno = await storage.saveTurno(dto);
  assert.equal(turno.profesionalNombre, 'Mariano Echavarria');
  assert.equal(JSON.parse(values.get('aura_turnos_v1'))[0].profesionalId, 'prof-2');
  assert.equal((await storage.getDisponibilidad(dto.fecha, 60, 'prof-2')).find(s => s.hora === dto.hora).disponible, false);
  assert.equal((await storage.getDisponibilidad(dto.fecha, 60, 'prof-1')).find(s => s.hora === dto.hora).disponible, true);
  await assert.rejects(storage.saveTurno(dto), /ya no está disponible/);
  await storage.saveTurno({ ...dto, profesionalId: 'prof-1' });
  assert.equal((await storage.getTurnos()).length, 2);
});

test('Exige profesional activo y respeta sus días y horarios', async () => {
  const { storage } = setup();
  const equipo = await storage.getEquipo();
  equipo[1].diasLaborales = [3];
  equipo[1].horarioInicio = '12:00';
  equipo[1].horarioFin = '15:00';
  equipo[2].activo = false;
  storage._setItem('aura_equipo_v1', equipo);
  assert.equal((await storage.getDisponibilidad('2026-10-01', 60, 'prof-2')).length, 0);
  const slots = await storage.getDisponibilidad('2026-09-30', 60, 'prof-2');
  assert.equal(slots[0].hora, '12:00');
  assert.equal(slots.at(-1).hora, '14:00');
  for (const profesionalId of [undefined, 'no-existe', 'prof-3']) {
    assert.equal((await storage.getDisponibilidad('2026-09-30', 60, profesionalId)).length, 0);
    await assert.rejects(storage.saveTurno({ profesionalId }), /profesional disponible/);
  }
});

test('Cambiar de profesional invalida fecha y horario anteriores', () => {
  const { context } = setup();
  const wizard = Object.create(context.window.Wizard.prototype);
  wizard.equipo = [{ id: 'prof-1', activo: true }, { id: 'prof-2', activo: true }];
  wizard.state = { profesional: wizard.equipo[0], fecha: '2026-09-30', hora: '11:00' };
  wizard.btnNext = {};
  wizard.selectProfessional('prof-2');
  assert.equal(wizard.state.profesional.id, 'prof-2');
  assert.equal(wizard.state.fecha, null);
  assert.equal(wizard.state.hora, null);
  assert.equal(wizard.btnNext.disabled, true);
});

test('El asistente envía la selección al guardar y la muestra en resumen y confirmación', async () => {
  const { context, storage } = setup();
  const wizard = Object.create(context.window.Wizard.prototype);
  const summaryName = {}, confirmationName = {};
  wizard.summaryContainer = { querySelector: () => summaryName };
  wizard.confirmationContainer = { querySelector: () => confirmationName };
  wizard.btnNext = {};
  wizard.updateStepUI = () => {};
  wizard.showToast = () => {};
  wizard.state = { profesional: (await storage.getEquipo())[2], servicio: { id: 'srv-1', nombre: 'Alisado', duracionMinutos: 60, precio: 150000 }, fecha: '2026-09-30', hora: '11:00', cliente: { nombre: 'Prueba', apellido: 'Reserva' } };
  wizard.renderSummary();
  assert.equal(summaryName.textContent, 'Sofía Carrizo');
  await wizard.confirmBooking();
  assert.equal(wizard.currentStep, 6);
  assert.equal(confirmationName.textContent, 'Sofía Carrizo');
  assert.equal((await storage.getTurnos())[0].profesionalId, 'prof-3');
});
