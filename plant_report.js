// ─── Shift Plant Report Module ────────────────────────────────────────────
(() => {
try {
const LS_PLANT_REPORT = 'fm_plant_report';
let plantReportsData = [];
try {
    plantReportsData = JSON.parse(localStorage.getItem(LS_PLANT_REPORT) || '[]');
} catch (e) {
    console.error("Failed to parse plant report data from localStorage:", e);
}
let activePlantReportId = null;

const pLocations = ['Basement', 'Ground Flr', '1st Flr (19)', '2nd Flr (51)', '3rd Flr (67)', '4th Flr (91)', 'Roof (110)', 'Silos Top', 'Silos Tower', 'Dryer Side'];
const pParams = [
    'Floor & Walls Cleaning',
    'Machine Cleaning',
    'Leakage',
    'Abnormal Machine Sound',
    'Unnecessary item'
];

const inp = (id, w = '100%') => `<input type="text" id="${id}" style="width:${w};border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;">`;
const num = (id, w = '100%') => `<input type="number" step="any" id="${id}" style="width:${w};border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;">`;
const chk = (id) => `<input type="checkbox" id="${id}" style="transform:scale(1.2);cursor:pointer;">`;

const offSel = (id) => `<select id="${id}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);"><option value="">Select Officer</option><option value="M. Zubair">M. Zubair</option><option value="M. Tahir">M. Tahir</option><option value="M. Shoaib">M. Shoaib</option></select>`;
const opSel = (id) => `<select id="${id}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);"><option value="">Select Operator</option><option value="M. Saifal">M. Saifal</option><option value="M. Umer">M. Umer</option><option value="M. Deen">M. Deen</option><option value="M. Akmel">M. Akmel</option><option value="M. Farrukh">M. Farrukh</option></select>`;

const getShiftTimes = (shiftName) => {
    if(shiftName === 'Morning') return {st:'06:00 AM', fn:'02:00 PM'};
    if(shiftName === 'Evening') return {st:'02:00 PM', fn:'10:00 PM'};
    if(shiftName === 'Night') return {st:'10:00 PM', fn:'06:00 AM'};
    return {st:'', fn:''};
};

const buildShiftDetailsUI = () => {
    let html = `<tr>
        <td>${offSel('pr-shift-officer')}</td>
        <td>
            <div style="display:flex;gap:0.4rem;align-items:center;">
                ${opSel('pr-shift-op1')}
                <span style="font-weight:bold;color:var(--text-secondary);">+</span>
                ${opSel('pr-shift-op2')}
            </div>
        </td>
        <td style="text-align:center;color:var(--text-secondary);" id="pr-shift-st-text">06:00 AM</td>
        <td style="text-align:center;color:var(--text-secondary);" id="pr-shift-fn-text">02:00 PM</td>
    </tr>`;
    const el = document.getElementById('pr-shift-tbody');
    if (el) el.innerHTML = html;
};

const build5SUI = () => {

    let rec = `<tr>
        <td>${num('pr-rec-work')}</td>
        <td>${num('pr-rec-avg')}</td>
        <td>${inp('pr-rec-rem')}</td>
    </tr>`;
    const recEl = document.getElementById('pr-receiving-tbody');
    if (recEl) recEl.innerHTML = rec;
};

const buildQCGrindingUI = () => {
    let qc = `<tr>
        <td>${inp('pr-qc-time', '80px')}</td>
        <td>${num('pr-qc-moist')}</td>
        <td>${inp('pr-qc-micro')}</td>
        <td>${num('pr-qc-bag')}</td>
        <td>${inp('pr-qc-rem')}</td>
    </tr>`;
    const qcEl = document.getElementById('pr-qc-tbody');
    if (qcEl) qcEl.innerHTML = qc;

    let grd = '';
    for (let i = 0; i < 3; i++) {
        grd += `<tr>
            <td>${inp(`pr-grd-grinder-${i}`, '80px')}</td>
            <td>${inp(`pr-grd-time-${i}`, '80px')}</td>
            <td>${inp(`pr-grd-mat-${i}`)}</td>
            <td>${num(`pr-grd-hz-${i}`)}</td>
            <td style="display:flex;gap:0.25rem;">${num(`pr-grd-amp-act-${i}`, '50%')} ${num(`pr-grd-amp-max-${i}`, '50%')}</td>
            <td>${num(`pr-grd-overs-${i}`)}</td>
            <td>${inp(`pr-grd-rem-${i}`)}</td>
        </tr>`;
    }
    const grdEl = document.getElementById('pr-grinding-tbody');
    if (grdEl) grdEl.innerHTML = grd;
};

const pmSel = (id) => `<select id="${id}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);"><option value="">Select Mill</option><option value="Pellet Mill A">Pellet Mill A</option><option value="Pellet Mill B">Pellet Mill B</option></select>`;
const sifterSel = (id) => `<select id="${id}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;background:var(--card-bg);color:var(--text-primary);"><option value="">Select Sifter</option><option value="8">8</option><option value="10">10</option></select>`;
const dumperInp = (id) => `
    <input type="text" id="${id}" list="dumper-options-${id}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;" placeholder="Select or type">
    <datalist id="dumper-options-${id}">
        <option value="Fully Open">
    </datalist>
`;

const buildPelletingUI = () => {
    let p = '';
    for (let i = 0; i < 4; i++) {
        p += `<tr>
            <td>${pmSel(`pr-pel-mill-${i}`)}</td>
            <td>${inp(`pr-pel-time-${i}`, '80px')}</td>
            <td>${inp(`pr-pel-feed-${i}`, '80px')}</td>
            <td>${num(`pr-pel-hz-${i}`, '70px')}</td>
            <td style="display:flex;gap:0.25rem;min-width:110px;">${num(`pr-pel-amp-act-${i}`, '50%')} ${num(`pr-pel-amp-max-${i}`, '50%')}</td>
            <td>${num(`pr-pel-pow-${i}`, '60px')}</td>
            <td>${num(`pr-pel-temp-${i}`, '60px')}</td>
            <td>${sifterSel(`pr-pel-sifter-${i}`)}</td>
            <td>${dumperInp(`pr-pel-dumper-${i}`)}</td>
            <td>${inp(`pr-pel-rem-${i}`)}</td>
        </tr>`;
    }
    const pelEl = document.getElementById('pr-pelleting-tbody');
    if (pelEl) pelEl.innerHTML = p;
};

const buildPhysicalVisitUI = () => {
    let pv = '';
    pParams.forEach((param, pIdx) => {
        pv += `<tr style="border-bottom:1px solid var(--card-border);">`;
        pv += `<td style="padding:0.4rem;font-size:0.8rem;font-weight:bold;">${param}</td>`;
        pLocations.forEach((loc, lIdx) => {
            pv += `<td style="text-align:center;">${chk(`pr-pv-${pIdx}-${lIdx}`)}</td>`;
        });
        pv += `</tr>`;
    });
    const pvEl = document.getElementById('pr-physical-tbody');
    if (pvEl) pvEl.innerHTML = pv;
};

const buildAllTabsUI = () => {
    buildShiftDetailsUI();
    build5SUI();
    buildQCGrindingUI();
    buildPelletingUI();
    buildPhysicalVisitUI();
};

const clearPlantReportForm = () => {
    const today = new Date();
    document.getElementById('pr-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' }) + '-' + today.getFullYear();
    document.getElementById('pr-shift-select').value = 'Morning';
    updateShiftTimes();
    document.querySelectorAll('#plant-report-modal input[type="text"], #plant-report-modal input[type="number"], #plant-report-modal select').forEach(el => {
        if(el.id !== 'pr-shift-select' && el.id !== 'pr-date') el.value = '';
    });
    document.querySelectorAll('#plant-report-modal input[type="checkbox"]').forEach(el => el.checked = false);
};

const updateShiftTimes = () => {
    const s = document.getElementById('pr-shift-select').value;
    const t = getShiftTimes(s);
    if(document.getElementById('pr-shift-st-text')) document.getElementById('pr-shift-st-text').textContent = t.st;
    if(document.getElementById('pr-shift-fn-text')) document.getElementById('pr-shift-fn-text').textContent = t.fn;
};

const getVal = id => document.getElementById(id) ? document.getElementById(id).value : '';
const getChk = id => document.getElementById(id) ? document.getElementById(id).checked : false;
const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val || ''; };
const setChk = (id, val) => { if (document.getElementById(id)) document.getElementById(id).checked = !!val; };

const savePlantReport = () => {
    const date = getVal('pr-date');
    const shift = getVal('pr-shift-select');
    if (!date) return alert('Date is required!');

    const op1 = getVal('pr-shift-op1') || '';
    const op2 = getVal('pr-shift-op2') || '';
    const opCombine = (op1 && op2) ? `${op1} + ${op2}` : (op1 || op2);

    const data = {
        date,
        shift,
        shiftDetails: { off: getVal('pr-shift-officer'), op: opCombine, st: getShiftTimes(shift).st, fn: getShiftTimes(shift).fn },
        fiveS: { cr: getVal('pr-5s-control'), pm: getVal('pr-5s-pellet'), b: getVal('pr-5s-batch'), rm: getVal('pr-5s-rem') },
        rec: { wf: getVal('pr-rec-work'), avg: getVal('pr-rec-avg'), rm: getVal('pr-rec-rem') },
        qc: { t: getVal('pr-qc-time'), m: getVal('pr-qc-moist'), mi: getVal('pr-qc-micro'), b: getVal('pr-qc-bag'), rm: getVal('pr-qc-rem') },
        grd: [0, 1, 2].map(i => ({
            g: getVal(`pr-grd-grinder-${i}`),
            t: getVal(`pr-grd-time-${i}`),
            m: getVal(`pr-grd-mat-${i}`),
            hz: getVal(`pr-grd-hz-${i}`),
            aa: getVal(`pr-grd-amp-act-${i}`),
            am: getVal(`pr-grd-amp-max-${i}`),
            ov: getVal(`pr-grd-overs-${i}`),
            rm: getVal(`pr-grd-rem-${i}`)
        })),
        pel: [0, 1, 2, 3].map(i => ({
            m: getVal(`pr-pel-mill-${i}`),
            t: getVal(`pr-pel-time-${i}`),
            f: getVal(`pr-pel-feed-${i}`),
            hz: getVal(`pr-pel-hz-${i}`),
            aa: getVal(`pr-pel-amp-act-${i}`),
            am: getVal(`pr-pel-amp-max-${i}`),
            p: getVal(`pr-pel-pow-${i}`),
            tm: getVal(`pr-pel-temp-${i}`),
            sm: getVal(`pr-pel-sifter-${i}`),
            d: getVal(`pr-pel-dumper-${i}`),
            rm: getVal(`pr-pel-rem-${i}`)
        })),
        pv: pParams.map((_, pIdx) => pLocations.map((__, lIdx) => getChk(`pr-pv-${pIdx}-${lIdx}`)))
    };

    if (activePlantReportId) {
        const idx = plantReportsData.findIndex(x => x.id === activePlantReportId);
        if (idx !== -1) { data.id = activePlantReportId; plantReportsData[idx] = data; }
    } else {
        data.id = Date.now();
        plantReportsData.push(data);
    }
    
    localStorage.setItem(LS_PLANT_REPORT, JSON.stringify(plantReportsData));
    window.renderPlantReportTable();
    document.getElementById('plant-report-modal').classList.remove('show');
    if (window.updateAllSubreportBadges) window.updateAllSubreportBadges();
};

const loadPlantReportToForm = (data) => {
    setVal('pr-date', data.date);
    setVal('pr-shift-select', data.shift);
    updateShiftTimes();
    
    setVal('pr-shift-officer', data.shiftDetails?.off);
    
    const opVal = data.shiftDetails?.op || '';
    const parts = opVal.split(' + ');
    setVal('pr-shift-op1', parts[0] || '');
    setVal('pr-shift-op2', parts[1] || '');

    setVal('pr-5s-control', data.fiveS?.cr);
    setVal('pr-5s-pellet', data.fiveS?.pm);
    setVal('pr-5s-batch', data.fiveS?.b);
    setVal('pr-5s-rem', data.fiveS?.rm);

    setVal('pr-rec-work', data.rec?.wf);
    setVal('pr-rec-avg', data.rec?.avg);
    setVal('pr-rec-rem', data.rec?.rm);

    setVal('pr-qc-time', data.qc?.t);
    setVal('pr-qc-moist', data.qc?.m);
    setVal('pr-qc-micro', data.qc?.mi);
    setVal('pr-qc-bag', data.qc?.b);
    setVal('pr-qc-rem', data.qc?.rm);

    for (let i = 0; i < 3; i++) {
        if (Array.isArray(data.grd)) {
            const r = data.grd[i] || {};
            setVal(`pr-grd-grinder-${i}`, r.g);
            setVal(`pr-grd-time-${i}`, r.t);
            setVal(`pr-grd-mat-${i}`, r.m);
            setVal(`pr-grd-hz-${i}`, r.hz);
            setVal(`pr-grd-amp-act-${i}`, r.aa);
            setVal(`pr-grd-amp-max-${i}`, r.am);
            setVal(`pr-grd-overs-${i}`, r.ov);
            setVal(`pr-grd-rem-${i}`, r.rm);
        } else {
            if (i === 0 && data.grd) {
                setVal(`pr-grd-grinder-0`, data.grd.g);
                setVal(`pr-grd-time-0`, data.grd.t);
                setVal(`pr-grd-mat-0`, data.grd.m);
                setVal(`pr-grd-hz-0`, data.grd.hz);
                setVal(`pr-grd-amp-act-0`, data.grd.aa);
                setVal(`pr-grd-amp-max-0`, data.grd.am);
                setVal(`pr-grd-overs-0`, data.grd.ov);
                setVal(`pr-grd-rem-0`, data.grd.rm);
            } else {
                setVal(`pr-grd-grinder-${i}`, '');
                setVal(`pr-grd-time-${i}`, '');
                setVal(`pr-grd-mat-${i}`, '');
                setVal(`pr-grd-hz-${i}`, '');
                setVal(`pr-grd-amp-act-${i}`, '');
                setVal(`pr-grd-amp-max-${i}`, '');
                setVal(`pr-grd-overs-${i}`, '');
                setVal(`pr-grd-rem-${i}`, '');
            }
        }
    }

    for (let i = 0; i < 4; i++) {
        if (Array.isArray(data.pel)) {
            const r = data.pel[i] || {};
            setVal(`pr-pel-mill-${i}`, r.m);
            setVal(`pr-pel-time-${i}`, r.t);
            setVal(`pr-pel-feed-${i}`, r.f);
            setVal(`pr-pel-hz-${i}`, r.hz);
            setVal(`pr-pel-amp-act-${i}`, r.aa);
            setVal(`pr-pel-amp-max-${i}`, r.am);
            setVal(`pr-pel-pow-${i}`, r.p);
            setVal(`pr-pel-temp-${i}`, r.tm);
            setVal(`pr-pel-sifter-${i}`, r.sm);
            setVal(`pr-pel-dumper-${i}`, r.d);
            setVal(`pr-pel-rem-${i}`, r.rm);
        } else {
            if (i === 0 && data.pel) {
                setVal(`pr-pel-mill-0`, data.pel.m);
                setVal(`pr-pel-time-0`, data.pel.t);
                setVal(`pr-pel-feed-0`, data.pel.f);
                setVal(`pr-pel-hz-0`, data.pel.hz);
                setVal(`pr-pel-amp-act-0`, data.pel.aa);
                setVal(`pr-pel-amp-max-0`, data.pel.am);
                setVal(`pr-pel-pow-0`, data.pel.p);
                setVal(`pr-pel-temp-0`, data.pel.tm);
                setVal(`pr-pel-sifter-0`, data.pel.sm);
                setVal(`pr-pel-dumper-0`, data.pel.d);
                setVal(`pr-pel-rem-0`, data.pel.rm);
            } else {
                setVal(`pr-pel-mill-${i}`, '');
                setVal(`pr-pel-time-${i}`, '');
                setVal(`pr-pel-feed-${i}`, '');
                setVal(`pr-pel-hz-${i}`, '');
                setVal(`pr-pel-amp-act-${i}`, '');
                setVal(`pr-pel-amp-max-${i}`, '');
                setVal(`pr-pel-pow-${i}`, '');
                setVal(`pr-pel-temp-${i}`, '');
                setVal(`pr-pel-sifter-${i}`, '');
                setVal(`pr-pel-dumper-${i}`, '');
                setVal(`pr-pel-rem-${i}`, '');
            }
        }
    }

    pParams.forEach((_, pIdx) => {
        pLocations.forEach((__, lIdx) => {
            setChk(`pr-pv-${pIdx}-${lIdx}`, data.pv?.[pIdx]?.[lIdx]);
        });
    });
};

window.renderPlantReportTable = () => {
    try { plantReportsData = JSON.parse(localStorage.getItem(LS_PLANT_REPORT) || '[]'); } catch(e) {}
    const tbody = document.querySelector('#plant-report-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (plantReportsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2rem;">No plant reports found.</td></tr>';
        return;
    }
    [...plantReportsData].reverse().forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.date}</td>
            <td><span style="background:var(--accent-glow);color:var(--accent-color);padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;font-size:0.85rem;">${p.shift}</span></td>
            <td>${p.shiftDetails?.off || '—'}</td>
            <td>
                <button class="btn btn-secondary" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="editPlantReport(${p.id})">Edit</button>
                <button class="btn btn-danger" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="deletePlantReport(${p.id})">Del</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.editPlantReport = (id) => {
    const d = plantReportsData.find(x => x.id === id);
    if (!d) return;
    activePlantReportId = id;
    loadPlantReportToForm(d);
    document.getElementById('plant-report-modal').classList.add('show');
};

window.deletePlantReport = (id) => {
    if (!confirm('Delete this plant report?')) return;
    plantReportsData = plantReportsData.filter(x => x.id !== id);
    localStorage.setItem(LS_PLANT_REPORT, JSON.stringify(plantReportsData));
    window.renderPlantReportTable();
};

window.initPlantReportEvents = () => {
    buildAllTabsUI();
    
    const prShiftSel = document.getElementById('pr-shift-select');
    if (prShiftSel) prShiftSel.addEventListener('change', updateShiftTimes);

    window.openPlantReportModal = () => {
        activePlantReportId = null;
        clearPlantReportForm();
        const modal = document.getElementById('plant-report-modal');
        if (modal) modal.classList.add('show');
    };

    const btnAdd = document.getElementById('btn-add-plant-report');
    if (btnAdd) {
        btnAdd.addEventListener('click', window.openPlantReportModal);
    }

    const btnSave = document.getElementById('btn-save-pr');
    if (btnSave) btnSave.addEventListener('click', savePlantReport);

    const btnClose1 = document.getElementById('plant-report-close');
    if (btnClose1) btnClose1.addEventListener('click', () => document.getElementById('plant-report-modal').classList.remove('show'));
    
    const btnClose2 = document.getElementById('btn-cancel-pr');
    if (btnClose2) btnClose2.addEventListener('click', () => document.getElementById('plant-report-modal').classList.remove('show'));

    window.renderPlantReportTable();
};

window.refreshPlantReportData = () => {
    try { plantReportsData = JSON.parse(localStorage.getItem(LS_PLANT_REPORT) || '[]'); } catch(e) {}
    if (typeof window.renderPlantReportTable === 'function') window.renderPlantReportTable();
};
} catch (err) {
    if (window.showRuntimeError) {
        window.showRuntimeError('plant_report.js', err);
    } else {
        console.error('plant_report.js error:', err);
    }
}
})();
