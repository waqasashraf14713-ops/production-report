// batching_scale.js
// Handles logic for the Batching Scale Calibration Checking

const initBatchingScale = () => {
    const LS_BATCHING_SCALE = 'fm_batching_scale';
    let batchingScaleData = [];
    try {
        batchingScaleData = JSON.parse(localStorage.getItem(LS_BATCHING_SCALE) || '[]');
    } catch (e) {
        console.error("Error reading batching scale data:", e);
    }
    let activeBatchingScaleId = null;

    const modal = document.getElementById('batching-scale-modal');
    const btnAdd = document.getElementById('btn-add-batching-scale');
    const btnClose = document.getElementById('batching-scale-close');
    const btnCancel = document.getElementById('btn-cancel-batching-scale');
    const btnSave = document.getElementById('btn-save-batching-scale');
    
    // Form Inputs
    const inputDate = document.getElementById('batching-modal-date');
    const inputOperator = document.getElementById('batching-modal-operator');
    const inputRemarks = document.getElementById('batching-modal-remarks');
    
    const bigScaleBody = document.getElementById('batching-modal-big-scale-body');
    const smallScaleBody = document.getElementById('batching-modal-small-scale-body');

    // Standard Target Weight values from calibration sheets
    const DEFAULT_BIG_SCALE_TARGETS = [4000, 3500, 3000, 2500, 2000, 1500, 1300, 1100, 900, 700, 500, 300, 100, 0];
    const DEFAULT_SMALL_SCALE_TARGETS = [2000, 1900, 1400, 900, 400, 200, 100, 0];

    const saveToLS = () => {
        localStorage.setItem(LS_BATCHING_SCALE, JSON.stringify(batchingScaleData));
    };

    // Helper to generate empty scale rows
    const generateDefaultScaleRows = (targets) => {
        return targets.map(t => ({ target: t, plc: '', hmi: '' }));
    };

    const renderTable = () => {
        const tbody = document.querySelector('#batching-scale-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (batchingScaleData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2rem;">No records found.</td></tr>';
            return;
        }

        // Add badge update if applicable
        const badge = document.getElementById('badge-batching-scale');
        if (badge) {
            badge.style.display = batchingScaleData.length > 0 ? 'inline-block' : 'none';
            badge.textContent = batchingScaleData.length + ' Checked';
        }

        [...batchingScaleData].reverse().forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.date}</td>
                <td>${record.operator || '—'}</td>
                <td style="max-width:350px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${record.remarks || ''}">${record.remarks || '—'}</td>
                <td>
                    <button class="btn btn-secondary" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="editBatchingScale(${record.id})">Edit</button>
                    <button class="btn btn-danger" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="deleteBatchingScale(${record.id})">Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    // Render Calibration rows in the Modal Input Grid
    const renderModalScaleGrids = (bigScaleRows, smallScaleRows) => {
        // Big Scale
        bigScaleBody.innerHTML = '';
        bigScaleRows.forEach((row, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:0.3rem;font-weight:600;color:var(--text-secondary);vertical-align:middle;">${row.target} kg</td>
                <td style="padding:0.3rem;"><input type="number" step="any" class="big-plc-input" data-index="${i}" value="${row.plc !== undefined && row.plc !== null ? row.plc : ''}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.3rem;outline:none;background:var(--card-bg);color:var(--text-primary);" /></td>
                <td style="padding:0.3rem;"><input type="number" step="any" class="big-hmi-input" data-index="${i}" value="${row.hmi !== undefined && row.hmi !== null ? row.hmi : ''}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.3rem;outline:none;background:var(--card-bg);color:var(--text-primary);" /></td>
            `;
            bigScaleBody.appendChild(tr);
        });

        // Small Scale
        smallScaleBody.innerHTML = '';
        smallScaleRows.forEach((row, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:0.3rem;font-weight:600;color:var(--text-secondary);vertical-align:middle;">${row.target} kg</td>
                <td style="padding:0.3rem;"><input type="number" step="any" class="small-plc-input" data-index="${i}" value="${row.plc !== undefined && row.plc !== null ? row.plc : ''}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.3rem;outline:none;background:var(--card-bg);color:var(--text-primary);" /></td>
                <td style="padding:0.3rem;"><input type="number" step="any" class="small-hmi-input" data-index="${i}" value="${row.hmi !== undefined && row.hmi !== null ? row.hmi : ''}" style="width:100%;border-radius:4px;border:1px solid var(--card-border);padding:0.3rem;outline:none;background:var(--card-bg);color:var(--text-primary);" /></td>
            `;
            smallScaleBody.appendChild(tr);
        });
    };

    const openModal = () => {
        activeBatchingScaleId = null;
        document.getElementById('batching-scale-title').textContent = 'New Calibration Checking Record';
        
        // reset form
        inputDate.value = new Date().toISOString().split('T')[0];
        inputOperator.value = '';
        inputRemarks.value = '';
        
        // Populate standard target grids
        renderModalScaleGrids(
            generateDefaultScaleRows(DEFAULT_BIG_SCALE_TARGETS),
            generateDefaultScaleRows(DEFAULT_SMALL_SCALE_TARGETS)
        );
        
        if (modal) modal.classList.add('show');
    };

    const closeModal = () => {
        if (modal) modal.classList.remove('show');
    };

    const saveRecord = () => {
        if (!inputDate.value) {
            alert('Please select a Date.');
            return;
        }

        // Parse Big Scale inputs
        const bigScale = [];
        const bigPlcInputs = bigScaleBody.querySelectorAll('.big-plc-input');
        const bigHmiInputs = bigScaleBody.querySelectorAll('.big-hmi-input');
        DEFAULT_BIG_SCALE_TARGETS.forEach((target, i) => {
            const plcVal = bigPlcInputs[i].value.trim();
            const hmiVal = bigHmiInputs[i].value.trim();
            bigScale.push({
                target: target,
                plc: plcVal === '' ? '' : parseFloat(plcVal),
                hmi: hmiVal === '' ? '' : parseFloat(hmiVal)
            });
        });

        // Parse Small Scale inputs
        const smallScale = [];
        const smallPlcInputs = smallScaleBody.querySelectorAll('.small-plc-input');
        const smallHmiInputs = smallScaleBody.querySelectorAll('.small-hmi-input');
        DEFAULT_SMALL_SCALE_TARGETS.forEach((target, i) => {
            const plcVal = smallPlcInputs[i].value.trim();
            const hmiVal = smallHmiInputs[i].value.trim();
            smallScale.push({
                target: target,
                plc: plcVal === '' ? '' : parseFloat(plcVal),
                hmi: hmiVal === '' ? '' : parseFloat(hmiVal)
            });
        });

        const recordId = activeBatchingScaleId ? Number(activeBatchingScaleId) : Date.now();

        const record = {
            id: recordId,
            date: inputDate.value,
            operator: inputOperator.value.trim(),
            remarks: inputRemarks.value.trim(),
            bigScale: bigScale,
            smallScale: smallScale
        };

        if (activeBatchingScaleId) {
            const index = batchingScaleData.findIndex(r => Number(r.id) === Number(activeBatchingScaleId));
            if (index !== -1) {
                batchingScaleData[index] = record;
            } else {
                batchingScaleData.push(record);
            }
        } else {
            batchingScaleData.push(record);
        }

        saveToLS();
        renderTable();
        closeModal();
        if (window.showToast) window.showToast('Calibration checking record saved.');
    };

    window.editBatchingScale = (id) => {
        const record = batchingScaleData.find(r => Number(r.id) === Number(id));
        if (!record) return;
        activeBatchingScaleId = Number(id);
        document.getElementById('batching-scale-title').textContent = 'Edit Calibration Checking Record';
        
        inputDate.value = record.date;
        inputOperator.value = record.operator || '';
        inputRemarks.value = record.remarks || '';
        
        // Render inputs with loaded values
        const bigScaleRows = record.bigScale || generateDefaultScaleRows(DEFAULT_BIG_SCALE_TARGETS);
        const smallScaleRows = record.smallScale || generateDefaultScaleRows(DEFAULT_SMALL_SCALE_TARGETS);
        renderModalScaleGrids(bigScaleRows, smallScaleRows);
        
        if (modal) modal.classList.add('show');
    };

    window.deleteBatchingScale = (id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        batchingScaleData = batchingScaleData.filter(r => Number(r.id) !== Number(id));
        saveToLS();
        renderTable();
        if (window.showToast) window.showToast('Calibration checking record deleted.');
    };

    // Event Listeners
    if (btnAdd) btnAdd.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (btnSave) btnSave.addEventListener('click', saveRecord);

    // Initial render
    renderTable();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBatchingScale);
} else {
    initBatchingScale();
}
