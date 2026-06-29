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

    // Standard Target Weight values from calibration sheets
    const DEFAULT_BIG_SCALE_TARGETS = [4000, 3500, 3000, 2500, 2000, 1500, 1300, 1100, 900, 700, 500, 300, 100, 0];
    const DEFAULT_SMALL_SCALE_TARGETS = [2000, 1900, 1400, 900, 400, 200, 100, 0];

    const saveToLS = () => {
        localStorage.setItem(LS_BATCHING_SCALE, JSON.stringify(batchingScaleData));
    };

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
        const badge = document.getElementById('badge-batching-scale');
        if (badge) {
            badge.style.display = 'inline-block';
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

    const renderModalScaleGrids = (bigScaleRows, smallScaleRows) => {
        const bigScaleBody  = document.getElementById('batching-modal-big-scale-body');
        const smallScaleBody = document.getElementById('batching-modal-small-scale-body');
        if (!bigScaleBody || !smallScaleBody) return;

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

    // Always query DOM elements at call-time to avoid null captures on init
    const openModal = () => {
        activeBatchingScaleId = null;
        const titleEl = document.getElementById('batching-scale-title');
        if (titleEl) titleEl.textContent = 'New Calibration Checking Record';

        const inputDate     = document.getElementById('batching-modal-date');
        const inputOperator = document.getElementById('batching-modal-operator');
        const inputRemarks  = document.getElementById('batching-modal-remarks');

        if (inputDate)     inputDate.value     = new Date().toISOString().split('T')[0];
        if (inputOperator) inputOperator.value = '';
        if (inputRemarks)  inputRemarks.value  = '';

        renderModalScaleGrids(
            generateDefaultScaleRows(DEFAULT_BIG_SCALE_TARGETS),
            generateDefaultScaleRows(DEFAULT_SMALL_SCALE_TARGETS)
        );

        const modal = document.getElementById('batching-scale-modal');
        if (modal) modal.classList.add('show');
    };

    const closeModal = () => {
        const modal = document.getElementById('batching-scale-modal');
        if (modal) modal.classList.remove('show');
    };

    const saveRecord = () => {
        const inputDate      = document.getElementById('batching-modal-date');
        const inputOperator  = document.getElementById('batching-modal-operator');
        const inputRemarks   = document.getElementById('batching-modal-remarks');
        const bigScaleBody   = document.getElementById('batching-modal-big-scale-body');
        const smallScaleBody = document.getElementById('batching-modal-small-scale-body');

        if (!inputDate || !inputDate.value) {
            alert('Please select a Date.');
            return;
        }

        const bigScale = [];
        if (bigScaleBody) {
            const bigPlcInputs = bigScaleBody.querySelectorAll('.big-plc-input');
            const bigHmiInputs = bigScaleBody.querySelectorAll('.big-hmi-input');
            DEFAULT_BIG_SCALE_TARGETS.forEach((target, i) => {
                const plcVal = bigPlcInputs[i] ? bigPlcInputs[i].value.trim() : '';
                const hmiVal = bigHmiInputs[i] ? bigHmiInputs[i].value.trim() : '';
                bigScale.push({
                    target,
                    plc: plcVal === '' ? '' : parseFloat(plcVal),
                    hmi: hmiVal === '' ? '' : parseFloat(hmiVal)
                });
            });
        }

        const smallScale = [];
        if (smallScaleBody) {
            const smallPlcInputs = smallScaleBody.querySelectorAll('.small-plc-input');
            const smallHmiInputs = smallScaleBody.querySelectorAll('.small-hmi-input');
            DEFAULT_SMALL_SCALE_TARGETS.forEach((target, i) => {
                const plcVal = smallPlcInputs[i] ? smallPlcInputs[i].value.trim() : '';
                const hmiVal = smallHmiInputs[i] ? smallHmiInputs[i].value.trim() : '';
                smallScale.push({
                    target,
                    plc: plcVal === '' ? '' : parseFloat(plcVal),
                    hmi: hmiVal === '' ? '' : parseFloat(hmiVal)
                });
            });
        }

        const recordId = activeBatchingScaleId ? Number(activeBatchingScaleId) : Date.now();
        const record = {
            id: recordId,
            date: inputDate.value,
            operator: inputOperator ? inputOperator.value.trim() : '',
            remarks:  inputRemarks  ? inputRemarks.value.trim()  : '',
            bigScale,
            smallScale
        };

        if (activeBatchingScaleId) {
            const index = batchingScaleData.findIndex(r => Number(r.id) === Number(activeBatchingScaleId));
            if (index !== -1) batchingScaleData[index] = record;
            else batchingScaleData.push(record);
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
        const titleEl = document.getElementById('batching-scale-title');
        if (titleEl) titleEl.textContent = 'Edit Calibration Checking Record';

        const inputDate     = document.getElementById('batching-modal-date');
        const inputOperator = document.getElementById('batching-modal-operator');
        const inputRemarks  = document.getElementById('batching-modal-remarks');

        if (inputDate)     inputDate.value     = record.date;
        if (inputOperator) inputOperator.value = record.operator || '';
        if (inputRemarks)  inputRemarks.value  = record.remarks  || '';

        const bigScaleRows   = record.bigScale   || generateDefaultScaleRows(DEFAULT_BIG_SCALE_TARGETS);
        const smallScaleRows = record.smallScale || generateDefaultScaleRows(DEFAULT_SMALL_SCALE_TARGETS);
        renderModalScaleGrids(bigScaleRows, smallScaleRows);

        const modal = document.getElementById('batching-scale-modal');
        if (modal) modal.classList.add('show');
    };

    window.deleteBatchingScale = (id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        batchingScaleData = batchingScaleData.filter(r => Number(r.id) !== Number(id));
        saveToLS();
        renderTable();
        if (window.showToast) window.showToast('Calibration checking record deleted.');
    };

    // Wire up button events
    const btnAdd    = document.getElementById('btn-add-batching-scale');
    const btnClose  = document.getElementById('batching-scale-close');
    const btnCancel = document.getElementById('btn-cancel-batching-scale');
    const btnSave   = document.getElementById('btn-save-batching-scale');

    if (btnAdd)    btnAdd.addEventListener('click', openModal);
    if (btnClose)  btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (btnSave)   btnSave.addEventListener('click', saveRecord);

    // Initial render
    renderTable();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBatchingScale);
} else {
    initBatchingScale();
}
