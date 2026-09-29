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
  const context = vm.createContext({ Date: FixedDate, URL, URLSearchParams, console, document,
    window: {location:{pathname:'/pages/reservas.html',href:'http://localhost/pages/reservas.html'}}, localStorage: { getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value) } });
  vm.runInContext(fs.readFileSync('js/data.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('js/storage.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('js/reservas.js', 'utf8') + '\nwindow.Wizard = BookingWizard;', context);
  const storage = context.window.StorageService;
  storage.init();
  return { storage, context, values };
}

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


test('Una falla de red rechaza el guardado y nunca escribe localStorage', async () => {
  const { storage, context, values } = setup();
  context.fetch = async () => { throw new Error('NetworkError'); };
  await assert.rejects(storage.saveTurno({profesionalId:1,servicioId:1,cliente:{}}), /No se pudo conectar/);
  assert.equal(values.size,0);
});
test('Una respuesta HTML genera un mensaje claro', async () => {
  const { storage, context } = setup();
  context.fetch=async()=>({headers:{get:()=> 'text/html'}});
  await assert.rejects(storage.getServicios(), /Respuesta inválida/);
});
test('Preselección usa claves públicas y conserva los IDs reales de MySQL', async () => {
  const { context, storage } = setup();
  context.window.location={search:'?servicio=srv-2&profesional=prof-4'};
  storage.getServicios=async()=>[{id:52,clave:'srv-2',activo:true}];
  const wizard=Object.create(context.window.Wizard.prototype);
  Object.assign(wizard,{equipo:[{id:44,clave:'prof-4',activo:true}],state:{},btnNext:{},professionalSelect:{}});
  await wizard.checkUrlParams();
  assert.equal(wizard.state.profesional.id,44);
  assert.equal(wizard.state.servicio.id,52);
});
