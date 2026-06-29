// batching_scale.js
// Handles logic for the Batching Scale section

const initBatchingScale = () => {
    const LS_BATCHING_SCALE = 'fm_batching_scale';
    let batchingScaleData = JSON.parse(localStorage.getItem(LS_BATCHING_SCALE) || '[]');
    let activeBatchingScaleId = null;

    const modal = document.getElementById('batching-scale-modal');
    const btnAdd = document.getElementById('btn-add-batching-scale');
    const btnClose = document.getElementById('batching-scale-close');
    const btnCancel = document.getElementById('btn-cancel-batching-scale');
    const btnSave = document.getElementById('btn-save-batching-scale');
    
    // Inputs
    const inputDate = document.getElementById('batching-modal-date');
    const inputShift = document.getElementById('batching-modal-shift');
    const inputRecipe = document.getElementById('batching-modal-recipe');
    const inputTarget = document.getElementById('batching-modal-target');
    const inputActual = document.getElementById('batching-modal-actual');
    const inputRemarks = document.getElementById('batching-modal-remarks');

    const saveToLS = () => {
        localStorage.setItem(LS_BATCHING_SCALE, JSON.stringify(batchingScaleData));
    };

    const renderTable = () => {
        const tbody = document.querySelector('#batching-scale-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (batchingScaleData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:2rem;">No records found.</td></tr>';
            return;
        }

        // Add badge update if applicable
        const badge = document.getElementById('badge-batching-scale');
        if (badge) {
            badge.style.display = batchingScaleData.length > 0 ? 'inline-block' : 'none';
            badge.textContent = batchingScaleData.length + ' Drafts';
        }

        [...batchingScaleData].reverse().forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.date}</td>
                <td>${record.shift}</td>
                <td>${record.recipe}</td>
                <td>${record.target} kg</td>
                <td>${record.actual} kg</td>
                <td style="color: ${record.variance < 0 ? 'red' : 'green'}; font-weight: bold;">${record.variance > 0 ? '+' : ''}${record.variance} kg</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${record.remarks || '—'}</td>
                <td>
                    <button class="btn btn-secondary" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="editBatchingScale(${record.id})">Edit</button>
                    <button class="btn btn-danger" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="deleteBatchingScale(${record.id})">Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    const openModal = () => {
        activeBatchingScaleId = null;
        document.getElementById('batching-scale-title').textContent = 'New Batching Scale Record';
        // reset form
        inputDate.value = new Date().toISOString().split('T')[0];
        inputShift.value = 'A';
        inputRecipe.value = '';
        inputTarget.value = '';
        inputActual.value = '';
        inputRemarks.value = '';
        if (modal) modal.classList.add('show');
    };

    const closeModal = () => {
        if (modal) modal.classList.remove('show');
    };

    const saveRecord = () => {
        if (!inputDate.value || !inputRecipe.value || !inputTarget.value || !inputActual.value) {
            alert('Please fill all required fields (Date, Recipe, Target, Actual).');
            return;
        }

        const target = parseFloat(inputTarget.value);
        const actual = parseFloat(inputActual.value);
        const variance = (actual - target).toFixed(2);
        const recordId = activeBatchingScaleId ? Number(activeBatchingScaleId) : Date.now();

        const record = {
            id: recordId,
            date: inputDate.value,
            shift: inputShift.value,
            recipe: inputRecipe.value,
            target: target,
            actual: actual,
            variance: variance,
            remarks: inputRemarks.value
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
        if (window.showToast) window.showToast('Batching scale record saved.');
    };

    window.editBatchingScale = (id) => {
        const record = batchingScaleData.find(r => Number(r.id) === Number(id));
        if (!record) return;
        activeBatchingScaleId = Number(id);
        document.getElementById('batching-scale-title').textContent = 'Edit Batching Scale Record';
        
        inputDate.value = record.date;
        inputShift.value = record.shift;
        inputRecipe.value = record.recipe;
        inputTarget.value = record.target;
        inputActual.value = record.actual;
        inputRemarks.value = record.remarks;
        
        if (modal) modal.classList.add('show');
    };

    window.deleteBatchingScale = (id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        batchingScaleData = batchingScaleData.filter(r => Number(r.id) !== Number(id));
        saveToLS();
        renderTable();
        if (window.showToast) window.showToast('Batching scale record deleted.');
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
