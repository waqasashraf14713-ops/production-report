// ─── Silo Filling and Discharge Performa Module ──────────────────────────────
(() => {
try {
    const LS_SILO_LOGS = 'fm_silo_logs';
    let siloLogs = [];
    try {
        siloLogs = JSON.parse(localStorage.getItem(LS_SILO_LOGS) || '[]');
    } catch(e) {
        console.error("Failed to parse silo logs:", e);
    }
    let activeLogId = null;
    let sbClient = null;

    let currentHistorySilo = null;
    let currentHistoryOperation = null;

    const initSupabase = () => {
        const sbUrl = localStorage.getItem('fmpr_supabaseUrl');
        const sbKey = localStorage.getItem('fmpr_supabaseKey');
        const sbDisabled = localStorage.getItem('fmpr_supabaseDisabled') === 'true';
        if (sbUrl && sbKey && !sbDisabled && typeof supabase !== 'undefined') {
            try {
                const cleanUrl = sbUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
                sbClient = supabase.createClient(cleanUrl, sbKey);
            } catch (e) {
                console.error('Silo performa Supabase init error:', e);
            }
        }
    };

    const saveSiloLogs = () => {
        localStorage.setItem(LS_SILO_LOGS, JSON.stringify(siloLogs));
    };

    window.slToggleInspectionChecklist = () => {
        const section = document.getElementById('sl-modal-inspection-section');
        if (!section) return;
        section.style.display = (section.style.display === 'none') ? 'block' : 'none';
    };

    const renderTableMarkup = (logsList) => {
        if (logsList.length === 0) {
            return `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);opacity:0.65;">
                    <div style="font-size:3rem;margin-bottom:1rem;">📋</div>
                    <div style="font-size:1.1rem;font-weight:600;">No records found.</div>
                </div>`;
        }

        let rows = '';
        [...logsList].reverse().forEach(log => {
            const hasInspection = log.inspection ? '✓ Yes' : '-';
            rows += `
                <tr style="border-bottom:1px solid var(--card-border);">
                    <td style="font-weight:600;">${log.date}</td>
                    <td>${log.shift || 'A'}</td>
                    <td style="font-weight:700;">${log.siloNumber}</td>
                    <td style="font-weight:700;color:${log.operation === 'Filling'?'#10b981':'#ef4444'};">${log.operation}</td>
                    <td>${log.material}</td>
                    <td>${log.moisture ? log.moisture + '%' : '-'}</td>
                    <td style="font-weight:700;color:#2563eb;">${log.netQty || 0}</td>
                    <td>${log.temperature ? log.temperature + '°C' : '-'}</td>
                    <td>${log.operator || '-'}</td>
                    <td>${log.sealNo || '-'}</td>
                    <td>${hasInspection}</td>
                    <td class="no-print">
                        <button class="btn btn-secondary" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="editSiloLog(${log.id})">✏️ Edit</button>
                        <button class="btn btn-danger" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="deleteSiloLog(${log.id})">🗑 Del</button>
                    </td>
                </tr>
            `;
        });

        return `
            <div class="table-responsive">
                <table class="report-table" style="font-size:0.9rem;width:100%;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#334155; font-weight:700;">
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Silo No</th>
                            <th>Operation</th>
                            <th>Material</th>
                            <th>Moisture %</th>
                            <th>Net Qty (T)</th>
                            <th>Temp (°C)</th>
                            <th>Performed By</th>
                            <th>Seal No</th>
                            <th>Inspected</th>
                            <th class="no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    };

    const renderSiloPerformaDashboard = () => {
        const grid = document.getElementById('silo-performas-grid');
        if (!grid) return;
        grid.innerHTML = '';

        for (let i = 1; i <= 16; i++) {
            const siloName = `Silo ${i}`;
            
            const fillingsCount = siloLogs.filter(l => l.siloNumber === siloName && l.operation === 'Filling').length;
            const dischargeCount = siloLogs.filter(l => l.siloNumber === siloName && l.operation === 'Discharging').length;

            const card = document.createElement('div');
            card.style = `
                background: #ffffff;
                border: 1px solid var(--card-border);
                border-radius: 10px;
                padding: 1.25rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
            `;
            card.className = 'silo-performa-card';
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;padding-bottom:0.5rem;margin-bottom:0.25rem;">
                    <span style="font-weight:800;font-size:1.1rem;color:#1e293b;">🏭 Silo ${i}</span>
                    <span style="font-size:0.7rem;background:#f1f5f9;color:#475569;padding:0.15rem 0.4rem;border-radius:3px;font-weight:600;">Status: Active</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                    <button class="btn btn-secondary" onclick="window.openSiloHistory('Silo ${i}', 'Filling')" style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0.75rem;font-size:0.8rem;background:#ecfdf5;border-color:#a7f3d0;color:#065f46;font-weight:700;">
                        <span>📥 Filling Performa</span>
                        <span style="background:#10b981;color:#fff;font-size:0.7rem;padding:0.1rem 0.35rem;border-radius:10px;">${fillingsCount}</span>
                    </button>
                    <button class="btn btn-secondary" onclick="window.openSiloHistory('Silo ${i}', 'Discharging')" style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0.75rem;font-size:0.8rem;background:#fef2f2;border-color:#fecaca;color:#991b1b;font-weight:700;">
                        <span>📤 Discharge Performa</span>
                        <span style="background:#ef4444;color:#fff;font-size:0.7rem;padding:0.1rem 0.35rem;border-radius:10px;">${dischargeCount}</span>
                    </button>
                </div>
            `;
            grid.appendChild(card);
        }
    };

    window.openSiloHistory = (siloNum, operationType) => {
        currentHistorySilo = siloNum;
        currentHistoryOperation = operationType;

        const modal = document.getElementById('silo-history-modal');
        const titleEl = document.getElementById('sh-modal-title');
        const subtitleEl = document.getElementById('sh-modal-subtitle');
        const tableContainer = document.getElementById('sh-table-container');

        if (!modal || !titleEl || !tableContainer) return;

        titleEl.textContent = `${siloNum} - ${operationType === 'Filling' ? 'Filling (Stock In)' : 'Discharge (Stock Out)'} Performa History`;
        subtitleEl.textContent = `List of recorded entries for ${siloNum}`;

        renderHistoryTable();
        modal.classList.add('show');
    };

    const renderHistoryTable = () => {
        const tableContainer = document.getElementById('sh-table-container');
        if (!tableContainer) return;

        const filteredLogs = siloLogs.filter(l => l.siloNumber === currentHistorySilo && l.operation === currentHistoryOperation);

        if (filteredLogs.length === 0) {
            tableContainer.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);opacity:0.65;">
                    <div style="font-size:3rem;margin-bottom:1rem;">📋</div>
                    <div style="font-size:1.1rem;font-weight:600;">No performa logs found for ${currentHistorySilo} (${currentHistoryOperation}).</div>
                    <div style="font-size:0.85rem;margin-top:0.25rem;">Click "➕ Add Log Entry" to create a new record.</div>
                </div>`;
            return;
        }

        let rows = '';
        [...filteredLogs].reverse().forEach(log => {
            const hasInspection = log.inspection ? '✓ Yes' : '-';
            const sealValue = log.sealNo || '-';
            const supervisorValue = log.supervisor || '-';

            rows += `
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="font-weight:600;padding:0.5rem;">${log.date}</td>
                    <td style="padding:0.5rem;">${log.shift || 'A'}</td>
                    <td style="padding:0.5rem;font-weight:600;">${log.material}</td>
                    <td style="padding:0.5rem;font-weight:700;">${log.moisture ? log.moisture + '%' : '-'}</td>
                    <td style="padding:0.5rem;font-weight:700;color:#2563eb;">${log.netQty || 0}</td>
                    <td style="padding:0.5rem;">${log.temperature ? log.temperature + '°C' : '-'}</td>
                    <td style="padding:0.5rem;">${log.operator || '-'}</td>
                    <td style="padding:0.5rem;">${sealValue}</td>
                    <td style="padding:0.5rem;">${supervisorValue}</td>
                    <td style="padding:0.5rem;font-weight:700;color:#4f46e5;">${hasInspection}</td>
                    <td class="no-print" style="padding:0.5rem;">
                        <button class="btn btn-secondary" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;" onclick="window.editSiloLog(${log.id})">✏️ Edit</button>
                        <button class="btn btn-danger" style="padding:0.15rem 0.35rem; font-size:0.72rem;width:auto;background:#ef4444;" onclick="window.deleteSiloLog(${log.id})">🗑 Del</button>
                    </td>
                </tr>
            `;
        });

        tableContainer.innerHTML = `
            <table class="report-table" style="font-size:0.8rem;width:100%;border-collapse:collapse;background:#ffffff;">
                <thead>
                    <tr style="background:#e2e8f0; color:#334155; font-weight:700; text-align:left;">
                        <th style="padding:0.5rem;">Date</th>
                        <th style="padding:0.5rem;">Shift</th>
                        <th style="padding:0.5rem;">Material</th>
                        <th style="padding:0.5rem;">Moisture</th>
                        <th style="padding:0.5rem;">Net Qty (T)</th>
                        <th style="padding:0.5rem;">Temp</th>
                        <th style="padding:0.5rem;">Operator</th>
                        <th style="padding:0.5rem;">Seal No</th>
                        <th style="padding:0.5rem;">Supervisor</th>
                        <th style="padding:0.5rem;">Inspected</th>
                        <th class="no-print" style="padding:0.5rem;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    };

    window.openSiloLogModal = (operationType, siloNum) => {
        activeLogId = null;
        document.getElementById('silo-log-modal-title').textContent = `New Silo ${operationType} Entry`;
        const today = new Date();
        document.getElementById('sl-modal-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' }) + '-' + today.getFullYear();
        document.getElementById('sl-modal-shift').value = 'A';
        
        document.getElementById('sl-modal-silo').value = siloNum || 'Silo 1';
        
        const operationSelect = document.getElementById('sl-modal-operation');
        operationSelect.value = operationType;
        operationSelect.disabled = true;

        document.getElementById('sl-modal-seal-no').value = '';
        document.getElementById('sl-modal-supervisor').value = '';
        
        for (let i = 1; i <= 4; i++) document.getElementById(`sl-chk-top${i}`).checked = false;
        for (let i = 1; i <= 12; i++) document.getElementById(`sl-chk-bot${i}`).checked = false;
        for (let i = 1; i <= 2; i++) document.getElementById(`sl-chk-lab${i}`).checked = false;

        const fillingFields = document.getElementById('sl-modal-filling-only-fields');
        const inspectionBtn = document.getElementById('sl-modal-inspection-btn-container');
        const inspectionSect = document.getElementById('sl-modal-inspection-section');

        if (operationType === 'Filling') {
            if (fillingFields) fillingFields.style.display = 'grid';
            if (inspectionBtn) inspectionBtn.style.display = 'block';
            if (inspectionSect) inspectionSect.style.display = 'none';
        } else {
            if (fillingFields) fillingFields.style.display = 'none';
            if (inspectionBtn) inspectionBtn.style.display = 'none';
            if (inspectionSect) inspectionSect.style.display = 'none';
        }

        document.getElementById('sl-modal-material').value = 'Maize';
        document.getElementById('sl-modal-moisture').value = '';
        document.getElementById('sl-modal-net-wt').value = '';
        document.getElementById('sl-modal-temp').value = '';
        document.getElementById('sl-modal-operator').value = '';
        document.getElementById('sl-modal-remarks').value = '';

        document.getElementById('silo-log-modal').classList.add('show');
    };

    window.editSiloLog = (id) => {
        const log = siloLogs.find(x => x.id === id);
        if (!log) return;
        activeLogId = id;

        document.getElementById('silo-log-modal-title').textContent = `Edit Silo ${log.operation} Entry`;
        document.getElementById('sl-modal-date').value = log.date || '';
        document.getElementById('sl-modal-shift').value = log.shift || 'A';
        document.getElementById('sl-modal-silo').value = log.siloNumber || 'Silo 1';
        
        const operationSelect = document.getElementById('sl-modal-operation');
        operationSelect.value = log.operation || 'Filling';
        operationSelect.disabled = true;

        const fillingFields = document.getElementById('sl-modal-filling-only-fields');
        const inspectionBtn = document.getElementById('sl-modal-inspection-btn-container');
        const inspectionSect = document.getElementById('sl-modal-inspection-section');

        if (log.operation === 'Filling') {
            if (fillingFields) fillingFields.style.display = 'grid';
            if (inspectionBtn) inspectionBtn.style.display = 'block';
            if (inspectionSect) inspectionSect.style.display = log.inspection ? 'block' : 'none';

            document.getElementById('sl-modal-seal-no').value = log.sealNo || '';
            document.getElementById('sl-modal-supervisor').value = log.supervisor || '';

            const insp = log.inspection || {};
            for (let i = 1; i <= 4; i++) document.getElementById(`sl-chk-top${i}`).checked = !!insp[`top${i}`];
            for (let i = 1; i <= 12; i++) document.getElementById(`sl-chk-bot${i}`).checked = !!insp[`bot${i}`];
            for (let i = 1; i <= 2; i++) document.getElementById(`sl-chk-lab${i}`).checked = !!insp[`lab${i}`];
        } else {
            if (fillingFields) fillingFields.style.display = 'none';
            if (inspectionBtn) inspectionBtn.style.display = 'none';
            if (inspectionSect) inspectionSect.style.display = 'none';
        }

        document.getElementById('sl-modal-material').value = log.material || '';
        document.getElementById('sl-modal-moisture').value = log.moisture !== undefined ? log.moisture : '';
        document.getElementById('sl-modal-net-wt').value = log.netQty !== undefined ? log.netQty : '';
        document.getElementById('sl-modal-temp').value = log.temperature !== undefined ? log.temperature : '';
        document.getElementById('sl-modal-operator').value = log.operator || '';
        document.getElementById('sl-modal-remarks').value = log.remarks || '';

        document.getElementById('silo-history-modal').classList.remove('show');
        document.getElementById('silo-log-modal').classList.add('show');
    };

    window.deleteSiloLog = async (id) => {
        if (!confirm('Delete this Silo Performa record?')) return;
        siloLogs = siloLogs.filter(x => x.id !== id);
        saveSiloLogs();
        renderHistoryTable();
        renderSiloPerformaDashboard();

        initSupabase();
        if (sbClient) {
            try {
                const { error } = await sbClient.from('silo_logs').delete().eq('id', id);
                if (error) throw error;
                if (window.showToast) window.showToast('✓ Deleted from Supabase');
            } catch (err) {
                console.error('Failed to delete from Supabase:', err);
            }
        }
    };

    const initSiloEvents = () => {
        const modal = document.getElementById('silo-log-modal');
        const btnClose = document.getElementById('silo-log-modal-close');
        const btnCancel = document.getElementById('btn-cancel-silo-log');
        const btnSave = document.getElementById('btn-save-silo-log');

        const navPerforma = document.getElementById('nav-silo-performa');

        const historyModal = document.getElementById('silo-history-modal');
        const historyClose = document.getElementById('sh-modal-close');
        const historyAdd = document.getElementById('sh-btn-add-entry');

        if (navPerforma) {
            navPerforma.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                navPerforma.classList.add('active');
                
                document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
                document.getElementById('view-silo-performa').style.display = 'block';
                
                renderSiloPerformaDashboard();
            });
        }

        if (historyClose) {
            historyClose.addEventListener('click', () => {
                historyModal.classList.remove('show');
                renderSiloPerformaDashboard();
            });
        }

        if (historyAdd) {
            historyAdd.addEventListener('click', () => {
                window.openSiloLogModal(currentHistoryOperation, currentHistorySilo);
            });
        }

        const closeModal = () => {
            modal.classList.remove('show');
            if (currentHistorySilo && currentHistoryOperation) {
                renderHistoryTable();
                historyModal.classList.add('show');
            }
        };
        if (btnClose) btnClose.addEventListener('click', closeModal);
        if (btnCancel) btnCancel.addEventListener('click', closeModal);

        if (btnSave) {
            btnSave.addEventListener('click', async () => {
                const date = document.getElementById('sl-modal-date').value.trim();
                const shift = document.getElementById('sl-modal-shift').value;
                const siloNumber = document.getElementById('sl-modal-silo').value;
                const operation = document.getElementById('sl-modal-operation').value;
                const material = document.getElementById('sl-modal-material').value.trim();
                const moisture = parseFloat(document.getElementById('sl-modal-moisture').value) || 0;
                const netQty = parseFloat(document.getElementById('sl-modal-net-wt').value) || 0;
                const temperature = parseFloat(document.getElementById('sl-modal-temp').value) || 0;
                const operator = document.getElementById('sl-modal-operator').value.trim();
                const remarks = document.getElementById('sl-modal-remarks').value.trim();

                if (!date) return alert('Please enter Date.');
                if (!material) return alert('Please enter Material Name.');

                let sealNo = '';
                let supervisor = '';
                let inspection = null;

                if (operation === 'Filling') {
                    sealNo = document.getElementById('sl-modal-seal-no').value.trim();
                    supervisor = document.getElementById('sl-modal-supervisor').value.trim();
                    
                    inspection = {
                        top1: document.getElementById('sl-chk-top1').checked,
                        top2: document.getElementById('sl-chk-top2').checked,
                        top3: document.getElementById('sl-chk-top3').checked,
                        top4: document.getElementById('sl-chk-top4').checked,
                        bot1: document.getElementById('sl-chk-bot1').checked,
                        bot2: document.getElementById('sl-chk-bot2').checked,
                        bot3: document.getElementById('sl-chk-bot3').checked,
                        bot4: document.getElementById('sl-chk-bot4').checked,
                        bot5: document.getElementById('sl-chk-bot5').checked,
                        bot6: document.getElementById('sl-chk-bot6').checked,
                        bot7: document.getElementById('sl-chk-bot7').checked,
                        bot8: document.getElementById('sl-chk-bot8').checked,
                        bot9: document.getElementById('sl-chk-bot9').checked,
                        bot10: document.getElementById('sl-chk-bot10').checked,
                        bot11: document.getElementById('sl-chk-bot11').checked,
                        bot12: document.getElementById('sl-chk-bot12').checked,
                        lab1: document.getElementById('sl-chk-lab1').checked,
                        lab2: document.getElementById('sl-chk-lab2').checked
                    };
                }

                const log = {
                    id: activeLogId || Date.now(),
                    date, shift, siloNumber, operation, material, moisture,
                    netQty, temperature, operator, remarks,
                    sealNo, supervisor, inspection
                };

                if (activeLogId) {
                    const idx = siloLogs.findIndex(x => x.id === activeLogId);
                    if (idx !== -1) siloLogs[idx] = log;
                } else {
                    siloLogs.push(log);
                }

                saveSiloLogs();
                closeModal();
                renderSiloPerformaDashboard();

                initSupabase();
                if (sbClient) {
                    try {
                        const dbRecord = {
                            id: log.id,
                            date: date.includes('-') && date.split('-').length === 3 ? `${date.split('-')[2]}-${date.split('-')[1] === 'Jan'?'01':date.split('-')[1] === 'Feb'?'02':date.split('-')[1] === 'Mar'?'03':date.split('-')[1] === 'Apr'?'04':date.split('-')[1] === 'May'?'05':date.split('-')[1] === 'Jun'?'06':date.split('-')[1] === 'Jul'?'07':date.split('-')[1] === 'Aug'?'08':date.split('-')[1] === 'Sep'?'09':date.split('-')[1] === 'Oct'?'10':date.split('-')[1] === 'Nov'?'11':'12'}-${date.split('-')[0].padStart(2,'0')}` : new Date().toISOString().split('T')[0],
                            shift: log.shift,
                            silo_number: log.siloNumber,
                            operation_type: log.operation,
                            material_name: log.material,
                            moisture: log.moisture,
                            net_qty: log.netQty,
                            temperature: log.temperature,
                            performed_by: log.operator,
                            remarks: log.remarks,
                            seal_no: log.sealNo,
                            supervisor: log.supervisor,
                            inspection: log.inspection
                        };

                        const { error } = await sbClient.from('silo_logs').upsert([dbRecord]);
                        if (error) throw error;
                        if (window.showToast) window.showToast('✓ Saved to Supabase');
                        alert(`✓ Silo ${log.operation} Performa saved to Supabase successfully!`);
                    } catch (err) {
                        console.error('Failed to save to Supabase:', err);
                        const errorMsg = err.message || err.details || JSON.stringify(err);
                        if (window.showToast) window.showToast(`✗ Supabase Error: ${errorMsg}`);
                        alert(`✗ Supabase Save Error:\n${errorMsg}\n\nPlease check table columns or schema.`);
                    }
                } else {
                    if (window.showToast) window.showToast('✓ Saved locally');
                    alert('✓ Saved locally.');
                }
            });
        }
    };

    const syncWithSupabase = async () => {
        initSupabase();
        if (sbClient) {
            try {
                const { data, error } = await sbClient.from('silo_logs').select('*').order('date', { ascending: false });
                if (!error && data) {
                    siloLogs = data.map(r => {
                        const parts = r.date.split('-');
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const localeDate = parts.length === 3 ? `${parseInt(parts[2])}-${months[parseInt(parts[1]) - 1]}-${parts[0]}` : r.date;
                        return {
                            id: r.id,
                            date: localeDate,
                            shift: r.shift,
                            siloNumber: r.silo_number,
                            operation: r.operation_type,
                            material: r.material_name,
                            moisture: r.moisture || 0,
                            netQty: r.net_qty || 0,
                            temperature: r.temperature || 0,
                            operator: r.performed_by,
                            remarks: r.remarks,
                            sealNo: r.seal_no,
                            supervisor: r.supervisor,
                            inspection: r.inspection
                        };
                    });
                    saveSiloLogs();
                }
            } catch (err) {
                console.error('Failed to sync silo logs with Supabase:', err);
            }
        }
        renderSiloPerformaDashboard();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            initSiloEvents();
            await syncWithSupabase();
        });
    } else {
        initSiloEvents();
        syncWithSupabase();
    }

} catch (err) {
    if (window.showRuntimeError) {
        window.showRuntimeError('silo_performa.js', err);
    } else {
        console.error('silo_performa.js error:', err);
    }
}
})();
