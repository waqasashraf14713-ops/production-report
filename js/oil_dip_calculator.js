document.addEventListener('DOMContentLoaded', () => {
    const tankSelect = document.getElementById('calc-tank-select');
    const tempInput = document.getElementById('calc-temp');
    const dipInput = document.getElementById('calc-dip');
    const gateWeightInput = document.getElementById('calc-gate-weight');
    
    const resDensity = document.getElementById('calc-res-density');
    const resStock = document.getElementById('calc-res-stock');
    const resDiff = document.getElementById('calc-res-diff');
    const resDiffPct = document.getElementById('calc-res-diff-pct');

    function calculate() {
        if (!tempInput || !dipInput) return;
        
        let temp = parseFloat(tempInput.value) || 0;
        let dip = parseFloat(dipInput.value) || 0;
        let tankFactor = parseFloat(tankSelect.value) || 4.5517;
        let gateWeight = parseFloat(gateWeightInput.value);

        // Density Formula based on Soybean Oil chart: 
        // 0°C = 0.9315, drops linearly by approx 0.000628 per °C
        let density = 0.9315 - (temp * 0.000628);
        if (density < 0) density = 0;
        
        // Volume (Liters) = Dip (mm) * Tank Factor (Liters/mm)
        let volume = dip * tankFactor;
        
        // Oil Stock (Kg) = Volume (L) * Density (kg/L)
        let stock = volume * density;
        
        resDensity.innerText = density.toFixed(4);
        resStock.innerText = Math.round(stock).toLocaleString();

        // Calculate differences if Gate Scale Weight is provided
        if (!isNaN(gateWeight) && gateWeight > 0) {
            let diff = gateWeight - stock; // Vehicle Manual Weight - Vehicle Weight (By Dip)
            let diffPct = (diff / gateWeight) * 100;
            
            resDiff.innerText = Math.round(diff).toLocaleString();
            resDiff.style.color = diff < 0 ? '#ef4444' : '#10b981'; // Red if negative, Green if positive
            
            resDiffPct.innerText = diffPct.toFixed(2) + '%';
            resDiffPct.style.color = diff < 0 ? '#ef4444' : '#10b981';
        } else {
            resDiff.innerText = '-';
            resDiff.style.color = 'var(--text-primary)';
            resDiffPct.innerText = '-';
            resDiffPct.style.color = 'var(--text-primary)';
        }
    }

    // Attach event listeners for real-time calculation
    [tankSelect, tempInput, dipInput, gateWeightInput].forEach(el => {
        if(el) {
            el.addEventListener('input', calculate);
            el.addEventListener('change', calculate);
        }
    });

    // Run initial calculation
    calculate();
});
