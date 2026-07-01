// ─── Batching Audit Report Module ────────────────────────────────────────────
(() => {
try {
    const LS_BATCHING_AUDIT = 'fm_batching_audit';
    let batchingAudits = [];
    try {
        batchingAudits = JSON.parse(localStorage.getItem(LS_BATCHING_AUDIT) || '[]');
    } catch (e) {
        console.error("Failed to parse batching audit data from localStorage:", e);
    }
    let activeBaId = null;
    let sbClient = null;

    const DEFAULT_ITEMS = [
        { name: 'Supplement(L.S)', config: '0.00', standWeight: 50.00, emptyTub: 0.150 },
        { name: 'M.C.P Wanda', config: 'CJN', standWeight: 25.00, emptyTub: 0.000 },
        { name: 'MARBLE CHIPS', config: 'Powder', standWeight: 0.00, emptyTub: 0.000 },
        { name: 'SALT', config: '-', standWeight: 50.00, emptyTub: 12.090 },
        { name: 'SODIUM BICARBONATE', config: 'Local', standWeight: 25.00, emptyTub: 12.545 },
        { name: 'LYSINE SULPHATE 70%', config: 'Dongxiao', standWeight: 25.00, emptyTub: 14.190 },
        { name: 'Maize', config: '0.00', standWeight: 25.00, emptyTub: 0.000 },
        { name: 'CMS', config: '0.00', standWeight: 25.00, emptyTub: 0.220 },
        { name: 'DL.METHININE', config: 'sumittto', standWeight: 250.00, emptyTub: 19.400 },
        { name: 'L THREONINE', config: 'meihua', standWeight: 25.00, emptyTub: 12.785 },
        { name: 'L TRYPTOPHAN', config: 'yilihong', standWeight: 20.00, emptyTub: 0.230 },
        { name: 'YIDUOZYME', config: 'Novatech', standWeight: 20.00, emptyTub: 2.320 },
        { name: 'L.VALINE', config: 'eppen', standWeight: 25.00, emptyTub: 13.820 },
        { name: 'L.ISOLEUCINE', config: 'Fufeng', standWeight: 20.00, emptyTub: 13.940 },
        { name: 'L ARGINUNE', config: 'Dongxiao', standWeight: 25.00, emptyTub: 13.360 },
        { name: 'L Glycine', config: 'Local', standWeight: 25.00, emptyTub: 13.135 },
        { name: 'Romen Barja Fat', config: 'go nutri', standWeight: 25.00, emptyTub: 0.150 },
        { name: 'DCP', config: '0.00', standWeight: 50.00, emptyTub: 0.170 },
        { name: 'Magnesium oxide', config: '0.00', standWeight: 40.00, emptyTub: 0.000 },
        { name: 'Lincomycine', config: '0.00', standWeight: 25.00, emptyTub: 0.210 },
        { name: 'Mix Oil', config: 'Grauary', standWeight: 0.00, emptyTub: 0.000 },
        { name: 'Soya Bean (Crude Oil)', config: 'Local', standWeight: 0.00, emptyTub: 0.000 },
        { name: 'Soya Bean Oil', config: 'Local', standWeight: 0.00, emptyTub: 0.000 }
    ];

    const initSupabase = () => {
        const sbUrl = localStorage.getItem('fmpr_supabaseUrl');
        const sbKey = localStorage.getItem('fmpr_supabaseKey');
        const sbDisabled = localStorage.getItem('fmpr_supabaseDisabled') === 'true';
        if (sbUrl && sbKey && !sbDisabled && typeof supabase !== 'undefined') {
            try {
                const cleanUrl = sbUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
                sbClient = supabase.createClient(cleanUrl, sbKey);
            } catch (e) {
                console.error('Batching audit supabase init error:', e);
            }
        }
    };

    const saveBaData = () => {
        localStorage.setItem(LS_BATCHING_AUDIT, JSON.stringify(batchingAudits));
    };

    const calculateRow = (i) => {
        const standWeight = parseFloat(document.getElementById(`ba-stand-weight-${i}`).value) || 0;
        
        // Opening inputs
        const openLoose = parseFloat(document.getElementById(`ba-open-loose-${i}`).value) || 0;
        const openBags = parseFloat(document.getElementById(`ba-open-bags-${i}`).value) || 0;
        const openEmptyTub = parseFloat(document.getElementById(`ba-open-emptytub-${i}`).value) || 0;
        const received = parseFloat(document.getElementById(`ba-received-${i}`).value) || 0;
        
        // Closing inputs
        const closeLoose = parseFloat(document.getElementById(`ba-close-loose-${i}`).value) || 0;
        const closeBags = parseFloat(document.getElementById(`ba-close-bags-${i}`).value) || 0;
        
        const bagsUsed = parseFloat(document.getElementById(`ba-bags-used-${i}`).value) || 0;
        const avgExcessLess = parseFloat(document.getElementById(`ba-avg-excess-${i}`).value) || 0;
        const issuance = parseFloat(document.getElementById(`ba-issuance-${i}`).value) || 0;
        const totalBatches = parseFloat(document.getElementById('ba-modal-total-batches').value) || 0;

        // Calc Net Opening Balance = (Bags Available * Stand Weight) + Loose Weight - Empty Tub Weight + Received
        const netOpening = (openBags * standWeight) + openLoose - openEmptyTub + received;
        
        // Calc Net Closing Balance = (Bags Available * Stand Weight) + Loose Weight - Empty Tub Weight
        const netClosing = (closeBags * standWeight) + closeLoose - openEmptyTub;
        
        // Calc Actual Used = Net Opening - Net Closing
        const actualUsed = netOpening - netClosing;

        // Calc Used Bags Excess/Less
        const usedBagsExcessLess = bagsUsed * avgExcessLess;

        // Calc Diff = Actual Used - Issuance
        const diff = actualUsed - issuance;

        // Calc Diff/Batch
        const diffBatch = totalBatches > 0 ? diff / totalBatches : 0;

        // Calc %age Excess/Less
        const pctExcess = issuance > 0 ? (diff / issuance) * 100 : 0;

        document.getElementById(`ba-net-opening-${i}`).value = netOpening.toFixed(2);
        document.getElementById(`ba-net-closing-${i}`).value = netClosing.toFixed(2);
        document.getElementById(`ba-actual-used-${i}`).value = actualUsed.toFixed(2);
        document.getElementById(`ba-used-bags-excess-${i}`).value = usedBagsExcessLess.toFixed(2);
        document.getElementById(`ba-diff-${i}`).value = diff.toFixed(3);
        document.getElementById(`ba-diff-batch-${i}`).value = diffBatch.toFixed(3);
        document.getElementById(`ba-pct-excess-${i}`).value = issuance > 0 ? pctExcess.toFixed(2) + '%' : '#DIV/0!';
    };

    window.calcBaRow = (i) => {
        calculateRow(i);
    };

    window.calcAllBaRows = () => {
        const tbody = document.getElementById('ba-rows-tbody');
        if (!tbody) return;
        for (let i = 0; i < tbody.children.length; i++) {
            calculateRow(i);
        }
    };

    const addAuditRowUI = (item = {}, i) => {
        const tbody = document.getElementById('ba-rows-tbody');
        const tr = document.createElement('tr');
        
        const standWeight = item.standWeight !== undefined ? item.standWeight : 0;
        const openEmptyTub = item.emptyTub !== undefined ? item.emptyTub : 0;

        tr.innerHTML = `
            <td style="font-weight:600;min-width:160px;text-align:left;position:sticky;left:0;background:var(--card-bg);z-index:2;box-shadow:2px 0 5px -2px rgba(0,0,0,0.1);">${item.name}</td>
            <td><input type="text" id="ba-config-${i}" value="${item.config || ''}" style="width:70px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;"></td>
            <td><input type="number" step="any" id="ba-stand-weight-${i}" value="${standWeight}" oninput="window.calcBaRow(${i})" style="width:70px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;"></td>
            <!-- Opening -->
            <td><input type="number" step="any" id="ba-open-loose-${i}" value="${item.openLoose || ''}" oninput="window.calcBaRow(${i})" style="width:85px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;"></td>
            <td><input type="number" step="any" id="ba-open-bags-${i}" value="${item.openBags || ''}" oninput="window.calcBaRow(${i})" style="width:75px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;"></td>
            <td><input type="number" step="any" id="ba-open-emptytub-${i}" value="${openEmptyTub}" oninput="window.calcBaRow(${i})" style="width:75px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;"></td>
            <!-- Received -->
            <td><input type="number" step="any" id="ba-received-${i}" value="${item.received || ''}" oninput="window.calcBaRow(${i})" style="width:85px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;"></td>
            <!-- Net Opening -->
            <td><input type="text" id="ba-net-opening-${i}" readonly style="width:90px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:rgba(0,0,0,0.05);color:var(--text-secondary);text-align:center;font-weight:600;"></td>
            <!-- Closing -->
            <td><input type="number" step="any" id="ba-close-loose-${i}" value="${item.closeLoose || ''}" oninput="window.calcBaRow(${i})" style="width:85px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;"></td>
            <td><input type="number" step="any" id="ba-close-bags-${i}" value="${item.closeBags || ''}" oninput="window.calcBaRow(${i})" style="width:75px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;"></td>
            <!-- Net Closing -->
            <td><input type="text" id="ba-net-closing-${i}" readonly style="width:90px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:rgba(0,0,0,0.05);color:var(--text-secondary);text-align:center;font-weight:600;"></td>
            <!-- Stats -->
            <td><input type="number" step="any" id="ba-bags-used-${i}" value="${item.bagsUsed || ''}" oninput="window.calcBaRow(${i})" style="width:75px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;"></td>
            <td><input type="number" step="any" id="ba-avg-excess-${i}" value="${item.avgExcessLess || ''}" oninput="window.calcBaRow(${i})" style="width:75px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;"></td>
            <td><input type="text" id="ba-used-bags-excess-${i}" readonly style="width:80px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:rgba(0,0,0,0.05);color:var(--text-secondary);text-align:center;"></td>
            <td><input type="text" id="ba-actual-used-${i}" readonly style="width:90px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:rgba(0,0,0,0.05);color:var(--text-secondary);text-align:center;font-weight:600;color:#3b82f6;"></td>
            <td><input type="number" step="any" id="ba-issuance-${i}" value="${item.issuance || ''}" oninput="window.calcBaRow(${i})" style="width:85px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:var(--card-bg);color:var(--text-primary);text-align:center;font-weight:600;"></td>
            <td><input type="text" id="ba-diff-${i}" readonly style="width:85px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:rgba(0,0,0,0.05);color:var(--text-secondary);text-align:center;font-weight:600;"></td>
            <td><input type="text" id="ba-diff-batch-${i}" readonly style="width:85px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:rgba(0,0,0,0.05);color:var(--text-secondary);text-align:center;font-weight:600;"></td>
            <td><input type="text" id="ba-pct-excess-${i}" readonly style="width:85px;border:1px solid var(--card-border);padding:0.25rem;border-radius:4px;background:rgba(0,0,0,0.05);color:var(--text-secondary);text-align:center;font-weight:600;"></td>
        `;
        tbody.appendChild(tr);
        calculateRow(i);
    };

    const renderBaTable = () => {
        const container = document.getElementById('ba-cards-container');
        if (!container) return;

        if (batchingAudits.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);opacity:0.65;">
                    <div style="font-size:3rem;margin-bottom:1rem;">💊</div>
                    <div style="font-size:1.1rem;font-weight:600;">No Batching Audits found.</div>
                    <div style="font-size:0.9rem;margin-top:0.5rem;">Click "➕ New Audit" to create a daily report.</div>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="report-table" id="ba-history-table" style="font-size:0.9rem;width:100%;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#334155; font-weight:700;">
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Total Batches</th>
                            <th>Acceptable Limit %</th>
                            <th>Items Audited</th>
                            <th class="no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;

        const tbody = container.querySelector('#ba-history-table tbody');
        [...batchingAudits].reverse().forEach(audit => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--card-border)';
            tr.innerHTML = `
                <td style="font-weight:600;">${audit.date}</td>
                <td>${audit.shift || 'ABC'}</td>
                <td style="font-weight:700;color:#3b82f6;">${audit.totalBatches}</td>
                <td>${audit.acceptableLimit}%</td>
                <td>${audit.items ? audit.items.length : 0} items</td>
                <td class="no-print">
                    <button class="btn btn-secondary" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="editBaReport(${audit.id})">✏️ Edit</button>
                    <button class="btn btn-danger" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="deleteBaReport(${audit.id})">🗑 Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    window.editBaReport = (id) => {
        const audit = batchingAudits.find(x => x.id === id);
        if (!audit) return;
        activeBaId = id;
        
        document.getElementById('ba-modal-date').value = audit.date || '';
        document.getElementById('ba-modal-shift').value = audit.shift || 'ABC';
        document.getElementById('ba-modal-limit').value = audit.acceptableLimit !== undefined ? audit.acceptableLimit : '0.4';
        document.getElementById('ba-modal-total-batches').value = audit.totalBatches !== undefined ? audit.totalBatches : '113';

        const tbody = document.getElementById('ba-rows-tbody');
        tbody.innerHTML = '';
        
        DEFAULT_ITEMS.forEach((def, index) => {
            const saved = audit.items ? audit.items.find(it => it.name === def.name) : null;
            addAuditRowUI(saved || def, index);
        });

        document.getElementById('batching-audit-modal').classList.add('show');
    };

    window.deleteBaReport = async (id) => {
        if (!confirm('Delete this Batching Audit record?')) return;
        batchingAudits = batchingAudits.filter(x => x.id !== id);
        saveBaData();
        renderBaTable();

        initSupabase();
        if (sbClient) {
            try {
                const { error } = await sbClient.from('batching_audits').delete().eq('id', id);
                if (error) throw error;
                if (window.showToast) window.showToast('✓ Deleted from Supabase');
            } catch (err) {
                console.error('Failed to delete from Supabase:', err);
            }
        }
    };

    const initBaEvents = () => {
        const btnAdd = document.getElementById('btn-add-batching-audit');
        const modal = document.getElementById('batching-audit-modal');
        const btnClose = document.getElementById('ba-modal-close');
        const btnCancel = document.getElementById('btn-cancel-ba-modal');
        const btnSave = document.getElementById('btn-save-ba-modal');

        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                activeBaId = null;
                const today = new Date();
                document.getElementById('ba-modal-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' }) + '-' + today.getFullYear();
                document.getElementById('ba-modal-shift').value = 'ABC';
                document.getElementById('ba-modal-limit').value = '0.4';
                document.getElementById('ba-modal-total-batches').value = '113';

                const tbody = document.getElementById('ba-rows-tbody');
                tbody.innerHTML = '';
                DEFAULT_ITEMS.forEach((item, index) => addAuditRowUI(item, index));

                modal.classList.add('show');
            });
        }

        const closeModal = () => modal.classList.remove('show');
        if (btnClose) btnClose.addEventListener('click', closeModal);
        if (btnCancel) btnCancel.addEventListener('click', closeModal);

        if (btnSave) {
            btnSave.addEventListener('click', async () => {
                const date = document.getElementById('ba-modal-date').value.trim();
                const shift = document.getElementById('ba-modal-shift').value.trim();
                const acceptableLimit = parseFloat(document.getElementById('ba-modal-limit').value) || 0.4;
                const totalBatches = parseFloat(document.getElementById('ba-modal-total-batches').value) || 113;

                if (!date) return alert('Please enter Date.');

                const items = [];
                const tbody = document.getElementById('ba-rows-tbody');
                const rowCount = tbody.children.length;

                for (let i = 0; i < rowCount; i++) {
                    const name = DEFAULT_ITEMS[i].name;
                    const config = document.getElementById(`ba-config-${i}`).value;
                    const standWeight = parseFloat(document.getElementById(`ba-stand-weight-${i}`).value) || 0;
                    const openLoose = parseFloat(document.getElementById(`ba-open-loose-${i}`).value) || 0;
                    const openBags = parseFloat(document.getElementById(`ba-open-bags-${i}`).value) || 0;
                    const openEmptyTub = parseFloat(document.getElementById(`ba-open-emptytub-${i}`).value) || 0;
                    const received = parseFloat(document.getElementById(`ba-received-${i}`).value) || 0;
                    const closeLoose = parseFloat(document.getElementById(`ba-close-loose-${i}`).value) || 0;
                    const closeBags = parseFloat(document.getElementById(`ba-close-bags-${i}`).value) || 0;
                    const bagsUsed = parseFloat(document.getElementById(`ba-bags-used-${i}`).value) || 0;
                    const avgExcessLess = parseFloat(document.getElementById(`ba-avg-excess-${i}`).value) || 0;
                    const issuance = parseFloat(document.getElementById(`ba-issuance-${i}`).value) || 0;

                    items.push({
                        name, config, standWeight, openLoose, openBags, emptyTub: openEmptyTub,
                        received, closeLoose, closeBags, bagsUsed, avgExcessLess, issuance
                    });
                }

                const report = {
                    id: activeBaId || Date.now(),
                    date,
                    shift,
                    acceptableLimit,
                    totalBatches,
                    items
                };

                if (activeBaId) {
                    const idx = batchingAudits.findIndex(x => x.id === activeBaId);
                    if (idx !== -1) {
                        batchingAudits[idx] = report;
                    }
                } else {
                    batchingAudits.push(report);
                }

                saveBaData();
                renderBaTable();
                closeModal();

                // Save to Supabase
                initSupabase();
                if (sbClient) {
                    try {
                        const dbRecord = {
                            id: report.id,
                            date: date.includes('-') && date.split('-').length === 3 ? `${date.split('-')[2]}-${date.split('-')[1] === 'Jan'?'01':date.split('-')[1] === 'Feb'?'02':date.split('-')[1] === 'Mar'?'03':date.split('-')[1] === 'Apr'?'04':date.split('-')[1] === 'May'?'05':date.split('-')[1] === 'Jun'?'06':date.split('-')[1] === 'Jul'?'07':date.split('-')[1] === 'Aug'?'08':date.split('-')[1] === 'Sep'?'09':date.split('-')[1] === 'Oct'?'10':date.split('-')[1] === 'Nov'?'11':'12'}-${date.split('-')[0].padStart(2,'0')}` : new Date().toISOString().split('T')[0],
                            shift: report.shift,
                            total_batches: report.totalBatches,
                            acceptable_limit: report.acceptableLimit,
                            items: report.items
                        };
                        const { error } = await sbClient.from('batching_audits').upsert([dbRecord]);
                        if (error) throw error;
                        if (window.showToast) window.showToast('✓ Saved to Supabase');
                        alert('✓ Batching Audit Report saved to Supabase successfully!');
                    } catch (err) {
                        console.error('Failed to save to Supabase:', err);
                        const errorMsg = err.message || err.details || JSON.stringify(err);
                        if (window.showToast) window.showToast(`✗ Supabase Error: ${errorMsg}`);
                        alert(`✗ Supabase Save Error:\n${errorMsg}\n\nPlease check table columns or schema.`);
                    }
                } else {
                    if (window.showToast) window.showToast('✓ Saved locally (Supabase not configured)');
                    alert('✓ Saved locally (Supabase not configured or offline).');
                }
            });
        }
    };

    const syncWithSupabase = async () => {
        initSupabase();
        if (sbClient) {
            try {
                const { data, error } = await sbClient.from('batching_audits').select('*').order('date', { ascending: false });
                if (!error && data) {
                    batchingAudits = data.map(r => {
                        const parts = r.date.split('-');
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const localeDate = parts.length === 3 ? `${parseInt(parts[2])}-${months[parseInt(parts[1]) - 1]}-${parts[0]}` : r.date;
                        return {
                            id: r.id,
                            date: localeDate,
                            shift: r.shift,
                            totalBatches: r.total_batches || 113,
                            acceptableLimit: r.acceptable_limit || 0.4,
                            items: r.items || []
                        };
                    });
                    saveBaData();
                }
            } catch (err) {
                console.error('Failed to sync batching audits with Supabase:', err);
            }
        }
        renderBaTable();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            initBaEvents();
            await syncWithSupabase();
        });
    } else {
        initBaEvents();
        syncWithSupabase();
    }

} catch (err) {
    if (window.showRuntimeError) {
        window.showRuntimeError('batching_audit.js', err);
    } else {
        console.error('batching_audit.js error:', err);
    }
}
})();
