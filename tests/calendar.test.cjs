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
  const context = vm.createContext({ Date: FixedDate, console, document,
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
    assert.equal((await storage.getDisponibilidad(date)).length, 0, date);
  }
});

test('Hoy descarta horarios vencidos y respeta duración y cierre', async () => {
  const { storage } = setup();
  const slots = await storage.getDisponibilidad('2026-09-29', 90);
  assert.equal(slots.find(s => s.hora === '10:00').disponible, false);
  assert.equal(slots.find(s => s.hora === '10:30').disponible, true);
  assert.equal(slots.at(-1).hora, '17:30');
});

test('Evita solapamientos, permite límites contiguos y libera cancelados', async () => {
  const { storage } = setup();
  storage._setItem('aura_turnos_v1', [{ fecha: '2026-09-30', hora: '11:00', duracionMinutos: '90', estado: 'Pendiente' }]);
  let slots = await storage.getDisponibilidad('2026-09-30', 60);
  for (const hour of ['10:30', '11:00', '11:30', '12:00']) assert.equal(slots.find(s => s.hora === hour).disponible, false);
  for (const hour of ['10:00', '12:30']) assert.equal(slots.find(s => s.hora === hour).disponible, true);
  storage._setItem('aura_turnos_v1', [{ fecha: '2026-09-30', hora: '11:00', duracionMinutos: 90, estado: 'Cancelado' }]);
  slots = await storage.getDisponibilidad('2026-09-30', 60);
  assert.equal(slots.find(s => s.hora === '11:00').disponible, true);
});

test('Revalida disponibilidad antes de guardar y rechaza duplicados', async () => {
  const { storage } = setup();
  const dto = { fecha: '2026-09-30', hora: '11:00', duracionMinutos: 60, cliente: {} };
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
  Object.assign(wizard, { calCurrentDate: new Date(2026, 8, 1), calendarDaysGrid: { appendChild: c => cells.push(c) }, calendarMonthTitle: {}, calPrevBtn: {}, state: {}, negocio: { diasApertura: [2,3,4,5,6] } });
  wizard.renderCalendar();
  assert.equal(cells.length, 32); // Septiembre comienza el martes: dos huecos.
  assert.equal(cells[2].tag, 'button');
  assert.equal(cells[2].disabled, true);
  assert.equal(cells[30].disabled, false); // Martes 29, fecha actual.
  assert.equal(wizard.calPrevBtn.disabled, true);
});
