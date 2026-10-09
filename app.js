// AIDEL demo: Medication Order screen
// REQ-001 retrieve weight · REQ-002 calculate max daily dose · REQ-003 alert
// REQ-004 justification to override · REQ-005 log alerts and justifications
const $ = (id) => document.getElementById(id);
const state = { patients: [], drugs: [], audit: [] };

async function load() {
  const [p, d] = await Promise.all([
    fetch('data/patients.json').then((r) => r.json()),
    fetch('data/dose-reference.json').then((r) => r.json()),
  ]);
  state.patients = p.patients;
  state.drugs = d.drugs;
  $('patient').innerHTML = state.patients.map((x) => `<option value="${x.mrn}">${x.name} (${x.mrn})</option>`).join('');
  $('drug').innerHTML = state.drugs.map((x) => `<option value="${x.id}">${x.name}</option>`).join('');
  $('build').textContent = document.querySelector('meta[name=build]')?.content || 'local';
  ['patient', 'drug', 'dose', 'freq', 'reason'].forEach((id) => $(id).addEventListener('input', evaluate));
  $('submit').addEventListener('click', submit);
  evaluate();
}

const patient = () => state.patients.find((x) => x.mrn === $('patient').value);
const drug = () => state.drugs.find((x) => x.id === $('drug').value);

// REQ-002
function maxDailyDose(p, d) {
  if (p.weightKg == null) return null;
  return Math.min(d.maxMgPerKgPerDay * p.weightKg, d.absoluteMaxMgPerDay);
}

function evaluate() {
  const p = patient(), d = drug();
  // REQ-001
  $('weight').textContent = p.weightKg == null
    ? 'Patient weight is missing – record a weight before ordering.'
    : `Weight: ${p.weightKg} kg (recorded ${p.weightRecorded})`;

  const dose = parseFloat($('dose').value) || 0;
  const freq = parseInt($('freq').value, 10) || 1;
  const daily = dose * freq;
  const max = maxDailyDose(p, d);
  $('calc').textContent = max == null ? '' : `Ordered daily dose: ${daily} mg · Maximum for this patient: ${max} mg/day`;

  const alert = $('alert');
  const exceeded = max != null && daily > max;
  // REQ-003 (changed): over 2x the maximum is a hard stop that a justification cannot override
  const hardStop = max != null && daily > 2 * max;
  if (hardStop) {
    alert.hidden = false;
    alert.className = 'stop';
    alert.textContent = `HARD STOP: ${daily} mg/day is more than twice the ${max} mg/day limit for ${p.weightKg} kg. Reduce the dose or contact Pharmacy.`;
  } else if (exceeded) {
    alert.hidden = false;
    alert.className = 'warn';
    alert.textContent = `Maximum-dose alert: ${daily} mg/day exceeds the ${max} mg/day limit for ${p.weightKg} kg.`;
  } else {
    alert.hidden = true;
  }
  // REQ-004
  $('justify').hidden = !exceeded || hardStop;
  const needsReason = exceeded && !$('reason').value.trim();
  $('submit').disabled = p.weightKg == null || dose <= 0 || needsReason || hardStop;
  return { p, d, daily, max, exceeded, hardStop };
}

function submit() {
  const r = evaluate();
  if (r.exceeded) {
    // REQ-005
    const entry = `${new Date().toISOString()} · ${r.p.mrn} · ${r.d.id} · ${r.daily} mg/day > ${r.max} · override: "${$('reason').value.trim()}"`;
    state.audit.unshift(entry);
    $('audit').innerHTML = state.audit.map((x) => `<li>${x}</li>`).join('');
  }
  $('result').className = 'ok';
  $('result').textContent = r.exceeded ? 'Order signed with documented override.' : 'Order signed.';
}

load();
