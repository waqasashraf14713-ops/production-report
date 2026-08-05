// dryer_report.js

window.currentDryerEditId = null;

let dryerSbClient = null;
function initDryerSupabase() {
    // Try to get from window.env first, then localStorage
    const sbUrl = (window.env && window.env.SUPABASE_URL) || localStorage.getItem('fmpr_supabaseUrl');
    const sbKey = (window.env && window.env.SUPABASE_KEY) || localStorage.getItem('fmpr_supabaseKey');
    if (sbUrl && sbKey && typeof supabase !== 'undefined') {
        const cleanUrl = sbUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
        dryerSbClient = supabase.createClient(cleanUrl, sbKey);
    }
}
document.addEventListener('DOMContentLoaded', initDryerSupabase);

let dryerReportData = {
    id: null,
    date: '',
    shift: '',
    operatorName: '',
    materialDumping: [],
    materialDischarge: [],
    silosDischargeGates: [],
    siloStatus: { silo09: {on:'', off:'', meter:''}, silo10: {on:'', off:'', meter:''}, silo11: {on:'', off:'', meter:''}, silo12: {on:'', off:'', meter:''}, silo13: {on:'', off:'', meter:''}, silo14: {on:'', off:'', meter:''}, silo15: {on:'', off:'', meter:''}, silo16: {on:'', off:'', meter:''}, wetBin: {on:'', off:'', meter:''}, coolingBin: {on:'', off:'', meter:''} },
    faultsAndCauses: '',
    cleaning: {},
    underProcessWork: '',
    general: ''
};

function openDryerReportModal() {
    window.currentDryerEditId = null; // reset
    const modal = document.getElementById('dryer-report-modal');
    if (!modal) return;
    
    // Auto-fill date if global date is set
    const globalDate = document.getElementById('sr-filter-date') ? document.getElementById('sr-filter-date').value : '';
    document.getElementById('dryer-date').value = globalDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(/ /g, '-');
    document.getElementById('dryer-shift').value = 'A'; // Default
    document.getElementById('dryer-operator').value = '';
    
    // Clear static fields
    const staticFields = ['dump-total-weight','dump-total-eff','dryer-faults','dryer-maintenance','dryer-general','dryer-summary'];
    staticFields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    
    // Clear checkboxes
    ['chk-drum','chk-chamber','chk-sieves1','chk-sieves2','chk-exhaust','chk-dust','chk-tower','chk-fiber','chk-mech','chk-elec'].forEach(id => { const el = document.getElementById(id); if(el) el.checked = false; });
    
    // Clear silo times
    const silos = ['09','10','11','12','13','14','15','16','wetbin','coolingbin'];
    silos.forEach(s => {
        ['on','off','meter'].forEach(type => {
            const el = document.getElementById(`${s}-${type}`);
            if(el) el.value = '';
        });
    });

    // Clear dynamic tables
    const dumpTbody = document.getElementById('dryer-dumping-tbody');
    const dischTbody = document.getElementById('dryer-discharge-tbody');
    if (dumpTbody) dumpTbody.innerHTML = '';
    if (dischTbody) dischTbody.innerHTML = '';
    
    // Add one default row
    addDryerDumpingRow();
    addDryerDischargeRow();
    
    // Render static gates table
    renderDryerGatesTable();
    
    modal.classList.add('show');
}

function closeDryerReportModal() {
    window.currentDryerEditId = null;
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
        const tons = wt;
        const tonsPerHour = tons / totalHours;
        const eff = (tonsPerHour / 60) * 100;
        effInput.value = eff.toFixed(2) + " %";
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
                ${Array.from({length: 8}, (_, i) => `<option value="Silo ${i+9}">Silo ${i+9}</option>`).join('')}
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
        silo09: { onTime: getVal('silo09-on'), offTime: getVal('silo09-off'), meter: getVal('silo09-meter') },
        silo10: { onTime: getVal('silo10-on'), offTime: getVal('silo10-off'), meter: getVal('silo10-meter') },
        silo11: { onTime: getVal('silo11-on'), offTime: getVal('silo11-off'), meter: getVal('silo11-meter') },
        silo12: { onTime: getVal('silo12-on'), offTime: getVal('silo12-off'), meter: getVal('silo12-meter') },
        silo13: { onTime: getVal('silo13-on'), offTime: getVal('silo13-off'), meter: getVal('silo13-meter') },
        silo14: { onTime: getVal('silo14-on'), offTime: getVal('silo14-off'), meter: getVal('silo14-meter') },
        silo15: { onTime: getVal('silo15-on'), offTime: getVal('silo15-off'), meter: getVal('silo15-meter') },
        silo16: { onTime: getVal('silo16-on'), offTime: getVal('silo16-off'), meter: getVal('silo16-meter') },
        wetBin: { onTime: getVal('wetbin-on'), offTime: getVal('wetbin-off'), meter: getVal('wetbin-meter') },
        coolingBin: { onTime: getVal('coolingbin-on'), offTime: getVal('coolingbin-off'), meter: getVal('coolingbin-meter') }
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
    const dbData = {
        date: getVal('dryer-date'),
        shift: getVal('dryer-shift'),
        operator_name: getVal('dryer-operator'),
        dumping_total_weight: getVal('dump-total-weight'),
        dumping_total_eff: getVal('dump-total-eff'),
        dump_total_weight: getVal('dump-total-weight'),
        dump_total_eff: getVal('dump-total-eff'),
        material_dumping: dumping,
        material_discharge: discharge,
        silos_discharge_gates: gates,
        silo_status: siloStatus,
        cleaning: cleaning,
        cleaning_checklist: cleaning,
        faults_and_causes: getVal('dryer-faults'),
        under_process_work: getVal('dryer-maintenance'),
        general: getVal('dryer-general'),
        summary: getVal('dryer-summary')
    };

    return dbData;
}

async function saveDryerReport() {
    const data = gatherDryerReportData();
    if (!data.date || !data.shift || !data.operator_name) {
        alert("Please fill out Date, Shift, and Operator Name.");
        return;
    }

    let isNewReport = false;
    try {
        if (dryerSbClient) {
            let dbData = { ...data };
            if (!window.currentDryerEditId) {
                delete dbData.id; // Let Supabase auto-generate the ID for new records
                isNewReport = true;
            } else {
                dbData.id = window.currentDryerEditId;
            }
            
            // Format date from DD-MMM to YYYY-MM-DD for Supabase
            let sqlDate = dbData.date;
            if (sqlDate && !/^\d{4}-\d{2}-\d{2}$/.test(sqlDate)) {
                let parts = sqlDate.split('-');
                if (parts.length >= 2) {
                    let d = parts[0].padStart(2, '0');
                    let m = parts[1].toLowerCase();
                    let y = parts.length === 3 ? parts[2] : new Date().getFullYear().toString();
                    if (y.length === 2) y = '20' + y;
                    const mMap = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
                    let mNum = mMap[m] || '01';
                    sqlDate = `${y}-${mNum}-${d}`;
                    dbData.date = sqlDate;
                }
            }
            
            // Clean up empty strings to NULL for database compatibility (fixes "invalid input syntax for type numeric: ''")
            for (let key in dbData) {
                if (dbData[key] === "") {
                    dbData[key] = null;
                }
            }
            
            let result, error;
            if (window.currentDryerEditId) {
                // Update Existing
                const res = await dryerSbClient.from('dryer_side_reports').update(dbData).eq('id', window.currentDryerEditId).select();
                result = res.data;
                error = res.error;
            } else {
                // Insert New
                const res = await dryerSbClient.from('dryer_side_reports').insert([dbData]).select();
                result = res.data;
                error = res.error;
                
                // Fallback for singular table name if error
                if (error && (error.code === '42P01' || error.message.includes('relation "public.dryer_side_reports" does not exist'))) {
                    const retry = await dryerSbClient.from('dryer_side_report').insert([dbData]).select();
                    if (retry.error) throw retry.error;
                    error = null;
                }
            }
            if (error) throw error;
        } else {
            // Fallback to local storage if supabase isn't connected
            let localReports = JSON.parse(localStorage.getItem('dryer_side_reports') || '[]');
            if (window.currentDryerEditId) {
                let idx = localReports.findIndex(r => r.id === window.currentDryerEditId);
                if (idx > -1) localReports[idx] = data;
            } else {
                data.id = Date.now();
                localReports.push(data);
            }
            localStorage.setItem('dryer_side_reports', JSON.stringify(localReports));
        }
        
        if (isNewReport && typeof window.silosData !== 'undefined' && dryerSbClient) {
            const sMap = {
                '08': 'Silo 08', '09': 'Silo 09', '10': 'Silo 10', '11': 'Silo 11',
                '12': 'Silo 12', '13': 'Silo 13', '14': 'Silo 14', '15': 'Silo 15', '16': 'Silo 16'
            };
            for (let k of Object.keys(sMap)) {
                let sKey = `silo${k}`;
                if (data.silo_status[sKey]) {
                    const onT = data.silo_status[sKey].onTime;
                    const offT = data.silo_status[sKey].offTime;
                    if (onT && offT) {
                        const [onH, onM] = onT.split(':').map(Number);
                        const [offH, offM] = offT.split(':').map(Number);
                        let diff = (offH + offM / 60) - (onH + onM / 60);
                        if (diff < 0) diff += 24;
                        if (diff > 0) {
                            const siloTarget = window.silosData.find(s => s.name === sMap[k]);
                            if (siloTarget) {
                                siloTarget.runTime = parseFloat(siloTarget.runTime || 0) + diff;
                                dryerSbClient.from('silos').update({ run_time: siloTarget.runTime }).eq('name', siloTarget.name).then(() => {}).catch(err => console.error('Silo update error:', err));
                            }
                        }
                    }
                }
            }
            if (typeof window.renderSilos === 'function') window.renderSilos();
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
    
    setupSiloFanListeners();
});

function setupSiloFanListeners() {
    const silos = ['08', '09', '10', '11', '12', '13', '14', '15', '16', 'wetbin', 'coolingbin'];
    const sMap = {
        '08': 'Silo 08', '09': 'Silo 09', '10': 'Silo 10', '11': 'Silo 11',
        '12': 'Silo 12', '13': 'Silo 13', '14': 'Silo 14', '15': 'Silo 15', '16': 'Silo 16'
    };

    silos.forEach(s => {
        const onEl = document.getElementById(`silo${s}-on`) || document.getElementById(`${s}-on`);
        const offEl = document.getElementById(`silo${s}-off`) || document.getElementById(`${s}-off`);
        const meterEl = document.getElementById(`silo${s}-meter`) || document.getElementById(`${s}-meter`);
        
        if (onEl && offEl && meterEl) {
            const calculateTotal = () => {
                const onT = onEl.value;
                const offT = offEl.value;
                if (onT && offT) {
                    const [onH, onM] = onT.split(':').map(Number);
                    const [offH, offM] = offT.split(':').map(Number);
                    let diff = (offH + offM/60) - (onH + onM/60);
                    if (diff < 0) diff += 24;
                    
                    let prevTotal = 0;
                    if (window.silosData && sMap[s]) {
                        const siloTarget = window.silosData.find(st => st.name === sMap[s]);
                        if (siloTarget) prevTotal = parseFloat(siloTarget.runTime || 0);
                    }
                    
                    // Add shift difference to previous accumulated total
                    meterEl.value = (prevTotal + diff).toFixed(2);
                }
            };
            onEl.addEventListener('change', calculateTotal);
            offEl.addEventListener('change', calculateTotal);
        }
    });
}

window.allDryerReports = [];

async function fetchDryerReports() {
    if (!dryerSbClient) initDryerSupabase(); // Ensure it's initialized
    let reports = [];
    if (dryerSbClient) {
        try {
            // Fetch from BOTH table names in parallel so reports saved on any system are always visible
            const [resSingular, resPlural] = await Promise.all([
                dryerSbClient.from('dryer_side_report').select('*').order('date', { ascending: false }),
                dryerSbClient.from('dryer_side_reports').select('*').order('date', { ascending: false })
            ]);

            let singularData = [];
            let pluralData = [];

            // Accept data from whichever table(s) exist
            if (!resSingular.error) singularData = resSingular.data || [];
            if (!resPlural.error) pluralData = resPlural.data || [];

            // If both tables failed, throw the first real error
            if (resSingular.error && resPlural.error) {
                throw resSingular.error;
            }

            // Merge both tables and deduplicate by id (prefer singular table record if duplicate)
            const seen = new Set();
            const merged = [];
            for (const r of [...singularData, ...pluralData]) {
                const key = String(r.id);
                if (!seen.has(key)) {
                    seen.add(key);
                    merged.push(r);
                }
            }
            reports = merged;

            // Also merge any offline/local reports that were saved when Supabase was unavailable
            let localReports = JSON.parse(localStorage.getItem('dryer_side_reports') || '[]');
            if (localReports.length > 0) {
                let cloudIds = new Set(reports.map(r => String(r.id)));
                let unsyncedLocal = localReports.filter(lr => !cloudIds.has(String(lr.id)));
                reports = [...reports, ...unsyncedLocal];
            }

            // Sort by date descending
            reports.sort((a, b) => new Date(b.date) - new Date(a.date));

        } catch (err) {
            console.error('Error fetching dryer reports from Supabase:', err);
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
                ${!r.supervisor_approval ? 
                    `<button class="btn btn-secondary" onclick="editDryerRecord(${idx})" style="padding:0.25rem 0.5rem;font-size:0.85rem;margin-left:5px;">✏️ Edit</button>` 
                    : ''
                }
                ${r.supervisor_approval ? 
                    `<button class="btn btn-primary" disabled style="padding:0.25rem 0.5rem;font-size:0.85rem;background:#15803d;border-color:#15803d;color:white;margin-left:5px;cursor:default;">🟢 Approved</button>` 
                    : 
                    `<button class="btn btn-primary" onclick="approveDryerRecordFromTable(${idx})" style="padding:0.25rem 0.5rem;font-size:0.85rem;background:#ef4444;border-color:#ef4444;margin-left:5px;">✅ Approve</button>`
                }
                <button class="btn btn-primary" onclick="printDryerRecordPdf(${idx})" style="padding:0.25rem 0.5rem;font-size:0.85rem;background:#8b5cf6;border-color:#8b5cf6;margin-left:5px;">📄 Print PDF</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.approveDryerRecordFromTable = async function(idx) {
    const record = window.allDryerReports[idx];
    if (!record) return;
    
    if (record.supervisor_approval) {
        alert("Already approved by " + record.supervisor_approval);
        return;
    }

    record.supervisor_approval = "Plant Supervisor";

    // Save to local storage
    let localReports = JSON.parse(localStorage.getItem('dryer_side_reports') || '[]');
    let localIdx = localReports.findIndex(r => r.id === record.id || (r.date === record.date && r.shift === record.shift));
    if (localIdx > -1) {
        localReports[localIdx].supervisor_approval = record.supervisor_approval;
        localStorage.setItem('dryer_side_reports', JSON.stringify(localReports));
    }

    // Save to Supabase
    if (dryerSbClient) {
        try {
            await dryerSbClient.from('dryer_side_reports').update({ supervisor_approval: record.supervisor_approval }).eq('id', record.id);
        } catch(e) { console.error(e); }
    }

    if (typeof showToast === 'function') showToast('✓ Report Approved');
    renderDryerReportsTable(window.allDryerReports);
    
    // Also update modal if it is currently displaying this record
    const modal = document.getElementById('dryer-record-view-modal');
    if (modal && modal.classList.contains('show')) {
        const content = document.getElementById('dryer-record-view-content');
        if (content) content.innerHTML = generateDryerReportHtml(record);
    }
};

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
                    ${record.silos_discharge_gates.map(g => `<tr><td>${g.conveyor}</td><td>${g.silo}</td><td>${g.gate}</td><td>${(g.isOpen || g.open) ? 'Yes' : 'No'}</td></tr>`).join('')}
                </tbody>
            </table>
        `;
    } else {
        gatesHtml = '<p style="text-align:center;">No records</p>';
    }

    let siloStatusHtml = `
        <table class="pdf-table">
            <thead><tr><th>Silo</th><th>On Time</th><th>Off Time</th><th>Meter (Hrs)</th></tr></thead>
            <tbody>
    `;
    const silos = ['09','10','11','12','13','14','15','16','wetbin','coolingbin'];
    silos.forEach(s => {
        let label = s.startsWith('0') || s.startsWith('1') ? 'Silo ' + s : (s === 'wetbin' ? 'Wet Bin' : 'Cooling Bin');
        let key = s;
        if (s !== 'wetbin' && s !== 'coolingbin') key = 'silo' + s;
        if (s === 'wetbin') key = 'wetBin';
        if (s === 'coolingbin') key = 'coolingBin';

        let obj = record.silo_status ? record.silo_status[key] : null;
        
        let on = obj && obj.onTime ? obj.onTime : '-';
        let off = obj && obj.offTime ? obj.offTime : '-';
        let meter = obj && obj.meter ? obj.meter : '-';

        // Fallback for old records if they were saved flat (just in case)
        if (on === '-' && record.silo_status && record.silo_status[s + '_on']) on = record.silo_status[s + '_on'];
        if (off === '-' && record.silo_status && record.silo_status[s + '_off']) off = record.silo_status[s + '_off'];

        if (on !== '-' || off !== '-' || meter !== '-') {
            siloStatusHtml += `<tr><td>${label}</td><td>${on}</td><td>${off}</td><td>${meter}</td></tr>`;
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
            <p style="margin-bottom:8px;"><strong>Total Dumping Weight:</strong> ${record.dump_total_weight || '-'} ton | <strong>Efficiency:</strong> ${record.dump_total_eff || '-'}</p>
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
                <h3 style="background-color:#f1f5f9; padding:8px; border:1px solid #000; font-size:14px; margin-bottom:10px;">4. Silo Fan Status (Active Times)</h3>
                ${siloStatusHtml}
            </div>
        </div>

        <div class="pdf-section" style="page-break-inside: avoid;">
            <h3 style="background-color:#f1f5f9; padding:8px; border:1px solid #000; font-size:14px; margin-bottom:10px;">5. Cleaning Checklist</h3>
            <div style="margin-bottom:10px;">
                ${(() => {
                    const cln = record.cleaning || record.cleaning_checklist || {};
                    return `
                        ${getChkBadge(cln.drum_cleaner, 'Drum Cleaner')}
                        ${getChkBadge(cln.chamber_section, 'Chamber Section')}
                        ${getChkBadge(cln.sieves_box_1, 'Sieves Box-1')}
                        ${getChkBadge(cln.sieves_box_2, 'Sieves Box-2')}
                        ${getChkBadge(cln.exhaust_fan_pipe, 'Exhaust Fan Pipe')}
                        ${getChkBadge(cln.dust_collector, 'Dust Collector')}
                        ${getChkBadge(cln.dryer_tower, 'Dryer Tower')}
                        ${getChkBadge(cln.dryer_fiber_pipe, 'Dryer Fiber Pipe')}
                        ${getChkBadge(cln.mechanical_worker, 'Mechanical Worker')}
                        ${getChkBadge(cln.mech_elec_worker, 'Mech/Electrical Worker')}
                    `;
                })()}
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
            <p style="margin-bottom:8px; display: flex; align-items: center; gap: 8px;">
                <strong>Plant Supervisor Approval:</strong> 
                ${record.supervisor_approval 
                    ? `<button class="btn btn-primary no-print" disabled style="padding:4px 12px; font-size:0.85rem; border-radius:9999px; background:#15803d; border:none; color:white; cursor:default; font-weight:bold;">🟢 Approved</button>`
                    : `<span style="background-color: #fef3c7; color: #d97706; border: 1px solid #fde68a; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 4px;">⚠️ Pending</span>
                       <button onclick="approveDryerRecordFromTable(${window.allDryerReports ? window.allDryerReports.indexOf(record) : -1})" class="btn btn-primary no-print" style="padding:4px 12px; font-size:0.85rem; border-radius:9999px; background:#ef4444; border:none; margin-left: 10px; cursor: pointer;">✅ Approve Now</button>`
                }
            </p>
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

window.editDryerRecord = function(idx) {
    const record = window.allDryerReports[idx];
    if (!record) return;
    
    // Clear and open modal
    openDryerReportModal();
    window.currentDryerEditId = record.id;
    
    // 1. Top Section
    if (document.getElementById('dryer-date')) document.getElementById('dryer-date').value = record.date || '';
    if (document.getElementById('dryer-shift')) document.getElementById('dryer-shift').value = record.shift || '';
    if (document.getElementById('dryer-operator')) document.getElementById('dryer-operator').value = record.operator_name || '';
    
    // 2. Material Dumping
    document.getElementById('dryer-dumping-tbody').innerHTML = '';
    if (document.getElementById('dump-total-weight')) document.getElementById('dump-total-weight').value = record.dumping_total_weight || '';
    if (document.getElementById('dump-total-eff')) document.getElementById('dump-total-eff').value = record.dumping_total_eff || '';
    
    if (record.material_dumping && record.material_dumping.length > 0) {
        record.material_dumping.forEach(d => {
            addDryerDumpingRow();
            const tr = document.getElementById('dryer-dumping-tbody').lastElementChild;
            if (tr) {
                if (tr.querySelector('.dump-mat')) tr.querySelector('.dump-mat').value = d.material || '';
                if (tr.querySelector('.dump-on')) tr.querySelector('.dump-on').value = d.onTime || '';
                if (tr.querySelector('.dump-off')) tr.querySelector('.dump-off').value = d.offTime || '';
                if (tr.querySelector('.dump-bin')) tr.querySelector('.dump-bin').value = d.siloWetBin || '';
                if (tr.querySelector('.dump-break')) tr.querySelector('.dump-break').value = d.breakReason || '';
                if (tr.querySelector('.dump-rem')) tr.querySelector('.dump-rem').value = d.remarks || '';
            }
        });
    } else {
        addDryerDumpingRow();
    }
    
    // 3. Material Discharge
    document.getElementById('dryer-discharge-tbody').innerHTML = '';
    if (record.material_discharge && record.material_discharge.length > 0) {
        record.material_discharge.forEach(d => {
            addDryerDischargeRow();
            const tr = document.getElementById('dryer-discharge-tbody').lastElementChild;
            if (tr) {
                if (tr.querySelector('.disc-mat')) tr.querySelector('.disc-mat').value = d.material || '';
                if (tr.querySelector('.disc-silo')) tr.querySelector('.disc-silo').value = d.siloNo || '';
                if (tr.querySelector('.disc-on')) tr.querySelector('.disc-on').value = d.onTime || '';
                if (tr.querySelector('.disc-off')) tr.querySelector('.disc-off').value = d.offTime || '';
                if (tr.querySelector('.disc-break')) tr.querySelector('.disc-break').value = d.breakReason || '';
                if (tr.querySelector('.disc-rem')) tr.querySelector('.disc-rem').value = d.remarks || '';
            }
        });
    } else {
        addDryerDischargeRow();
    }
    
    // 4. Gates
    if (record.silos_discharge_gates && record.silos_discharge_gates.length > 0) {
        record.silos_discharge_gates.forEach((g, i) => {
            const gateNum = document.getElementById(`gate-num-${i}`);
            const gateOpen = document.getElementById(`gate-open-${i}`);
            if (gateNum) gateNum.value = g.gate || '';
            if (gateOpen) gateOpen.checked = g.isOpen || false;
        });
    }
    
    // 5. Silo Status
    const setSiloField = (key, type, val) => {
        const idMap = { 'silo09':'09', 'silo10':'10', 'silo11':'11', 'silo12':'12', 'silo13':'13', 'silo14':'14', 'silo15':'15', 'silo16':'16', 'wetBin':'wetbin', 'coolingBin':'coolingbin' };
        const el = document.getElementById(`${idMap[key]}-${type}`);
        if (el) el.value = val || '';
    };
    if (record.silo_status) {
        Object.keys(record.silo_status).forEach(key => {
            const obj = record.silo_status[key];
            if (obj) {
                setSiloField(key, 'on', obj.onTime);
                setSiloField(key, 'off', obj.offTime);
                setSiloField(key, 'meter', obj.meter);
            }
        });
    }
    
    // 6. Cleaning
    const cln = record.cleaning || record.cleaning_checklist || {};
    const setChk = (dbKey, elId) => {
        if (cln[dbKey]) {
            const el = document.getElementById(elId);
            if (el) el.checked = true;
        }
    };
    setChk('drum_cleaner', 'chk-drum');
    setChk('chamber_section', 'chk-chamber');
    setChk('sieves_box_1', 'chk-sieves1');
    setChk('sieves_box_2', 'chk-sieves2');
    setChk('exhaust_fan_pipe', 'chk-exhaust');
    setChk('dust_collector', 'chk-dust');
    setChk('dryer_tower', 'chk-tower');
    setChk('dryer_fiber_pipe', 'chk-fiber');
    setChk('mechanical_worker', 'chk-mech');
    setChk('mech_elec_worker', 'chk-elec');
    
    // 7. General & Faults
    if (document.getElementById('dryer-faults')) document.getElementById('dryer-faults').value = record.faults_and_causes || '';
    if (document.getElementById('dryer-maintenance')) document.getElementById('dryer-maintenance').value = record.under_process_work || '';
    if (document.getElementById('dryer-general')) document.getElementById('dryer-general').value = record.general || '';
    if (document.getElementById('dryer-summary')) document.getElementById('dryer-summary').value = record.summary || '';
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
