document.addEventListener('DOMContentLoaded', () => {
    try {
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
    const navDailyLessExcess = document.getElementById('nav-daily-less-excess');
    const viewDailyLessExcess = document.getElementById('view-daily-less-excess');
    const navFiveS = document.getElementById('nav-five-s');
    const viewFiveS = document.getElementById('view-five-s');
    // navDailyChecklist and viewDailyChecklist are now part of view-five-s tabs
    const navShiftReport = document.getElementById('nav-shift-report');
    const viewShiftReport = document.getElementById('view-shift-report');
    const navBatchingAudit = document.getElementById('nav-batching-audit');
    const viewBatchingAudit = document.getElementById('view-batching-audit');
    const navBatchingScale = document.getElementById('nav-batching-scale');
    const viewBatchingScale = document.getElementById('view-batching-scale');

    const switchView = (activeNav, activeView) => {
        [navDashboard, navSiloStatus, navDailyReport, navMaizeMoisture, navDailyLessExcess, navFiveS, navShiftReport, navBatchingAudit, navBatchingScale].forEach(nav => {
            if (nav) nav.classList.remove('active');
        });
        [viewDashboard, viewSiloStatus, viewDailyReport, viewMaizeMoisture, viewDailyLessExcess, viewFiveS, viewShiftReport, viewBatchingAudit, viewBatchingScale].forEach(view => {
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

    if (navDailyLessExcess) {
        navDailyLessExcess.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(navDailyLessExcess, viewDailyLessExcess);
        });
    }

    if (navFiveS) {
        navFiveS.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(navFiveS, viewFiveS);
            // Default to 5S tab; initialize both sub-modules
            switchQSTab('five-s');
            showFiveSDashboard();
        });
    }
    // Daily Checklist is now a tab inside view-five-s — no separate nav handler needed

    if (navShiftReport) {
        navShiftReport.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(navShiftReport, viewShiftReport);
            initShiftReportView();
        });
    }

    if (navBatchingAudit) {
        navBatchingAudit.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(navBatchingAudit, viewBatchingAudit);
            initBatchingAuditView();
        });
    }

    if (navBatchingScale) {
        navBatchingScale.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(navBatchingScale, viewBatchingScale);
        });
    }

    // ─── LocalStorage & Supabase configuration keys ───────────────────────────
    const LS_SILOS       = 'fmpr_silosData';
    const LS_MATERIALS   = 'fmpr_materials';
    const LS_MAIZE_LOGS  = 'fmpr_maizeLogs';
    const LS_LESS_EXCESS_LOGS = 'fmpr_lessExcessLogs';
    const LS_FIVE_S_LOGS = 'fmpr_fiveSLogs';
    const LS_DAILY_CHECKLISTS = 'fmpr_dailyChecklists';
    const LS_SHIFT_REPORTS    = 'fmpr_shiftReports';
    const LS_BATCHING_AUDITS  = 'fmpr_batchingAudits';
    const LS_SB_URL      = 'fmpr_supabaseUrl';
    const LS_SB_KEY      = 'fmpr_supabaseKey';
    const LS_SB_DISABLED = 'fmpr_supabaseDisabled';

    const DEPARTMENTS = [
        { id: 'godown', name: 'Old Godown', icon: '📦', class: 'godown' },
        { id: 'mech', name: 'Mechanical', icon: '⚙️', class: 'mech' },
        { id: 'elec', name: 'Electrical', icon: '⚡', class: 'elec' },
        { id: 'control', name: 'Control Room', icon: '🎛️', class: 'control' },
        { id: 'premix', name: 'Premix', icon: '🥣', class: 'premix' },
        { id: 'other', name: 'Other Department', icon: '📁', class: 'other' }
    ];

    const CHECKLIST_ITEMS = {
        'Old Godown': {
            sort: [
                'Obsolete materials and damaged bags are removed.',
                'Unused pallets and packaging materials are stored away.',
                'No personal or unrelated items are left in storage areas.',
                'Red tags are applied to questionable items.',
                'Aisles and exit routes are free of storage overflow.'
            ],
            set: [
                'Stacking zones and lanes are clearly marked and labeled.',
                'Pallets are perfectly aligned within grid lines.',
                'Raw materials are stacked by batch number and type.',
                'Visual stock cards are placed and readable.',
                'First-In, First-Out (FIFO) pathways are clear.'
            ],
            shine: [
                'Floor is swept and free of spilled grains/dust.',
                'Dust is wiped from the bags and stacks.',
                'Pallets and storage racks are clean.',
                'Cleaning tools (brooms, pans) are in their spots.',
                'Rodent traps are clean and placed correctly.'
            ],
            std: [
                'Stacking height limit guides are clearly posted.',
                'Standard operating procedures (SOPs) are visible.',
                'Safety signs and fire exit marks are clear.',
                'Cleaning schedules are active and signed off.',
                '5S audit summary sheet is displayed on the board.'
            ],
            sust: [
                'Warehouse team performs daily 5-minute sweeps.',
                'PPE (dust masks, safety shoes) is worn by all.',
                'Deviations are corrected immediately.',
                'Weekly team audit results are updated.',
                'Daily inspection check sheet is completed.'
            ]
        },
        'Mechanical': {
            sort: [
                'No broken tools or machinery parts lying around.',
                'Scrap metal is immediately placed in the scrap bin.',
                'Unused spare parts are returned to store.',
                'Red tags applied to inactive workshop equipment.',
                'Workbenches are free of unnecessary items.'
            ],
            set: [
                'Tools are hung on labeled shadow boards.',
                'Parts drawers and storage bins are clearly labeled.',
                'Gas cylinders and heavy machines are secured in spots.',
                'Safety walkways are marked and completely clear.',
                'Toolboxes are organized by category.'
            ],
            shine: [
                'Workbenches are wiped clean of oil and grease.',
                'Floor is free of oil spills and metal shavings.',
                'Maintenance machines (lathe, drill) are clean.',
                'Cleaning rags are disposed of in fireproof bins.',
                'Light fixtures are clean and functioning.'
            ],
            std: [
                'Machine safety guards are installed and labeled.',
                'Emergency stop buttons are highly visible.',
                'LOTO (Lock-Out Tag-Out) station is stocked.',
                'Maintenance logbook is active and updated.',
                'Lubrication charts are posted near machines.'
            ],
            sust: [
                'Technicians return tools to boards immediately.',
                'Daily 5-minute cleanup is performed.',
                'Safety shoes and goggles are worn constantly.',
                'Housekeeping logs are signed off daily.',
                'Preventive maintenance checks are sustained.'
            ]
        },
        'Electrical': {
            sort: [
                'No scrap wire pieces or insulation left on floor.',
                'Obsolete electrical components are disposed.',
                'Broken test meters/leads are removed.',
                'Personal items kept outside switchgear rooms.',
                'Red tags placed on retired electrical gear.'
            ],
            set: [
                'Electrical panels are labeled and doors closed.',
                'Cables are neatly tied, routed, and tagged.',
                'Test equipment is stored in designated cases.',
                'Keys to panels are in labeled key cabinets.',
                'LOTO padlocks are organized on board.'
            ],
            shine: [
                'Inside of control panels is free of dust.',
                'Switchgear room floor is dry and swept.',
                'No cobwebs or dust on cable trays.',
                'Panel exterior surfaces are wiped clean.',
                'Air vents on panels are clean and open.'
            ],
            std: [
                'High voltage danger signs are posted.',
                'Electrical single-line diagrams are in folders.',
                'LOTO procedures are clearly posted.',
                'Rubber insulation mats are placed in front of panels.',
                'Calibration dates are marked on all meters.'
            ],
            sust: [
                'Panel doors are always kept locked after work.',
                'Daily visual inspections are done and logged.',
                'Safety gloves/glasses worn during live testing.',
                'Only authorized electricians enter control rooms.',
                'Weekly battery bank checks are maintained.'
            ]
        },
        'Control Room': {
            sort: [
                'Desks are free of personal clutter (cups, food).',
                'Old paper logs are filed and archived.',
                'Unused computer peripherals are removed.',
                'Red tags placed on obsolete monitors/servers.',
                'Operators desks have only active documents.'
            ],
            set: [
                'Monitors and HMI screens are positioned correctly.',
                'Emergency contact list is posted by the phone.',
                'Mill plant manuals are in labeled folders.',
                'Keyboards and mice are in clean desk pads.',
                'Operator chairs are adjusted and in place.'
            ],
            shine: [
                'Screens are free of fingerprints and dust.',
                'Keyboards and desks are wiped clean daily.',
                'Air conditioning filters are clean.',
                'Trash bin is emptied every shift.',
                'Control panel status LEDs are clean and visible.'
            ],
            std: [
                'SOPs for plant startup and shutdown are posted.',
                'Critical alarm levels are marked on charts.',
                'Operator shift handover log is standard.',
                'Visitor logbook is active at entry.',
                'Safety exit route from control room is clear.'
            ],
            sust: [
                'No eating or drinking near control consoles.',
                'Hourly process parameters are logged standard.',
                'Shift screen layouts are kept to standards.',
                'Alarm responses are logged immediately.',
                'Daily checklist completed before shift starts.'
            ]
        },
        'Premix': {
            sort: [
                'Obsolete micro-ingredients are removed.',
                'Empty bags/liners are disposed of immediately.',
                'Only active bags are placed on supply pallets.',
                'Scoops not in use are removed from scales.',
                'Red tags applied to expired premix batches.'
            ],
            set: [
                'Micro-ingredient bins are labeled with bag codes.',
                'Scoops are hung on designated colored hooks.',
                'Weighing scales are set on clean tables.',
                'Active recipe sheets are placed on clipboard.',
                'Pallets of active ingredients are aligned.'
            ],
            shine: [
                'Weighing scales are brushed clean of dust.',
                'No powder spills on the floor or tables.',
                'Dust extraction hoods are clean and running.',
                'Hand washing sink is clean and dry.',
                'Premix mixer exterior is wiped daily.'
            ],
            std: [
                'Scale calibration weights are stored and labeled.',
                'Micro-ingredient recipe chart is posted.',
                'Batch sheet verification standard is active.',
                'Wear-mask and wear-gloves signs are posted.',
                'All ingredient bins have lid status labels.'
            ],
            sust: [
                'Dust masks, hairnets, and gloves worn by all.',
                'Scale calibration verified before every batch.',
                'Bags are tightly sealed immediately after scoop.',
                'Premix room door is kept closed.',
                'Cross-contamination prevention check logged.'
            ]
        },
        'Other Department': {
            sort: [
                'Unused files or office materials archived.',
                'Red tags applied to broken chairs or fans.',
                'Trash is separated into bins.',
                'Walkways and corridors free of clutter.',
                'Notice boards have only active posters.'
            ],
            set: [
                'First aid kit is fully stocked and labeled.',
                'Fire extinguishers are accessible and tagged.',
                'Evacuation route maps are clearly posted.',
                'Office files are organized in labeled cabinets.',
                'Stationery is sorted in drawers.'
            ],
            shine: [
                'Floors are swept and mopped daily.',
                'Windows and desks are dust-free.',
                'Bins are emptied and sanitized daily.',
                'Common dining/break area is clean.',
                'Office equipment is wiped down.'
            ],
            std: [
                'Housekeeping standards are posted.',
                'Emergency assembly point sign is visible.',
                'Fire drill record is logged.',
                'First aider contact list is posted.',
                'Weekly cleaning roster is visible.'
            ],
            sust: [
                '5S audit score is updated on notice board.',
                'Safety drills are attended by all staff.',
                'Housekeeping deviations are corrected.',
                'Staff complete their daily desk cleanup.',
                'Monthly 5S committee reviews are held.'
            ]
        }
    };

    let availableMaterials = ['Maize', 'Rice'];
    let silosData = [];
    let maizeLogs = [];
    let lessExcessLogs = [];
    let fiveSLogs = [];
    let currentFiveSDept = null;
    let activeFiveSAuditId = null;
    let dailyChecklists = [];
    let currentChecklistDate = null;
    let shiftReports = [];
    let currentSrFilterDate = null;
    let activeSrId = null;
    let batchingAudits = [];
    let currentBaFilterDate = null;
    let activeBaId = null;

    let sbDisabled = localStorage.getItem(LS_SB_DISABLED) === 'true';
    let supabaseUrl = localStorage.getItem(LS_SB_URL) || (sbDisabled ? '' : (window.env && window.env.SUPABASE_URL) || '');
    if (supabaseUrl) {
        supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    }
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

    const mapLessExcessFromDb = (dbRow) => ({
        id: dbRow.id,
        date: dbRow.report_date,
        shift: dbRow.shift,
        officerName: dbRow.officer_name,
        feedName: dbRow.feed_name,
        batches: parseFloat(dbRow.batches || 0),
        productionBags: parseFloat(dbRow.production_bags || 0),
        waterAddition: parseFloat(dbRow.water_addition || 0),
        remarks: dbRow.remarks || '',
        locked: dbRow.is_locked === true || dbRow.is_locked === 'true'
    });

    const mapLessExcessToDb = (log) => ({
        id: log.id,
        report_date: log.date,
        shift: log.shift,
        officer_name: log.officerName,
        feed_name: log.feedName,
        batches: parseFloat(log.batches || 0),
        production_bags: parseFloat(log.productionBags || 0),
        water_addition: parseFloat(log.waterAddition || 0),
        remarks: log.remarks || '',
        is_locked: log.locked === true
    });

    const mapMaizeLogFromDb = (dbLog) => ({
        id: dbLog.id,
        date: dbLog.date,
        siloNumber: dbLog.silo_number,
        purchaseMoisture: parseFloat(dbLog.purchase_moisture || 0),
        formulaMoisture: parseFloat(dbLog.formula_moisture || 0),
        cRoomUnGrind: dbLog.c_room_un_grind || [null, null, null, null, null, null],
        labWetUnGrind: dbLog.lab_wet_un_grind || [null, null, null, null, null, null],
        labWetGrind: dbLog.lab_wet_grind || [null, null, null, null, null, null]
    });

    const mapMaizeLogToDb = (log) => ({
        id: log.id,
        date: log.date,
        silo_number: log.siloNumber,
        purchase_moisture: log.purchaseMoisture,
        formula_moisture: log.formulaMoisture,
        c_room_un_grind: log.cRoomUnGrind,
        lab_wet_un_grind: log.labWetUnGrind,
        lab_wet_grind: log.labWetGrind
    });

    const mapFiveSFromDb = (dbRow) => ({
        id: dbRow.id,
        date: dbRow.audit_date,
        auditorName: dbRow.auditor_name,
        areaName: dbRow.area_name,
        sortScore: parseFloat(dbRow.sort_score || 5),
        setOrderScore: parseFloat(dbRow.set_order_score || 5),
        shineScore: parseFloat(dbRow.shine_score || 5),
        standardizeScore: parseFloat(dbRow.standardize_score || 5),
        sustainScore: parseFloat(dbRow.sustain_score || 5),
        remarks: dbRow.remarks || '',
        locked: dbRow.is_locked === true || dbRow.is_locked === 'true'
    });

    const mapFiveSToDb = (log) => ({
        id: log.id,
        audit_date: log.date,
        auditor_name: log.auditorName,
        area_name: log.areaName,
        sort_score: log.sortScore,
        set_order_score: log.setOrderScore,
        shine_score: log.shineScore,
        standardize_score: log.standardizeScore,
        sustain_score: log.sustainScore,
        remarks: log.remarks || '',
        is_locked: log.locked === true
    });

    const mapDailyChecklistFromDb = (dbRow) => ({
        id: dbRow.id,
        date: dbRow.checklist_date,
        departmentName: dbRow.department_name,
        filledBy: dbRow.filled_by,
        checkedItems: dbRow.checked_items || [],
        remarks: dbRow.remarks || ''
    });

    const mapDailyChecklistToDb = (log) => ({
        id: log.id,
        checklist_date: log.date,
        department_name: log.departmentName,
        filled_by: log.filledBy,
        checked_items: log.checkedItems,
        remarks: log.remarks || ''
    });

    const mapShiftReportFromDb = (r) => ({
        id: r.id,
        date: r.report_date,
        shift: r.shift,
        officerName: r.officer_name,
        feedProduced: r.feed_produced || '',
        batches: parseFloat(r.batches || 0),
        productionBags: parseFloat(r.production_bags || 0),
        rawMaterialUsed: r.raw_material_used || '',
        machineIssues: r.machine_issues || '',
        qualityRemarks: r.quality_remarks || '',
        generalRemarks: r.general_remarks || '',
        isSubmitted: r.is_submitted === true
    });

    const mapShiftReportToDb = (r) => ({
        id: r.id,
        report_date: r.date,
        shift: r.shift,
        officer_name: r.officerName,
        feed_produced: r.feedProduced || '',
        batches: r.batches || 0,
        production_bags: r.productionBags || 0,
        raw_material_used: r.rawMaterialUsed || '',
        machine_issues: r.machineIssues || '',
        quality_remarks: r.qualityRemarks || '',
        general_remarks: r.generalRemarks || '',
        is_submitted: r.isSubmitted === true
    });

    const mapBatchingAuditFromDb = (a) => ({
        id: a.id,
        date: a.audit_date,
        time: a.audit_time,
        medicineName: a.medicine_name,
        batchNo: a.batch_no || '',
        expectedQty: parseFloat(a.expected_qty || 0),
        actualQty: parseFloat(a.actual_qty || 0),
        remarks: a.remarks || '',
        auditorName: a.auditor_name || ''
    });

    const mapBatchingAuditToDb = (a) => ({
        id: a.id,
        audit_date: a.date,
        audit_time: a.time,
        medicine_name: a.medicineName,
        batch_no: a.batchNo || '',
        expected_qty: a.expectedQty || 0,
        actual_qty: a.actualQty || 0,
        remarks: a.remarks || '',
        auditor_name: a.auditorName || ''
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
            else if (silo.id >= 17 && silo.id <= 19) expectedCap = 400;
            else if (silo.id >= 20 && silo.id <= 21) expectedCap = 250;

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
                    if (silosData.length < 21) {
                        const newSilos = generateSiloData(21).slice(silosData.length);
                        const dbRows = newSilos.map(mapSiloToDb);
                        await sbClient.from('silos').insert(dbRows);
                        silosData = [...silosData, ...newSilos];
                    }
                } else {
                    // Seed default silos
                    const defaultSilos = generateSiloData(21);
                    const dbRows = defaultSilos.map(mapSiloToDb);
                    await sbClient.from('silos').insert(dbRows);
                    silosData = defaultSilos;
                }

                // Fetch Less/Excess logs
                const { data: dbLogs, error: logErr } = await sbClient.from('daily_less_excess_logs').select('*').order('id', { ascending: true });
                if (logErr) throw logErr;
                
                if (dbLogs && dbLogs.length > 0) {
                    lessExcessLogs = dbLogs.map(mapLessExcessFromDb);
                } else {
                    lessExcessLogs = JSON.parse(localStorage.getItem(LS_LESS_EXCESS_LOGS)) || [];
                    if (lessExcessLogs.length > 0) {
                        // Seed local data to Supabase
                        await sbClient.from('daily_less_excess_logs').insert(lessExcessLogs.map(mapLessExcessToDb));
                    }
                }

                // Fetch Maize logs
                const { data: dbMaize, error: maizeErr } = await sbClient.from('daily_maize_logs').select('*').order('id', { ascending: true });
                if (maizeErr) throw maizeErr;

                if (dbMaize && dbMaize.length > 0) {
                    maizeLogs = dbMaize.map(mapMaizeLogFromDb);
                } else {
                    maizeLogs = JSON.parse(localStorage.getItem(LS_MAIZE_LOGS)) || [];
                    if (maizeLogs.length > 0) {
                        // Seed local data to Supabase
                        await sbClient.from('daily_maize_logs').insert(maizeLogs.map(mapMaizeLogToDb));
                    }
                }

                // Fetch 5S logs
                const { data: dbFiveS, error: fiveSErr } = await sbClient.from('five_s_logs').select('*').order('id', { ascending: true });
                if (fiveSErr) throw fiveSErr;

                if (dbFiveS && dbFiveS.length > 0) {
                    fiveSLogs = dbFiveS.map(mapFiveSFromDb);
                } else {
                    fiveSLogs = JSON.parse(localStorage.getItem(LS_FIVE_S_LOGS)) || [];
                    if (fiveSLogs.length > 0) {
                        await sbClient.from('five_s_logs').insert(fiveSLogs.map(mapFiveSToDb));
                    } else {
                        seedDefaultFiveSLogs();
                        await sbClient.from('five_s_logs').insert(fiveSLogs.map(mapFiveSToDb));
                    }
                }

                // Fetch Daily Checklists
                const { data: dbChecklists, error: checklistErr } = await sbClient.from('daily_checklists').select('*').order('id', { ascending: true });
                if (checklistErr) throw checklistErr;

                if (dbChecklists && dbChecklists.length > 0) {
                    dailyChecklists = dbChecklists.map(mapDailyChecklistFromDb);
                } else {
                    dailyChecklists = JSON.parse(localStorage.getItem(LS_DAILY_CHECKLISTS)) || [];
                    if (dailyChecklists.length > 0) {
                        await sbClient.from('daily_checklists').insert(dailyChecklists.map(mapDailyChecklistToDb));
                    }
                }

                enforceFixedCapacities();
                // Sync to backup local storage
                localStorage.setItem(LS_SILOS, JSON.stringify(silosData));
                localStorage.setItem(LS_MATERIALS, JSON.stringify(availableMaterials));
                localStorage.setItem(LS_FIVE_S_LOGS, JSON.stringify(fiveSLogs));
                localStorage.setItem(LS_DAILY_CHECKLISTS, JSON.stringify(dailyChecklists));

                // Fetch Shift Reports
                const { data: dbSr, error: srErr } = await sbClient.from('shift_reports').select('*').order('id', { ascending: true });
                if (srErr) throw srErr;
                if (dbSr && dbSr.length > 0) {
                    shiftReports = dbSr.map(mapShiftReportFromDb);
                } else {
                    shiftReports = JSON.parse(localStorage.getItem(LS_SHIFT_REPORTS)) || [];
                    if (shiftReports.length > 0) {
                        await sbClient.from('shift_reports').insert(shiftReports.map(mapShiftReportToDb));
                    }
                }
                localStorage.setItem(LS_SHIFT_REPORTS, JSON.stringify(shiftReports));

                // Fetch Batching Audits
                const { data: dbBa, error: baErr } = await sbClient.from('batching_audits').select('*').order('id', { ascending: true });
                if (baErr) throw baErr;
                if (dbBa && dbBa.length > 0) {
                    batchingAudits = dbBa.map(mapBatchingAuditFromDb);
                } else {
                    batchingAudits = JSON.parse(localStorage.getItem(LS_BATCHING_AUDITS)) || [];
                    if (batchingAudits.length > 0) {
                        await sbClient.from('batching_audits').insert(batchingAudits.map(mapBatchingAuditToDb));
                    }
                }
                localStorage.setItem(LS_BATCHING_AUDITS, JSON.stringify(batchingAudits));
            } catch (err) {
                console.error('Supabase fetch failed, fallback to local storage:', err);
                loadFromLocalStorage();
            }
        } else {
            loadFromLocalStorage();
        }
    };

    const safeParse = (key, fallback) => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return fallback;
            return JSON.parse(item);
        } catch (e) {
            console.error(`Error parsing localStorage key "${key}":`, e);
            return fallback;
        }
    };

    const loadFromLocalStorage = () => {
        availableMaterials = safeParse(LS_MATERIALS, null);
        ensureDefaultMaterials();
        silosData = safeParse(LS_SILOS, null);
        if (!silosData) {
            silosData = generateSiloData(21);
            localStorage.setItem(LS_SILOS, JSON.stringify(silosData));
            localStorage.setItem(LS_MATERIALS, JSON.stringify(availableMaterials));
        } else if (silosData.length < 21) {
            const newSilos = generateSiloData(21);
            silosData = [...silosData, ...newSilos.slice(silosData.length)];
            localStorage.setItem(LS_SILOS, JSON.stringify(silosData));
        }
        maizeLogs = safeParse(LS_MAIZE_LOGS, []);
        lessExcessLogs = safeParse(LS_LESS_EXCESS_LOGS, []);
        fiveSLogs = safeParse(LS_FIVE_S_LOGS, []);
        if (fiveSLogs.length === 0) {
            seedDefaultFiveSLogs();
        }
        dailyChecklists = safeParse(LS_DAILY_CHECKLISTS, []);
        shiftReports = safeParse(LS_SHIFT_REPORTS, []);
        batchingAudits = safeParse(LS_BATCHING_AUDITS, []);
        enforceFixedCapacities();
    };

    const saveMaizeLogs = async () => {
        localStorage.setItem(LS_MAIZE_LOGS, JSON.stringify(maizeLogs));
        if (isSbConnected && sbClient) {
            try {
                const { error } = await sbClient
                    .from('daily_maize_logs')
                    .upsert(maizeLogs.map(mapMaizeLogToDb));
                if (error) throw error;
            } catch (err) {
                console.error('Supabase save failed for maize logs:', err);
                alert('Supabase Save Error (Maize Logs): ' + (err.message || err.details || JSON.stringify(err)));
            }
        }
    };

    const saveLessExcessLogs = async () => {
        localStorage.setItem(LS_LESS_EXCESS_LOGS, JSON.stringify(lessExcessLogs));
        if (isSbConnected && sbClient) {
            try {
                const { error } = await sbClient
                    .from('daily_less_excess_logs')
                    .upsert(lessExcessLogs.map(mapLessExcessToDb));
                if (error) throw error;
            } catch (err) {
                console.error('Supabase save failed for less/excess logs:', err);
                alert('Supabase Save Error (Less/Excess): ' + (err.message || err.details || JSON.stringify(err)));
            }
        }
    };

    const saveFiveSLogs = async () => {
        localStorage.setItem(LS_FIVE_S_LOGS, JSON.stringify(fiveSLogs));
        if (isSbConnected && sbClient) {
            try {
                const { error } = await sbClient
                    .from('five_s_logs')
                    .upsert(fiveSLogs.map(mapFiveSToDb));
                if (error) throw error;
            } catch (err) {
                console.error('Supabase save failed for 5S logs:', err);
                alert('Supabase Save Error (5S Logs): ' + (err.message || err.details || JSON.stringify(err)));
            }
        }
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

                // Delete five_s_logs
                const { error: f5Err } = await sbClient.from('five_s_logs').delete().gt('id', 0);
                if (f5Err) throw f5Err;

                // Delete daily_checklists
                const { error: dcErr } = await sbClient.from('daily_checklists').delete().gt('id', 0);
                if (dcErr) throw dcErr;

                // Delete shift_reports
                const { error: srErr } = await sbClient.from('shift_reports').delete().gt('id', 0);
                if (srErr) throw srErr;

                // Delete batching audits
                const { error: baErr } = await sbClient.from('batching_audits').delete().gt('id', 0);
                if (baErr) throw baErr;

                availableMaterials = [];
                ensureDefaultMaterials();
                silosData = generateSiloData(21);
                fiveSLogs = [];
                dailyChecklists = [];
                shiftReports = [];
                batchingAudits = [];
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
            localStorage.removeItem(LS_FIVE_S_LOGS);
            localStorage.removeItem(LS_DAILY_CHECKLISTS);
            localStorage.removeItem(LS_SHIFT_REPORTS);
            localStorage.removeItem(LS_BATCHING_AUDITS);
            availableMaterials = [];
            ensureDefaultMaterials();
            silosData = generateSiloData(21);
            fiveSLogs = [];
            dailyChecklists = [];
            shiftReports = [];
            batchingAudits = [];
            saveData();
            seedDefaultFiveSLogs();
            renderSilos();
        }
    };
    const btnResetEl = document.getElementById('btn-reset');
    if (btnResetEl) btnResetEl.addEventListener('click', resetData);

    const btnAddMaizeLogEl = document.getElementById('btn-add-maize-log');
    if (btnAddMaizeLogEl) {
        btnAddMaizeLogEl.addEventListener('click', () => {
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
    }
    const btnAddLessExcessEl = document.getElementById('btn-add-less-excess-log');
    if (btnAddLessExcessEl) {
        btnAddLessExcessEl.addEventListener('click', () => {
            if (lessExcessLogs.length > 0) {
                const lastLog = lessExcessLogs[lessExcessLogs.length - 1];
                if (!lastLog.locked) {
                    alert('Please submit the current shift before starting a new one!');
                    return;
                }
            }
        
        const today = new Date();
        const d = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
        
        let currentShift = 'A';
        if (lessExcessLogs.length > 0) {
            const lastLog = lessExcessLogs[lessExcessLogs.length - 1];
            if (lastLog.shift === 'A') currentShift = 'B';
            else if (lastLog.shift === 'B') currentShift = 'C';
            else if (lastLog.shift === 'C') currentShift = 'A';
        }
        
        let currentOfficer = 'Zubair';
        for (let i = lessExcessLogs.length - 1; i >= 0; i--) {
            if (lessExcessLogs[i].shift === currentShift) {
                currentOfficer = lessExcessLogs[i].officerName;
                break;
            }
        }

        lessExcessLogs.push({
            id: Date.now(),
            date: d,
            shift: currentShift,
            officerName: currentOfficer,
            feedName: 'Feed 1',
            batches: 1,
            productionBags: 100,
            waterAddition: 0,
            overallAvg: 0,
            remarks: '',
            locked: false
        });
        saveLessExcessLogs();
        renderLessExcessTable();
        showToast('✓ Started new shift');
        });
    }

    const leFilterDateInput = document.getElementById('le-filter-date');
    if (leFilterDateInput) {
        leFilterDateInput.addEventListener('change', () => {
            renderLessExcessTable();
        });
    }

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
            let name = `Silo ${i.toString().padStart(2, '0')}`;
            
            if (i === 3 || i === 6) capacity = 500;
            else if (i >= 9 && i <= 12) capacity = 2500;
            else if (i >= 17 && i <= 19) {
                capacity = 400;
                name = `Wet Bin ${(i - 16).toString().padStart(2, '0')}`;
            } else if (i >= 20 && i <= 21) {
                capacity = 250;
                name = `Cooling Bin ${(i - 19).toString().padStart(2, '0')}`;
            }
            
            const fillLevel     = Math.floor(10 + Math.random() * 80);
            const currentFillTons = Math.round((fillLevel / 100) * capacity);
            const now  = new Date();
            const start = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
            const end   = new Date(start.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
            const fmt = d => d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

            silos.push({
                id: i,
                name:             name,
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

    const initSiloDataModalEvents = () => {
        try {
            const btnOpen = document.getElementById('btn-add-silo-data');
            const modal = document.getElementById('silo-data-modal');
            const btnClose = document.getElementById('silo-data-close');
            const btnCancel = document.getElementById('btn-cancel-silo-data');
            const btnSave = document.getElementById('btn-save-silo-data');

            const selectSilo = document.getElementById('sd-m-silo');
            const selectStatus = document.getElementById('sd-m-status');
            const selectMaterial = document.getElementById('sd-m-material');
            const inputFill = document.getElementById('sd-m-fill');
            const inputCapacity = document.getElementById('sd-m-capacity');
            const inputPMoist = document.getElementById('sd-m-pmoist');
            const inputCMoist = document.getElementById('sd-m-cmoist');
            const selectFan = document.getElementById('sd-m-fan');
            const inputRuntime = document.getElementById('sd-m-runtime');
            const inputFanOn = document.getElementById('sd-m-fanon');
            const inputFanOff = document.getElementById('sd-m-fanoff');

            if (!btnOpen || !modal) {
                console.warn("btn-add-silo-data or silo-data-modal not found in DOM");
                return;
            }

            // Populate Silo Dropdown
            const populateSiloDropdown = () => {
                if (!selectSilo) return;
                selectSilo.innerHTML = '';
                const silos = Array.isArray(silosData) ? silosData : [];
                silos.forEach(silo => {
                    const opt = document.createElement('option');
                    opt.value = silo.id;
                    opt.textContent = silo.name;
                    selectSilo.appendChild(opt);
                });
            };

            // Populate Materials Dropdown
            const populateMaterialsDropdown = () => {
                if (!selectMaterial) return;
                selectMaterial.innerHTML = '';
                const mats = Array.isArray(availableMaterials) ? availableMaterials : ['Maize', 'Rice'];
                mats.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m;
                    opt.textContent = m;
                    selectMaterial.appendChild(opt);
                });
                const optAddNew = document.createElement('option');
                optAddNew.value = 'add_new';
                optAddNew.textContent = '+ Add New...';
                selectMaterial.appendChild(optAddNew);
            };

            // Load Selected Silo Data into form
            const loadSiloData = () => {
                if (!selectSilo) return;
                const siloId = parseInt(selectSilo.value);
                const silos = Array.isArray(silosData) ? silosData : [];
                const silo = silos.find(s => s.id === siloId);
                if (!silo) return;

                if (selectStatus) selectStatus.value = silo.status || 'Stopped';
                if (selectMaterial) selectMaterial.value = silo.materialType || 'Maize';
                if (inputFill) inputFill.value = silo.currentFillTons || 0;
                if (inputCapacity) inputCapacity.value = silo.capacity || 0;
                if (inputPMoist) inputPMoist.value = silo.purchaseMoisture || 0;
                if (inputCMoist) inputCMoist.value = silo.currentMoisture || 0;
                if (selectFan) selectFan.value = silo.fanStatus || 'Off';
                if (inputRuntime) inputRuntime.value = silo.runTime || 0;
                if (inputFanOn) inputFanOn.value = silo.fanOnTime || '-';
                if (inputFanOff) inputFanOff.value = silo.fanOffTime || '-';
            };

            selectSilo.addEventListener('change', loadSiloData);

            // Material selection custom add
            if (selectMaterial) {
                selectMaterial.addEventListener('change', (e) => {
                    if (e.target.value === 'add_new') {
                        const newMat = prompt('Enter new material name:');
                        if (newMat && newMat.trim()) {
                            const name = newMat.trim();
                            if (Array.isArray(availableMaterials)) {
                                if (!availableMaterials.includes(name)) {
                                    availableMaterials.push(name);
                                }
                            } else {
                                availableMaterials = [name];
                            }
                            populateMaterialsDropdown();
                            selectMaterial.value = name;
                        } else {
                            loadSiloData();
                        }
                    }
                });
            }

            const openModal = () => {
                try {
                    populateSiloDropdown();
                    populateMaterialsDropdown();
                    loadSiloData();
                    modal.classList.add('show');
                } catch (e) {
                    console.error("Error opening silo data modal:", e);
                }
            };
            const closeModal = () => {
                modal.classList.remove('show');
            };

            window.openSiloDataModal = openModal;
            window.closeSiloDataModal = closeModal;

            btnOpen.addEventListener('click', openModal);
            if (btnClose) btnClose.addEventListener('click', closeModal);
            if (btnCancel) btnCancel.addEventListener('click', closeModal);

            if (btnSave) {
                btnSave.addEventListener('click', async () => {
                    try {
                        const siloId = parseInt(selectSilo.value);
                        const silos = Array.isArray(silosData) ? silosData : [];
                        const silo = silos.find(s => s.id === siloId);
                        if (!silo) return;

                        if (selectStatus) silo.status = selectStatus.value;
                        if (selectMaterial) silo.materialType = selectMaterial.value;
                        if (inputFill) silo.currentFillTons = parseFloat(inputFill.value) || 0;
                        if (silo.capacity) {
                            silo.fillLevel = Math.round((silo.currentFillTons / silo.capacity) * 100);
                        }
                        if (inputPMoist) silo.purchaseMoisture = parseFloat(inputPMoist.value) || 0;
                        if (inputCMoist) silo.currentMoisture = parseFloat(inputCMoist.value) || 0;
                        if (selectFan) silo.fanStatus = selectFan.value;
                        if (inputRuntime) silo.runTime = parseFloat(inputRuntime.value) || 0;
                        if (inputFanOn) silo.fanOnTime = inputFanOn.value.trim();
                        if (inputFanOff) silo.fanOffTime = inputFanOff.value.trim();

                        saveData(silo);
                        renderSilos();
                        closeModal();
                        showToast(`✓ Silo ${silo.name} updated`);
                    } catch (e) {
                        console.error("Error saving silo data:", e);
                        alert("Error saving silo data: " + e.message);
                    }
                });
            }
        } catch (e) {
            console.error("Error in initSiloDataModalEvents:", e);
        }
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
        initFiveSEvents();
        initDailyChecklistEvents();
        initShiftReportEvents();
        initBatchingAuditEvents();
        initStandaloneRmEvents();
        initPerformaEvents();
        initSiloDataModalEvents();
        if (window.initPlantReportEvents) window.initPlantReportEvents();
        if (window.initQualityStandardsEvents) window.initQualityStandardsEvents();
        if (window.initSiloDumpEvents) window.initSiloDumpEvents();
        if (window.initSiloMoistEvents) window.initSiloMoistEvents();
        // Refresh module data tables after Supabase sync
        if (window.refreshSiloDumpData) window.refreshSiloDumpData();
        if (window.refreshSiloMoistData) window.refreshSiloMoistData();
        if (window.refreshPlantReportData) window.refreshPlantReportData();
        if (window.refreshQsData) window.refreshQsData();
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
            const rawUrl = document.getElementById('sb-url').value.trim();
            const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
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
            const rawUrl = document.getElementById('sb-url').value.trim();
            const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
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
    const makeEditable = (el, inputType, getRaw, onCommit, options = null) => {
        el.classList.add('editable-value');
        el.title = 'Click to edit';

        el.addEventListener('click', () => {
            if (el.classList.contains('editing')) return;
            el.classList.add('editing');

            let input;
            if (options) {
                input = document.createElement('select');
                input.className = 'inline-edit-input';
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (opt === getRaw()) option.selected = true;
                    input.appendChild(option);
                });
            } else {
                input = document.createElement('input');
                input.type      = inputType;
                input.value     = getRaw();
                input.className = 'inline-edit-input';
            }
            
            el.innerHTML = '';
            el.appendChild(input);
            input.focus();
            if (!options) input.select();

            const commit = () => {
                el.classList.remove('editing');
                onCommit(input.value.trim(), el);
            };
            const cancel = (orig) => {
                el.classList.remove('editing');
                el.textContent = orig;
            };
            const origText = el.textContent;

            if (options) {
                input.addEventListener('change', commit);
                input.addEventListener('blur', commit);
            } else {
                input.addEventListener('blur', commit);
                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter')  { input.blur(); }
                    if (e.key === 'Escape') { input.removeEventListener('blur', commit); cancel(origText); }
                });
            }
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

    // ─── Render Less / Excess Table ───────────────────────────────────────────
    const renderLessExcessTable = () => {
        // Keep a running total for cumulative average calculation
        const feedTotals = {};

        // Calculate totals dynamically forward (oldest first)
        lessExcessLogs.forEach(log => {
            const expectedBags = log.batches * 100;
            const diffBags = log.productionBags - expectedBags;
            
            if (!feedTotals[log.feedName]) feedTotals[log.feedName] = { expected: 0, diff: 0 };
            feedTotals[log.feedName].expected += expectedBags;
            feedTotals[log.feedName].diff += diffBags;
            
            let pct = '0.00%';
            if (expectedBags > 0) {
                pct = ((diffBags / expectedBags) * 100).toFixed(2) + '%';
            }
            
            log._overallBadgeClass = 'badge-neutral';
            log._overallPct = '0.00%';
            log._diffStr = diffBags > 0 ? '+' + diffBags : diffBags;
            log._pctStr = diffBags > 0 ? '+' + pct : pct;
            log._badgeClass = diffBags > 0 ? 'badge-success' : diffBags < 0 ? 'badge-danger' : 'badge-neutral';

            const totals = feedTotals[log.feedName];
            if (totals && totals.expected > 0) {
                const pctNum = (totals.diff / totals.expected) * 100;
                log._overallPct = pctNum.toFixed(2) + '%';
                if (pctNum > 0) {
                    log._overallPct = '+' + log._overallPct;
                    log._overallBadgeClass = 'badge-success';
                } else if (pctNum < 0) {
                    log._overallBadgeClass = 'badge-danger';
                }
            }
        });

        // Now render backwards (newest first) with grouping
        const container = document.getElementById('daily-less-excess-container');
        if (!container) return;
        container.innerHTML = '';

        // Filter by date if a date filter is selected
        const filterInput = document.getElementById('le-filter-date');
        let selectedDate = filterInput ? filterInput.value : '';
        
        let filteredLogs = [...lessExcessLogs];
        if (selectedDate) {
            // Convert YYYY-MM-DD to d-MMM
            const parts = selectedDate.split('-');
            if (parts.length === 3) {
                const day = parseInt(parts[2], 10);
                const monthIndex = parseInt(parts[1], 10) - 1;
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                if (monthIndex >= 0 && monthIndex < 12) {
                    const formattedDate = day + '-' + months[monthIndex];
                    filteredLogs = filteredLogs.filter(r => r.date === formattedDate);
                }
            }
        }

        const reversedLogs = filteredLogs.reverse();
        let currentGroupKey = null;
        let currentTableBody = null;

        reversedLogs.forEach(log => {
            const groupKey = `${log.date}|${log.shift}|${log.officerName}`;
            
            if (groupKey !== currentGroupKey) {
                // Create Group Container
                const groupDiv = document.createElement('div');
                groupDiv.className = 'shift-group-container';
                groupDiv.style.background = 'var(--card-bg)';
                groupDiv.style.borderRadius = '8px';
                groupDiv.style.overflow = 'hidden';
                groupDiv.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                
                const isLocked = log.locked === true;
                
                let shiftStyle = 'background: var(--card-bg);';
                let shiftBadgeClass = '';
                if (log.shift === 'A') {
                    shiftStyle = 'background: linear-gradient(to right, rgba(245, 158, 11, 0.15), var(--card-bg)); border-left: 4px solid #f59e0b;';
                    shiftBadgeClass = 'color: #f59e0b; font-weight: bold; background: rgba(245, 158, 11, 0.2); padding: 0.1rem 0.4rem; border-radius: 4px;';
                } else if (log.shift === 'B') {
                    shiftStyle = 'background: linear-gradient(to right, rgba(59, 130, 246, 0.15), var(--card-bg)); border-left: 4px solid #3b82f6;';
                    shiftBadgeClass = 'color: #3b82f6; font-weight: bold; background: rgba(59, 130, 246, 0.2); padding: 0.1rem 0.4rem; border-radius: 4px;';
                } else if (log.shift === 'C') {
                    shiftStyle = 'background: linear-gradient(to right, rgba(139, 92, 246, 0.15), var(--card-bg)); border-left: 4px solid #8b5cf6;';
                    shiftBadgeClass = 'color: #8b5cf6; font-weight: bold; background: rgba(139, 92, 246, 0.2); padding: 0.1rem 0.4rem; border-radius: 4px;';
                }
                
                let actionHtml = '';
                if (isLocked) {
                    actionHtml = `<span style="color:var(--success-color); font-weight:bold; font-size: 0.9rem;">🔒 Shift Submitted</span>`;
                } else {
                    actionHtml = `
                        <button class="btn btn-sm" id="btn-submit-grp-${log.id}" style="padding: 0.2rem 0.6rem; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--success-color); background: transparent; color: var(--success-color); cursor: pointer; margin-right: 0.5rem;">✅ Submit Shift</button>
                        <button class="btn btn-sm btn-primary" id="btn-add-grp-${log.id}" style="padding: 0.2rem 0.6rem; font-size: 0.85rem; border-radius: 4px; border: none; background: var(--accent-color); color: #fff; cursor: pointer;">➕ Add Entry</button>
                    `;
                }

                const headerDiv = document.createElement('div');
                headerDiv.style = `padding: 1rem 1.5rem; display:flex; justify-content:space-between; align-items:center; ${shiftStyle}`;
                headerDiv.innerHTML = `
                    <div>
                        <strong style="color:var(--text-secondary)">Date:</strong> <span class="${isLocked ? '' : 'editable-value'}" id="le-grp-date-${log.id}" title="${isLocked ? '' : 'Click to edit'}">${log.date}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                        <strong style="color:var(--text-secondary)">Shift:</strong> <span class="${isLocked ? '' : 'editable-value'}" id="le-grp-shift-${log.id}" title="${isLocked ? '' : 'Click to edit'}" style="${shiftBadgeClass}">${log.shift}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                        <strong style="color:var(--text-secondary)">Officer:</strong> <span class="${isLocked ? '' : 'editable-value'}" id="le-grp-officer-${log.id}" title="${isLocked ? '' : 'Click to edit'}">${log.officerName}</span>
                    </div>
                    <div>${actionHtml}</div>
                `;
                groupDiv.appendChild(headerDiv);
                
                const table = document.createElement('table');
                table.className = 'report-table less-excess-table';
                table.style.margin = '0';
                table.style.borderTop = 'none';
                table.style.borderTopLeftRadius = '0';
                table.style.borderTopRightRadius = '0';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Feed Name / No.</th>
                            <th>Batches</th>
                            <th>Actual Production (Bags)</th>
                            <th>Less/Excess (Bags)</th>
                            <th>Final %age</th>
                            <th>Water Addition</th>
                            <th>Overall Avg Less/Excess</th>
                            <th>Remarks</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                currentTableBody = table.querySelector('tbody');
                groupDiv.appendChild(table);
                container.appendChild(groupDiv);
                
                currentGroupKey = groupKey;

                if (!isLocked) {
                    // Bind Group Editables
                    const updateGroup = (field, newVal) => {
                        lessExcessLogs.forEach(l => {
                            if (l.date === log.date && l.shift === log.shift && l.officerName === log.officerName) {
                                l[field] = newVal;
                            }
                        });
                        saveLessExcessLogs();
                        renderLessExcessTable();
                    };

                    makeEditable(document.getElementById(`le-grp-date-${log.id}`), 'text', () => log.date, (val) => updateGroup('date', val || log.date));
                    makeEditable(document.getElementById(`le-grp-shift-${log.id}`), 'text', () => log.shift, (val) => updateGroup('shift', val || log.shift), ['A', 'B', 'C']);
                    makeEditable(document.getElementById(`le-grp-officer-${log.id}`), 'text', () => log.officerName, (val) => updateGroup('officerName', val || log.officerName), ['Zubair', 'Shoaib', 'Tahir']);

                    document.getElementById(`btn-submit-grp-${log.id}`).addEventListener('click', () => {
                        if (confirm('Submit this shift? You will no longer be able to edit or add entries to it.')) {
                            lessExcessLogs.forEach(l => {
                                if (l.date === log.date && l.shift === log.shift && l.officerName === log.officerName) {
                                    l.locked = true;
                                }
                            });
                            saveLessExcessLogs();
                            renderLessExcessTable();
                            showToast('✓ Shift Submitted successfully');
                        }
                    });

                    document.getElementById(`btn-add-grp-${log.id}`).addEventListener('click', () => {
                        let insertIndex = lessExcessLogs.length;
                        for (let i = lessExcessLogs.length - 1; i >= 0; i--) {
                            if (lessExcessLogs[i].date === log.date && lessExcessLogs[i].shift === log.shift && lessExcessLogs[i].officerName === log.officerName) {
                                insertIndex = i + 1;
                                break;
                            }
                        }
                        lessExcessLogs.splice(insertIndex, 0, {
                            id: Date.now(),
                            date: log.date,
                            shift: log.shift,
                            officerName: log.officerName,
                            feedName: 'Feed 1',
                            batches: 1,
                            productionBags: 100,
                            waterAddition: 0,
                            overallAvg: 0,
                            remarks: '',
                            locked: false
                        });
                        saveLessExcessLogs();
                        renderLessExcessTable();
                        showToast('✓ Added new entry to shift');
                    });
                }
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="${log.locked ? '' : 'editable-value'}" id="le-feed-${log.id}" title="${log.locked ? '' : 'Click to edit'}">${log.feedName}</span></td>
                <td><span class="${log.locked ? '' : 'editable-value'}" id="le-batch-${log.id}" title="${log.locked ? '' : 'Click to edit'}">${log.batches}</span></td>
                <td><span class="${log.locked ? '' : 'editable-value'}" id="le-prod-${log.id}" title="${log.locked ? '' : 'Click to edit'}" style="font-weight: bold; color: #93c5fd;">${log.productionBags}</span></td>
                <td><span class="badge ${log._badgeClass}">${log._diffStr}</span></td>
                <td><span class="badge ${log._badgeClass}">${log._pctStr}</span></td>
                <td><span class="${log.locked ? '' : 'editable-value'}" id="le-water-${log.id}" title="${log.locked ? '' : 'Click to edit'}">${log.waterAddition ?? 0}</span></td>
                <td><span class="badge ${log._overallBadgeClass}">${log._overallPct}</span></td>
                <td><span class="${log.locked ? '' : 'editable-value'}" id="le-remarks-${log.id}" title="${log.locked ? '' : 'Click to edit'}">${log.remarks || (log.locked ? '' : '<span style="color:var(--text-secondary); font-style:italic; font-size:0.85rem;">+ Add remark</span>')}</span></td>
                <td>${log.locked ? '' : `<button class="btn btn-sm" style="background:transparent; border:none; color:var(--danger-color); cursor:pointer; font-size:1.1rem; padding:0;" id="le-del-${log.id}" title="Delete Entry">🗑️</button>`}</td>
            `;
            currentTableBody.appendChild(tr);

            if (!log.locked) {
                // Bind individual row editables
                makeEditable(document.getElementById(`le-feed-${log.id}`), 'text', () => log.feedName, (val) => { log.feedName = val || log.feedName; saveLessExcessLogs(); renderLessExcessTable(); });
                makeEditable(document.getElementById(`le-batch-${log.id}`), 'number', () => log.batches, (val) => { const n = parseFloat(val); if (!isNaN(n)) log.batches = n; saveLessExcessLogs(); renderLessExcessTable(); });
                makeEditable(document.getElementById(`le-prod-${log.id}`), 'number', () => log.productionBags, (val) => { const n = parseFloat(val); if (!isNaN(n)) log.productionBags = n; saveLessExcessLogs(); renderLessExcessTable(); });
                makeEditable(document.getElementById(`le-water-${log.id}`), 'number', () => log.waterAddition ?? 0, (val) => { const n = parseFloat(val); if (!isNaN(n)) log.waterAddition = n; saveLessExcessLogs(); renderLessExcessTable(); });
                makeEditable(document.getElementById(`le-remarks-${log.id}`), 'text', () => log.remarks || '', (val) => { log.remarks = val || ''; saveLessExcessLogs(); renderLessExcessTable(); });

                document.getElementById(`le-del-${log.id}`).addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this entry?')) {
                        lessExcessLogs = lessExcessLogs.filter(x => x.id !== log.id);
                        saveLessExcessLogs();
                        renderLessExcessTable();
                        showToast('✓ Entry deleted');
                    }
                });
            }
        });
    };

    // ─── Render Silo Cards ────────────────────────────────────────────────────
    const renderSilos = () => {
        // Fail-safe: ensure we have 21 silos
        if (!silosData || silosData.length < 21) {
            const newSilos = generateSiloData(21);
            if (!silosData) {
                silosData = newSilos;
            } else {
                silosData = [...silosData, ...newSilos.slice(silosData.length)];
            }
            localStorage.setItem(LS_SILOS, JSON.stringify(silosData));
        }

        const grid = document.getElementById('silo-grid');
        grid.innerHTML = '';

        const groups = [
            { name: 'Concrete Silos', ids: [1, 2, 3, 4, 5, 6, 7, 8] },
            { name: 'Steel Silos', ids: [9, 10, 11, 12] },
            { name: 'Wet Bins', ids: [17, 18, 19] },
            { name: 'Cooling Bins', ids: [20, 21] },
            { name: 'Solvent Silos', ids: [13, 14, 15, 16] }
        ];

        groups.forEach(group => {
            const header = document.createElement('div');
            header.style.gridColumn = '1 / -1';
            header.innerHTML = `<h2 style="color: var(--text-primary); padding: 1rem 0 0.5rem; border-bottom: 2px solid var(--accent-color); font-size: 1.8rem; margin-top: ${group.name === 'Concrete Silos' ? '-1rem' : '1.5rem'};">${group.name}</h2>`;
            grid.appendChild(header);

            group.ids.forEach(id => {
                const silo = silosData.find(s => s.id === id);
                if (!silo) return;

                const mc  = getMoistureColor(silo.currentMoisture);
                const mPct = Math.min((silo.currentMoisture / 20) * 100, 100);

                const card = document.createElement('div');
                card.className = 'silo-card';

                card.innerHTML = `
                    <div class="glass-silo-container" id="silo-glass-${silo.id}">
                        <div class="silo-particles">
                            <span class="silo-particle" style="left:15%;animation-delay:0s;"></span>
                            <span class="silo-particle" style="left:35%;animation-delay:0.8s;"></span>
                            <span class="silo-particle" style="left:55%;animation-delay:1.5s;"></span>
                            <span class="silo-particle" style="left:75%;animation-delay:0.4s;"></span>
                            <span class="silo-particle" style="left:85%;animation-delay:2s;"></span>
                        </div>
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
                        <div style="position:absolute;top:10px;right:10px;z-index:10;background:rgba(15,23,42,0.85);backdrop-filter:blur(8px);padding:5px 12px;border-radius:20px;font-weight:700;font-size:0.75rem;color:#38bdf8;border:1px solid rgba(56,189,248,0.3);box-shadow:0 2px 10px rgba(0,0,0,0.3),0 0 15px rgba(56,189,248,0.1);letter-spacing:0.5px;">
                            <span style="color:rgba(255,255,255,0.6);font-weight:500;">FILL</span> ${silo.fillLevel}%
                        </div>
                        <div style="position:absolute;top:10px;left:10px;z-index:10;background:${silo.fanStatus==='On'?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)'};backdrop-filter:blur(8px);padding:5px 10px;border-radius:20px;font-weight:700;font-size:0.7rem;color:${silo.fanStatus==='On'?'#4ade80':'#f87171'};border:1px solid ${silo.fanStatus==='On'?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'};box-shadow:0 2px 8px rgba(0,0,0,0.3);">
                            ${silo.fanStatus==='On'?'⚡ FAN ON':'⏸ FAN OFF'}
                        </div>
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
            });
        });

        renderSummary();
        renderDailyReportTable();
        renderMaizeMoistureTable();
        renderLessExcessTable();

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

    // ─── 5S Audit & Checklist Functions ──────────────────────────────────────────
    const seedDefaultFiveSLogs = () => {
        const defaultAuditors = ['Tahir', 'Shoaib', 'Zubair'];
        const areas = ['Old Godown', 'Mechanical', 'Electrical', 'Control Room', 'Premix', 'Other Department'];
        const logs = [];
        
        areas.forEach((area, idx) => {
            const d1 = new Date();
            d1.setDate(d1.getDate() - 7);
            const d1Str = d1.getDate() + '-' + d1.toLocaleString('default', { month: 'short' });
            
            const d2 = new Date();
            d2.setDate(d2.getDate() - 1);
            const d2Str = d2.getDate() + '-' + d2.toLocaleString('default', { month: 'short' });
            
            logs.push({
                id: Date.now() - (idx * 200000) - 100000,
                date: d1Str,
                auditorName: defaultAuditors[idx % defaultAuditors.length],
                areaName: area,
                sortScore: idx === 0 ? 4 : idx === 1 ? 3 : idx === 2 ? 4 : idx === 3 ? 5 : 4,
                setOrderScore: idx === 0 ? 3 : idx === 1 ? 4 : idx === 2 ? 3 : idx === 3 ? 4 : 4,
                shineScore: idx === 0 ? 4 : idx === 1 ? 3 : idx === 2 ? 4 : idx === 3 ? 5 : 5,
                standardizeScore: idx === 0 ? 4 : idx === 1 ? 3 : idx === 2 ? 3 : idx === 3 ? 4 : 4,
                sustainScore: idx === 0 ? 3 : idx === 1 ? 3 : idx === 2 ? 3 : idx === 3 ? 4 : 4,
                remarks: 'Initial 5S Audit. Clutter identified, clean-up scheduled.',
                locked: false
            });
            
            logs.push({
                id: Date.now() - (idx * 200000),
                date: d2Str,
                auditorName: defaultAuditors[(idx + 1) % defaultAuditors.length],
                areaName: area,
                sortScore: idx === 0 ? 5 : idx === 1 ? 4 : idx === 2 ? 5 : idx === 3 ? 5 : 5,
                setOrderScore: idx === 0 ? 4 : idx === 1 ? 5 : idx === 2 ? 4 : idx === 3 ? 5 : 5,
                shineScore: idx === 0 ? 5 : idx === 1 ? 4 : idx === 2 ? 5 : idx === 3 ? 5 : 5,
                standardizeScore: idx === 0 ? 4 : idx === 1 ? 4 : idx === 2 ? 4 : idx === 3 ? 5 : 5,
                sustainScore: idx === 0 ? 4 : idx === 1 ? 4 : idx === 2 ? 4 : idx === 3 ? 5 : 5,
                remarks: 'Follow-up audit. Visual controls implemented.',
                locked: false
            });
        });
        
        fiveSLogs = logs;
        localStorage.setItem(LS_FIVE_S_LOGS, JSON.stringify(fiveSLogs));
    };

    const showFiveSDashboard = () => {
        const dbView = document.getElementById('five-s-dashboard-view');
        const detView = document.getElementById('five-s-detail-view');
        if (dbView) dbView.style.display = 'block';
        if (detView) detView.style.display = 'none';

        const grid = document.querySelector('.five-s-dept-grid');
        if (!grid) return;
        grid.innerHTML = '';

        DEPARTMENTS.forEach(dept => {
            const deptLogs = fiveSLogs.filter(log => log.areaName === dept.name);
            
            let scoreStr = 'N/A';
            let progressPct = 0;
            let statusBadge = `<span class="five-s-badge badge-neutral">No Audits</span>`;
            let lastDate = 'Never';

            if (deptLogs.length > 0) {
                const latestLog = deptLogs[deptLogs.length - 1];
                lastDate = latestLog.date;

                let totalSum = 0;
                deptLogs.forEach(l => {
                    const avg = (l.sortScore + l.setOrderScore + l.shineScore + l.standardizeScore + l.sustainScore) / 5.0;
                    totalSum += avg;
                });
                const overallAvg = totalSum / deptLogs.length;
                scoreStr = overallAvg.toFixed(1) + ' / 5';
                progressPct = (overallAvg / 5.0) * 100;

                const latestAvg = (latestLog.sortScore + latestLog.setOrderScore + latestLog.shineScore + latestLog.standardizeScore + latestLog.sustainScore) / 5.0;
                if (latestAvg >= 4.5) {
                    statusBadge = `<span class="five-s-badge badge-excellent">Excellent</span>`;
                } else if (latestAvg >= 3.5) {
                    statusBadge = `<span class="five-s-badge badge-good">Good</span>`;
                } else if (latestAvg >= 2.5) {
                    statusBadge = `<span class="five-s-badge badge-fair">Fair</span>`;
                } else {
                    statusBadge = `<span class="five-s-badge badge-action">Action Needed</span>`;
                }
            }

            const card = document.createElement('div');
            card.className = `five-s-dept-card ${dept.class}`;
            card.innerHTML = `
                <div class="five-s-card-header">
                    <span class="five-s-card-icon">${dept.icon}</span>
                    ${statusBadge}
                </div>
                <div>
                    <h3 class="five-s-card-title">${dept.name} Department</h3>
                    <div class="five-s-card-meta">Last Audit: ${lastDate}</div>
                </div>
                <div>
                    <div class="five-s-card-score-row">
                        <span style="font-size:0.85rem; color:var(--text-secondary)">5S Score (Avg)</span>
                        <span class="five-s-card-score">${scoreStr}</span>
                    </div>
                    <div class="five-s-progress-container">
                        <div class="five-s-progress-bar" style="width: ${progressPct}%"></div>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                showFiveSDepartmentDetail(dept.name);
            });

            grid.appendChild(card);
        });
    };

    const showFiveSDepartmentDetail = (deptName) => {
        currentFiveSDept = deptName;
        
        const dbView = document.getElementById('five-s-dashboard-view');
        const detView = document.getElementById('five-s-detail-view');
        if (dbView) dbView.style.display = 'none';
        if (detView) detView.style.display = 'block';

        const titleEl = document.getElementById('five-s-dept-title');
        if (titleEl) titleEl.textContent = `${deptName} Department 5S Audits`;

        renderFiveSLogsTable();
    };

    const renderFiveSLogsTable = () => {
        const tableBody = document.querySelector('#five-s-table tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (!currentFiveSDept) return;

        const deptLogs = fiveSLogs.filter(log => log.areaName === currentFiveSDept);

        let totalAudits = deptLogs.length;
        let sumSort = 0, sumSet = 0, sumShine = 0, sumStandardize = 0, sumSustain = 0;
        let sumOverall = 0;

        deptLogs.forEach(l => {
            sumSort += l.sortScore;
            sumSet += l.setOrderScore;
            sumShine += l.shineScore;
            sumStandardize += l.standardizeScore;
            sumSustain += l.sustainScore;
            sumOverall += (l.sortScore + l.setOrderScore + l.shineScore + l.standardizeScore + l.sustainScore) / 5.0;
        });

        const avgSort = totalAudits > 0 ? (sumSort / totalAudits) : 0;
        const avgSet = totalAudits > 0 ? (sumSet / totalAudits) : 0;
        const avgShine = totalAudits > 0 ? (sumShine / totalAudits) : 0;
        const avgStandardize = totalAudits > 0 ? (sumStandardize / totalAudits) : 0;
        const avgSustain = totalAudits > 0 ? (sumSustain / totalAudits) : 0;
        const overallScore = totalAudits > 0 ? (sumOverall / totalAudits) : 0;

        document.getElementById('dept-total-5s-audits').textContent = totalAudits;
        document.getElementById('dept-avg-sort').textContent = avgSort.toFixed(1);
        document.getElementById('dept-avg-set').textContent = avgSet.toFixed(1);
        document.getElementById('dept-avg-shine').textContent = avgShine.toFixed(1);
        document.getElementById('dept-avg-standardize').textContent = avgStandardize.toFixed(1);
        document.getElementById('dept-avg-sustain').textContent = avgSustain.toFixed(1);
        document.getElementById('dept-overall-5s-score').textContent = overallScore.toFixed(1) + ' / 5';

        const badgeEl = document.getElementById('dept-overall-5s-badge');
        if (badgeEl) {
            badgeEl.className = '';
            if (totalAudits === 0) {
                badgeEl.textContent = 'No Audits';
                badgeEl.classList.add('five-s-badge', 'badge-neutral');
            } else if (overallScore >= 4.5) {
                badgeEl.textContent = 'Excellent';
                badgeEl.classList.add('five-s-badge', 'badge-excellent');
            } else if (overallScore >= 3.5) {
                badgeEl.textContent = 'Good';
                badgeEl.classList.add('five-s-badge', 'badge-good');
            } else if (overallScore >= 2.5) {
                badgeEl.textContent = 'Fair';
                badgeEl.classList.add('five-s-badge', 'badge-fair');
            } else {
                badgeEl.textContent = 'Action Needed';
                badgeEl.classList.add('five-s-badge', 'badge-action');
            }
        }

        const sortedLogs = [...deptLogs].reverse();

        sortedLogs.forEach(log => {
            const row = document.createElement('tr');
            const rowAvg = (log.sortScore + log.setOrderScore + log.shineScore + log.standardizeScore + log.sustainScore) / 5.0;
            
            let statusText = 'Fair';
            let badgeClass = 'badge-fair';
            if (rowAvg >= 4.5) { statusText = 'Excellent'; badgeClass = 'badge-excellent'; }
            else if (rowAvg >= 3.5) { statusText = 'Good'; badgeClass = 'badge-good'; }
            else if (rowAvg < 2.5) { statusText = 'Action Needed'; badgeClass = 'badge-action'; }

            row.innerHTML = `
                <td><span class="editable-value" id="f5-date-${log.id}">${log.date}</span></td>
                <td><span class="editable-value" id="f5-auditor-${log.id}">${log.auditorName}</span></td>
                <td><span style="color:#f59e0b;font-weight:600;">${log.sortScore}</span></td>
                <td><span style="color:#3b82f6;font-weight:600;">${log.setOrderScore}</span></td>
                <td><span style="color:#10b981;font-weight:600;">${log.shineScore}</span></td>
                <td><span style="color:#8b5cf6;font-weight:600;">${log.standardizeScore}</span></td>
                <td><span style="color:#ec4899;font-weight:600;">${log.sustainScore}</span></td>
                <td style="font-weight: bold;">${rowAvg.toFixed(1)}</td>
                <td><span class="five-s-badge ${badgeClass}">${statusText}</span></td>
                <td><span class="editable-value" id="f5-remarks-${log.id}">${log.remarks || '-'}</span></td>
                <td style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">
                    <button class="btn btn-secondary btn-sm" id="btn-edit-chk-f5-${log.id}" style="padding:0.25rem 0.5rem;font-size:0.8rem;border:none;background:var(--text-secondary);color:#fff;border-radius:4px;cursor:pointer;">📋 Checklist</button>
                    <button class="btn btn-danger btn-sm" id="btn-delete-f5-${log.id}" style="padding:0.25rem 0.5rem;font-size:0.8rem;">🗑️ Delete</button>
                </td>
            `;

            tableBody.appendChild(row);

            makeEditable(document.getElementById(`f5-date-${log.id}`), 'text', () => log.date, (val) => {
                log.date = val || log.date;
                saveFiveSLogs();
                renderFiveSLogsTable();
            });

            makeEditable(document.getElementById(`f5-auditor-${log.id}`), 'text', () => log.auditorName, (val) => {
                log.auditorName = val || log.auditorName;
                saveFiveSLogs();
                renderFiveSLogsTable();
            }, ['Zubair', 'Shoaib', 'Tahir', 'Waqas']);

            makeEditable(document.getElementById(`f5-remarks-${log.id}`), 'text', () => log.remarks || '', (val) => {
                log.remarks = val || '';
                saveFiveSLogs();
                renderFiveSLogsTable();
            });

            document.getElementById(`btn-edit-chk-f5-${log.id}`).addEventListener('click', () => {
                openFiveSChecklistModal(log);
            });

            document.getElementById(`btn-delete-f5-${log.id}`).addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this audit record?')) {
                    fiveSLogs = fiveSLogs.filter(x => x.id !== log.id);
                    localStorage.setItem(LS_FIVE_S_LOGS, JSON.stringify(fiveSLogs));
                    if (isSbConnected && sbClient) {
                        try {
                            await sbClient.from('five_s_logs').delete().eq('id', log.id);
                        } catch (err) {
                            console.error('Failed to delete from Supabase:', err);
                        }
                    }
                    renderFiveSLogsTable();
                    showToast('✓ Audit deleted');
                }
            });
        });
    };

    // ─── 5S Modal Functions ──────────────────────────────────────────────────────
    const openFiveSChecklistModal = (log = null) => {
        const modal = document.getElementById('five-s-checklist-modal');
        if (!modal) return;

        const dateInput = document.getElementById('f5-audit-date');
        const auditorSelect = document.getElementById('f5-audit-auditor');
        const remarksText = document.getElementById('f5-audit-remarks');
        const titleEl = document.getElementById('f5-modal-title');

        if (titleEl) {
            titleEl.textContent = log 
                ? `Edit 5S Audit - ${currentFiveSDept}`
                : `New 5S Audit - ${currentFiveSDept}`;
        }

        let checklistState = [];
        if (log) {
            activeFiveSAuditId = log.id;
            if (dateInput) dateInput.value = log.date;
            if (auditorSelect) auditorSelect.value = log.auditorName;
            if (remarksText) remarksText.value = log.remarks || '';

            if (log.checklistState && log.checklistState.length === 25) {
                checklistState = [...log.checklistState];
            } else {
                // Fallback from raw scores
                const scores = [log.sortScore, log.setOrderScore, log.shineScore, log.standardizeScore, log.sustainScore];
                scores.forEach(score => {
                    const val = Math.round(score);
                    for (let i = 0; i < 5; i++) {
                        checklistState.push(i < val);
                    }
                });
            }
        } else {
            activeFiveSAuditId = null;
            if (dateInput) {
                const today = new Date();
                dateInput.value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
            }
            if (auditorSelect) auditorSelect.selectedIndex = 0;
            if (remarksText) remarksText.value = '';
            // Default all 25 items to checked (score = 5)
            for (let i = 0; i < 25; i++) checklistState.push(true);
        }

        // Generate Checklist items HTML
        const container = document.getElementById('f5-checklist-container');
        if (container) {
            container.innerHTML = '';
            const deptItems = CHECKLIST_ITEMS[currentFiveSDept] || CHECKLIST_ITEMS['Other Department'];

            const categories = [
                { key: 'sort', name: '1. Sort (Seiri)', color: '#f59e0b', items: deptItems.sort },
                { key: 'set', name: '2. Set In Order (Seiton)', color: '#3b82f6', items: deptItems.set },
                { key: 'shine', name: '3. Shine (Seiso)', color: '#10b981', items: deptItems.shine },
                { key: 'std', name: '4. Standardize (Seiketsu)', color: '#8b5cf6', items: deptItems.std },
                { key: 'sust', name: '5. Sustain (Shitsuke)', color: '#ec4899', items: deptItems.sust }
            ];

            categories.forEach((cat, catIdx) => {
                const catSection = document.createElement('div');
                catSection.style.borderLeft = `4px solid ${cat.color}`;
                catSection.style.paddingLeft = '1rem';
                catSection.style.marginBottom = '0.5rem';
                
                catSection.innerHTML = `
                    <h3 style="color:${cat.color}; font-size:1.05rem; margin-bottom:0.5rem; font-weight:600;">${cat.name}</h3>
                    <div class="f5-cat-items" style="display:flex; flex-direction:column; gap:0.5rem;">
                    </div>
                `;

                const itemsContainer = catSection.querySelector('.f5-cat-items');
                cat.items.forEach((itemText, itemIdx) => {
                    const globalIdx = catIdx * 5 + itemIdx;
                    const itemDiv = document.createElement('div');
                    itemDiv.style.display = 'flex';
                    itemDiv.style.alignItems = 'flex-start';
                    itemDiv.style.gap = '0.75rem';
                    itemDiv.style.cursor = 'pointer';

                    const isChecked = checklistState[globalIdx];
                    itemDiv.innerHTML = `
                        <input type="checkbox" id="f5-item-${globalIdx}" ${isChecked ? 'checked' : ''} style="margin-top:0.25rem; width:16px; height:16px; cursor:pointer;" />
                        <label for="f5-item-${globalIdx}" style="font-size:0.9rem; color:var(--text-primary); cursor:pointer; line-height:1.3;">${itemText}</label>
                    `;

                    // Handle checking change
                    const chk = itemDiv.querySelector('input');
                    chk.addEventListener('change', () => {
                        updateFiveSModalScores();
                    });

                    // Make label clickable
                    const lbl = itemDiv.querySelector('label');
                    lbl.addEventListener('click', (e) => {
                        e.preventDefault();
                        chk.checked = !chk.checked;
                        updateFiveSModalScores();
                    });

                    itemsContainer.appendChild(itemDiv);
                });

                container.appendChild(catSection);
            });
        }

        updateFiveSModalScores();
        modal.classList.add('show');
    };

    const updateFiveSModalScores = () => {
        const scores = [];
        for (let catIdx = 0; catIdx < 5; catIdx++) {
            let checkedCount = 0;
            for (let itemIdx = 0; itemIdx < 5; itemIdx++) {
                const globalIdx = catIdx * 5 + itemIdx;
                const chk = document.getElementById(`f5-item-${globalIdx}`);
                if (chk && chk.checked) {
                    checkedCount++;
                }
            }
            scores.push(Math.max(1, checkedCount));
        }

        const sum = scores.reduce((a, b) => a + b, 0);
        const overall = sum / 5.0;

        const scoreText = document.getElementById('f5-modal-overall-score');
        if (scoreText) scoreText.textContent = `${overall.toFixed(1)} / 5`;

        const badge = document.getElementById('f5-modal-status-badge');
        if (badge) {
            badge.className = 'five-s-badge';
            if (overall >= 4.5) {
                badge.textContent = 'Excellent';
                badge.classList.add('badge-excellent');
            } else if (overall >= 3.5) {
                badge.textContent = 'Good';
                badge.classList.add('badge-good');
            } else if (overall >= 2.5) {
                badge.textContent = 'Fair';
                badge.classList.add('badge-fair');
            } else {
                badge.textContent = 'Action Needed';
                badge.classList.add('badge-action');
            }
        }
    };

    const saveFiveSModalAudit = () => {
        const dateInput = document.getElementById('f5-audit-date');
        const auditorSelect = document.getElementById('f5-audit-auditor');
        const remarksText = document.getElementById('f5-audit-remarks');

        const date = (dateInput ? dateInput.value.trim() : '') || 'Today';
        const auditor = auditorSelect ? auditorSelect.value : 'Zubair';
        const remarks = remarksText ? remarksText.value.trim() : '';

        const scores = [];
        const checklistState = [];
        for (let catIdx = 0; catIdx < 5; catIdx++) {
            let checkedCount = 0;
            for (let itemIdx = 0; itemIdx < 5; itemIdx++) {
                const globalIdx = catIdx * 5 + itemIdx;
                const chk = document.getElementById(`f5-item-${globalIdx}`);
                const isChecked = chk ? chk.checked : false;
                checklistState.push(isChecked);
                if (isChecked) {
                    checkedCount++;
                }
            }
            scores.push(Math.max(1, checkedCount));
        }

        if (activeFiveSAuditId) {
            const log = fiveSLogs.find(x => x.id === activeFiveSAuditId);
            if (log) {
                log.date = date;
                log.auditorName = auditor;
                log.remarks = remarks;
                log.sortScore = scores[0];
                log.setOrderScore = scores[1];
                log.shineScore = scores[2];
                log.standardizeScore = scores[3];
                log.sustainScore = scores[4];
                log.checklistState = checklistState;
            }
            showToast('✓ Audit checklist updated');
        } else {
            fiveSLogs.push({
                id: Date.now(),
                date: date,
                auditorName: auditor,
                areaName: currentFiveSDept,
                sortScore: scores[0],
                setOrderScore: scores[1],
                shineScore: scores[2],
                standardizeScore: scores[3],
                sustainScore: scores[4],
                remarks: remarks,
                locked: false,
                checklistState: checklistState
            });
            showToast('✓ Added new 5S checklist audit');
        }

        saveFiveSLogs();
        renderFiveSLogsTable();
        closeFiveSModal();
    };

    const closeFiveSModal = () => {
        const modal = document.getElementById('five-s-checklist-modal');
        if (modal) modal.classList.remove('show');
        activeFiveSAuditId = null;
    };

    const initFiveSEvents = () => {
        const btnAdd = document.getElementById('btn-add-five-s-log');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                if (!currentFiveSDept) return;
                openFiveSChecklistModal();
            });
        }

        const btnBack = document.getElementById('btn-five-s-back');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                showFiveSDashboard();
            });
        }

        // Checklist Modal Event Listeners
        const modalClose = document.getElementById('f5-modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', closeFiveSModal);
        }

        const btnCancel = document.getElementById('btn-cancel-f5-modal');
        if (btnCancel) {
            btnCancel.addEventListener('click', closeFiveSModal);
        }

        const btnSave = document.getElementById('btn-save-f5-modal');
        if (btnSave) {
            btnSave.addEventListener('click', saveFiveSModalAudit);
        }
    };

    // ─── Daily Checklist module ────────────────────────────────────────────────
    const DAILY_CHECKLIST_QUESTIONS = {
        'Old Godown': [
            'All incoming bags are inspected for leakage and weight.',
            'Moisture levels of grain bags are checked and logged.',
            'Stacking heights do not exceed the safe limit (15 bags).',
            'Aisles and emergency exits are completely unobstructed.',
            'Rodent traps and bait stations are inspected.',
            'Daily dispatch and receipt ledger is updated.'
        ],
        'Mechanical': [
            'All machines are lubricated and oil levels checked.',
            'Guards and safety covers are securely in place.',
            'Pre-start inspection completed for hammer mills and mixers.',
            'No abnormal noise or vibration detected during idle run.',
            'Workshop tools are accounted for and sorted.',
            'Pneumatic lines are checked for leaks and pressure.'
        ],
        'Electrical': [
            'Motor control centers (MCC) checked for overheating/burning smell.',
            'Power factor panels are operating at target (>0.90).',
            'Backup generator has sufficient fuel and battery voltage.',
            'Emergency stop buttons on all major machines are tested/functional.',
            'Electrical panels are locked and keys secured.',
            'Cable trays and conduits inspected for damage or exposure.'
        ],
        'Control Room': [
            'SCADA system communication with PLC is stable.',
            'All bin/silo level sensors show active readings.',
            'Feeder speed controls and batching scales are calibrated.',
            'Interlock system status verified and fully active.',
            'Batch production logs are printed/backed up.',
            'Control room temperature is within limits (AC functioning).'
        ],
        'Premix': [
            'Micro-ingredient scales are calibrated and zeroed.',
            'Pre-weighed premix batches verified against formulation sheet.',
            'Premix dispenser and dumping hopper suction fans are on.',
            'No cross-contamination risk in the preparation area.',
            'Inventory of high-value vitamins/minerals checked.',
            'Hand addition log sheet is signed and completed.'
        ],
        'Other Department': [
            'Office computers, lights, and AC are turned off after shift.',
            'Sufficient supply of printing paper and office stationery.',
            'Admin files and records are organized and stored securely.',
            'Sewerage and water supply pumps are checked and working.',
            'Visitor log and gate pass register are up to date.',
            'General cleanliness of office areas and toilets.'
        ]
    };
    window.DAILY_CHECKLIST_QUESTIONS = DAILY_CHECKLIST_QUESTIONS;

    const DEPT_HEADS = {
        'Old Godown': ['Zubair', 'Asif', 'Imran', 'Waqas', 'Tahir', 'Shoaib'],
        'Mechanical': ['Asif', 'Zubair', 'Imran', 'Waqas', 'Tahir', 'Shoaib'],
        'Electrical': ['Imran', 'Zubair', 'Asif', 'Waqas', 'Tahir', 'Shoaib'],
        'Control Room': ['Waqas', 'Zubair', 'Asif', 'Imran', 'Tahir', 'Shoaib'],
        'Premix': ['Tahir', 'Zubair', 'Asif', 'Imran', 'Waqas', 'Shoaib'],
        'Other Department': ['Shoaib', 'Zubair', 'Asif', 'Imran', 'Waqas', 'Tahir']
    };

    let activeDcDeptName = null;

    // ─── Tab switcher for the merged 5S & Daily Checklist section ─────────────
    const switchQSTab = (tabName) => {
        // Update tab button styles
        const tabFiveS = document.getElementById('tab-five-s');
        const tabDC    = document.getElementById('tab-daily-checklist');
        const panelFiveS = document.getElementById('qs-panel-five-s');
        const panelDC    = document.getElementById('qs-panel-daily-checklist');

        if (tabName === 'five-s') {
            if (tabFiveS) tabFiveS.classList.add('active');
            if (tabDC)    tabDC.classList.remove('active');
            if (panelFiveS) panelFiveS.style.display = 'block';
            if (panelDC)    panelDC.style.display    = 'none';
        } else {
            if (tabDC)    tabDC.classList.add('active');
            if (tabFiveS) tabFiveS.classList.remove('active');
            if (panelDC)    panelDC.style.display    = 'block';
            if (panelFiveS) panelFiveS.style.display = 'none';
            // Lazily init the checklist dashboard when the tab is first opened
            initDailyChecklistDashboard();
        }
    };
    // Expose globally for HTML onclick attributes
    window.switchQSTab = switchQSTab;

    const initDailyChecklistDashboard = () => {
        const dateInput = document.getElementById('dc-date-select');
        if (dateInput && !dateInput.value) {
            const today = new Date();
            const d = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
            dateInput.value = d;
            currentChecklistDate = d;
        } else if (dateInput) {
            currentChecklistDate = dateInput.value.trim();
        }
        renderDailyChecklistDashboard();
    };

    const renderDailyChecklistDashboard = () => {
        const grid = document.querySelector('.dc-dept-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        const selectedDate = currentChecklistDate || '';
        
        DEPARTMENTS.forEach(dept => {
            const log = dailyChecklists.find(l => l.date === selectedDate && l.departmentName === dept.name);
            const isCompleted = !!log;
            const filledBy = log ? log.filledBy : 'Not Filled';
            
            const headsForDept = DEPT_HEADS[dept.name] || [];
            const defaultHead = headsForDept[0] || '';
            const headName = defaultHead;
            
            let scoreText = '';
            if (log && log.checkedItems) {
                const checkedCount = log.checkedItems.filter(Boolean).length;
                scoreText = `${checkedCount} / ${log.checkedItems.length} checked`;
            }
            
            const card = document.createElement('div');
            card.className = `dc-dept-card ${dept.class}`;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span style="font-size:1.5rem;">${dept.icon}</span>
                        <span style="font-weight:700; font-size:1.1rem; color:var(--text-primary);">${dept.name}</span>
                    </div>
                    <span class="badge ${isCompleted ? 'badge-completed' : 'badge-pending'}" style="font-size:0.75rem; font-weight:700; padding:0.25rem 0.5rem; border-radius:12px;">
                        ${isCompleted ? 'Completed ✅' : 'Pending ⚠️'}
                    </span>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.35rem; font-size:0.85rem; color:var(--text-secondary); margin-top: auto;">
                    <div><strong style="color:var(--text-primary);">Department Head:</strong> ${headName}</div>
                    <div><strong style="color:var(--text-primary);">Filled By:</strong> ${log ? filledBy : '<span style="color:var(--text-secondary); opacity:0.6;">Pending</span>'}</div>
                    ${isCompleted ? `<div><strong style="color:var(--text-primary);">Checks Completed:</strong> <span style="font-weight:600; color:var(--text-primary);">${scoreText}</span></div>` : ''}
                </div>
            `;
            
            card.addEventListener('click', () => {
                openDailyChecklistForm(dept.name);
            });
            
            grid.appendChild(card);
        });
    };

    const openDailyChecklistForm = (deptName) => {
        activeDcDeptName = deptName;
        const modal = document.getElementById('daily-checklist-modal');
        if (!modal) return;
        
        const titleEl = document.getElementById('dc-modal-title');
        if (titleEl) {
            titleEl.textContent = `${deptName} Daily Checklist - ${currentChecklistDate}`;
        }
        
        const headSelect = document.getElementById('dc-modal-head');
        if (headSelect) {
            headSelect.innerHTML = '';
            const heads = DEPT_HEADS[deptName] || [];
            heads.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                headSelect.appendChild(opt);
            });
        }
        
        const log = dailyChecklists.find(l => l.date === currentChecklistDate && l.departmentName === deptName);
        
        if (log && headSelect) {
            headSelect.value = log.filledBy;
        }
        
        const remarksText = document.getElementById('dc-modal-remarks');
        if (remarksText) {
            remarksText.value = log ? log.remarks : '';
        }
        
        const questionsContainer = document.getElementById('dc-questions-container');
        if (questionsContainer) {
            questionsContainer.innerHTML = '';
            const questions = DAILY_CHECKLIST_QUESTIONS[deptName] || [];
            
            questions.forEach((q, idx) => {
                const isChecked = log && log.checkedItems ? !!log.checkedItems[idx] : false;
                
                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.alignItems = 'flex-start';
                label.style.gap = '0.75rem';
                label.style.cursor = 'pointer';
                label.style.fontSize = '0.95rem';
                label.style.color = 'var(--text-primary)';
                label.style.padding = '0.5rem';
                label.style.borderRadius = '6px';
                label.style.transition = 'background 0.2s';
                label.addEventListener('mouseenter', () => label.style.background = 'rgba(255,255,255,0.05)');
                label.addEventListener('mouseleave', () => label.style.background = 'transparent');
                
                label.innerHTML = `
                    <input type="checkbox" class="dc-question-checkbox" data-index="${idx}" ${isChecked ? 'checked' : ''} style="margin-top: 0.2rem; width: 1.1rem; height: 1.1rem; cursor: pointer; accent-color: var(--accent-color);" />
                    <span>${q}</span>
                `;
                questionsContainer.appendChild(label);
            });
        }
        
        modal.classList.add('show');
    };

    const closeDailyChecklistModal = () => {
        const modal = document.getElementById('daily-checklist-modal');
        if (modal) modal.classList.remove('show');
        activeDcDeptName = null;
    };

    const saveDailyChecklistModal = async () => {
        if (!activeDcDeptName) return;
        
        const headSelect = document.getElementById('dc-modal-head');
        const remarksText = document.getElementById('dc-modal-remarks');
        
        const filledBy = headSelect ? headSelect.value : '';
        const remarks = remarksText ? remarksText.value.trim() : '';
        
        const checkboxes = document.querySelectorAll('.dc-question-checkbox');
        const checkedItems = Array.from(checkboxes)
            .sort((a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index))
            .map(cb => cb.checked);
            
        let log = dailyChecklists.find(l => l.date === currentChecklistDate && l.departmentName === activeDcDeptName);
        
        if (log) {
            log.filledBy = filledBy;
            log.checkedItems = checkedItems;
            log.remarks = remarks;
        } else {
            log = {
                id: Date.now(),
                date: currentChecklistDate,
                departmentName: activeDcDeptName,
                filledBy: filledBy,
                checkedItems: checkedItems,
                remarks: remarks
            };
            dailyChecklists.push(log);
        }
        
        await saveDailyChecklists();
        renderDailyChecklistDashboard();
        closeDailyChecklistModal();
    };

    const saveDailyChecklists = async () => {
        localStorage.setItem(LS_DAILY_CHECKLISTS, JSON.stringify(dailyChecklists));
        if (isSbConnected && sbClient) {
            try {
                const { error } = await sbClient
                    .from('daily_checklists')
                    .upsert(dailyChecklists.map(mapDailyChecklistToDb));
                if (error) throw error;
                showToast('✓ Saved to Supabase');
            } catch (err) {
                console.error('Supabase save failed for daily checklists:', err);
                showToast('✓ Saved locally (Supabase offline)');
            }
        } else {
            showToast('✓ Saved');
        }
    };

    const initDailyChecklistEvents = () => {
        const dateInput = document.getElementById('dc-date-select');
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                currentChecklistDate = dateInput.value.trim();
                renderDailyChecklistDashboard();
            });
            dateInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    currentChecklistDate = dateInput.value.trim();
                    renderDailyChecklistDashboard();
                }
            });
        }

        const dcModalClose = document.getElementById('dc-modal-close');
        if (dcModalClose) {
            dcModalClose.addEventListener('click', closeDailyChecklistModal);
        }

        const btnCancelDcModal = document.getElementById('btn-cancel-dc-modal');
        if (btnCancelDcModal) {
            btnCancelDcModal.addEventListener('click', closeDailyChecklistModal);
        }

        const btnSaveDcModal = document.getElementById('btn-save-dc-modal');
        if (btnSaveDcModal) {
            btnSaveDcModal.addEventListener('click', saveDailyChecklistModal);
        }
    };

    // ─── Production Officer Shift Report Module ────────────────────────────────

    const saveShiftReports = async () => {
        localStorage.setItem(LS_SHIFT_REPORTS, JSON.stringify(shiftReports));
        if (isSbConnected && sbClient) {
            try {
                const { error } = await sbClient
                    .from('shift_reports')
                    .upsert(shiftReports.map(mapShiftReportToDb));
                if (error) throw error;
                showToast('✓ Shift Report saved to Supabase');
            } catch (err) {
                console.error('Supabase save failed for shift reports:', err);
                showToast('✓ Saved locally (Supabase offline)');
            }
        } else {
            showToast('✓ Shift Report saved');
        }
    };

    const initShiftReportView = () => {
        const filterInput = document.getElementById('sr-filter-date');
        if (filterInput) {
            if (!filterInput.value) {
                const today = new Date();
                const d = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
                filterInput.value = d;
                currentSrFilterDate = d;
            } else {
                currentSrFilterDate = filterInput.value.trim();
            }
        }
        renderShiftReports();
    };

    const getFilteredShiftReports = () => {
        let filtered = [...shiftReports];
        if (currentSrFilterDate) {
            filtered = filtered.filter(r => r.date === currentSrFilterDate);
        }
        // Sort alphabetically by shift (A -> B -> C) for side-by-side comparison
        return filtered.sort((a, b) => a.shift.localeCompare(b.shift));
    };

    const renderShiftReports = () => {
        const container = document.getElementById('sr-cards-container');
        if (!container) return;

        const filtered = getFilteredShiftReports();

        // Update summary strip
        const totalShifts = filtered.length;
        const totalBatches = filtered.reduce((s, r) => s + (r.batches || 0), 0);
        const totalBags = filtered.reduce((s, r) => s + (r.productionBags || 0), 0);
        const totalIssues = filtered.filter(r => r.machineIssues && r.machineIssues.trim()).length;
        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        el('sr-total-shifts', totalShifts);
        el('sr-total-batches', totalBatches);
        el('sr-total-bags', totalBags.toLocaleString());
        el('sr-total-issues', totalIssues);

        // Update completion badges for standalone reports
        window.updateAllSubreportBadges = () => {
            const updateBadge = (lsKey, elId) => {
                const data = JSON.parse(localStorage.getItem(lsKey) || '[]');
                const badge = document.getElementById(elId);
                const badgeTop = document.getElementById(elId + '-top');
                
                const hasReport = data.some(d => d.date === currentSrFilterDate);
                
                if (badge) {
                    badge.className = hasReport ? 'sr-submitted-badge' : 'sr-draft-badge';
                    badge.style.display = 'inline-block';
                    badge.innerHTML = hasReport ? '✅ Filled' : '⌛ Pending';
                }
                
                if (badgeTop) {
                    badgeTop.className = hasReport ? 'sr-submitted-badge' : 'sr-draft-badge';
                    badgeTop.style.display = 'inline-block';
                    badgeTop.innerHTML = hasReport ? '✅ Filled' : '⌛ Pending';
                }
            };
            updateBadge('fm_standalone_rm_checks', 'badge-rm');
            updateBadge('fm_performas', 'badge-performa');
            updateBadge('fm_plant_report', 'badge-plant');
            updateBadge('fm_qs_report', 'badge-qs');
            updateBadge('fm_silo_dump', 'badge-silo');
            updateBadge('fm_silo_moisture', 'badge-silo-moist');
            updateBadge('fmpr_dailyChecklists', 'badge-dc');
        };
        window.updateAllSubreportBadges();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);opacity:0.65;">
                    <div style="font-size:3rem;margin-bottom:1rem;">📋</div>
                    <div style="font-size:1.1rem;font-weight:600;">No shift reports for this date</div>
                    <div style="font-size:0.9rem;margin-top:0.5rem;">Click "+ New Shift Report" to add the first one.</div>
                </div>`;
            return;
        }

        container.innerHTML = '';
        const rmData = JSON.parse(localStorage.getItem('fm_standalone_rm_checks') || '[]') || [];
        const performaData = JSON.parse(localStorage.getItem('fm_performas') || '[]') || [];
        const plantReportData = JSON.parse(localStorage.getItem('fm_plant_report') || '[]') || [];
        const qsReportData = JSON.parse(localStorage.getItem('fm_qs_report') || '[]') || [];
        const siloDumpData = JSON.parse(localStorage.getItem('fm_silo_dump') || '[]') || [];
        const siloMoistData = JSON.parse(localStorage.getItem('fm_silo_moisture') || '[]') || [];
        const dailyChecklistData = JSON.parse(localStorage.getItem('fmpr_dailyChecklists') || '[]') || [];

        filtered.forEach(r => {
            const shiftClass = { A: 'shift-a', B: 'shift-b', C: 'shift-c' }[r.shift] || 'shift-a';
            const statusBadge = r.isSubmitted
                ? `<span class="sr-submitted-badge">✅ Submitted</span>`
                : `<span class="sr-draft-badge">✏️ Draft</span>`;

            const fieldRow = (label, value) => value ? `
                <div class="sr-field-group">
                    <div class="sr-field-label">${label}</div>
                    <div class="sr-field-value">${value}</div>
                </div>` : '';

            const hasRm = rmData.some(d => d.date === r.date && d.shift === r.shift);
            const hasPerforma = performaData.some(d => d.date === r.date);
            const hasPlant = plantReportData.some(d => d.date === r.date && d.shift === r.shift);
            const hasQs = qsReportData.some(d => d.date === r.date && d.shift === r.shift);
            const hasSilo = siloDumpData.some(d => d.date === r.date && d.shift === r.shift);
            const hasSiloMoist = siloMoistData.some(d => d.date === r.date && d.shift === r.shift);
            const hasDc = dailyChecklistData.some(d => d.date === r.date);

            const subReportStatus = (name, hasReport) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:0.35rem 0;border-bottom:1px dashed var(--card-border);">
                    <span style="font-size:0.9rem;font-weight:500;color:var(--text-primary);">🔹 ${name}</span>
                    ${hasReport ? '<span class="sr-submitted-badge" style="font-size:0.75rem;padding:0.2rem 0.5rem;display:inline-block;">✅ Filled</span>' : '<span class="sr-draft-badge" style="font-size:0.75rem;padding:0.2rem 0.5rem;display:inline-block;">⌛ Pending</span>'}
                </div>
            `;

            const card = document.createElement('div');
            card.className = 'sr-shift-card';
            card.innerHTML = `
                <div class="sr-card-header">
                    <div class="sr-card-header-left">
                        <span class="sr-shift-badge ${shiftClass}">Shift ${r.shift}</span>
                        <div>
                            <div class="sr-officer-name">👷 ${r.officerName}</div>
                            <div class="sr-date-label">📅 ${r.date}</div>
                        </div>
                    </div>
                    <div class="sr-card-actions">
                        <span class="sr-stat-pill">🏭 ${r.batches} Batches</span>
                        <span class="sr-stat-pill">👜 ${(r.productionBags || 0).toLocaleString()} Bags</span>
                        ${statusBadge}
                        <button class="btn btn-secondary" style="padding:0.3rem 0.75rem;font-size:0.82rem;" onclick="openSrEditModal(${r.id})">✏️ Edit</button>
                        <button class="btn" style="padding:0.3rem 0.75rem;font-size:0.82rem;background:var(--accent-color);color:#fff;" onclick="toggleSrSubmit(${r.id})">${r.isSubmitted ? '↩ Unsubmit' : '✅ Submit'}</button>
                        <button class="btn btn-danger" style="padding:0.3rem 0.75rem;font-size:0.82rem;" onclick="deleteSrReport(${r.id})">🗑</button>
                    </div>
                </div>
                <div class="sr-card-body">
                    ${fieldRow('Feed Produced', r.feedProduced)}
                    ${fieldRow('Raw Material Used', r.rawMaterialUsed)}
                    ${fieldRow('Machine / Equipment Issues', r.machineIssues || '<span style="color:var(--text-secondary);opacity:0.5;">None reported</span>')}
                    ${fieldRow('Quality Observations', r.qualityRemarks)}
                    ${fieldRow('General Remarks', r.generalRemarks)}
                    
                    <div style="margin-top:1.5rem;padding:1rem;background:var(--card-bg);border:1px solid var(--card-border);border-radius:8px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.02);">
                        <h4 style="margin-bottom:0.75rem;font-size:1rem;color:var(--text-primary);border-bottom:2px solid var(--card-border);padding-bottom:0.4rem;display:flex;align-items:center;gap:0.5rem;">
                            📎 Attached Reports Status
                        </h4>
                        ${subReportStatus('Raw Material Unloading Check', hasRm)}
                        ${subReportStatus('Daily Performas Check List', hasPerforma)}
                        ${subReportStatus('Shift Plant Report', hasPlant)}
                        ${subReportStatus('Quality Standards Check List', hasQs)}
                        ${subReportStatus('Silo Dumping Moisture Report', hasSilo)}
                        ${subReportStatus('Silo Moisture Report', hasSiloMoist)}
                        ${subReportStatus('Department Daily Checklist', hasDc)}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        if (typeof window.updateDailySiloMoistureSummary === 'function') {
            window.updateDailySiloMoistureSummary(currentSrFilterDate);
        }
    };

    // Global helpers for inline onclick in rendered cards
    window.openSrEditModal = (id) => {
        const r = shiftReports.find(x => x.id === id);
        if (!r) return;
        activeSrId = id;
        const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.value = val || ''; };
        set('sr-modal-date', r.date);
        set('sr-modal-shift', r.shift);
        set('sr-modal-officer', r.officerName);
        set('sr-modal-feed', r.feedProduced);
        set('sr-modal-batches', r.batches);
        set('sr-modal-bags', r.productionBags);
        
        set('sr-modal-bags', r.productionBags);
        set('sr-modal-raw', r.rawMaterialUsed);
        set('sr-modal-machine', r.machineIssues);
        set('sr-modal-quality', r.qualityRemarks);
        set('sr-modal-general', r.generalRemarks);
        const title = document.getElementById('sr-modal-title');
        if (title) title.textContent = `Edit Shift Report — ${r.date} Shift ${r.shift}`;
        const modal = document.getElementById('shift-report-modal');
        if (modal) modal.classList.add('show');
    };

    window.toggleSrSubmit = async (id) => {
        const r = shiftReports.find(x => x.id === id);
        if (!r) return;
        r.isSubmitted = !r.isSubmitted;
        await saveShiftReports();
        renderShiftReports();
    };

    window.deleteSrReport = async (id) => {
        if (!confirm('Delete this shift report?')) return;
        shiftReports = shiftReports.filter(x => x.id !== id);
        if (isSbConnected && sbClient) {
            try { await sbClient.from('shift_reports').delete().eq('id', id); } catch (e) { /* ignore */ }
        }
        await saveShiftReports();
        renderShiftReports();
    };

    // ─── Standalone Raw Material Checks Module ──────────────────────────────
    
    const LS_STANDALONE_RM_CHECKS = 'fm_standalone_rm_checks';
    let standaloneRmChecks = JSON.parse(localStorage.getItem(LS_STANDALONE_RM_CHECKS) || '[]');
    let activeStandaloneRmId = null;

    const saveStandaloneRmChecks = () => {
        localStorage.setItem(LS_STANDALONE_RM_CHECKS, JSON.stringify(standaloneRmChecks));
        // We could also sync to Supabase if a table exists
    };

    const renderStandaloneRmChecks = () => {
        const tbody = document.querySelector('#standalone-rm-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (standaloneRmChecks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:2rem;">No unloading checks found.</td></tr>';
            return;
        }
        [...standaloneRmChecks].reverse().forEach(c => {
            const tr = document.createElement('tr');
            const staffList = [c.clerk && 'Clerk', c.qc && 'QC', c.sec && 'SEC', c.sup && 'Sup', c.sampler && 'Sampler'].filter(Boolean).join(', ') || 'None';
            tr.innerHTML = `
                <td>${c.date}</td>
                <td>${c.shift}</td>
                <td>${c.vehicle}</td>
                <td>${c.location}</td>
                <td>${c.moisture}</td>
                <td>${staffList}</td>
                <td>${c.quality}</td>
                <td>${c.remarks}</td>
                <td>
                    <button class="btn btn-secondary" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="editStandaloneRm(${c.id})">Edit</button>
                    <button class="btn btn-danger" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="deleteStandaloneRm(${c.id})">Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    window.editStandaloneRm = (id) => {
        const c = standaloneRmChecks.find(x => x.id === id);
        if (!c) return;
        activeStandaloneRmId = id;
        document.getElementById('rm-modal-date').value = c.date;
        document.getElementById('rm-modal-shift').value = c.shift;
        document.getElementById('rm-modal-vehicle').value = c.vehicle;
        document.getElementById('rm-modal-location').value = c.location;
        document.getElementById('rm-modal-moisture').value = c.moisture;
        document.getElementById('rm-modal-clerk').checked = !!c.clerk;
        document.getElementById('rm-modal-qc').checked = !!c.qc;
        document.getElementById('rm-modal-sec').checked = !!c.sec;
        document.getElementById('rm-modal-sup').checked = !!c.sup;
        document.getElementById('rm-modal-sampler').checked = !!c.sampler;
        document.getElementById('rm-modal-quality').value = c.quality;
        document.getElementById('rm-modal-remarks').value = c.remarks;
        document.getElementById('rm-standalone-modal').classList.add('show');
    };

    window.deleteStandaloneRm = (id) => {
        if (!confirm('Delete this unloading check?')) return;
        standaloneRmChecks = standaloneRmChecks.filter(x => x.id !== id);
        saveStandaloneRmChecks();
        renderStandaloneRmChecks();
    };

    const openStandaloneRmModal = () => {
        activeStandaloneRmId = null;
        const today = new Date();
        document.getElementById('rm-modal-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
        document.getElementById('rm-modal-shift').value = 'A';
        document.getElementById('rm-modal-vehicle').value = '';
        document.getElementById('rm-modal-location').value = '';
        document.getElementById('rm-modal-moisture').value = '';
        ['clerk', 'qc', 'sec', 'sup', 'sampler'].forEach(k => document.getElementById(`rm-modal-${k}`).checked = false);
        document.getElementById('rm-modal-quality').value = '';
        document.getElementById('rm-modal-remarks').value = '';
        document.getElementById('rm-standalone-modal').classList.add('show');
    };

    const closeStandaloneRmModal = () => document.getElementById('rm-standalone-modal').classList.remove('show');

    const saveStandaloneRmModal = () => {
        const c = {
            date: document.getElementById('rm-modal-date').value.trim(),
            shift: document.getElementById('rm-modal-shift').value.trim(),
            vehicle: document.getElementById('rm-modal-vehicle').value.trim(),
            location: document.getElementById('rm-modal-location').value.trim(),
            moisture: document.getElementById('rm-modal-moisture').value.trim(),
            clerk: document.getElementById('rm-modal-clerk').checked,
            qc: document.getElementById('rm-modal-qc').checked,
            sec: document.getElementById('rm-modal-sec').checked,
            sup: document.getElementById('rm-modal-sup').checked,
            sampler: document.getElementById('rm-modal-sampler').checked,
            quality: document.getElementById('rm-modal-quality').value.trim(),
            remarks: document.getElementById('rm-modal-remarks').value.trim()
        };
        if (!c.date || !c.shift) return alert('Date and Shift are required.');
        if (activeStandaloneRmId) {
            const idx = standaloneRmChecks.findIndex(x => x.id === activeStandaloneRmId);
            if (idx !== -1) { c.id = activeStandaloneRmId; standaloneRmChecks[idx] = c; }
        } else {
            c.id = Date.now();
            standaloneRmChecks.push(c);
        }
        saveStandaloneRmChecks();
        renderStandaloneRmChecks();
        closeStandaloneRmModal();
        if (window.updateAllSubreportBadges) window.updateAllSubreportBadges();
    };

    const initStandaloneRmEvents = () => {
        const btnAdd = document.getElementById('btn-add-standalone-rm');
        if (btnAdd) btnAdd.addEventListener('click', openStandaloneRmModal);
        const btnSave = document.getElementById('btn-save-rm');
        if (btnSave) btnSave.addEventListener('click', saveStandaloneRmModal);
        const btnClose1 = document.getElementById('rm-standalone-close');
        if (btnClose1) btnClose1.addEventListener('click', closeStandaloneRmModal);
        const btnClose2 = document.getElementById('btn-cancel-rm');
        if (btnClose2) btnClose2.addEventListener('click', closeStandaloneRmModal);
        renderStandaloneRmChecks();
    };

    // ─── Performas Check List Module ────────────────────────────────────────────

    const LS_PERFORMAS = 'fm_performas';
    let performasData = JSON.parse(localStorage.getItem(LS_PERFORMAS) || '[]');
    let activePerformaId = null;

    const performaItems = [
        { cat: 'AUDITS', name: 'Batching Medicine Audit (Audit & Share In Whatsapp Group)', m:true, e:true, n:true },
        { cat: 'AUDITS', name: 'Medicine Stock & Configuration/Batch Number Closing', m:true, e:false, n:false },
        { cat: 'AUDITS', name: 'Daily Oil Audit', m:true, e:false, n:false },
        { cat: 'AUDITS', name: 'Daily Molasses checking by Batching Clerk', m:true, e:false, n:false },
        { cat: 'AUDITS', name: 'Premix Stock Audit', m:false, e:false, n:true },
        
        { cat: 'PROCESS', name: 'Receiving Avg Checking', m:true, e:true, n:true },
        { cat: 'PROCESS', name: "Receiving Clerk's Shift Report", m:true, e:true, n:true },
        { cat: 'PROCESS', name: "Batching Clerk's working Sheet (Medicine Ticking Sheets)", m:true, e:true, n:true },
        { cat: 'PROCESS', name: "Batching Clerk's Shift Report", m:true, e:true, n:true },
        { cat: 'PROCESS', name: "Pellet Mill Operator's Shift Report", m:true, e:true, n:true },
        { cat: 'PROCESS', name: 'Maize Moisture (after each 30 Batches)', m:true, e:true, n:true },
        { cat: 'PROCESS', name: 'Daily Packing Bardana Checking', m:true, e:true, n:true },
        { cat: 'PROCESS', name: 'On No Change, Bags less/Excess checking', m:true, e:true, n:true },
        { cat: 'PROCESS', name: 'Crumbler Powder checking Via Basement Worker', m:true, e:true, n:true },
        { cat: 'PROCESS', name: 'Grain Grinding Samples', m:true, e:true, n:true },
        { cat: 'PROCESS', name: 'Feed weight checking from different stacks of Feed(Checked Weight Physically)', m:true, e:true, n:true },
        { cat: 'PROCESS', name: 'Physical Checking of finished feed stock(Checked Physically & sign in field)', m:true, e:true, n:true },
        { cat: 'PROCESS', name: 'Stiching Machine Submission to Electric Department', m:true, e:true, n:true },
        { cat: 'PROCESS', name: 'Welding Permit Filling, In case of Welding', m:true, e:false, n:false },
        { cat: 'PROCESS', name: 'Packing Side Scales Checking', m:true, e:false, n:false },
        { cat: 'PROCESS', name: 'Batching Area Scales Checking', m:true, e:false, n:false },
        { cat: 'PROCESS', name: 'Premix Department Scales checking', m:true, e:false, n:false },
        { cat: 'PROCESS', name: 'Receiving Plan', m:true, e:false, n:false },

        { cat: 'HOUSE KEEPING', name: "Drum Cleaner waste checking Via 67'' Worker", m:true, e:true, n:true },
        { cat: 'HOUSE KEEPING', name: 'Overall Factory Waste checking', m:true, e:true, n:false },

        { cat: 'MACHINE EFFICIENCY AND MAINTENACE', name: 'Old Godown Hammer Mill Efficiency Checking', m:true, e:true, n:true },
        { cat: 'MACHINE EFFICIENCY AND MAINTENACE', name: '40Ton Pellet Grease checking, If Grease on Manual', m:true, e:true, n:true },

        { cat: 'RAW MATERIAL UNLOADING PROTOCOLS', name: 'Unloading Cross Check (Checked Physically & sign in field)', m:true, e:true, n:true },
        { cat: 'RAW MATERIAL UNLOADING PROTOCOLS', name: 'Silo Inspection Report before Filling', m:true, e:true, n:true },
        { cat: 'RAW MATERIAL UNLOADING PROTOCOLS', name: 'Silo Side A+B Line Dumping Sample checking via Worker', m:true, e:true, n:true },
        { cat: 'RAW MATERIAL UNLOADING PROTOCOLS', name: 'Dryer to Concrete Silo Shifting Maize Sample', m:true, e:true, n:true },

        { cat: 'OTHERS', name: 'Bats weights checking,Both scales Calibration checking after 15 Days,Oil system scale checking', m:true, e:true, n:true },
        { cat: 'OTHERS', name: 'Plant Cleaning Before Breeder', m:true, e:true, n:true },
        { cat: 'OTHERS', name: 'Both Scales Weight checking During Breeder Batching', m:true, e:true, n:true },
        { cat: 'OTHERS', name: 'Batching Medicines weight checking (For Breeder)', m:true, e:true, n:true },
        { cat: 'OTHERS', name: '5 WHY Performa', m:true, e:true, n:true }
    ];

    const savePerformas = () => {
        localStorage.setItem(LS_PERFORMAS, JSON.stringify(performasData));
    };

    const renderPerformaTable = () => {
        const tbody = document.querySelector('#performa-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (performasData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2rem;">No checklists found.</td></tr>';
            return;
        }
        [...performasData].reverse().forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.date}</td>
                <td>${p.sign || '—'}</td>
                <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.remarks || '—'}</td>
                <td>
                    <button class="btn btn-secondary" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="editPerforma(${p.id})">Edit</button>
                    <button class="btn btn-danger" style="padding:0.25rem 0.5rem;font-size:0.8rem;" onclick="deletePerforma(${p.id})">Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    const populatePerformaModalTable = (dataMap = {}) => {
        const tbody = document.getElementById('performa-modal-tbody');
        if (!tbody) return;
        let html = '';
        let currentCat = '';
        performaItems.forEach((item, index) => {
            if (item.cat !== currentCat) {
                currentCat = item.cat;
                html += `<tr style="background:rgba(0,0,0,0.03);"><td colspan="5" style="font-weight:bold;color:var(--text-primary);padding-top:1rem;border-bottom:2px solid var(--card-border);">${currentCat}</td></tr>`;
            }
            
            const cellM = item.m ? `<input type="checkbox" id="pf-chk-m-${index}" style="transform:scale(1.2); cursor:pointer;" ${dataMap[index]?.m ? 'checked' : ''}>` : '<div style="background:var(--card-border);height:100%;width:100%;min-height:24px;border-radius:4px;"></div>';
            const cellE = item.e ? `<input type="checkbox" id="pf-chk-e-${index}" style="transform:scale(1.2); cursor:pointer;" ${dataMap[index]?.e ? 'checked' : ''}>` : '<div style="background:var(--card-border);height:100%;width:100%;min-height:24px;border-radius:4px;"></div>';
            const cellN = item.n ? `<input type="checkbox" id="pf-chk-n-${index}" style="transform:scale(1.2); cursor:pointer;" ${dataMap[index]?.n ? 'checked' : ''}>` : '<div style="background:var(--card-border);height:100%;width:100%;min-height:24px;border-radius:4px;"></div>';

            html += `
                <tr style="border-bottom:1px solid var(--card-border);">
                    <td style="text-align:center;color:var(--text-secondary);font-size:0.85rem;">${index + 1}</td>
                    <td style="font-size:0.9rem;padding:0.6rem;">${item.name}</td>
                    <td style="text-align:center;padding:0;">${cellM}</td>
                    <td style="text-align:center;padding:0;">${cellE}</td>
                    <td style="text-align:center;padding:0;">${cellN}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    };

    window.editPerforma = (id) => {
        const p = performasData.find(x => x.id === id);
        if (!p) return;
        activePerformaId = id;
        document.getElementById('performa-modal-date').value = p.date || '';
        document.getElementById('performa-modal-sign').value = p.sign || '';
        document.getElementById('performa-modal-remarks').value = p.remarks || '';
        
        populatePerformaModalTable(p.checks || {});
        document.getElementById('performa-modal').classList.add('show');
    };

    window.deletePerforma = (id) => {
        if (!confirm('Delete this checklist?')) return;
        performasData = performasData.filter(x => x.id !== id);
        savePerformas();
        renderPerformaTable();
    };

    const openPerformaModal = () => {
        activePerformaId = null;
        const today = new Date();
        document.getElementById('performa-modal-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
        document.getElementById('performa-modal-sign').value = '';
        document.getElementById('performa-modal-remarks').value = '';
        populatePerformaModalTable({});
        document.getElementById('performa-modal').classList.add('show');
    };

    const closePerformaModal = () => document.getElementById('performa-modal').classList.remove('show');

    const savePerformaModal = () => {
        const date = document.getElementById('performa-modal-date').value.trim();
        if (!date) return alert('Date is required.');
        
        const checks = {};
        performaItems.forEach((item, index) => {
            checks[index] = {
                m: item.m ? (document.getElementById(`pf-chk-m-${index}`)?.checked || false) : false,
                e: item.e ? (document.getElementById(`pf-chk-e-${index}`)?.checked || false) : false,
                n: item.n ? (document.getElementById(`pf-chk-n-${index}`)?.checked || false) : false,
            };
        });

        const p = {
            date,
            sign: document.getElementById('performa-modal-sign').value.trim(),
            remarks: document.getElementById('performa-modal-remarks').value.trim(),
            checks
        };

        if (activePerformaId) {
            const idx = performasData.findIndex(x => x.id === activePerformaId);
            if (idx !== -1) { p.id = activePerformaId; performasData[idx] = p; }
        } else {
            p.id = Date.now();
            performasData.push(p);
        }
        
        savePerformas();
        renderPerformaTable();
        closePerformaModal();
        if (window.updateAllSubreportBadges) window.updateAllSubreportBadges();
    };

    const initPerformaEvents = () => {
        const btnAdd = document.getElementById('btn-add-performa');
        if (btnAdd) btnAdd.addEventListener('click', openPerformaModal);
        const btnSave = document.getElementById('btn-save-performa');
        if (btnSave) btnSave.addEventListener('click', savePerformaModal);
        const btnClose1 = document.getElementById('performa-modal-close');
        if (btnClose1) btnClose1.addEventListener('click', closePerformaModal);
        const btnClose2 = document.getElementById('btn-cancel-performa');
        if (btnClose2) btnClose2.addEventListener('click', closePerformaModal);
        renderPerformaTable();
    };

    // ─── Shift Report Form State ────────────────────────────────────────────────

    const openSrNewModal = () => {
        activeSrId = null;
        const today = new Date();
        const d = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
        const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.value = val || ''; };
        set('sr-modal-date', currentSrFilterDate || d);
        set('sr-modal-shift', 'A');
        set('sr-modal-officer', 'Zubair');
        set('sr-modal-feed', '');
        set('sr-modal-batches', '');
        set('sr-modal-bags', '');
        
        set('sr-modal-raw', '');
        set('sr-modal-machine', '');
        set('sr-modal-quality', '');
        set('sr-modal-general', '');
        const title = document.getElementById('sr-modal-title');
        if (title) title.textContent = 'New Shift Report';
        const modal = document.getElementById('shift-report-modal');
        if (modal) modal.classList.add('show');
    };

    const closeSrModal = () => {
        const modal = document.getElementById('shift-report-modal');
        if (modal) modal.classList.remove('show');
        activeSrId = null;
    };

    const saveSrModal = async () => {
        const get = (elId) => { const e = document.getElementById(elId); return e ? e.value.trim() : ''; };
        const getCheck = (elId) => { const e = document.getElementById(elId); return e ? e.checked : false; };
        const date = get('sr-modal-date');
        const shift = get('sr-modal-shift');
        const officerName = get('sr-modal-officer');
        if (!date || !shift || !officerName) {
            alert('Please fill in Date, Shift, and Officer Name.');
            return;
        }
        const reportData = {
            date,
            shift,
            officerName,
            feedProduced: get('sr-modal-feed'),
            batches: parseFloat(get('sr-modal-batches')) || 0,
            productionBags: parseFloat(get('sr-modal-bags')) || 0,
            rawMaterialUsed: get('sr-modal-raw'),
            machineIssues: get('sr-modal-machine'),
            qualityRemarks: get('sr-modal-quality'),
            generalRemarks: get('sr-modal-general'),
            isSubmitted: false
        };

        if (activeSrId) {
            const idx = shiftReports.findIndex(x => x.id === activeSrId);
            if (idx !== -1) {
                reportData.id = activeSrId;
                reportData.isSubmitted = shiftReports[idx].isSubmitted;
                shiftReports[idx] = reportData;
            }
        } else {
            reportData.id = Date.now();
            shiftReports.push(reportData);
        }
        currentSrFilterDate = date;
        const filterEl = document.getElementById('sr-filter-date');
        if (filterEl) filterEl.value = date;
        await saveShiftReports();
        renderShiftReports();
        closeSrModal();
    };

    const initShiftReportEvents = () => {
        const btnAdd = document.getElementById('btn-add-shift-report');
        if (btnAdd) btnAdd.addEventListener('click', openSrNewModal);

        const modalClose = document.getElementById('sr-modal-close');
        if (modalClose) modalClose.addEventListener('click', closeSrModal);

        const btnCancel = document.getElementById('btn-cancel-sr-modal');
        if (btnCancel) btnCancel.addEventListener('click', closeSrModal);

        const btnSave = document.getElementById('btn-save-sr-modal');
        if (btnSave) btnSave.addEventListener('click', saveSrModal);

        const filterInput = document.getElementById('sr-filter-date');
        if (filterInput) {
            filterInput.addEventListener('change', () => {
                currentSrFilterDate = filterInput.value.trim();
                renderShiftReports();
            });
            filterInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    currentSrFilterDate = filterInput.value.trim();
                    renderShiftReports();
                }
            });
        }
    };

    // ─── Batching Audit Module ────────────────────────────────────────────────

    const saveBatchingAudits = async () => {
        localStorage.setItem(LS_BATCHING_AUDITS, JSON.stringify(batchingAudits));
        if (isSbConnected && sbClient) {
            try {
                const { error } = await sbClient
                    .from('batching_audits')
                    .upsert(batchingAudits.map(mapBatchingAuditToDb));
                if (error) throw error;
                showToast('✓ Batching Audit saved to Supabase');
            } catch (err) {
                console.error('Supabase save failed for batching audits:', err);
                showToast('✓ Saved locally (Supabase offline)');
            }
        } else {
            showToast('✓ Batching Audit saved');
        }
    };

    const initBatchingAuditView = () => {
        const filterInput = document.getElementById('ba-filter-date');
        if (filterInput) {
            if (!filterInput.value) {
                const today = new Date();
                const d = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
                filterInput.value = d;
                currentBaFilterDate = d;
            } else {
                currentBaFilterDate = filterInput.value.trim();
            }
        }
        renderBatchingAudits();
    };

    const getFilteredBatchingAudits = () => {
        if (!currentBaFilterDate) return [...batchingAudits].reverse();
        return batchingAudits.filter(a => a.date === currentBaFilterDate).reverse();
    };

    const renderBatchingAudits = () => {
        const container = document.getElementById('ba-cards-container');
        if (!container) return;

        const filtered = getFilteredBatchingAudits();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);opacity:0.65;">
                    <div style="font-size:3rem;margin-bottom:1rem;">💊</div>
                    <div style="font-size:1.1rem;font-weight:600;">No batching audits for this date</div>
                    <div style="font-size:0.9rem;margin-top:0.5rem;">Click "+ New Audit" to add one.</div>
                </div>`;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(a => {
            const variance = a.expectedQty - a.actualQty;
            const isOk = Math.abs(variance) < 0.01; // Allow floating point tolerance
            const variancePill = isOk 
                ? '<span class="ba-variance-pill ok">✅ OK</span>'
                : '<span class="ba-variance-pill warning">⚠️ Variance: ' + variance.toFixed(2) + '</span>';

            const card = document.createElement('div');
            card.className = 'ba-card';
            card.innerHTML = `
                <div class="ba-card-header">
                    <div style="display:flex;align-items:center;gap:1rem;">
                        <span class="ba-time-badge">🕒 ${a.time}</span>
                        <div>
                            <div style="font-weight:700;font-size:1rem;color:var(--text-primary);">💊 ${a.medicineName}</div>
                            <div style="font-size:0.82rem;color:var(--text-secondary);font-weight:500;">Batch: ${a.batchNo || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="ba-card-actions" style="display:flex;align-items:center;gap:0.5rem;">
                        ${variancePill}
                        <button class="btn btn-secondary" style="padding:0.3rem 0.75rem;font-size:0.82rem;" onclick="openBaEditModal(${a.id})">✏️ Edit</button>
                        <button class="btn btn-danger" style="padding:0.3rem 0.75rem;font-size:0.82rem;" onclick="deleteBaReport(${a.id})">🗑</button>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0;">
                    <div class="sr-field-group">
                        <div class="sr-field-label">Expected Qty</div>
                        <div class="sr-field-value">${a.expectedQty}</div>
                    </div>
                    <div class="sr-field-group">
                        <div class="sr-field-label">Actual Qty</div>
                        <div class="sr-field-value">${a.actualQty}</div>
                    </div>
                    <div class="sr-field-group">
                        <div class="sr-field-label">Auditor</div>
                        <div class="sr-field-value">${a.auditorName || '-'}</div>
                    </div>
                    <div class="sr-field-group">
                        <div class="sr-field-label">Remarks</div>
                        <div class="sr-field-value">${a.remarks || '-'}</div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    };

    window.openBaEditModal = (id) => {
        const a = batchingAudits.find(x => x.id === id);
        if (!a) return;
        activeBaId = id;
        const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.value = val || ''; };
        set('ba-modal-date', a.date);
        set('ba-modal-time', a.time);
        set('ba-modal-medicine', a.medicineName);
        set('ba-modal-batch', a.batchNo);
        set('ba-modal-expected', a.expectedQty);
        set('ba-modal-actual', a.actualQty);
        set('ba-modal-auditor', a.auditorName);
        set('ba-modal-remarks', a.remarks);
        const title = document.getElementById('ba-modal-title');
        if (title) title.textContent = `Edit Batching Audit — ${a.date} ${a.time}`;
        const modal = document.getElementById('batching-audit-modal');
        if (modal) modal.classList.add('show');
    };

    window.deleteBaReport = async (id) => {
        if (!confirm('Delete this batching audit?')) return;
        batchingAudits = batchingAudits.filter(x => x.id !== id);
        if (isSbConnected && sbClient) {
            try { await sbClient.from('batching_audits').delete().eq('id', id); } catch (e) { /* ignore */ }
        }
        await saveBatchingAudits();
        renderBatchingAudits();
    };

    const openBaNewModal = () => {
        activeBaId = null;
        const today = new Date();
        const d = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' });
        const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.value = val || ''; };
        set('ba-modal-date', currentBaFilterDate || d);
        set('ba-modal-time', '12 AM');
        set('ba-modal-medicine', '');
        set('ba-modal-batch', '');
        set('ba-modal-expected', '');
        set('ba-modal-actual', '');
        set('ba-modal-auditor', '');
        set('ba-modal-remarks', '');
        const title = document.getElementById('ba-modal-title');
        if (title) title.textContent = 'New Batching Audit';
        const modal = document.getElementById('batching-audit-modal');
        if (modal) modal.classList.add('show');
    };

    const closeBaModal = () => {
        const modal = document.getElementById('batching-audit-modal');
        if (modal) modal.classList.remove('show');
        activeBaId = null;
    };

    const saveBaModal = async () => {
        const get = (elId) => { const e = document.getElementById(elId); return e ? e.value.trim() : ''; };
        const date = get('ba-modal-date');
        const time = get('ba-modal-time');
        const medicineName = get('ba-modal-medicine');
        if (!date || !time || !medicineName) {
            alert('Please fill in Date, Time, and Medicine Name.');
            return;
        }
        const auditData = {
            date,
            time,
            medicineName,
            batchNo: get('ba-modal-batch'),
            expectedQty: parseFloat(get('ba-modal-expected')) || 0,
            actualQty: parseFloat(get('ba-modal-actual')) || 0,
            auditorName: get('ba-modal-auditor'),
            remarks: get('ba-modal-remarks')
        };

        if (activeBaId) {
            const idx = batchingAudits.findIndex(x => x.id === activeBaId);
            if (idx !== -1) {
                auditData.id = activeBaId;
                batchingAudits[idx] = auditData;
            }
        } else {
            auditData.id = Date.now();
            batchingAudits.push(auditData);
        }
        currentBaFilterDate = date;
        const filterEl = document.getElementById('ba-filter-date');
        if (filterEl) filterEl.value = date;
        await saveBatchingAudits();
        renderBatchingAudits();
        closeBaModal();
    };

    const initBatchingAuditEvents = () => {
        const btnAdd = document.getElementById('btn-add-batching-audit');
        if (btnAdd) btnAdd.addEventListener('click', openBaNewModal);

        const modalClose = document.getElementById('ba-modal-close');
        if (modalClose) modalClose.addEventListener('click', closeBaModal);

        const btnCancel = document.getElementById('btn-cancel-ba-modal');
        if (btnCancel) btnCancel.addEventListener('click', closeBaModal);

        const btnSave = document.getElementById('btn-save-ba-modal');
        if (btnSave) btnSave.addEventListener('click', saveBaModal);

        const filterInput = document.getElementById('ba-filter-date');
        if (filterInput) {
            filterInput.addEventListener('change', () => {
                currentBaFilterDate = filterInput.value.trim();
                renderBatchingAudits();
            });
            filterInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    currentBaFilterDate = filterInput.value.trim();
                    renderBatchingAudits();
                }
            });
        }
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
} catch (err) {
    if (window.showRuntimeError) {
        window.showRuntimeError('script.js', err);
    } else {
        console.error('script.js init error:', err);
    }
}
});

