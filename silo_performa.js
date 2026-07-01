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

    window.calcSlNet = () => {
        const start = parseFloat(document.getElementById('sl-modal-start-wt').value) || 0;
        const end = parseFloat(document.getElementById('sl-modal-end-wt').value) || 0;
        // Net is absolute difference
        const net = Math.abs(end - start);
        document.getElementById('sl-modal-net-wt').value = net.toFixed(2);
    };

    const renderSiloLogs = () => {
        const container = document.getElementById('silo-logs-container');
        if (!container) return;

        if (siloLogs.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);opacity:0.65;">
                    <div style="font-size:3rem;margin-bottom:1rem;">📥</div>
                    <div style="font-size:1.1rem;font-weight:600;">No Silo Performa entries found.</div>
                    <div style="font-size:0.9rem;margin-top:0.5rem;">Click "➕ New Entry" to record a log.</div>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="report-table" id="silo-logs-table" style="font-size:0.9rem;width:100%;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#334155; font-weight:700;">
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Silo No</th>
                            <th>Operation</th>
                            <th>Material</th>
                            <th>Moisture %</th>
                            <th>Start Wt (T)</th>
                            <th>End Wt (T)</th>
                            <th>Net Qty (T)</th>
                            <th>Temp (°C)</th>
                            <th>Performed By</th>
                            <th>Remarks</th>
                            <th class="no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;

        const tbody = container.querySelector('#silo-logs-table tbody');
        [...siloLogs].reverse().forEach(log => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--card-border)';
            tr.innerHTML = `
                <td style="font-weight:600;">${log.date}</td>
                <td>${log.shift || 'A'}</td>
                <td style="font-weight:700;">${log.siloNumber}</td>
                <td style="font-weight:700;color:${log.operation === 'Filling'?'#10b981':'#ef4444'};">${log.operation}</td>
                <td>${log.material}</td>
                <td>${log.moisture ? log.moisture + '%' : '-'}</td>
                <td>${log.startWeight || 0}</td>
                <td>${log.endWeight || 0}</td>
                <td style="font-weight:700;color:#2563eb;">${log.netQty || 0}</td>
                <td>${log.temperature ? log.temperature + '°C' : '-'}</td>
                <td>${log.operator || '-'}</td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${log.remarks || ''}">${log.remarks || '-'}</td>
                <td class="no-print">
                    <button class="btn btn-secondary" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="editSiloLog(${log.id})">✏️ Edit</button>
                    <button class="btn btn-danger" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="deleteSiloLog(${log.id})">🗑 Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    window.editSiloLog = (id) => {
        const log = siloLogs.find(x => x.id === id);
        if (!log) return;
        activeLogId = id;

        document.getElementById('silo-log-modal-title').textContent = 'Edit Silo Filling/Discharge Entry';
        document.getElementById('sl-modal-date').value = log.date || '';
        document.getElementById('sl-modal-shift').value = log.shift || 'A';
        document.getElementById('sl-modal-silo').value = log.siloNumber || 'Silo 1';
        document.getElementById('sl-modal-operation').value = log.operation || 'Filling';
        document.getElementById('sl-modal-material').value = log.material || '';
        document.getElementById('sl-modal-moisture').value = log.moisture !== undefined ? log.moisture : '';
        document.getElementById('sl-modal-start-wt').value = log.startWeight !== undefined ? log.startWeight : '';
        document.getElementById('sl-modal-end-wt').value = log.endWeight !== undefined ? log.endWeight : '';
        document.getElementById('sl-modal-net-wt').value = log.netQty !== undefined ? log.netQty : '';
        document.getElementById('sl-modal-temp').value = log.temperature !== undefined ? log.temperature : '';
        document.getElementById('sl-modal-operator').value = log.operator || '';
        document.getElementById('sl-modal-remarks').value = log.remarks || '';

        document.getElementById('silo-log-modal').classList.add('show');
    };

    window.deleteSiloLog = async (id) => {
        if (!confirm('Delete this Silo Performa record?')) return;
        siloLogs = siloLogs.filter(x => x.id !== id);
        saveSiloLogs();
        renderSiloLogs();

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
        const btnAdd = document.getElementById('btn-add-silo-log');
        const modal = document.getElementById('silo-log-modal');
        const btnClose = document.getElementById('silo-log-modal-close');
        const btnCancel = document.getElementById('btn-cancel-silo-log');
        const btnSave = document.getElementById('btn-save-silo-log');

        const navSiloPerforma = document.getElementById('nav-silo-performa');

        if (navSiloPerforma) {
            navSiloPerforma.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                navSiloPerforma.classList.add('active');
                
                document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
                document.getElementById('view-silo-performa').style.display = 'block';
                
                renderSiloLogs();
            });
        }

        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                activeLogId = null;
                document.getElementById('silo-log-modal-title').textContent = 'New Silo Filling/Discharge Entry';
                const today = new Date();
                document.getElementById('sl-modal-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' }) + '-' + today.getFullYear();
                document.getElementById('sl-modal-shift').value = 'A';
                document.getElementById('sl-modal-silo').value = 'Silo 1';
                document.getElementById('sl-modal-operation').value = 'Filling';
                document.getElementById('sl-modal-material').value = 'Maize';
                document.getElementById('sl-modal-moisture').value = '';
                document.getElementById('sl-modal-start-wt').value = '';
                document.getElementById('sl-modal-end-wt').value = '';
                document.getElementById('sl-modal-net-wt').value = '0.00';
                document.getElementById('sl-modal-temp').value = '';
                document.getElementById('sl-modal-operator').value = '';
                document.getElementById('sl-modal-remarks').value = '';

                modal.classList.add('show');
            });
        }

        const closeModal = () => modal.classList.remove('show');
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
                const startWeight = parseFloat(document.getElementById('sl-modal-start-wt').value) || 0;
                const endWeight = parseFloat(document.getElementById('sl-modal-end-wt').value) || 0;
                const netQty = parseFloat(document.getElementById('sl-modal-net-wt').value) || 0;
                const temperature = parseFloat(document.getElementById('sl-modal-temp').value) || 0;
                const operator = document.getElementById('sl-modal-operator').value.trim();
                const remarks = document.getElementById('sl-modal-remarks').value.trim();

                if (!date) return alert('Please enter Date.');
                if (!material) return alert('Please enter Material Name.');

                const log = {
                    id: activeLogId || Date.now(),
                    date, shift, siloNumber, operation, material, moisture,
                    startWeight, endWeight, netQty, temperature, operator, remarks
                };

                if (activeLogId) {
                    const idx = siloLogs.findIndex(x => x.id === activeLogId);
                    if (idx !== -1) siloLogs[idx] = log;
                } else {
                    siloLogs.push(log);
                }

                saveSiloLogs();
                renderSiloLogs();
                closeModal();

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
                            start_weight: log.startWeight,
                            end_weight: log.endWeight,
                            net_qty: log.netQty,
                            temperature: log.temperature,
                            performed_by: log.operator,
                            remarks: log.remarks
                        };

                        const { error } = await sbClient.from('silo_logs').upsert([dbRecord]);
                        if (error) throw error;
                        if (window.showToast) window.showToast('✓ Saved to Supabase');
                        alert('✓ Silo Performa saved to Supabase successfully!');
                    } catch (err) {
                        console.error('Failed to save to Supabase:', err);
                        const errorMsg = err.message || err.details || JSON.stringify(err);
                        if (window.showToast) window.showToast(`✗ Supabase Error: ${errorMsg}`);
                        alert(`✗ Supabase Save Error:\n${errorMsg}\n\nPlease check table columns or schema.`);
                    }
                } else {
                    if (window.showToast) window.showToast('✓ Saved locally');
                    alert('✓ Saved locally (offline/Supabase not active).');
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
                            startWeight: r.start_weight || 0,
                            endWeight: r.end_weight || 0,
                            netQty: r.net_qty || 0,
                            temperature: r.temperature || 0,
                            operator: r.performed_by,
                            remarks: r.remarks
                        };
                    });
                    saveSiloLogs();
                }
            } catch (err) {
                console.error('Failed to sync silo logs with Supabase:', err);
            }
        }
        renderSiloLogs();
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
