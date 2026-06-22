document.addEventListener('DOMContentLoaded', () => {
    // ─── Date / Time ───────────────────────────────────────────────────────────
    const updateDateTime = () => {
        const now = new Date();
        const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = now.toLocaleDateString(undefined, optionsDate);
        document.getElementById('current-time').textContent = now.toLocaleTimeString();
    };
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // ─── Sidebar Navigation ────────────────────────────────────────────────────
    const navDashboard = document.getElementById('nav-dashboard');
    const navSiloStatus = document.getElementById('nav-silo-status');
    const navDailyReport = document.getElementById('nav-daily-report');
    const navMaizeMoisture = document.getElementById('nav-maize-moisture');
    const viewDashboard = document.getElementById('view-dashboard');
    const viewSiloStatus = document.getElementById('view-silo-status');
    const viewDailyReport = document.getElementById('view-daily-report');
    const viewMaizeMoisture = document.getElementById('view-maize-moisture');

    const switchView = (activeNav, activeView) => {
        [navDashboard, navSiloStatus, navDailyReport, navMaizeMoisture].forEach(nav => {
            if (nav) nav.classList.remove('active');
        });
        [viewDashboard, viewSiloStatus, viewDailyReport, viewMaizeMoisture].forEach(view => {
            if (view) view.style.display = 'none';
        });

        if (activeNav) activeNav.classList.add('active');
        if (activeView) activeView.style.display = 'block';
    };

    if (navDashboard) {
        navDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(navDashboard, viewDashboard);
        });
    }

    if (navSiloStatus) {
        navSiloStatus.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(navSiloStatus, viewSiloStatus);
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        });
    }

    if (navDailyReport) {
        navDailyReport.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(navDailyReport, viewDailyReport);
        });
    }

    if (navMaizeMoisture) {
        navMaizeMoisture.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(navMaizeMoisture, viewMaizeMoisture);
        });
    }

    // ─── LocalStorage & Supabase configuration keys ───────────────────────────
    const LS_SILOS       = 'fmpr_silosData';
    const LS_MATERIALS   = 'fmpr_materials';
    const LS_MAIZE_LOGS  = 'fmpr_maizeLogs';
    const LS_SB_URL      = 'fmpr_supabaseUrl';
    const LS_SB_KEY      = 'fmpr_supabaseKey';
    const LS_SB_DISABLED = 'fmpr_supabaseDisabled';

    let availableMaterials = ['Maize', 'Rice'];
    let silosData = [];
    let maizeLogs = [];

    let sbDisabled = localStorage.getItem(LS_SB_DISABLED) === 'true';
    let supabaseUrl = localStorage.getItem(LS_SB_URL) || (sbDisabled ? '' : (window.env && window.env.SUPABASE_URL) || '');
    let supabaseKey = localStorage.getItem(LS_SB_KEY) || (sbDisabled ? '' : (window.env && window.env.SUPABASE_KEY) || '');
    let sbClient = null;
    let isSbConnected = false;
    let sbRealtimeSubscription = null;

    // ─── DB Mapping Helpers ────────────────────────────────────────────────────
    const mapSiloFromDb = (dbSilo) => ({
        id: dbSilo.id,
        name: dbSilo.name,
        status: dbSilo.status,
        runTime: parseFloat(dbSilo.run_time || 0),
        currentMoisture: parseFloat(dbSilo.current_moisture || 0),
        purchaseMoisture: parseFloat(dbSilo.purchase_moisture || 0),
        fanStatus: dbSilo.fan_status,
        materialType: dbSilo.material_type,
        capacity: parseFloat(dbSilo.capacity || 0),
        fillLevel: parseInt(dbSilo.fill_level || 0),
        currentFillTons: parseFloat(dbSilo.current_fill_tons || 0),
        fillingStart: dbSilo.filling_start,
        fillingEnd: dbSilo.filling_end,
        fanOnTime: dbSilo.fan_on_time || '-',
        fanOffTime: dbSilo.fan_off_time || '-'
    });

    const mapSiloToDb = (silo) => ({
        id: silo.id,
        name: silo.name,
        status: silo.status,
        run_time: silo.runTime,
        current_moisture: silo.currentMoisture,
        purchase_moisture: silo.purchaseMoisture,
        fan_status: silo.fanStatus,
        material_type: silo.materialType,
        capacity: silo.capacity,
        fill_level: silo.fillLevel,
        current_fill_tons: silo.currentFillTons,
        filling_start: silo.fillingStart,
        filling_end: silo.fillingEnd,
        fan_on_time: silo.fanOnTime,
        fan_off_time: silo.fanOffTime
    });

    // ─── Supabase Status UI ────────────────────────────────────────────────────
    const updateSbStatusUI = () => {
        const dot = document.getElementById('supabase-status-dot');
        const text = document.getElementById('supabase-status-text');
        const disconnectBtn = document.getElementById('btn-disconnect-supabase');

        if (!dot || !text) return;

        dot.className = '';
        if (isSbConnected) {
            dot.classList.add('connected');
            text.textContent = 'Supabase Connected';
            if (disconnectBtn) disconnectBtn.style.display = 'block';
        } else if (supabaseUrl && supabaseKey) {
            dot.classList.add('error');
            text.textContent = 'Supabase Connection Error';
            if (disconnectBtn) disconnectBtn.style.display = 'block';
        } else {
            dot.classList.add('disconnected');
            text.textContent = 'Local Storage Only';
            if (disconnectBtn) disconnectBtn.style.display = 'none';
        }
    };

    // ─── Initialize Supabase Client ───────────────────────────────────────────
    const initSupabase = async () => {
        if (!supabaseUrl || !supabaseKey) {
            sbClient = null;
            isSbConnected = false;
            updateSbStatusUI();
            return false;
        }

        try {
            if (typeof supabase === 'undefined') {
                console.warn('Supabase SDK is not available yet.');
                isSbConnected = false;
                updateSbStatusUI();
                return false;
            }

            sbClient = supabase.createClient(supabaseUrl, supabaseKey);

            // Ping db
            const { data, error } = await sbClient.from('materials').select('name').limit(1);
            if (error) throw error;

            isSbConnected = true;
            updateSbStatusUI();
            setupRealtimeSubscription();
            return true;
        } catch (err) {
            console.error('Supabase connection error:', err);
            isSbConnected = false;
            updateSbStatusUI();
            return false;
        }
    };

    // ─── Realtime Database Updates ─────────────────────────────────────────────
    const setupRealtimeSubscription = () => {
        if (sbRealtimeSubscription) {
            sbRealtimeSubscription.unsubscribe();
        }

        if (!sbClient) return;

        sbRealtimeSubscription = sbClient
            .channel('public:silos')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'silos' },
                payload => {
                    const newRow = payload.new;
                    if (newRow) {
                        const idx = silosData.findIndex(s => s.id === newRow.id);
                        if (idx !== -1) {
                            const updatedSilo = mapSiloFromDb(newRow);
                            silosData[idx] = updatedSilo;
                            
                            // Re-render only if user is not currently in an inline edit
                            const isEditing = document.querySelector('.inline-edit-input');
                            if (!isEditing) {
                                renderSilos();
                            } else {
                                renderSummary();
                            }
                        }
                    }
                }
            )
            .subscribe();
    };
    const ensureDefaultMaterials = () => {
        const required = ['Fresh Maize', 'Old Maize', 'Dryer Maize'];
        if (!availableMaterials || !Array.isArray(availableMaterials)) {
            availableMaterials = [];
        }
        required.forEach(m => {
            if (!availableMaterials.includes(m)) availableMaterials.push(m);
        });
    };

    // ─── Data Sync Functions ───────────────────────────────────────────────────
    const enforceFixedCapacities = () => {
        let changed = false;
        if (!silosData) return;
        silosData.forEach(silo => {
            let expectedCap = 5000;
            if (silo.id === 3 || silo.id === 6) expectedCap = 500;
            else if (silo.id >= 9 && silo.id <= 12) expectedCap = 2500;

            if (silo.capacity !== expectedCap) {
                silo.capacity = expectedCap;
                if (silo.currentFillTons > expectedCap) {
                    silo.currentFillTons = expectedCap;
                }
                silo.fillLevel = Math.round((silo.currentFillTons / expectedCap) * 100) || 0;
                changed = true;
            }
        });
        if (changed) {
            saveData();
        }
    };

    const loadAllData = async () => {
        if (isSbConnected && sbClient) {
            try {
                // Fetch materials
                const { data: dbMats, error: matErr } = await sbClient.from('materials').select('name');
                if (matErr) throw matErr;

                if (dbMats && dbMats.length > 0) {
                    availableMaterials = dbMats.map(m => m.name);
                    ensureDefaultMaterials();
                } else {
                    ensureDefaultMaterials();
                    await sbClient.from('materials').insert(availableMaterials.map(m => ({ name: m })));
                }

                // Fetch silos
                const { data: dbSilos, error: siloErr } = await sbClient.from('silos').select('*').order('id', { ascending: true });
                if (siloErr) throw siloErr;

                if (dbSilos && dbSilos.length > 0) {
                    silosData = dbSilos.map(mapSiloFromDb);
                    if (silosData.length < 16) {
                        const newSilos = generateSiloData(16).slice(silosData.length);
                        const dbRows = newSilos.map(mapSiloToDb);
                        await sbClient.from('silos').insert(dbRows);
                        silosData = [...silosData, ...newSilos];
                    }
                } else {
                    // Seed default silos
                    const defaultSilos = generateSiloData(16);
                    const dbRows = defaultSilos.map(mapSiloToDb);
                    await sbClient.from('silos').insert(dbRows);
                    silosData = defaultSilos;
                }

                enforceFixedCapacities();
                // Sync to backup local storage
                localStorage.setItem(LS_SILOS, JSON.stringify(silosData));
                localStorage.setItem(LS_MATERIALS, JSON.stringify(availableMaterials));
            } catch (err) {
                console.error('Supabase fetch failed, fallback to local storage:', err);
                loadFromLocalStorage();
            }
        } else {
            loadFromLocalStorage();
        }
    };

    const loadFromLocalStorage = () => {
        availableMaterials = JSON.parse(localStorage.getItem(LS_MATERIALS));
        ensureDefaultMaterials();
        silosData = JSON.parse(localStorage.getItem(LS_SILOS));
        if (!silosData) {
            silosData = generateSiloData(16);
            localStorage.setItem(LS_SILOS, JSON.stringify(silosData));
            localStorage.setItem(LS_MATERIALS, JSON.stringify(availableMaterials));
        } else if (silosData.length < 16) {
            const newSilos = generateSiloData(16);
            silosData = [...silosData, ...newSilos.slice(silosData.length)];
            localStorage.setItem(LS_SILOS, JSON.stringify(silosData));
        }
        maizeLogs = JSON.parse(localStorage.getItem(LS_MAIZE_LOGS)) || [];
        enforceFixedCapacities();
    };

    const saveMaizeLogs = () => {
        localStorage.setItem(LS_MAIZE_LOGS, JSON.stringify(maizeLogs));
        // If we want to sync to supabase later, we'd do it here.
    };

    const saveData = async (modifiedSilo = null) => {
        // Always write to Local Storage first (backup / offline support)
        localStorage.setItem(LS_SILOS, JSON.stringify(silosData));
        localStorage.setItem(LS_MATERIALS, JSON.stringify(availableMaterials));

        if (isSbConnected && sbClient) {
            try {
                if (modifiedSilo) {
                    const { error } = await sbClient
                        .from('silos')
                        .update(mapSiloToDb(modifiedSilo))
                        .eq('id', modifiedSilo.id);
                    if (error) throw error;
                } else {
                    const { error } = await sbClient
                        .from('silos')
                        .upsert(silosData.map(mapSiloToDb));
                    if (error) throw error;
                }

                // Also make sure availableMaterials are inserted
                const { error: matErr } = await sbClient
                    .from('materials')
                    .upsert(availableMaterials.map(m => ({ name: m })));
                if (matErr) throw matErr;

                showToast('✓ Saved to Supabase');
            } catch (err) {
                console.error('Supabase save failed:', err);
                showToast('✓ Saved locally (Supabase offline)');
            }
        } else {
            showToast('✓ Saved');
        }
    };

    const resetData = async () => {
        if (!confirm('Reset all silo data to defaults?')) return;

        if (isSbConnected && sbClient) {
            try {
                // Delete all rows in silos and materials
                const { error: siloErr } = await sbClient.from('silos').delete().gt('id', 0);
                if (siloErr) throw siloErr;
                
                const { error: matErr } = await sbClient.from('materials').delete().neq('name', '');
                if (matErr) throw matErr;

                availableMaterials = [];
                ensureDefaultMaterials();
                silosData = generateSiloData(16);
                // This will trigger re-seeding inside loadAllData
                await loadAllData();
                renderSilos();
                showToast('✓ Database reset to defaults');
            } catch (err) {
                console.error('Database reset failed:', err);
                showToast('✗ Database reset failed');
            }
        } else {
            localStorage.removeItem(LS_SILOS);
            localStorage.removeItem(LS_MATERIALS);
            availableMaterials = [];
            ensureDefaultMaterials();
            silosData = generateSiloData(16);
            saveData();
            renderSilos();
        }
    };
    document.getElementById('btn-reset').addEventListener('click', resetData);

    document.getElementById('btn-add-maize-log').addEventListener('click', () => {
        const today = new Date();
        const d = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
        maizeLogs.push({
            id: Date.now(),
            date: d,
            siloNumber: '7',
            purchaseMoisture: 12.55,
            formulaMoisture: 12.0,
            cRoomUnGrind: [null, null, null, null, null, null],
            labWetUnGrind: [null, null, null, null, null, null],
            labWetGrind: [null, null, null, null, null, null]
        });
        saveMaizeLogs();
        renderMaizeMoistureTable();
        showToast('✓ Added new date log');
    });

    const shareWhatsAppBtn = document.getElementById('btn-share-whatsapp');
    if (shareWhatsAppBtn) {
        shareWhatsAppBtn.addEventListener('click', () => {
            if (!maizeLogs || maizeLogs.length === 0) {
                alert('No daily logs available to share.');
                return;
            }
            const lastLogs = maizeLogs.slice(-4);
            let text = '*Feed Mill Maize Moisture Report (Last 4 Days)*\n\n';
            
            lastLogs.forEach(l => {
                text += `*Date:* ${l.date}\n`;
                text += `*Silo #:* ${l.siloNumber}\n`;
                text += `*Purchase Moisture:* ${l.purchaseMoisture}%\n`;
                text += `*Formula Moisture:* ${l.formulaMoisture}%\n`;
                
                // Helper to format array average locally so we don't rely strictly on DOM state
                const calcAvgStr = (arr) => {
                    const valid = arr.filter(x => typeof x === 'number' && !isNaN(x));
                    if (valid.length === 0) return '';
                    const sum = valid.reduce((a, b) => a + b, 0);
                    return (sum / valid.length).toFixed(1) + '%';
                };
                const calcRawAvg = (arr) => {
                    const valid = arr.filter(x => typeof x === 'number' && !isNaN(x));
                    if (valid.length === 0) return null;
                    const sum = valid.reduce((a, b) => a + b, 0);
                    return parseFloat((sum / valid.length).toFixed(1));
                };

                const avgCR = calcAvgStr(l.cRoomUnGrind);
                const avgLWU = calcAvgStr(l.labWetUnGrind);
                const avgLWG = calcAvgStr(l.labWetGrind);
                
                text += `*Avg C.Room:* ${avgCR || '-'}\n`;
                text += `*Avg Lab Wet (UnGrind):* ${avgLWU || '-'}\n`;
                text += `*Avg Lab Wet (Grind):* ${avgLWG || '-'}\n`;

                const rawAvg = calcRawAvg(l.cRoomUnGrind);
                if (rawAvg !== null && typeof l.formulaMoisture === 'number') {
                    const diff = (rawAvg - l.formulaMoisture).toFixed(1);
                    const sign = diff > 0 ? '+' : '';
                    text += `*Difference:* ${sign}${diff}%\n`;
                }
                text += `\n`;
            });

            const url = `https://wa.me/?text=${encodeURIComponent(text.trim())}`;
            window.open(url, '_blank');
        });
    }

    // ─── Toast notification ────────────────────────────────────────────────────
    const showToast = (msg) => {
        const t = document.getElementById('save-toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._tid);
        t._tid = setTimeout(() => t.classList.remove('show'), 2000);
    };

    // ─── Mock data generator ───────────────────────────────────────────────────
    const generateSiloData = (count) => {
        const silos = [];
        for (let i = 1; i <= count; i++) {
            const isRunning     = Math.random() > 0.3;
            const runtimeHours  = parseFloat((Math.random() * 12).toFixed(1));
            const currentMoisture  = parseFloat((10 + Math.random() * 6).toFixed(1));
            const purchaseMoisture = parseFloat((currentMoisture + Math.random() * 3).toFixed(1));
            const fanStatus     = isRunning ? 'On' : 'Off';
            const material      = availableMaterials[Math.floor(Math.random() * availableMaterials.length)];
            let capacity = 5000;
            if (i === 3 || i === 6) capacity = 500;
            else if (i >= 9 && i <= 12) capacity = 2500;
            
            const fillLevel     = Math.floor(10 + Math.random() * 80);
            const currentFillTons = Math.round((fillLevel / 100) * capacity);
            const now  = new Date();
            const start = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
            const end   = new Date(start.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
            const fmt = d => d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

            silos.push({
                id: i,
                name:             `Silo ${i.toString().padStart(2, '0')}`,
                status:           isRunning ? 'Running' : 'Stopped',
                runTime:          isRunning ? runtimeHours : 0,
                currentMoisture,
                purchaseMoisture,
                fanStatus,
                materialType:     material,
                capacity,
                fillLevel,
                currentFillTons,
                fillingStart:     fmt(start),
                fillingEnd:       Math.random() > 0.5 ? fmt(end) : 'In Progress',
                fanOnTime:        isRunning ? fmt(start) : '-',
                fanOffTime:       isRunning ? '-' : fmt(end)
            });
        }
        return silos;
    };

    // ─── Application Initialization ───────────────────────────────────────────
    const initializeApplication = async () => {
        // Set inputs in modal
        const urlInput = document.getElementById('sb-url');
        const keyInput = document.getElementById('sb-key');
        if (urlInput) urlInput.value = supabaseUrl;
        if (keyInput) keyInput.value = supabaseKey;

        // Init Supabase if credentials exist
        if (supabaseUrl && supabaseKey) {
            await initSupabase();
        } else {
            updateSbStatusUI();
        }

        // Fetch initial data
        await loadAllData();

        // Render UI
        renderSilos();
    };

    // ─── Modal Actions ──────────────────────────────────────────────────────────
    const modal = document.getElementById('supabase-modal');
    const statusBtn = document.getElementById('btn-supabase-status');
    const closeBtn = document.getElementById('modal-close');
    const testBtn = document.getElementById('btn-test-connection');
    const saveSbBtn = document.getElementById('btn-save-supabase');
    const disconnectBtn = document.getElementById('btn-disconnect-supabase');
    const statusMsg = document.getElementById('connection-status-msg');
    const copySqlBtn = document.getElementById('btn-copy-sql');

    const showModal = () => {
        document.getElementById('sb-url').value = supabaseUrl;
        document.getElementById('sb-key').value = supabaseKey;
        statusMsg.style.display = 'none';
        modal.classList.add('show');
    };

    const hideModal = () => {
        modal.classList.remove('show');
    };

    if (statusBtn) statusBtn.addEventListener('click', showModal);
    if (closeBtn) closeBtn.addEventListener('click', hideModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    const displayStatus = (type, text) => {
        statusMsg.className = `status-msg ${type}`;
        statusMsg.textContent = text;
        statusMsg.style.display = 'block';
    };

    // Test Connection
    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            const url = document.getElementById('sb-url').value.trim();
            const key = document.getElementById('sb-key').value.trim();

            if (!url || !key) {
                displayStatus('error', 'Please fill in both the URL and Anon Key.');
                return;
            }

            displayStatus('info', 'Connecting to Supabase...');

            try {
                if (typeof supabase === 'undefined') {
                    displayStatus('error', 'Supabase SDK not loaded. Check internet connection.');
                    return;
                }
                const testClient = supabase.createClient(url, key);
                
                // Query materials to verify table and credentials
                const { error } = await testClient.from('materials').select('name').limit(1);
                if (error) throw error;

                displayStatus('success', '✓ Connection successful! Tables found.');
            } catch (err) {
                console.error(err);
                displayStatus('error', `Connection failed: ${err.message || 'Check credentials and tables.'}`);
            }
        });
    }

    // Save and Sync
    if (saveSbBtn) {
        saveSbBtn.addEventListener('click', async () => {
            const url = document.getElementById('sb-url').value.trim();
            const key = document.getElementById('sb-key').value.trim();

            if (!url || !key) {
                displayStatus('error', 'Please fill in both the URL and Anon Key.');
                return;
            }

            displayStatus('info', 'Connecting and syncing data...');

            try {
                if (typeof supabase === 'undefined') {
                    displayStatus('error', 'Supabase SDK not loaded.');
                    return;
                }
                const testClient = supabase.createClient(url, key);
                const { error } = await testClient.from('materials').select('name').limit(1);
                if (error) throw error;

                // Save configuration
                supabaseUrl = url;
                supabaseKey = key;
                localStorage.setItem(LS_SB_URL, url);
                localStorage.setItem(LS_SB_KEY, key);
                localStorage.removeItem(LS_SB_DISABLED);
                sbDisabled = false;
                
                sbClient = testClient;
                isSbConnected = true;
                updateSbStatusUI();
                setupRealtimeSubscription();

                // Sync data
                await loadAllData();
                renderSilos();

                displayStatus('success', '✓ Connected and synchronized successfully!');
                setTimeout(hideModal, 1500);
            } catch (err) {
                console.error(err);
                displayStatus('error', `Sync failed: ${err.message || 'Please check your SQL setup.'}`);
            }
        });
    }

    // Disconnect
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            if (!confirm('Disconnect from Supabase? The app will return to using Local Storage.')) return;
            
            // Clear settings
            supabaseUrl = '';
            supabaseKey = '';
            localStorage.removeItem(LS_SB_URL);
            localStorage.removeItem(LS_SB_KEY);
            localStorage.setItem(LS_SB_DISABLED, 'true');
            sbDisabled = true;

            if (sbRealtimeSubscription) {
                sbRealtimeSubscription.unsubscribe();
                sbRealtimeSubscription = null;
            }

            sbClient = null;
            isSbConnected = false;
            updateSbStatusUI();

            // Reload from localStorage
            loadFromLocalStorage();
            renderSilos();

            hideModal();
            showToast('Disconnected from Supabase');
        });
    }

    // Copy SQL Schema
    if (copySqlBtn) {
        copySqlBtn.addEventListener('click', () => {
            const sqlText = document.getElementById('sql-code').textContent;
            navigator.clipboard.writeText(sqlText).then(() => {
                copySqlBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copySqlBtn.textContent = 'Copy SQL';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }

    // ─── Moisture color ────────────────────────────────────────────────────────
    const getMoistureColor = (v) => {
        if (v > 15) return 'var(--danger-color)';
        if (v < 11) return 'var(--warning-color)';
        return 'var(--success-color)';
    };

    // ─── Summary bar ──────────────────────────────────────────────────────────
    const renderSummary = () => {
        let active = 0, moisture = 0, runtime = 0;
        silosData.forEach(s => {
            if (s.status === 'Running') { active++; runtime += parseFloat(s.runTime); }
            moisture += parseFloat(s.currentMoisture);
        });
        document.getElementById('active-silos-count').textContent = active;
        document.getElementById('avg-moisture').textContent       = (moisture / silosData.length).toFixed(1) + '%';
        document.getElementById('total-runtime').textContent      = runtime.toFixed(1) + 'h';
    };

    // ─── Inline edit helper ────────────────────────────────────────────────────
    // Makes a span click-to-edit.  onCommit(rawValue) lets caller format display & save.
    const makeEditable = (el, inputType, getRaw, onCommit) => {
        el.classList.add('editable-value');
        el.title = 'Click to edit';

        el.addEventListener('click', () => {
            if (el.classList.contains('editing')) return;
            el.classList.add('editing');

            const input = document.createElement('input');
            input.type      = inputType;
            input.value     = getRaw();
            input.className = 'inline-edit-input';
            el.innerHTML = '';
            el.appendChild(input);
            input.focus();
            input.select();

            const commit = () => {
                el.classList.remove('editing');
                onCommit(input.value.trim(), el);
            };
            const cancel = (orig) => {
                el.classList.remove('editing');
                el.textContent = orig;
            };
            const origText = el.textContent;

            input.addEventListener('blur',    commit);
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter')  { input.blur(); }
                if (e.key === 'Escape') { input.removeEventListener('blur', commit); cancel(origText); }
            });
        });
    };

    // ─── Render Daily Report Table ────────────────────────────────────────────
    const renderDailyReportTable = () => {
        const tbody = document.querySelector('#daily-report-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        silosData.forEach(silo => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong><span class="editable-value" id="tbl-name-${silo.id}" title="Click to edit">${silo.name}</span></strong></td>
                <td>
                    <span class="status-indicator status-${silo.status.toLowerCase()} status-toggle" id="tbl-status-${silo.id}" title="Click to toggle status">
                        <span class="status-dot"></span>
                        ${silo.status}
                    </span>
                </td>
                <td>
                    <select class="material-select" data-id="${silo.id}"
                        style="background:rgba(0,0,0,0.3);color:var(--text-primary);border:1px solid var(--card-border);
                               padding:0.2rem 0.5rem;border-radius:0.25rem;font-family:inherit;font-size:0.85rem;outline:none;">
                        ${availableMaterials.map(m => `<option value="${m}" ${m===silo.materialType?'selected':''} style="background:var(--bg-color);">${m}</option>`).join('')}
                        <option value="add_new" style="background:var(--bg-color);">+ Add New...</option>
                    </select>
                </td>
                <td>${silo.capacity} T</td>
                <td id="tbl-fill-level-${silo.id}">${silo.fillLevel}%</td>
                <td><span class="editable-value" id="tbl-fill-${silo.id}" title="Click to edit">${silo.currentFillTons}</span> T</td>
                <td><span class="editable-value" id="tbl-pmoist-${silo.id}" title="Click to edit">${silo.purchaseMoisture}</span>%</td>
                <td><span class="editable-value" id="tbl-cmoist-${silo.id}" title="Click to edit" style="color:${getMoistureColor(silo.currentMoisture)}">${silo.currentMoisture}</span>%</td>
                <td><span class="metric-value fan-toggle" id="tbl-fan-${silo.id}" title="Click to toggle" style="color:${silo.fanStatus==='On'?'var(--success-color)':'var(--text-secondary)'}">${silo.fanStatus}</span></td>
                <td><span class="editable-value" id="tbl-fanon-${silo.id}" title="Click to edit">${silo.fanOnTime}</span></td>
                <td><span class="editable-value" id="tbl-fanoff-${silo.id}" title="Click to edit">${silo.fanOffTime}</span></td>
                <td><span class="editable-value" id="tbl-runtime-${silo.id}" title="Click to edit">${silo.runTime}</span> h</td>
            `;
            tbody.appendChild(tr);

            // Bind edits
            makeEditable(document.getElementById(`tbl-name-${silo.id}`), 'text', () => silo.name, (val, el) => {
                silo.name = val || silo.name;
                saveData(silo);
                renderSilos();
            });

            makeEditable(document.getElementById(`tbl-fill-${silo.id}`), 'number', () => silo.currentFillTons, (val, el) => {
                const n = parseFloat(val);
                if (!isNaN(n) && n >= 0) {
                    silo.currentFillTons = Math.min(n, silo.capacity);
                    silo.fillLevel = Math.round((silo.currentFillTons / silo.capacity) * 100);
                }
                saveData(silo);
                renderSilos();
            });

            makeEditable(document.getElementById(`tbl-pmoist-${silo.id}`), 'number', () => silo.purchaseMoisture, (val, el) => {
                const n = parseFloat(val);
                if (!isNaN(n)) silo.purchaseMoisture = n;
                saveData(silo);
                renderSilos();
            });

            makeEditable(document.getElementById(`tbl-cmoist-${silo.id}`), 'number', () => silo.currentMoisture, (val, el) => {
                const n = parseFloat(val);
                if (!isNaN(n)) silo.currentMoisture = n;
                saveData(silo);
                renderSilos();
            });

            makeEditable(document.getElementById(`tbl-runtime-${silo.id}`), 'number', () => silo.runTime, (val, el) => {
                const n = parseFloat(val);
                if (!isNaN(n) && n >= 0) silo.runTime = n;
                saveData(silo);
                renderSilos();
            });

            makeEditable(document.getElementById(`tbl-fanon-${silo.id}`), 'text', () => silo.fanOnTime, (val, el) => {
                silo.fanOnTime = val || silo.fanOnTime;
                saveData(silo);
                renderSilos();
            });

            makeEditable(document.getElementById(`tbl-fanoff-${silo.id}`), 'text', () => silo.fanOffTime, (val, el) => {
                silo.fanOffTime = val || silo.fanOffTime;
                saveData(silo);
                renderSilos();
            });

            // Toggles
            document.getElementById(`tbl-status-${silo.id}`).addEventListener('click', () => {
                silo.status = silo.status === 'Running' ? 'Stopped' : 'Running';
                if (silo.status === 'Stopped') silo.fanStatus = 'Off';
                saveData(silo);
                renderSilos();
            });

            document.getElementById(`tbl-fan-${silo.id}`).addEventListener('click', () => {
                silo.fanStatus = silo.fanStatus === 'On' ? 'Off' : 'On';
                saveData(silo);
                renderSilos();
            });
        });
    };

    const getAvgStr = (arr) => {
        const valid = arr.filter(x => typeof x === 'number' && !isNaN(x));
        if (valid.length === 0) return '';
        const sum = valid.reduce((a, b) => a + b, 0);
        return (sum / valid.length).toFixed(1) + '%';
    };

    const getRawAvg = (arr) => {
        const valid = arr.filter(x => typeof x === 'number' && !isNaN(x));
        if (valid.length === 0) return null;
        const sum = valid.reduce((a, b) => a + b, 0);
        return parseFloat((sum / valid.length).toFixed(1));
    };

    const calcDiffHtml = (log) => {
        const avg = getRawAvg(log.cRoomUnGrind);
        if (avg === null || typeof log.formulaMoisture !== 'number') return '';
        const diff = (avg - log.formulaMoisture).toFixed(1);
        const color = diff > 0 ? 'var(--danger-color)' : (diff < 0 ? 'var(--success-color)' : 'var(--text-secondary)');
        const bg = diff > 0 ? 'rgba(239,68,68,0.1)' : (diff < 0 ? 'rgba(34,197,94,0.1)' : 'transparent');
        const sign = diff > 0 ? '+' : '';
        return `<span style="color:${color}; background:${bg}; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold;">${sign}${diff}%</span>`;
    };

    // ─── Render Maize Moisture Table ──────────────────────────────────────────
    const renderMaizeMoistureTable = () => {
        const table = document.querySelector('#maize-moisture-table');
        if (!table) return;

        if (maizeLogs.length === 0) {
            table.innerHTML = `<tr><td style="padding:2rem;text-align:center;color:var(--text-secondary);">No daily logs found. Click "Add New Date Log" to start.</td></tr>`;
            return;
        }

        const visibleLogs = maizeLogs.slice(-3);

        // Build transposed HTML
        let html = `
            <thead>
                <tr>
                    <th class="frozen-col" style="background:var(--bg-color); z-index: 10;">Date</th>
                    ${visibleLogs.map(l => `<th colspan="3"><span class="editable-value" id="ml-date-${l.id}" title="Click to edit">${l.date}</span></th>`).join('')}
                </tr>
                <tr>
                    <th class="frozen-col" style="background:var(--bg-color); z-index: 10;">Silo #</th>
                    ${visibleLogs.map(l => `<th colspan="3" style="background:rgba(255,255,0,0.15); color:var(--text-primary);"><span class="editable-value" id="ml-silo-${l.id}" title="Click to edit">${l.siloNumber}</span></th>`).join('')}
                </tr>
                <tr>
                    <th class="frozen-col" style="background:var(--bg-color); z-index: 10;">Purchase Moisture</th>
                    ${visibleLogs.map(l => `<th colspan="3"><span class="editable-value" id="ml-pur-${l.id}" title="Click to edit">${l.purchaseMoisture}</span>%</th>`).join('')}
                </tr>
                <tr>
                    <th class="frozen-col" style="background:var(--bg-color); z-index: 10;">Analyzer</th>
                    ${visibleLogs.map(l => `<th>C.Room</th><th colspan="2">Lab Wet</th>`).join('')}
                </tr>
                <tr>
                    <th class="frozen-col" style="background:var(--bg-color); z-index: 10;"></th>
                    ${visibleLogs.map(l => `<th>ungrind</th><th>un Grind</th><th>Grind</th>`).join('')}
                </tr>
            </thead>
            <tbody>
        `;

        for (let i = 0; i < 6; i++) {
            html += `<tr><td class="frozen-col" style="background:var(--card-bg);"><strong>${i+1}${i===0?'st':i===1?'nd':i===2?'rd':'th'} Moisture</strong></td>`;
            visibleLogs.forEach(l => {
                html += `
                    <td><span class="editable-value" id="ml-cru-${l.id}-${i}">${l.cRoomUnGrind[i] !== null ? l.cRoomUnGrind[i] + '%' : '-'}</span></td>
                    <td><span class="editable-value" id="ml-lwu-${l.id}-${i}">${l.labWetUnGrind[i] !== null ? l.labWetUnGrind[i] + '%' : '-'}</span></td>
                    <td><span class="editable-value" id="ml-lwg-${l.id}-${i}">${l.labWetGrind[i] !== null ? l.labWetGrind[i] + '%' : '-'}</span></td>
                `;
            });
            html += `</tr>`;
        }

        html += `
                <tr style="border-top: 2px solid var(--card-border);">
                    <td class="frozen-col" style="background:var(--bg-color);"><strong>Running Avg. Moisture</strong></td>
                    ${visibleLogs.map(l => `
                        <td><strong>${getAvgStr(l.cRoomUnGrind)}</strong></td>
                        <td><strong>${getAvgStr(l.labWetUnGrind)}</strong></td>
                        <td><strong>${getAvgStr(l.labWetGrind)}</strong></td>
                    `).join('')}
                </tr>
                <tr>
                    <td class="frozen-col" style="background:var(--card-bg);">Avg Consumed Moisture</td>
                    ${visibleLogs.map(l => `<td colspan="3">${getAvgStr(l.cRoomUnGrind)}</td>`).join('')}
                </tr>
                <tr>
                    <td class="frozen-col" style="background:rgba(255,255,0,0.15); color:var(--text-primary);">Formula Moisture</td>
                    ${visibleLogs.map(l => `<td colspan="3" style="background:rgba(255,255,0,0.15);"><span class="editable-value" id="ml-form-${l.id}">${l.formulaMoisture}</span>%</td>`).join('')}
                </tr>
                <tr>
                    <td class="frozen-col" style="background:var(--card-bg);">Difference (Running - Formula)</td>
                    ${visibleLogs.map(l => `<td colspan="3">${calcDiffHtml(l)}</td>`).join('')}
                </tr>
            </tbody>
        `;

        table.innerHTML = html;

        // Bind Editables
        visibleLogs.forEach(l => {
            makeEditable(document.getElementById(`ml-date-${l.id}`), 'text', () => l.date, (val) => { l.date = val || l.date; saveMaizeLogs(); renderMaizeMoistureTable(); });
            makeEditable(document.getElementById(`ml-silo-${l.id}`), 'text', () => l.siloNumber, (val) => { l.siloNumber = val || l.siloNumber; saveMaizeLogs(); renderMaizeMoistureTable(); });
            makeEditable(document.getElementById(`ml-pur-${l.id}`), 'number', () => l.purchaseMoisture, (val) => { const n = parseFloat(val); if (!isNaN(n)) l.purchaseMoisture = n; saveMaizeLogs(); renderMaizeMoistureTable(); });
            makeEditable(document.getElementById(`ml-form-${l.id}`), 'number', () => l.formulaMoisture, (val) => { const n = parseFloat(val); if (!isNaN(n)) l.formulaMoisture = n; saveMaizeLogs(); renderMaizeMoistureTable(); });

            for (let i = 0; i < 6; i++) {
                makeEditable(document.getElementById(`ml-cru-${l.id}-${i}`), 'number', () => l.cRoomUnGrind[i] ?? '', (val) => { 
                    const n = parseFloat(val); l.cRoomUnGrind[i] = isNaN(n) ? null : n; saveMaizeLogs(); renderMaizeMoistureTable(); 
                });
                makeEditable(document.getElementById(`ml-lwu-${l.id}-${i}`), 'number', () => l.labWetUnGrind[i] ?? '', (val) => { 
                    const n = parseFloat(val); l.labWetUnGrind[i] = isNaN(n) ? null : n; saveMaizeLogs(); renderMaizeMoistureTable(); 
                });
                makeEditable(document.getElementById(`ml-lwg-${l.id}-${i}`), 'number', () => l.labWetGrind[i] ?? '', (val) => { 
                    const n = parseFloat(val); l.labWetGrind[i] = isNaN(n) ? null : n; saveMaizeLogs(); renderMaizeMoistureTable(); 
                });
            }
        });
    };

    // ─── Render Silo Cards ────────────────────────────────────────────────────
    const renderSilos = () => {
        const grid = document.getElementById('silo-grid');
        grid.innerHTML = '';

        silosData.forEach(silo => {
            if (silo.id === 1) {
                const header = document.createElement('div');
                header.style.gridColumn = '1 / -1';
                header.innerHTML = `<h2 style="color: var(--text-primary); padding: 1rem 0 0.5rem; border-bottom: 2px solid var(--accent-color); font-size: 1.8rem; margin-top: -1rem;">Main Silos</h2>`;
                grid.appendChild(header);
            } else if (silo.id === 9) {
                const header = document.createElement('div');
                header.style.gridColumn = '1 / -1';
                header.innerHTML = `<h2 style="color: var(--text-primary); padding: 1rem 0 0.5rem; border-bottom: 2px solid var(--accent-color); font-size: 1.8rem; margin-top: 1rem;">Dryer Side Silos</h2>`;
                grid.appendChild(header);
            } else if (silo.id === 13) {
                const header = document.createElement('div');
                header.style.gridColumn = '1 / -1';
                header.innerHTML = `<h2 style="color: var(--text-primary); padding: 1rem 0 0.5rem; border-bottom: 2px solid var(--accent-color); font-size: 1.8rem; margin-top: 1rem;">Solvent Silos</h2>`;
                grid.appendChild(header);
            }

            const mc  = getMoistureColor(silo.currentMoisture);
            const mPct = Math.min((silo.currentMoisture / 20) * 100, 100);

            const card = document.createElement('div');
            card.className = 'silo-card';

            card.innerHTML = `
                <div class="glass-silo-container" id="silo-glass-${silo.id}">
                    <div class="glass-silo-body">
                        <div class="glass-silo-maize" style="height: ${silo.fillLevel}%"></div>
                        <div class="glass-silo-reflection"></div>
                    </div>
                    <div class="glass-silo-legs-container">
                        <div class="glass-silo-leg left"></div>
                        <div class="glass-silo-leg right"></div>
                        <div class="glass-silo-fan">
                            <div class="fan-blades ${silo.fanStatus === 'On' ? 'spin' : 'fan-off'}">
                                <div class="fan-blade h"></div>
                                <div class="fan-blade v"></div>
                                <div class="fan-center"></div>
                            </div>
                        </div>
                    </div>
                    <div style="position: absolute; top: 10px; right: 10px; z-index: 4; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 12px; font-weight: bold; font-size: 0.8rem; color: var(--text-primary); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Fill: ${silo.fillLevel}%</div>
                </div>
                <div class="silo-card-content">
                    <div class="silo-header">
                        <div class="silo-title" id="name-${silo.id}">${silo.name}</div>
                        <div class="status-indicator status-${silo.status.toLowerCase()}"
                             id="status-${silo.id}">
                            <span class="status-dot"></span>
                            <span class="status-text">${silo.status}</span>
                        </div>
                    </div>

                    <!-- Material -->
                    <div class="metric">
                        <div class="metric-label">
                            <span>Material Type</span>
                            <span class="metric-value">${silo.materialType}</span>
                        </div>
                    </div>

                    <!-- Capacity -->
                    <div class="metric">
                        <div class="metric-label">
                            <span>Capacity</span>
                            <span class="metric-value" id="cap-${silo.id}">${silo.capacity} Tons</span>
                        </div>
                    </div>

                    <!-- Fill -->
                    <div class="metric">
                        <div class="metric-label">
                            <span>Current Fill</span>
                            <span class="metric-value" id="fill-${silo.id}">${silo.currentFillTons} Tons (${silo.fillLevel}%)</span>
                        </div>
                    </div>

                    <!-- Fan -->
                    <div class="metric">
                        <div class="metric-label">
                            <span>Fan Status</span>
                            <span class="metric-value" id="fan-${silo.id}"
                                  style="color:${silo.fanStatus==='On'?'var(--success-color)':'var(--text-secondary)'}">
                                ${silo.fanStatus}
                            </span>
                        </div>
                    </div>

                    <!-- Filling Start -->
                    <div class="metric">
                        <div class="metric-label">
                            <span>Filling Start</span>
                            <span class="metric-value" id="fstart-${silo.id}" style="font-size:0.8rem;">${silo.fillingStart}</span>
                        </div>
                    </div>

                    <!-- Filling End -->
                    <div class="metric">
                        <div class="metric-label">
                            <span>Filling End</span>
                            <span class="metric-value" id="fend-${silo.id}" style="font-size:0.8rem;">${silo.fillingEnd}</span>
                        </div>
                    </div>

                    <!-- Purchase Moisture -->
                    <div class="metric">
                        <div class="metric-label">
                            <span>Purchase Moisture</span>
                            <span class="metric-value" id="pmoist-${silo.id}">${silo.purchaseMoisture}%</span>
                        </div>
                    </div>

                    <!-- Current Moisture -->
                    <div class="metric">
                        <div class="metric-label">
                            <span>Current Moisture</span>
                            <span class="metric-value" id="cmoist-${silo.id}" style="color:${mc}">${silo.currentMoisture}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" id="mbar-${silo.id}" style="width:${mPct}%;background-color:${mc};"></div>
                        </div>
                    </div>

                    <!-- Run Time -->
                    <div class="metric" style="margin-top:1rem;border-top:1px solid var(--card-border);padding-top:0.5rem;">
                        <div class="metric-label">
                            <span>Run Time (Today)</span>
                            <span class="metric-value" id="runtime-${silo.id}">${silo.runTime} Hours</span>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);

            // Read-only in this view. Data is editable in the Daily Report table.
        });

        // ── Remove Three.js call as we use a static image ──
        // (Image is rendered in the HTML template directly)

        renderSummary();
        renderDailyReportTable();
        renderMaizeMoistureTable();

        // ── Material select ───────────────────────────────────────────────────
        document.querySelectorAll('.material-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const siloId = parseInt(e.target.getAttribute('data-id'));
                const silo   = silosData.find(s => s.id === siloId);

                if (e.target.value === 'add_new') {
                    const newMat = prompt('Enter new material name:');
                    if (newMat && newMat.trim()) {
                        const name = newMat.trim();
                        if (!availableMaterials.includes(name)) availableMaterials.push(name);
                        silo.materialType = name;

                        document.querySelectorAll('.material-select').forEach(sel => {
                            const cur = sel.value;
                            sel.innerHTML = availableMaterials.map(m =>
                                `<option value="${m}" style="background:var(--bg-color);">${m}</option>`
                            ).join('') + '<option value="add_new" style="background:var(--bg-color);">+ Add New...</option>';
                            sel.value = parseInt(sel.getAttribute('data-id')) === siloId
                                ? name
                                : (cur !== 'add_new' ? cur : availableMaterials[0]);
                        });
                    } else {
                        e.target.value = silo.materialType;
                    }
                } else {
                    silo.materialType = e.target.value;
                }
                saveData(silo);
                renderSilos();
            });
        });
    };

    // Start application
    initializeApplication();

    // ─── Three.js ─────────────────────────────────────────────────────────────
    function initThreeJS(containerId, isRunning, fillLevel) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Prevent NaN aspect ratio if container is initially hidden
        const width  = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);

        const scene    = new THREE.Scene();
        const camera   = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // ── Materials ──────────────────────────────────────────────────────────
        // Concrete body (back half — opaque)
        const concreteMat = new THREE.MeshStandardMaterial({
            color: 0xc2b49e,   // warm concrete beige-gray
            roughness: 0.92,
            metalness: 0.0,
        });

        // Glass viewport (front half — transparent window)
        const windowMat = new THREE.MeshPhysicalMaterial({
            color: 0xaaddff,
            roughness: 0.0,
            metalness: 0.0,
            transmission: 0.82,
            transparent: true,
            opacity: 0.22,
            clearcoat: 1.0,
            side: THREE.DoubleSide,
        });

        // Concrete roof / base
        const roofMat = new THREE.MeshStandardMaterial({
            color: 0x8a7a6a,
            roughness: 0.85,
            metalness: 0.0,
        });

        // Horizontal ring bands
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xa09080,
            roughness: 0.7,
            metalness: 0.05,
        });

        // Golden Maize — original colour
        const maizeMat = new THREE.MeshStandardMaterial({
            color: 0xF4A000,        // deep golden yellow
            roughness: 0.75,
            metalness: 0.0,
            emissive: 0x3d2600,
            emissiveIntensity: 0.25,
        });

        // Metal (fan, ladder)
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.4 });

        // ── Silo Group ─────────────────────────────────────────────────────────
        const siloGroup  = new THREE.Group();
        const bodyHeight = 3;

        // Back half — concrete (thetaStart=0, thetaLength=PI)
        const backGeom = new THREE.CylinderGeometry(1, 1, bodyHeight, 48, 1, false, 0, Math.PI);
        siloGroup.add(new THREE.Mesh(backGeom, concreteMat));

        // Front half — glass window (thetaStart=PI, thetaLength=PI)
        const frontGeom = new THREE.CylinderGeometry(1, 1, bodyHeight, 48, 1, false, Math.PI, Math.PI);
        siloGroup.add(new THREE.Mesh(frontGeom, windowMat));

        // ── Horizontal Concrete Bands ──────────────────────────────────────────
        for (let r = -1.3; r <= 1.3; r += 0.45) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.015, 0.028, 8, 48), ringMat);
            ring.position.y = r;
            siloGroup.add(ring);
        }

        // ── Golden Maize Fill (visible through glass) ──────────────────────────
        const grainHeight = (fillLevel / 100) * bodyHeight;
        if (grainHeight > 0) {
            // Main grain cylinder
            const grainGeom = new THREE.CylinderGeometry(0.93, 0.93, grainHeight, 48);
            const grain = new THREE.Mesh(grainGeom, maizeMat);
            grain.position.y = -(bodyHeight / 2) + (grainHeight / 2);
            siloGroup.add(grain);

            // Natural grain pile (mound) on top — conical heap
            const pileH = 0.28;
            const pile  = new THREE.Mesh(new THREE.ConeGeometry(0.93, pileH, 48), maizeMat);
            pile.position.y = -(bodyHeight / 2) + grainHeight + pileH / 2;
            siloGroup.add(pile);

            // Warm point light inside silo — makes maize glow golden
            const grainLight = new THREE.PointLight(0xffaa22, 1.2, 4);
            grainLight.position.set(0, -(bodyHeight / 2) + grainHeight * 0.6, 0);
            siloGroup.add(grainLight);
        }

        // ── Concrete Roof Cone ─────────────────────────────────────────────────
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.08, 0.75, 48), roofMat);
        roof.position.y = bodyHeight / 2 + 0.375;
        siloGroup.add(roof);

        // Roof vent pipe on top
        const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12), metalMat);
        vent.position.y = bodyHeight / 2 + 0.75 + 0.175;
        siloGroup.add(vent);

        // ── Base ──────────────────────────────────────────────────────────────
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.22, 48), concreteMat);
        base.position.y = -(bodyHeight / 2) - 0.11;
        siloGroup.add(base);

        // ── Ladder (side detail) ──────────────────────────────────────────────
        // Rails
        [-0.07, 0.07].forEach(zOff => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.025, bodyHeight + 0.3, 0.025), metalMat);
            rail.position.set(1.02, 0, zOff);
            siloGroup.add(rail);
        });
        // Rungs
        for (let y = -(bodyHeight / 2) + 0.1; y < bodyHeight / 2; y += 0.28) {
            const rung = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.18), metalMat);
            rung.position.set(1.02, y, 0);
            siloGroup.add(rung);
        }

        // ── Fan Assembly ──────────────────────────────────────────────────────
        const fanGroup = new THREE.Group();
        // Position fan underneath the silo base
        fanGroup.position.set(0, -(bodyHeight / 2) - 0.45, 0);

        // Fan casing
        fanGroup.add(new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.45, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 })
        ));

        // Fan hub facing forwards (z-axis)
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 16),
            new THREE.MeshStandardMaterial({ color: 0x222222 }));
        hub.rotation.x = Math.PI / 2;
        hub.position.z = 0.25;
        fanGroup.add(hub);

        // Fan blades facing forwards
        const bladesGroup = new THREE.Group();
        bladesGroup.position.z = 0.26;
        const bMat  = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5 });
        const bGeom = new THREE.BoxGeometry(0.42, 0.025, 0.09); // Adjusted for Z-facing
        const b1 = new THREE.Mesh(bGeom, bMat);
        const b2 = new THREE.Mesh(bGeom, bMat); b2.rotation.z = Math.PI / 2;
        const b3 = new THREE.Mesh(bGeom, bMat); b3.rotation.z = Math.PI / 4;
        const b4 = new THREE.Mesh(bGeom, bMat); b4.rotation.z = -Math.PI / 4;
        bladesGroup.add(b1, b2, b3, b4);
        fanGroup.add(bladesGroup);
        
        // Add legs/supports for the silo so it stands above the fan
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16), concreteMat);
            const angle = (Math.PI / 2) * i + Math.PI / 4;
            leg.position.set(0.85 * Math.cos(angle), -(bodyHeight / 2) - 0.47, 0.85 * Math.sin(angle));
            siloGroup.add(leg);
        }

        siloGroup.add(fanGroup);

        scene.add(siloGroup);

        // ── Lighting ──────────────────────────────────────────────────────────
        // Soft ambient
        scene.add(new THREE.AmbientLight(0xfff5e0, 0.55));

        // Main sun light (warm)
        const sun = new THREE.DirectionalLight(0xfff8e7, 1.4);
        sun.position.set(4, 8, 6);
        scene.add(sun);

        // Cool sky fill from opposite side
        const skyFill = new THREE.DirectionalLight(0x8ab4d0, 0.45);
        skyFill.position.set(-5, 4, -4);
        scene.add(skyFill);

        // Subtle ground bounce
        const ground = new THREE.HemisphereLight(0xffe0a0, 0x806050, 0.3);
        scene.add(ground);

        // ── Camera ────────────────────────────────────────────────────────────
        camera.position.set(2.8, 0.8, 6.2);
        camera.lookAt(0, 0.2, 0);

        // ── Animation Loop ────────────────────────────────────────────────────
        (function animate() {
            requestAnimationFrame(animate);
            siloGroup.rotation.y -= 0.003;          // slow showcase rotation
            if (isRunning) bladesGroup.rotation.z += 0.45;  // fan spin
            renderer.render(scene, camera);
        })();

        // ── Resize ────────────────────────────────────────────────────────────
        window.addEventListener('resize', () => {
            if (!container) return;
            const w = container.clientWidth, h = container.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });
    }
});

