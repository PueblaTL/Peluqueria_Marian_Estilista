import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

let row = { id: 1, estado: 'Pendiente', fecha: '2026-09-24', nombre: '<img onerror=alert(1)>', apellido: 'QA', email: 'qa@example.test', telefono: '12345678' };
let rejectUpdate = false;
const context = vm.createContext({ console: { error() {} }, document: { addEventListener() {} }, window: {
  API_BASE: '/backend/api', StorageService: {
    getInscripciones: async () => [row],
    updateInscripcionEstado: async (id, estado) => { if (rejectUpdate) throw new Error('Guardado rechazado'); row.estado = estado; }
  }, requestApi: async () => { row.certificadoCodigo = 'ME-CERT-QA'; }
} });
vm.runInContext(fs.readFileSync(new URL('../../frontend/js/admin.js', import.meta.url), 'utf8') + '\nglobalThis.Dashboard = AdminDashboard;', context);
const dashboard = Object.create(context.Dashboard.prototype);
dashboard.cursoInscriptosTable = { innerHTML: '' };
const toasts = [];
dashboard.showToast = message => toasts.push(message);
await dashboard.loadCursoInscriptosTable();
assert.match(dashboard.cursoInscriptosTable.innerHTML, /value="completado"/);
assert.match(dashboard.cursoInscriptosTable.innerHTML, /disabled title=/);
assert.ok(!dashboard.cursoInscriptosTable.innerHTML.includes('<img onerror'));
const select = { disabled: false, value: 'completado', dataset: { estado: 'Pendiente' } };
await dashboard.cambiarEstadoInscripcion(1, 'completado', select);
assert.match(dashboard.cursoInscriptosTable.innerHTML, />Completado<\/span>/);
assert.ok(!dashboard.cursoInscriptosTable.innerHTML.includes('disabled title='));
assert.ok(toasts.at(-1).includes('completó el curso'));
await dashboard.generarCertificado(1, { disabled: false, textContent: '' });
assert.match(dashboard.cursoInscriptosTable.innerHTML, /Ver certificado/);
assert.ok(!dashboard.cursoInscriptosTable.innerHTML.includes('>Generar certificado<'));
rejectUpdate = true;
await dashboard.cambiarEstadoInscripcion(1, 'Pendiente', select);
assert.equal(select.value, 'completado');
assert.equal(select.disabled, false);
assert.equal(row.estado, 'completado');
console.log('OK: selector integrado, generación condicionada, confirmación, ver certificado, escape HTML y restauración ante error.');
