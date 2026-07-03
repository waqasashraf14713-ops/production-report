// dryer_report.js

let dryerReportData = {
    id: null,
    date: '',
    shift: '',
    operatorName: '',
    materialDumping: [],
    materialDischarge: [],
    silosDischargeGates: [],
    siloStatus: { silo08: {on:'', off:''}, silo09: {on:'', off:''}, silo10: {on:'', off:''}, silo11: {on:'', off:''}, silo12: {on:'', off:''}, silo13: {on:'', off:''}, silo14: {on:'', off:''}, silo15: {on:'', off:''}, silo16: {on:'', off:''}, wetBin: {on:'', off:''}, coolingBin: {on:'', off:''} },
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
    document.getElementById('dump-total-weight').value = '';
    document.getElementById('dump-total-eff').value = '';
    
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
                ${Array.from({length: 8}, (_, i) => `<option value="Silo ${i+9}">Silo ${i+9}</option>`).join('')}
                <option value="Wet Bin">Wet Bin</option>
                <option value="Cooling Bin">Cooling Bin</option>
            </select>
        </td>
        <td><input list="break-reasons" class="dump-break" style="width:100%;" placeholder="Select or type..."></td>
        <td><input type="text" class="dump-rem" style="width:100%;"></td>
        <td><button class="btn btn-danger" onclick="this.closest('tr').remove()" style="padding:0.25rem 0.5rem;">X</button></td>
    `;
    tbody.appendChild(tr);
    
    tr.querySelector('.dump-on').addEventListener('change', calcTotalDryerEff);
    tr.querySelector('.dump-off').addEventListener('change', calcTotalDryerEff);
}

function calcTotalDryerEff() {
    const wt = parseFloat(document.getElementById('dump-total-weight').value);
    const effInput = document.getElementById('dump-total-eff');
    
    if (isNaN(wt) || wt <= 0) {
        effInput.value = "";
        return;
    }

    let totalHours = 0;
    document.querySelectorAll('#dryer-dumping-tbody tr').forEach(tr => {
        const onT = tr.querySelector('.dump-on').value;
        const offT = tr.querySelector('.dump-off').value;
        if (onT && offT) {
            const [onH, onM] = onT.split(':').map(Number);
            const [offH, offM] = offT.split(':').map(Number);
            let diffHours = (offH + offM/60) - (onH + onM/60);
            if (diffHours < 0) diffHours += 24;
            if (diffHours > 0) totalHours += diffHours;
        }
    });

    if (totalHours > 0) {
        const eff = wt / totalHours;
        effInput.value = eff.toFixed(2) + " kg/h";
    } else {
        effInput.value = "";
    }
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
        <td><input list="break-reasons" class="disc-break" style="width:100%;" placeholder="Select or type..."></td>
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
            breakReason: tr.querySelector('.dump-break').value,
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
            breakReason: tr.querySelector('.disc-break').value,
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
        silo16: { onTime: getVal('silo16-on'), offTime: getVal('silo16-off') },
        wetBin: { onTime: getVal('wetbin-on'), offTime: getVal('wetbin-off') },
        coolingBin: { onTime: getVal('coolingbin-on'), offTime: getVal('coolingbin-off') }
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
        dumping_total_weight: getVal('dump-total-weight'),
        dumping_total_eff: getVal('dump-total-eff'),
        material_discharge: discharge,
        silos_discharge_gates: gates,
        silo_status: siloStatus,
        faults_and_causes: getVal('dryer-faults'),
        cleaning: cleaning,
        under_process_work: getVal('dryer-maintenance'),
        general: getVal('dryer-general'),
        supervisor_approval: getVal('dryer-supervisor'),
        summary: getVal('dryer-summary')
    };
}

async function saveDryerReport() {
    const data = gatherDryerReportData();
    if (!data.date || !data.shift || !data.operator_name) {
        alert("Please fill out Date, Shift, and Operator Name.");
        return;
    }

    try {
        if (window.isSbConnected && window.sbClient) {
            let dbData = { ...data };
            delete dbData.id; // Let Supabase auto-generate the ID
            const { data: result, error } = await window.sbClient.from('dryer_side_reports').insert([dbData]).select();
            
            // If the table is actually named 'dryer_side_report' (singular), fallback to it
            if (error && (error.code === '42P01' || error.message.includes('relation "public.dryer_side_reports" does not exist'))) {
                const retry = await window.sbClient.from('dryer_side_report').insert([dbData]).select();
                if (retry.error) throw retry.error;
            } else if (error) {
                throw error;
            }
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

window.allDryerReports = [];

async function fetchDryerReports() {
    let reports = [];
    if (window.isSbConnected && window.sbClient) {
        try {
            let res = await window.sbClient.from('dryer_side_reports').select('*').order('date', { ascending: false });
            if (res.error && (res.error.code === '42P01' || res.error.message.includes('relation "public.dryer_side_reports" does not exist'))) {
                res = await window.sbClient.from('dryer_side_report').select('*').order('date', { ascending: false });
            }
            if (res.error) throw res.error;
            reports = res.data || [];
        } catch (err) {
            console.error('Error fetching dryer reports from Supabase:', err);
            // Fallback to local
            reports = JSON.parse(localStorage.getItem('dryer_side_reports') || '[]');
        }
    } else {
        reports = JSON.parse(localStorage.getItem('dryer_side_reports') || '[]');
    }
    window.allDryerReports = reports;
    renderDryerReportsTable(reports);
}

function renderDryerReportsTable(reports) {
    const tbody = document.querySelector('#dryer-records-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No records found</td></tr>';
        return;
    }
    reports.forEach((r, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.date || '-'}</td>
            <td>${r.shift || '-'}</td>
            <td>${r.operator_name || '-'}</td>
            <td>${r.faults_and_causes || '-'}</td>
            <td class="no-print">
                <button class="btn btn-secondary" onclick="viewDryerRecord(${idx})" style="padding:0.25rem 0.5rem;font-size:0.85rem;">View</button>
                <button class="btn btn-primary" onclick="printDryerRecordPdf(${idx})" style="padding:0.25rem 0.5rem;font-size:0.85rem;background:#8b5cf6;border-color:#8b5cf6;">📄 Print PDF</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function generateDryerReportHtml(record) {
    const styleHtml = `
        <style>
            .pdf-report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .pdf-report-header h2 { margin: 0 0 10px 0; font-size: 24px; color: #1e293b; }
            .pdf-section { margin-bottom: 20px; }
            .pdf-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 13px; }
            .pdf-table th, .pdf-table td { border: 1px solid #cbd5e1; padding: 6px; text-align: center; }
            .pdf-table th { background-color: #e2e8f0; color: #334155; font-weight: bold; }
        </style>
    `;

    let gatesHtml = '';
    if (record.silos_discharge_gates && record.silos_discharge_gates.length > 0) {
        gatesHtml = `
            <table class="pdf-table">
                <thead><tr><th>Conveyor #</th><th>Silo #</th><th>Gate #</th><th>Open</th></tr></thead>
                <tbody>
                    ${record.silos_discharge_gates.map(g => `<tr><td>${g.conveyor}</td><td>${g.silo}</td><td>${g.gate}</td><td>${g.open ? 'Yes' : 'No'}</td></tr>`).join('')}
                </tbody>
            </table>
        `;
    } else {
        gatesHtml = '<p style="text-align:center;">No records</p>';
    }

    let siloStatusHtml = `
        <table class="pdf-table">
            <thead><tr><th>Silo</th><th>On Time</th><th>Off Time</th></tr></thead>
            <tbody>
    `;
    const silos = ['08','09','10','11','12','13','14','15','16','wetbin','coolingbin'];
    silos.forEach(s => {
        let label = s.startsWith('0') || s.startsWith('1') ? 'Silo ' + s : (s === 'wetbin' ? 'Wet Bin' : 'Cooling Bin');
        let on = record.silo_status && record.silo_status[s + '_on'] ? record.silo_status[s + '_on'] : '-';
        let off = record.silo_status && record.silo_status[s + '_off'] ? record.silo_status[s + '_off'] : '-';
        if (on !== '-' || off !== '-') {
            siloStatusHtml += `<tr><td>${label}</td><td>${on}</td><td>${off}</td></tr>`;
        }
    });
    siloStatusHtml += `</tbody></table>`;

    const getChkBadge = (val, label) => val ? `<span style="display:inline-block;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:12px;margin:2px;font-size:12px;">✅ ${label}</span>` : `<span style="display:inline-block;background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:12px;margin:2px;font-size:12px;">❌ ${label}</span>`;

    return styleHtml + `
        <div class="pdf-report-header">
            <h2>Dryer Side Shift Report</h2>
            <p><strong>Date:</strong> ${record.date || '-'} | <strong>Shift:</strong> ${record.shift || '-'} | <strong>Operator:</strong> ${record.operator_name || '-'}</p>
        </div>
        
        <div class="pdf-section">
            <h3 style="background-color:#f1f5f9; padding:8px; border:1px solid #000; font-size:14px; margin-bottom:10px;">1. Material Dumping</h3>
            <p style="margin-bottom:8px;"><strong>Total Dumping Weight:</strong> ${record.dump_total_weight || '-'} kg | <strong>Efficiency:</strong> ${record.dump_total_eff || '-'}</p>
            <table class="pdf-table">
                <thead><tr><th>Material</th><th>On Time</th><th>Off Time</th><th>Silo/Wet Bin</th><th>Break Reason</th><th>Remarks</th></tr></thead>
                <tbody>
                    ${record.material_dumping && record.material_dumping.length > 0 ? record.material_dumping.map(d => `<tr><td>${d.material}</td><td>${d.onTime}</td><td>${d.offTime}</td><td>${d.siloWetBin}</td><td>${d.breakReason || ''}</td><td>${d.remarks}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;">No records</td></tr>'}
                </tbody>
            </table>
        </div>

        <div class="pdf-section">
            <h3 style="background-color:#f1f5f9; padding:8px; border:1px solid #000; font-size:14px; margin-bottom:10px;">2. Material Discharge</h3>
            <table class="pdf-table">
                <thead><tr><th>Material</th><th>Silo No.</th><th>On Time</th><th>Off Time</th><th>Break Reason</th><th>Remarks</th></tr></thead>
                <tbody>
                    ${record.material_discharge && record.material_discharge.length > 0 ? record.material_discharge.map(d => `<tr><td>${d.material}</td><td>${d.siloNo}</td><td>${d.onTime}</td><td>${d.offTime}</td><td>${d.breakReason || ''}</td><td>${d.remarks}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;">No records</td></tr>'}
                </tbody>
            </table>
        </div>

        <div class="pdf-section" style="display:flex;gap:20px;page-break-inside: avoid;">
            <div style="flex:1;">
                <h3 style="background-color:#f1f5f9; padding:8px; border:1px solid #000; font-size:14px; margin-bottom:10px;">3. Silos Discharge Gates</h3>
                ${gatesHtml}
            </div>
            <div style="flex:1;">
                <h3 style="background-color:#f1f5f9; padding:8px; border:1px solid #000; font-size:14px; margin-bottom:10px;">4. Silo Status (Active Times)</h3>
                ${siloStatusHtml}
            </div>
        </div>

        <div class="pdf-section" style="page-break-inside: avoid;">
            <h3 style="background-color:#f1f5f9; padding:8px; border:1px solid #000; font-size:14px; margin-bottom:10px;">5. Cleaning Checklist</h3>
            <div style="margin-bottom:10px;">
                ${getChkBadge(record.cleaning_checklist?.drum_cleaner, 'Drum Cleaner')}
                ${getChkBadge(record.cleaning_checklist?.chamber_section, 'Chamber Section')}
                ${getChkBadge(record.cleaning_checklist?.sieves_box1, 'Sieves Box-1')}
                ${getChkBadge(record.cleaning_checklist?.sieves_box2, 'Sieves Box-2')}
                ${getChkBadge(record.cleaning_checklist?.exhaust_fan, 'Exhaust Fan Pipe')}
                ${getChkBadge(record.cleaning_checklist?.dust_collector, 'Dust Collector')}
                ${getChkBadge(record.cleaning_checklist?.dryer_tower, 'Dryer Tower')}
                ${getChkBadge(record.cleaning_checklist?.dryer_fiber_pipe, 'Dryer Fiber Pipe')}
                ${getChkBadge(record.cleaning_checklist?.mechanical_worker, 'Mechanical Worker')}
                ${getChkBadge(record.cleaning_checklist?.elec_worker, 'Mech/Electrical Worker')}
            </div>
        </div>

        <div class="pdf-section" style="page-break-inside: avoid;">
            <h3 style="background-color:#f1f5f9; padding:8px; border:1px solid #000; font-size:14px; margin-bottom:10px;">6. General Comments & Faults</h3>
            <p style="margin-bottom:8px;"><strong>Faults & Causes:</strong> ${record.faults_and_causes || '-'}</p>
            <p style="margin-bottom:8px;"><strong>Under Process Work:</strong> ${record.under_process_work || '-'}</p>
            <p style="margin-bottom:8px;"><strong>General Remarks:</strong> ${record.general || '-'}</p>
        </div>

        <div class="pdf-section" style="page-break-inside: avoid; margin-top:20px; border-top:2px solid #000; padding-top:10px;">
            <h3 style="font-size:16px; margin-bottom:10px;">Summary & Approval</h3>
            <p style="margin-bottom:8px;"><strong>Summary:</strong> ${record.summary || '-'}</p>
            <p style="margin-bottom:8px;"><strong>Plant Supervisor Approval:</strong> ${record.supervisor_approval || '<span style="color:#64748b;font-style:italic;">Pending</span>'}</p>
        </div>
    `;
}

window.viewDryerRecord = function(idx) {
    const record = window.allDryerReports[idx];
    if (!record) return;
    const modal = document.getElementById('dryer-record-view-modal');
    const content = document.getElementById('dryer-record-view-content');
    if (modal && content) {
        content.innerHTML = generateDryerReportHtml(record);
        modal.classList.add('show');
    }
};

window.printDryerRecordPdf = function(idx) {
    const record = window.allDryerReports[idx];
    if (!record) return;
    const container = document.getElementById('dryer-report-print-container');
    if (!container) return;

    container.innerHTML = generateDryerReportHtml(record);
    document.body.classList.add('printing-dryer-pdf');
    setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-dryer-pdf');
    }, 500);
};

window.fetchDryerReports = fetchDryerReports;

// Dynamic Break Reasons functionality
function updateBreakReasonsList(newReason) {
    if (!newReason || newReason.trim() === '') return;
    const datalist = document.getElementById('break-reasons');
    if (!datalist) return;
    
    let exists = false;
    for (let opt of datalist.options) {
        if (opt.value.toLowerCase() === newReason.trim().toLowerCase()) {
            exists = true;
            break;
        }
    }
    
    if (!exists) {
        const option = document.createElement('option');
        option.value = newReason.trim();
        datalist.appendChild(option);
        
        let customBreaks = JSON.parse(localStorage.getItem('custom_break_reasons') || '[]');
        if (!customBreaks.includes(newReason.trim())) {
            customBreaks.push(newReason.trim());
            localStorage.setItem('custom_break_reasons', JSON.stringify(customBreaks));
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const datalist = document.getElementById('break-reasons');
    if (datalist) {
        let customBreaks = JSON.parse(localStorage.getItem('custom_break_reasons') || '[]');
        customBreaks.forEach(reason => {
            let exists = false;
            for (let opt of datalist.options) {
                if (opt.value.toLowerCase() === reason.toLowerCase()) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                const option = document.createElement('option');
                option.value = reason;
                datalist.appendChild(option);
            }
        });
    }
    
    document.body.addEventListener('change', (e) => {
        if (e.target && e.target.getAttribute('list') === 'break-reasons') {
            updateBreakReasonsList(e.target.value);
        }
    });
});
