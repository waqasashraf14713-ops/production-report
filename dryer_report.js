// dryer_report.js

let dryerReportData = {
    id: null,
    date: '',
    shift: '',
    operatorName: '',
    materialDumping: [],
    materialDischarge: [],
    silosDischargeGates: [],
    siloStatus: { silo08: {on:'', off:''}, silo09: {on:'', off:''}, silo10: {on:'', off:''}, silo11: {on:'', off:''}, silo12: {on:'', off:''}, silo13: {on:'', off:''}, silo14: {on:'', off:''}, silo15: {on:'', off:''}, silo16: {on:'', off:''} },
    faultsAndCauses: '',
    cleaning: {},
    underProcessWork: '',
    general: ''
};

function openDryerReportModal() {
    const modal = document.getElementById('dryer-report-modal');
    if (!modal) return;
    
    // Auto-fill date if global date is set
    const globalDate = document.getElementById('sr-filter-date') ? document.getElementById('sr-filter-date').value : '';
    document.getElementById('dryer-date').value = globalDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(/ /g, '-');
    document.getElementById('dryer-shift').value = 'A'; // Default
    
    // Clear dynamic tables
    document.getElementById('dryer-dumping-tbody').innerHTML = '';
    document.getElementById('dryer-discharge-tbody').innerHTML = '';
    
    // Add one default row
    addDryerDumpingRow();
    addDryerDischargeRow();
    
    // Render static gates table
    renderDryerGatesTable();
    
    modal.classList.add('show');
}

function closeDryerReportModal() {
    const modal = document.getElementById('dryer-report-modal');
    if (modal) modal.classList.remove('show');
}

function addDryerDumpingRow() {
    const tbody = document.getElementById('dryer-dumping-tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <select class="dump-mat" style="width:100%;">
                <option value="">Select...</option>
                <option value="Maize">Maize</option>
                <option value="Seed">Seed</option>
            </select>
        </td>
        <td><input type="time" class="dump-on" style="width:100%;"></td>
        <td><input type="time" class="dump-off" style="width:100%;"></td>
        <td>
            <select class="dump-bin" style="width:100%;">
                <option value="">Select...</option>
                ${Array.from({length: 16}, (_, i) => `<option value="Silo ${i+1}">Silo ${i+1}</option>`).join('')}
                <option value="Wet Bin 1">Wet Bin 1</option>
                <option value="Wet Bin 2">Wet Bin 2</option>
                <option value="Wet Bin 3">Wet Bin 3</option>
            </select>
        </td>
        <td><input type="text" class="dump-rem" style="width:100%;"></td>
        <td><button class="btn btn-danger" onclick="this.closest('tr').remove()" style="padding:0.25rem 0.5rem;">X</button></td>
    `;
    tbody.appendChild(tr);
}

function addDryerDischargeRow() {
    const tbody = document.getElementById('dryer-discharge-tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <select class="disc-mat" style="width:100%;">
                <option value="">Select...</option>
                <option value="Maize">Maize</option>
                <option value="Seed">Seed</option>
            </select>
        </td>
        <td>
            <select class="disc-silo" style="width:100%;">
                <option value="">Select...</option>
                ${Array.from({length: 16}, (_, i) => `<option value="Silo ${i+1}">Silo ${i+1}</option>`).join('')}
                <option value="Wet Bin 1">Wet Bin 1</option>
                <option value="Wet Bin 2">Wet Bin 2</option>
                <option value="Wet Bin 3">Wet Bin 3</option>
            </select>
        </td>
        <td><input type="time" class="disc-on" style="width:100%;"></td>
        <td><input type="time" class="disc-off" style="width:100%;"></td>
        <td><input type="text" class="disc-rem" style="width:100%;"></td>
        <td><button class="btn btn-danger" onclick="this.closest('tr').remove()" style="padding:0.25rem 0.5rem;">X</button></td>
    `;
    tbody.appendChild(tr);
}

function renderDryerGatesTable() {
    const tbody = document.getElementById('dryer-gates-tbody');
    tbody.innerHTML = '';
    const gates = [
        { conv: '', silo: '8' },
        { conv: 'A.29', silo: '9' },
        { conv: 'A.28', silo: '10' },
        { conv: '', silo: '11' },
        { conv: '', silo: '12' },
        { conv: '', silo: '13' },
        { conv: '', silo: '14' },
        { conv: '', silo: '15' },
        { conv: '', silo: '16' }
    ];
    gates.forEach((g, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${g.conv}</td>
            <td>${g.silo}</td>
            <td><input type="text" id="gate-num-${i}" style="width:100%;"></td>
            <td><input type="checkbox" id="gate-open-${i}"></td>
        `;
        tbody.appendChild(tr);
    });
}

function gatherDryerReportData() {
    const getVal = id => { const el = document.getElementById(id); return el ? el.value : ''; };
    const getChk = id => { const el = document.getElementById(id); return el ? el.checked : false; };
    
    // Dumping
    const dumping = [];
    document.querySelectorAll('#dryer-dumping-tbody tr').forEach(tr => {
        dumping.push({
            material: tr.querySelector('.dump-mat').value,
            onTime: tr.querySelector('.dump-on').value,
            offTime: tr.querySelector('.dump-off').value,
            siloWetBin: tr.querySelector('.dump-bin').value,
            remarks: tr.querySelector('.dump-rem').value
        });
    });
    
    // Discharge
    const discharge = [];
    document.querySelectorAll('#dryer-discharge-tbody tr').forEach(tr => {
        discharge.push({
            material: tr.querySelector('.disc-mat').value,
            siloNo: tr.querySelector('.disc-silo').value,
            onTime: tr.querySelector('.disc-on').value,
            offTime: tr.querySelector('.disc-off').value,
            remarks: tr.querySelector('.disc-rem').value
        });
    });
    
    // Gates
    const gates = [];
    const gateRows = [
        { conv: '', silo: '8' },
        { conv: 'A.29', silo: '9' },
        { conv: 'A.28', silo: '10' },
        { conv: '', silo: '11' },
        { conv: '', silo: '12' },
        { conv: '', silo: '13' },
        { conv: '', silo: '14' },
        { conv: '', silo: '15' },
        { conv: '', silo: '16' }
    ];
    gateRows.forEach((g, i) => {
        gates.push({
            conveyor: g.conv,
            silo: g.silo,
            gate: getVal(`gate-num-${i}`),
            isOpen: getChk(`gate-open-${i}`)
        });
    });
    
    // Silo Status
    const siloStatus = {
        silo08: { onTime: getVal('silo08-on'), offTime: getVal('silo08-off') },
        silo09: { onTime: getVal('silo09-on'), offTime: getVal('silo09-off') },
        silo10: { onTime: getVal('silo10-on'), offTime: getVal('silo10-off') },
        silo11: { onTime: getVal('silo11-on'), offTime: getVal('silo11-off') },
        silo12: { onTime: getVal('silo12-on'), offTime: getVal('silo12-off') },
        silo13: { onTime: getVal('silo13-on'), offTime: getVal('silo13-off') },
        silo14: { onTime: getVal('silo14-on'), offTime: getVal('silo14-off') },
        silo15: { onTime: getVal('silo15-on'), offTime: getVal('silo15-off') },
        silo16: { onTime: getVal('silo16-on'), offTime: getVal('silo16-off') }
    };
    
    const cleaning = {
        drum_cleaner: getChk('chk-drum'),
        chamber_section: getChk('chk-chamber'),
        sieves_box_1: getChk('chk-sieves1'),
        sieves_box_2: getChk('chk-sieves2'),
        exhaust_fan_pipe: getChk('chk-exhaust'),
        dust_collector: getChk('chk-dust'),
        dryer_tower: getChk('chk-tower'),
        dryer_fiber_pipe: getChk('chk-fiber'),
        mechanical_worker: getChk('chk-mech'),
        mech_elec_worker: getChk('chk-elec')
    };

    return {
        id: Date.now(), // Temporary until Supabase is used
        date: getVal('dryer-date'),
        shift: getVal('dryer-shift'),
        operator_name: getVal('dryer-operator'),
        material_dumping: dumping,
        material_discharge: discharge,
        silos_discharge_gates: gates,
        silo_status: siloStatus,
        faults_and_causes: getVal('dryer-faults'),
        cleaning: cleaning,
        under_process_work: getVal('dryer-maintenance'),
        general: getVal('dryer-general')
    };
}

async function saveDryerReport() {
    const data = gatherDryerReportData();
    if (!data.date || !data.shift || !data.operator_name) {
        alert("Please fill out Date, Shift, and Operator Name.");
        return;
    }

    try {
        if (window.supabase) {
            const { data: result, error } = await window.supabase.from('dryer_side_report').insert([data]);
            if (error) throw error;
        } else {
            // Fallback to local storage if supabase isn't connected
            let localReports = JSON.parse(localStorage.getItem('dryer_side_reports') || '[]');
            localReports.push(data);
            localStorage.setItem('dryer_side_reports', JSON.stringify(localReports));
        }
        
        if (typeof showToast === 'function') showToast("✓ Dryer Report saved successfully.");
        else alert("Report Saved.");
        
        closeDryerReportModal();
        
        // Update badge if on shift report page
        const badge = document.getElementById('badge-dryer-top');
        if (badge) {
            badge.style.display = 'inline-block';
            badge.classList.remove('badge-pending', 'sr-draft-badge');
            badge.classList.add('badge-success', 'sr-submitted-badge');
            badge.textContent = '✅ Completed';
        }

    } catch (err) {
        console.error('Error saving Dryer Report:', err);
        alert('Failed to save report: ' + err.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const btnClose = document.getElementById('dryer-report-close');
    if (btnClose) btnClose.addEventListener('click', closeDryerReportModal);
    
    const btnCancel = document.getElementById('btn-cancel-dryer');
    if (btnCancel) btnCancel.addEventListener('click', closeDryerReportModal);
    
    const btnSave = document.getElementById('btn-save-dryer');
    if (btnSave) btnSave.addEventListener('click', saveDryerReport);
    
    // Attach open method to window
    window.openDryerReportModal = openDryerReportModal;
});
