// ─── Silo Dumping Moisture & Condition Check Module ───────────────────────

(() => {
try {
const LS_SD = 'fm_silo_dump';
let sdData = [];
try {
    sdData = JSON.parse(localStorage.getItem(LS_SD) || '[]');
} catch (e) {
    console.error("Failed to parse silo dump data from localStorage:", e);
}
let activeSdId = null;

const inp = (id, w = '100%') => `<input type="text" id="${id}" style="width:${w};border-radius:4px;border:1px solid var(--card-border);padding:0.4rem;outline:none;">`;

const generateTimeSlots = (shift) => {
    let startHour = 0;
    if (shift === 'Morning') startHour = 6;
    else if (shift === 'Evening') startHour = 14;
    else if (shift === 'Night') startHour = 22;

    const slots = [];
    for (let i = 0; i < 16; i++) {
        let totalMinutes = startHour * 60 + i * 30;
        let h = Math.floor(totalMinutes / 60) % 24;
        let m = totalMinutes % 60;
        
        let ampm = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        
        const mStr = m === 0 ? '00' : '30';
        const hStr = h12 < 10 ? '0' + h12 : h12;
        
        slots.push(`${hStr}:${mStr} ${ampm}`);
    }
    return slots;
};

const buildSdUI = (shift) => {
    const times = generateTimeSlots(shift);
    let html = '';
    times.forEach((t, i) => {
        html += `
        <tr>
            <td style="font-weight:bold;color:var(--text-secondary);padding:0.5rem;">${t}</td>
            <td style="padding:0.2rem;">${inp(`sd-mat-${i}`)}</td>
            
            <td style="padding:0.2rem; border-left:2px solid #ccc;">${inp(`sd-amois-${i}`)}</td>
            <td style="padding:0.2rem;">${inp(`sd-acr-${i}`)}</td>
            <td style="padding:0.2rem;">${inp(`sd-acond-${i}`)}</td>
            <td style="padding:0.2rem; border-right:2px solid #ccc;">${inp(`sd-asilo-${i}`)}</td>

            <td style="padding:0.2rem;">${inp(`sd-bmois-${i}`)}</td>
            <td style="padding:0.2rem;">${inp(`sd-bcr-${i}`)}</td>
            <td style="padding:0.2rem;">${inp(`sd-bcond-${i}`)}</td>
            <td style="padding:0.2rem;">${inp(`sd-bsilo-${i}`)}</td>
        </tr>`;
    });
    
    const tbody = document.getElementById('sd-tbody');
    if (tbody) tbody.innerHTML = html;
};

const clearSdForm = () => {
    const today = new Date();
    document.getElementById('sd-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
    document.getElementById('sd-shift').value = 'Morning';
    document.getElementById('sd-officer').value = '';
    
    buildSdUI('Morning');
    
    document.getElementById('sd-remarks').value = '';
    document.getElementById('sd-apm').value = '';
};

const renderSdTable = () => {
    // Always reload from localStorage so previously saved reports appear
    try { sdData = JSON.parse(localStorage.getItem(LS_SD) || '[]'); } catch(e) {}
    const tbody = document.querySelector('#silo-dump-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (sdData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2rem;">No Silo Dumping reports found.</td></tr>';
        return;
    }
    [...sdData].reverse().forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.date}</td>
            <td><span style="background:var(--accent-glow);color:var(--accent-color);padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;font-size:0.85rem;">${p.shift}</span></td>
            <td>${p.officer || '—'}</td>
            <td>
                <button class="btn btn-secondary" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="editSd(${p.id})">Edit</button>
                <button class="btn btn-danger" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="deleteSd(${p.id})">Del</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

const getVal = id => document.getElementById(id) ? document.getElementById(id).value : '';
const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val || ''; };

const saveSd = () => {
    const date = getVal('sd-date');
    const shift = getVal('sd-shift');
    const officer = getVal('sd-officer');
    if (!date) return alert('Date is required!');

    const rows = [];
    for (let i = 0; i < 16; i++) {
        rows.push({
            mat: getVal(`sd-mat-${i}`),
            amois: getVal(`sd-amois-${i}`),
            acr: getVal(`sd-acr-${i}`),
            acond: getVal(`sd-acond-${i}`),
            asilo: getVal(`sd-asilo-${i}`),
            bmois: getVal(`sd-bmois-${i}`),
            bcr: getVal(`sd-bcr-${i}`),
            bcond: getVal(`sd-bcond-${i}`),
            bsilo: getVal(`sd-bsilo-${i}`)
        });
    }

    const remarks = getVal('sd-remarks');
    const apm = getVal('sd-apm');

    const data = {
        date, shift, officer, rows, remarks, apm
    };

    if (activeSdId) {
        const idx = sdData.findIndex(x => x.id === activeSdId);
        if (idx !== -1) { data.id = activeSdId; sdData[idx] = data; }
    } else {
        data.id = Date.now();
        sdData.push(data);
    }
    
    localStorage.setItem(LS_SD, JSON.stringify(sdData));
    renderSdTable();
    document.getElementById('silo-dump-modal').classList.remove('show');
    if (window.updateAllSubreportBadges) window.updateAllSubreportBadges();
};

const loadSdToForm = (data) => {
    setVal('sd-date', data.date);
    setVal('sd-shift', data.shift);
    setVal('sd-officer', data.officer);
    
    buildSdUI(data.shift);

    if (data.rows) {
        data.rows.forEach((r, i) => {
            setVal(`sd-mat-${i}`, r.mat);
            setVal(`sd-amois-${i}`, r.amois);
            setVal(`sd-acr-${i}`, r.acr);
            setVal(`sd-acond-${i}`, r.acond);
            setVal(`sd-asilo-${i}`, r.asilo);
            
            setVal(`sd-bmois-${i}`, r.bmois);
            setVal(`sd-bcr-${i}`, r.bcr);
            setVal(`sd-bcond-${i}`, r.bcond);
            setVal(`sd-bsilo-${i}`, r.bsilo);
        });
    }

    setVal('sd-remarks', data.remarks);
    setVal('sd-apm', data.apm);
};

window.editSd = (id) => {
    const d = sdData.find(x => x.id === id);
    if (!d) return;
    activeSdId = id;
    loadSdToForm(d);
    document.getElementById('silo-dump-modal').classList.add('show');
};

window.deleteSd = (id) => {
    if (!confirm('Delete this report?')) return;
    sdData = sdData.filter(x => x.id !== id);
    localStorage.setItem(LS_SD, JSON.stringify(sdData));
    renderSdTable();
};

window.initSiloDumpEvents = () => {
    
    const shiftSel = document.getElementById('sd-shift');
    if (shiftSel) {
        shiftSel.addEventListener('change', (e) => {
            // Warning: Changing shift clears table inputs
            buildSdUI(e.target.value);
        });
    }

    window.openSiloDumpModal = () => {
        activeSdId = null;
        clearSdForm();
        const modal = document.getElementById('silo-dump-modal');
        if (modal) modal.classList.add('show');
    };

    const btnAdd = document.getElementById('btn-add-silo-dump');
    if (btnAdd) {
        btnAdd.addEventListener('click', window.openSiloDumpModal);
    }

    const btnSave = document.getElementById('btn-save-sd');
    if (btnSave) btnSave.addEventListener('click', saveSd);

    const btnClose1 = document.getElementById('silo-dump-close');
    if (btnClose1) btnClose1.addEventListener('click', () => document.getElementById('silo-dump-modal').classList.remove('show'));
    
    const btnClose2 = document.getElementById('btn-cancel-sd');
    if (btnClose2) btnClose2.addEventListener('click', () => document.getElementById('silo-dump-modal').classList.remove('show'));

    renderSdTable();
};

// Allow external code to refresh the table after data sync
window.refreshSiloDumpData = () => {
    try { sdData = JSON.parse(localStorage.getItem(LS_SD) || '[]'); } catch(e) {}
    renderSdTable();
};
} catch (err) {
    if (window.showRuntimeError) {
        window.showRuntimeError('silo_dump.js', err);
    } else {
        console.error('silo_dump.js error:', err);
    }
}
})();
