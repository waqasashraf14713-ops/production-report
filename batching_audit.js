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

    const RECIPE_GROUPS = {
        chenab: ['430(278)', '431(279)', '432(278)', '433(290)', '432(265)', '433(289)', '431(262)', '434(276)', '432(252)', '432(257)', '434(271)', '31A(288)', '31A(291)', '33Y(298)', '34A(287)', '34M(187)', '33P(290)', '33A(305)', '34A(282)', '33A(304)', '33P(288)', '31A(285)', '33A(33)LS', '34M(186)', '34Y(260)'],
        delta: ['41A(298)', '42A(297)', '33A(296)', '43A(309)', '33M(185)', '34A(284)', '33Y(282)', '33A(315)', '34M(186)-delta', '34Y(260)-delta', 'sample-delta'],
        wanda: ['733(98)', '731(103)', '723(99)', '721(104)', '732(102)', '741(104)', '743(108)', '742(106)', '744(78)', '712(103)', '743(0)'],
        breeder: ['324LC(76)', '521(22)', '5212(52)', '5221(52)', '521(20)', '522(1)', '5211(52)', 'sample-breeder']
    };

    const RECIPES = {
        // Asia-Chenab
        '430(278)': { 'SALT': 8.7, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 31.07, 'DL.METHININE': 17.09, 'L THREONINE': 9.85, 'YIDUOZYME': 0.5, 'L.VALINE': 4.9, 'L.ISOLEUCINE': 4.26, 'L ARGINUNE': 1.08, 'L Glycine': 5, 'Soya Bean Oil': 20 },
        '431(279)': { 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 32.79, 'DL.METHININE': 12.6, 'L THREONINE': 8.78, 'L.VALINE': 2.66, 'L.ISOLEUCINE': 3.97, 'L Glycine': 4.73 },
        '432(278)': { 'MARBLE CHIPS': 12.6, 'SALT': 9.4, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 31.47, 'DL.METHININE': 10.94, 'L THREONINE': 7.79, 'L.VALINE': 2.13, 'L.ISOLEUCINE': 3.78, 'L Glycine': 2.04 },
        '433(290)': { 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 37.96, 'DL.METHININE': 12.24, 'L THREONINE': 9.61, 'L.VALINE': 4.92, 'L.ISOLEUCINE': 6.48, 'L ARGINUNE': 4.8, 'L Glycine': 5 },
        '432(265)': { 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 35.73, 'DL.METHININE': 10.87, 'L THREONINE': 8.39, 'L.VALINE': 3.7, 'L.ISOLEUCINE': 5.65, 'L ARGINUNE': 5, 'L Glycine': 1.46 },
        '433(289)': { 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 35.05, 'DL.METHININE': 12.35, 'L THREONINE': 8.64, 'L.VALINE': 4.53, 'L.ISOLEUCINE': 5.77, 'L ARGINUNE': 5, 'L Glycine': 0.06 },
        '431(262)': { 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 36.44, 'DL.METHININE': 12.9, 'L THREONINE': 9.56, 'L.VALINE': 4.64, 'L.ISOLEUCINE': 5.98, 'L ARGINUNE': 5, 'L Glycine': 5 },
        '434(276)': { 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 34.97, 'DL.METHININE': 13.05, 'L THREONINE': 8.86, 'L.VALINE': 4.81, 'L.ISOLEUCINE': 5.72, 'L ARGINUNE': 5, 'L Glycine': 0.92, 'Mix Oil': 10 },
        '432(252)': { 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 24.03, 'DL.METHININE': 13.28, 'L THREONINE': 7.14, 'L.VALINE': 2.12, 'L.ISOLEUCINE': 2.06, 'L Glycine': 5, 'Mix Oil': 30 },
        '432(257)': { 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 37.91, 'DL.METHININE': 10.49, 'L THREONINE': 8.62, 'L.VALINE': 3.82, 'L.ISOLEUCINE': 6.26, 'L ARGINUNE': 6, 'Mix Oil': 20 },
        '434(271)': { 'SALT': 8.3, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 36.67, 'DL.METHININE': 13.51, 'L THREONINE': 9.62, 'L.VALINE': 5.35, 'L.ISOLEUCINE': 6.32, 'L ARGINUNE': 5, 'L Glycine': 2.28, 'Soya Bean Oil': 20 },
        '31A(288)': { 'SALT': 18.1, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 28.79, 'DL.METHININE': 8.27, 'L THREONINE': 7.88, 'L TRYPTOPHAN': 1.74, 'L.ISOLEUCINE': 3.32, 'L ARGINUNE': 1.93 },
        '31A(291)': { 'SALT': 18.6, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 27.73, 'DL.METHININE': 7.63, 'L THREONINE': 7.47, 'L TRYPTOPHAN': 1.38, 'L.ISOLEUCINE': 2.51, 'L Glycine': 4.73 },
        '33Y(298)': { 'SALT': 37.2, 'SODIUM BICARBONATE': 12, 'LYSINE SULPHATE 70%': 55.46, 'DL.METHININE': 15.26, 'L THREONINE': 14.94, 'L TRYPTOPHAN': 2.76, 'L.ISOLEUCINE': 5.02, 'L Glycine': 2.06 },
        '34A(287)': { 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 11.74, 'DL.METHININE': 6.45, 'L THREONINE': 1.35, 'L.ISOLEUCINE': 0.78 },
        '34M(187)': { 'Maize': 5, 'DL.METHININE': 8.13, 'L THREONINE': 1.7, 'L TRYPTOPHAN': 1.16, 'L.ISOLEUCINE': 2.17, 'L Glycine': 3.05 },
        '33P(290)': { 'Maize': 5, 'DL.METHININE': 9.75, 'L THREONINE': 2.4, 'L TRYPTOPHAN': 0.95, 'L.ISOLEUCINE': 1.92, 'L Glycine': 1.46 },
        '33A(305)': { 'SALT': 7.6, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 12.84, 'DL.METHININE': 4.87, 'L THREONINE': 2.59, 'L TRYPTOPHAN': 0.53 },
        '34A(282)': { 'SALT': 7.4, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 12.3, 'DL.METHININE': 8.28, 'L THREONINE': 2.05, 'L TRYPTOPHAN': 0.06, 'L.ISOLEUCINE': 1.21 },
        '33A(304)': { 'SALT': 14.5, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 13.53, 'DL.METHININE': 7.64, 'L THREONINE': 2.15, 'L TRYPTOPHAN': 1.08, 'L.ISOLEUCINE': 2.42 },
        '33P(288)': { 'SALT': 16.2, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 11.77, 'DL.METHININE': 8.23, 'L THREONINE': 1.52, 'L TRYPTOPHAN': 0.46, 'L.ISOLEUCINE': 1.16 },
        '31A(285)': { 'SALT': 7.4, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 15.81, 'DL.METHININE': 5.4, 'L THREONINE': 2.23, 'L TRYPTOPHAN': 0.63 },
        '33A(33)LS': { 'SALT': 10.2, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 10.98, 'DL.METHININE': 7.01, 'L THREONINE': 2.22, 'L TRYPTOPHAN': 1.44, 'L.ISOLEUCINE': 1, 'Soya Bean Oil': 20 },
        '34M(186)': { 'SALT': 13.7, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 11.13, 'DL.METHININE': 7.01, 'L THREONINE': 2.22, 'L TRYPTOPHAN': 1.44, 'L.ISOLEUCINE': 1 },
        '34Y(260)': { 'SALT': 17, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 23.41, 'DL.METHININE': 15.26, 'L THREONINE': 5.87, 'L TRYPTOPHAN': 1.44, 'Soya Bean Oil': 30 },

        // Delta
        '41A(298)': { 'SALT': 9.4, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 32.61, 'DL.METHININE': 11.93, 'L THREONINE': 8.53, 'L.VALINE': 2.39, 'L.ISOLEUCINE': 3.94, 'L Glycine': 4.55 },
        '42A(297)': { 'MARBLE CHIPS': 12.5, 'SALT': 9.6, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 31.29, 'DL.METHININE': 9.89, 'L THREONINE': 7.41, 'L TRYPTOPHAN': 0.13, 'L.VALINE': 1.69, 'L.ISOLEUCINE': 3.74, 'L Glycine': 1.79 },
        '33A(296)': { 'SALT': 10.5, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 11.34, 'DL.METHININE': 8.21, 'L THREONINE': 1.84, 'L.ISOLEUCINE': 1.1 },
        '43A(309)': { 'SALT': 9.9, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 35.13, 'DL.METHININE': 11.39, 'L THREONINE': 8.65, 'L TRYPTOPHAN': 0.95, 'L.ISOLEUCINE': 5.4, 'L Glycine': 3.05 },
        '33M(185)': { 'SALT': 7.3, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 14.03, 'DL.METHININE': 8.79, 'L THREONINE': 2.36, 'L TRYPTOPHAN': 0.85, 'L.ISOLEUCINE': 2.29 },
        '34A(284)': { 'SALT': 7.9, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 13.03, 'DL.METHININE': 8.06, 'L THREONINE': 1.92, 'L TRYPTOPHAN': 0.85, 'L.ISOLEUCINE': 1.95, 'DCP': 2.96 },
        '33Y(282)': { 'SALT': 9.7, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 14.8, 'DL.METHININE': 9.38, 'L THREONINE': 2.8, 'L TRYPTOPHAN': 0.77, 'L.ISOLEUCINE': 2.33 },
        '33A(315)': { 'SALT': 6.8, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 15.44, 'DL.METHININE': 7.04, 'L THREONINE': 1.79, 'L TRYPTOPHAN': 1.29, 'L.ISOLEUCINE': 2.54 },
        '34M(186)-delta': { 'SALT': 7.4, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 5.44, 'DL.METHININE': 7.46, 'L THREONINE': 0.05, 'L TRYPTOPHAN': 26.76, 'L Glycine': 30 },
        '34Y(260)-delta': { 'SALT': 6.6, 'SODIUM BICARBONATE': 5, 'LYSINE SULPHATE 70%': 12.34, 'DL.METHININE': 10.31, 'L THREONINE': 2.74, 'L TRYPTOPHAN': 1.11, 'L.ISOLEUCINE': 2.31 },
        'sample-delta': { 'SALT': 6.6, 'SODIUM BICARBONATE': 6, 'LYSINE SULPHATE 70%': 13.52, 'DL.METHININE': 7.52, 'L THREONINE': 1.8, 'L TRYPTOPHAN': 0.91, 'L.ISOLEUCINE': 1.21 },

        // Wanda
        '733(98)': { 'Supplement(L.S)': 56, 'M.C.P Wanda': 4, 'SALT': 40, 'SODIUM BICARBONATE': 8, 'CMS': 80, 'Magnesium oxide': 4 },
        '731(103)': { 'SALT': 20, 'SODIUM BICARBONATE': 8, 'CMS': 40 },
        '723(99)': { 'SALT': 40, 'SODIUM BICARBONATE': 8, 'Soya Bean Oil': 12 },
        '721(104)': { 'SALT': 40, 'SODIUM BICARBONATE': 8, 'CMS': 20, 'DCP': 8, 'Magnesium oxide': 4 },
        '732(102)': { 'SALT': 20, 'SODIUM BICARBONATE': 8, 'CMS': 20, 'DCP': 4, 'Magnesium oxide': 4 },
        '741(104)': { 'SALT': 20, 'SODIUM BICARBONATE': 8, 'CMS': 20, 'DCP': 8, 'Magnesium oxide': 4 },
        '743(108)': { 'SALT': 24, 'SODIUM BICARBONATE': 12, 'CMS': 20, 'DCP': 12, 'Magnesium oxide': 8, 'Soya Bean Oil': 16 },
        '742(106)': { 'Supplement(L.S)': 64, 'SALT': 24, 'SODIUM BICARBONATE': 8, 'CMS': 20, 'DCP': 8, 'Magnesium oxide': 4, 'Soya Bean Oil': 10 },
        '744(78)': { 'Supplement(L.S)': 64, 'SALT': 120, 'SODIUM BICARBONATE': 40, 'CMS': 1000, 'DCP': 600, 'Magnesium oxide': 400 },
        '712(103)': { 'Supplement(L.S)': 64, 'SALT': 24, 'SODIUM BICARBONATE': 16, 'CMS': 20, 'DCP': 8, 'Magnesium oxide': 4, 'Soya Bean Oil': 50 },
        '743(0)': { 'Supplement(L.S)': 64, 'SALT': 120, 'SODIUM BICARBONATE': 32, 'CMS': 100, 'DCP': 40, 'Magnesium oxide': 20, 'Soya Bean Oil': 10 },

        // Breeder
        '324LC(76)': { 'M.C.P Wanda': 42, 'SALT': 12.5, 'SODIUM BICARBONATE': 5, 'LYSINE SULPHATE 70%': 13.02, 'DL.METHININE': 9.6, 'L THREONINE': 0.56, 'L TRYPTOPHAN': 0.93, 'YIDUOZYME': 3.01, 'L.ISOLEUCINE': 0.12 },
        '521(22)': { 'M.C.P Wanda': 52.5, 'SALT': 10.88, 'SODIUM BICARBONATE': 5, 'LYSINE SULPHATE 70%': 23.17, 'DL.METHININE': 8.42, 'L THREONINE': 3.45 },
        '5212(52)': { 'M.C.P Wanda': 31.5, 'SALT': 11.07, 'SODIUM BICARBONATE': 8.99, 'LYSINE SULPHATE 70%': 0.28, 'L THREONINE': 7.14, 'L TRYPTOPHAN': 3.47, 'YIDUOZYME': 0.14, 'L.ISOLEUCINE': 1 },
        '5221(52)': { 'M.C.P Wanda': 40, 'SALT': 11.36, 'SODIUM BICARBONATE': 5, 'LYSINE SULPHATE 70%': 6.31, 'L THREONINE': 6.73, 'L TRYPTOPHAN': 0.8, 'YIDUOZYME': 0.26 },
        '521(20)': { 'M.C.P Wanda': 53.5, 'SALT': 10.98, 'SODIUM BICARBONATE': 5, 'LYSINE SULPHATE 70%': 25, 'L THREONINE': 8.07, 'L TRYPTOPHAN': 3.54, 'YIDUOZYME': 0.08 },
        '522(1)': { 'SALT': 10.53, 'SODIUM BICARBONATE': 5, 'LYSINE SULPHATE 70%': 23.13, 'L THREONINE': 9.2, 'L TRYPTOPHAN': 4.1 },
        '5211(52)': { 'M.C.P Wanda': 36, 'SALT': 11, 'SODIUM BICARBONATE': 7.32, 'LYSINE SULPHATE 70%': 1.36, 'L THREONINE': 7.55, 'L TRYPTOPHAN': 3.64, 'YIDUOZYME': 0.28, 'L.ISOLEUCINE': 1.26 },
        'sample-breeder': { 'M.C.P Wanda': 18, 'SALT': 6, 'SODIUM BICARBONATE': 4.5 }
    };

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

        const netOpening = (openBags * standWeight) + openLoose - openEmptyTub + received;
        const netClosing = (closeBags * standWeight) + closeLoose - openEmptyTub;
        const actualUsed = netOpening - netClosing;
        const usedBagsExcessLess = bagsUsed * avgExcessLess;
        const diff = actualUsed - issuance;
        const diffBatch = totalBatches > 0 ? diff / totalBatches : 0;
        const pctExcess = issuance > 0 ? (diff / issuance) * 100 : 0;

        document.getElementById(`ba-net-opening-${i}`).value = netOpening.toFixed(2);
        document.getElementById(`ba-net-closing-${i}`).value = netClosing.toFixed(2);
        document.getElementById(`ba-actual-used-${i}`).value = actualUsed.toFixed(2);
        document.getElementById(`ba-used-bags-excess-${i}`).value = usedBagsExcessLess.toFixed(2);
        document.getElementById(`ba-diff-${i}`).value = diff.toFixed(3);
        document.getElementById(`ba-diff-batch-${i}`).value = diffBatch.toFixed(3);
        document.getElementById(`ba-pct-excess-${i}`).value = issuance > 0 ? pctExcess.toFixed(2) + '%' : '#DIV/0!';
    };

    window.updateRecipesCalculation = () => {
        let sumChenab = 0;
        let sumDelta = 0;
        let sumWanda = 0;
        let sumBreeder = 0;

        const ingredientIssuance = {};
        DEFAULT_ITEMS.forEach(it => {
            ingredientIssuance[it.name] = 0;
        });

        document.querySelectorAll('.ba-recipe-input').forEach(input => {
            const group = input.getAttribute('data-group');
            const code = input.getAttribute('data-code');
            const val = parseFloat(input.value) || 0;

            if (val > 0) {
                if (group === 'chenab') sumChenab += val;
                else if (group === 'delta') sumDelta += val;
                else if (group === 'wanda') sumWanda += val;
                else if (group === 'breeder') sumBreeder += val;

                const recipe = RECIPES[code];
                if (recipe) {
                    for (let ing in recipe) {
                        if (ingredientIssuance[ing] !== undefined) {
                            ingredientIssuance[ing] += val * recipe[ing];
                        }
                    }
                }
            }
        });

        document.getElementById('ba-form-chenab').value = sumChenab;
        document.getElementById('ba-form-delta').value = sumDelta;
        document.getElementById('ba-form-wanda').value = sumWanda;
        document.getElementById('ba-form-breeder').value = sumBreeder;

        const totalBatches = sumChenab + sumDelta + sumWanda + sumBreeder;
        document.getElementById('ba-modal-total-batches').value = totalBatches;

        DEFAULT_ITEMS.forEach((it, i) => {
            const issuanceInput = document.getElementById(`ba-issuance-${i}`);
            if (issuanceInput) {
                issuanceInput.value = ingredientIssuance[it.name] > 0 ? ingredientIssuance[it.name].toFixed(2) : '';
            }
        });

        window.calcAllBaRows();
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
            <td style="font-weight:600;min-width:160px;text-align:left;position:sticky;left:0;background:#f8fafc;z-index:2;box-shadow:2px 0 5px -2px rgba(0,0,0,0.1);border-right:1px solid #cbd5e1;color:#0f172a;padding:0.3rem;">${item.name}</td>
            <td style="padding:0.2rem;"><input type="text" id="ba-config-${i}" value="${item.config || ''}" style="width:70px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="number" step="any" id="ba-stand-weight-${i}" value="${standWeight}" oninput="window.calcBaRow(${i})" style="width:70px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-size:0.75rem;"></td>
            <!-- Opening -->
            <td style="padding:0.2rem;"><input type="number" step="any" id="ba-open-loose-${i}" value="${item.openLoose || ''}" oninput="window.calcBaRow(${i})" style="width:85px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="number" step="any" id="ba-open-bags-${i}" value="${item.openBags || ''}" oninput="window.calcBaRow(${i})" style="width:75px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="number" step="any" id="ba-open-emptytub-${i}" value="${openEmptyTub}" oninput="window.calcBaRow(${i})" style="width:75px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-size:0.75rem;"></td>
            <!-- Received -->
            <td style="padding:0.2rem;"><input type="number" step="any" id="ba-received-${i}" value="${item.received || ''}" oninput="window.calcBaRow(${i})" style="width:85px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-size:0.75rem;"></td>
            <!-- Net Opening -->
            <td style="padding:0.2rem;"><input type="text" id="ba-net-opening-${i}" readonly style="width:90px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#e0f2fe;color:#1e3a8a;text-align:center;font-weight:700;font-size:0.75rem;"></td>
            <!-- Closing -->
            <td style="padding:0.2rem;"><input type="number" step="any" id="ba-close-loose-${i}" value="${item.closeLoose || ''}" oninput="window.calcBaRow(${i})" style="width:85px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="number" step="any" id="ba-close-bags-${i}" value="${item.closeBags || ''}" oninput="window.calcBaRow(${i})" style="width:75px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-size:0.75rem;"></td>
            <!-- Net Closing -->
            <td style="padding:0.2rem;"><input type="text" id="ba-net-closing-${i}" readonly style="width:90px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#fee2e2;color:#991b1b;text-align:center;font-weight:700;font-size:0.75rem;"></td>
            <!-- Stats -->
            <td style="padding:0.2rem;"><input type="number" step="any" id="ba-bags-used-${i}" value="${item.bagsUsed || ''}" oninput="window.calcBaRow(${i})" style="width:75px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="number" step="any" id="ba-avg-excess-${i}" value="${item.avgExcessLess || ''}" oninput="window.calcBaRow(${i})" style="width:75px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="text" id="ba-used-bags-excess-${i}" readonly style="width:80px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#f1f5f9;color:#475569;text-align:center;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="text" id="ba-actual-used-${i}" readonly style="width:90px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#f1f5f9;color:#0284c7;text-align:center;font-weight:700;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="number" step="any" id="ba-issuance-${i}" value="${item.issuance || ''}" oninput="window.calcBaRow(${i})" style="width:85px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#ffffff;color:#0f172a;text-align:center;font-weight:600;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="text" id="ba-diff-${i}" readonly style="width:85px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#f1f5f9;color:#475569;text-align:center;font-weight:600;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="text" id="ba-diff-batch-${i}" readonly style="width:85px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#f1f5f9;color:#475569;text-align:center;font-weight:600;font-size:0.75rem;"></td>
            <td style="padding:0.2rem;"><input type="text" id="ba-pct-excess-${i}" readonly style="width:85px;border:1px solid #cbd5e1;padding:0.15rem 0.25rem;border-radius:3px;background:#f1f5f9;color:#475569;text-align:center;font-weight:600;font-size:0.75rem;"></td>
        `;
        tbody.appendChild(tr);
        calculateRow(i);
    };

    const populateRecipeInputsUI = () => {
        const buildCol = (divId, groupKey) => {
            const container = document.getElementById(divId);
            if (!container) return;
            container.innerHTML = '';
            RECIPE_GROUPS[groupKey].forEach(code => {
                const cleanCode = code.replace('-delta', '').replace('-breeder', '');
                const row = document.createElement('div');
                row.style = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:0.15rem;';
                row.innerHTML = `
                    <span style="font-weight:600;font-size:0.72rem;color:#334155;white-space:nowrap;">${cleanCode}</span>
                    <input type="number" step="any" class="ba-recipe-input" data-group="${groupKey}" data-code="${code}" value="" style="width:50px;border:1px solid #cbd5e1;padding:0.05rem 0.15rem;border-radius:3px;font-size:0.72rem;text-align:center;height:18px;background:#ffffff;">
                `;
                container.appendChild(row);
            });
        };
        buildCol('ba-recipes-chenab', 'chenab');
        buildCol('ba-recipes-delta', 'delta');
        buildCol('ba-recipes-wanda', 'wanda');
        buildCol('ba-recipes-breeder', 'breeder');

        // Bind update handler to all inputs
        document.querySelectorAll('.ba-recipe-input').forEach(input => {
            input.addEventListener('input', () => {
                window.updateRecipesCalculation();
            });
        });
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

        // Load recipe values
        const savedRecipes = audit.recipes || {};
        document.querySelectorAll('.ba-recipe-input').forEach(input => {
            const code = input.getAttribute('data-code');
            input.value = savedRecipes[code] !== undefined ? savedRecipes[code] : '';
        });

        window.updateRecipesCalculation();

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
        const btnClear = document.getElementById('btn-clear-recipes');

        // Populate recipe entries UI
        populateRecipeInputsUI();

        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                activeBaId = null;
                const today = new Date();
                document.getElementById('ba-modal-date').value = today.getDate() + '-' + today.toLocaleString('default', { month: 'short' }) + '-' + today.getFullYear();
                document.getElementById('ba-modal-shift').value = 'ABC';
                document.getElementById('ba-modal-limit').value = '0.4';
                document.getElementById('ba-modal-total-batches').value = '0';

                // Clear recipe inputs
                document.querySelectorAll('.ba-recipe-input').forEach(input => {
                    input.value = '';
                });

                document.getElementById('ba-form-chenab').value = '0';
                document.getElementById('ba-form-delta').value = '0';
                document.getElementById('ba-form-wanda').value = '0';
                document.getElementById('ba-form-breeder').value = '0';

                const tbody = document.getElementById('ba-rows-tbody');
                tbody.innerHTML = '';
                DEFAULT_ITEMS.forEach((item, index) => addAuditRowUI(item, index));

                modal.classList.add('show');
            });
        }

        const closeModal = () => modal.classList.remove('show');
        if (btnClose) btnClose.addEventListener('click', closeModal);
        if (btnCancel) btnCancel.addEventListener('click', closeModal);

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                document.querySelectorAll('.ba-recipe-input').forEach(input => {
                    input.value = '';
                });
                window.updateRecipesCalculation();
            });
        }

        if (btnSave) {
            btnSave.addEventListener('click', async () => {
                const date = document.getElementById('ba-modal-date').value.trim();
                const shift = document.getElementById('ba-modal-shift').value.trim();
                const acceptableLimit = parseFloat(document.getElementById('ba-modal-limit').value) || 0.4;
                const totalBatches = parseFloat(document.getElementById('ba-modal-total-batches').value) || 0;
                
                const formChenab = parseFloat(document.getElementById('ba-form-chenab').value) || 0;
                const formDelta = parseFloat(document.getElementById('ba-form-delta').value) || 0;
                const formWanda = parseFloat(document.getElementById('ba-form-wanda').value) || 0;
                const formBreeder = parseFloat(document.getElementById('ba-form-breeder').value) || 0;

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

                // Gather recipe inputs values
                const recipes = {};
                document.querySelectorAll('.ba-recipe-input').forEach(input => {
                    const code = input.getAttribute('data-code');
                    const val = parseFloat(input.value) || 0;
                    if (val > 0) {
                        recipes[code] = val;
                    }
                });

                const report = {
                    id: activeBaId || Date.now(),
                    date,
                    shift,
                    acceptableLimit,
                    totalBatches,
                    formChenab,
                    formDelta,
                    formWanda,
                    formBreeder,
                    recipes,
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
                            form_chenab: report.formChenab,
                            form_delta: report.formDelta,
                            form_wanda: report.formWanda,
                            form_breeder: report.formBreeder,
                            recipes: report.recipes,
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
                            totalBatches: r.total_batches || 0,
                            acceptableLimit: r.acceptable_limit || 0.4,
                            formChenab: r.form_chenab || 0,
                            formDelta: r.form_delta || 0,
                            formWanda: r.form_wanda || 0,
                            formBreeder: r.form_breeder || 0,
                            recipes: r.recipes || {},
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
