// --- DATA DEFINITIONS (from Python backend) ---

const OpioidType = {
    MORPHINE: "morphine",
    OXYCODONE: "oxycodone",
    HYDROCODONE: "hydrocodone",
    HYDROMORPHONE: "hydromorphone",
    FENTANYL: "fentanyl",
    METHADONE: "methadone",
    OXYMORPHONE: "oxymorphone",
    CODEINE: "codeine",
    TRAMADOL: "tramadol",
    TAPENTADOL: "tapentadol",
    BUPRENORPHINE: "buprenorphine"
};

const Route = {
    ORAL: "oral",
    IV: "iv",
    IM: "im",
    SUBLINGUAL: "sublingual",
    TRANSDERMAL: "transdermal",
    RECTAL: "rectal"
};

const PatientFactor = {
    NONE: "none",
    ELDERLY: "elderly",
    FRAIL: "frail"
};

const AVAILABLE_OPIOIDS = Object.values(OpioidType).map(o => ({ id: o, name: o.charAt(0).toUpperCase() + o.slice(1) }));
const AVAILABLE_ROUTES = Object.values(Route).map(r => ({ id: r, name: r.toUpperCase() }));
const AVAILABLE_PATIENT_FACTORS = Object.values(PatientFactor).map(f => ({ id: f, name: f.charAt(0).toUpperCase() + f.slice(1) }));
const COMMON_FREQUENCIES = ["q4h", "q6h", "q8h", "q12h", "q24h", "qd", "bid", "tid", "qid", "prn", "1/d", "2/d", "3/d", "4/d"];

const EQUIANALGESIC_FACTORS = {
    [OpioidType.MORPHINE]: { [Route.ORAL]: 1.0, [Route.IV]: 2.0, [Route.IM]: 2.0, [Route.SUBLINGUAL]: 1.0, [Route.RECTAL]: 1.0 },
    [OpioidType.OXYCODONE]: { [Route.ORAL]: 1.5, [Route.IV]: 3.0, [Route.RECTAL]: 1.5 },
    [OpioidType.HYDROCODONE]: { [Route.ORAL]: 1.0 },
    [OpioidType.HYDROMORPHONE]: { [Route.ORAL]: 4.0, [Route.IV]: 20.0, [Route.IM]: 20.0, [Route.RECTAL]: 4.0 },
    [OpioidType.OXYMORPHONE]: { [Route.ORAL]: 3.0, [Route.IV]: 10.0, [Route.IM]: 10.0, [Route.RECTAL]: 10.0 },
    [OpioidType.FENTANYL]: { [Route.TRANSDERMAL]: 2.4, [Route.IV]: 200.0, [Route.IM]: 200.0 },
    [OpioidType.METHADONE]: { [Route.ORAL]: 4.0, [Route.IV]: 12.0 },
    [OpioidType.CODEINE]: { [Route.ORAL]: 0.15, [Route.IM]: 0.15 },
    [OpioidType.TRAMADOL]: { [Route.ORAL]: 0.1 },
    [OpioidType.TAPENTADOL]: { [Route.ORAL]: 0.4 },
    [OpioidType.BUPRENORPHINE]: { [Route.SUBLINGUAL]: 75.0, [Route.TRANSDERMAL]: 100.0 }
};

const COMMON_DOSAGE_FORMS = {
    [OpioidType.MORPHINE]: [5, 10, 15, 20, 30, 40, 50, 60, 100],
    [OpioidType.OXYCODONE]: [5, 7.5, 10, 15, 20, 30, 40, 60, 80],
    [OpioidType.HYDROCODONE]: [2.5, 5, 7.5, 10],
    [OpioidType.HYDROMORPHONE]: [2, 4, 8, 12, 16, 32],
    [OpioidType.OXYMORPHONE]: [5, 10, 15, 30],
    [OpioidType.FENTANYL]: [12, 25, 50, 75, 100],
    [OpioidType.METHADONE]: [5, 10, 20, 40, 80, 120, 160],
    [OpioidType.CODEINE]: [15, 30, 60],
    [OpioidType.TRAMADOL]: [50, 100, 200, 300],
    [OpioidType.TAPENTADOL]: [50, 100, 150, 200, 250],
    [OpioidType.BUPRENORPHINE]: [2, 8, 16, 32]
};

// --- CONVERSION LOGIC (from conversion_service.py) ---

function getConversionFactor(opioid, route) {
    const factors = EQUIANALGESIC_FACTORS[opioid];
    if (!factors) throw new Error(`No conversion factors available for ${opioid}`);
    if (factors[route]) return factors[route];
    // Fallback to first available route if specific one isn't found
    const firstAvailableRoute = Object.keys(factors)[0];
    if (firstAvailableRoute) return factors[firstAvailableRoute];
    throw new Error(`No conversion factor available for ${opioid} via ${route}`);
}

function calculateDailyDose(dose, frequency) {
    const freqLower = frequency.toLowerCase();
    if (freqLower.includes('/')) {
        const [num] = freqLower.split('/');
        const multiplier = parseFloat(num);
        if (!isNaN(multiplier)) return dose * multiplier;
    }

    const freqMap = {
        'q4h': 6, 'q6h': 4, 'q8h': 3, 'q12h': 2, 'q24h': 1,
        'qd': 1, 'bid': 2, 'tid': 3, 'qid': 4
    };

    if (freqMap[freqLower]) return dose * freqMap[freqLower];
    if (freqLower === 'prn') return 0; // PRN doses are not included in TDD calculation
    
    const numericFreq = parseFloat(frequency);
    if (!isNaN(numericFreq)) return dose * numericFreq; // Assume it's times per day

    throw new Error(`Invalid frequency format: ${frequency}`);
}

function toOme(drug, dose, unit, route, frequency) {
    let steps = [];
    let currentDose = dose;

    if (unit.toLowerCase() === 'mcg') {
        currentDose /= 1000;
        steps.push({ description: `Convert dose from mcg to mg`, details: `${dose}mcg -> ${currentDose.toFixed(3)}mg`, value: currentDose });
    }

    const dailyDose = calculateDailyDose(currentDose, frequency);
    steps.push({ description: `Calculate Total Daily Dose (TDD)`, details: `${currentDose}mg at frequency '${frequency}' -> ${dailyDose.toFixed(1)}mg/day`, value: dailyDose });

    const factor = getConversionFactor(drug, route);
    const ome = dailyDose * factor;
    steps.push({ description: `Convert to Oral Morphine Equivalent (OME)`, details: `${dailyDose.toFixed(1)}mg/day * ${factor} (factor for ${drug} ${route}) -> ${ome.toFixed(1)}mg OME/day`, value: ome });

    return { ome, steps };
}

function applySwitchReduction(ome, isSwitching, patientFactor) {
    if (!isSwitching) {
        return { adjustedOme: ome, steps: [{ description: 'No reduction applied', details: 'Not switching opioids, so no dose reduction is needed.', value: ome }] };
    }

    let reductionPercent = 0.25; // Default 25% reduction
    let reason = "Standard 25% reduction for incomplete cross-tolerance.";

    if (patientFactor === PatientFactor.ELDERLY || patientFactor === PatientFactor.FRAIL) {
        reductionPercent = 0.50;
        reason = `Increased 50% reduction due to patient factor: ${patientFactor}.`;
    }

    const reductionAmount = ome * reductionPercent;
    const adjustedOme = ome - reductionAmount;
    const steps = [{ description: 'Apply dose reduction for switching', details: `Reducing by ${(reductionPercent * 100)}%. ${reason} ${ome.toFixed(1)}mg - ${reductionAmount.toFixed(1)}mg -> ${adjustedOme.toFixed(1)}mg OME/day`, value: adjustedOme }];
    
    return { adjustedOme, steps };
}

function fromOmeToTarget(ome, targetOpioid, targetRoute) {
    const factor = getConversionFactor(targetOpioid, targetRoute);
    if (factor === 0) throw new Error(`Target opioid ${targetOpioid} has a conversion factor of 0.`);
    const targetDose = ome / factor;
    const steps = [{ description: `Convert from OME to Target Opioid`, details: `${ome.toFixed(1)}mg OME/day / ${factor} (factor for ${targetOpioid} ${targetRoute}) -> ${targetDose.toFixed(2)}mg/day`, value: targetDose }];
    return { targetDose, steps };
}

function roundToForm(dose, drug) {
    const forms = COMMON_DOSAGE_FORMS[drug];
    if (!forms || forms.length === 0) return dose; // No specific forms, return as is

    // Find the closest dosage form
    return forms.reduce((prev, curr) => Math.abs(curr - dose) < Math.abs(prev - dose) ? curr : prev);
}

function convertOpioidDose(request) {
    let allSteps = [];
    let totalOme = 0;

    request.current_opioids.forEach((opioid, i) => {
        const { ome, steps } = toOme(opioid.drug, opioid.dose, opioid.unit, opioid.route, opioid.frequency);
        steps.forEach(step => step.description = `${i + 1}. ${step.description} (${opioid.drug})`);
        totalOme += ome;
        allSteps.push(...steps);
    });

    if (request.current_opioids.length > 1) {
        allSteps.push({ description: `${request.current_opioids.length + 1}. Calculate total OME`, details: `Sum of all conversions = ${totalOme.toFixed(1)}mg OME/day`, value: totalOme });
    }

    const { adjustedOme, steps: reductionSteps } = applySwitchReduction(totalOme, request.is_switching, request.patient_factor);
    reductionSteps.forEach(step => step.description = `${allSteps.length + 1}. ${step.description}`);
    allSteps.push(...reductionSteps);

    const { targetDose: unroundedDose, steps: targetSteps } = fromOmeToTarget(adjustedOme, request.target_opioid, request.target_route);
    targetSteps.forEach(step => step.description = `${allSteps.length + 1}. ${step.description}`);
    allSteps.push(...targetSteps);

    const roundedDose = roundToForm(unroundedDose, request.target_opioid);
    if (Math.abs(roundedDose - unroundedDose) > 0.01) {
        allSteps.push({ description: `${allSteps.length + 1}. Round to convenient dosage form`, details: `Rounded from ${unroundedDose.toFixed(2)}mg to ${roundedDose}mg`, value: roundedDose });
    }

    const notes = [
        "Always reassess pain control and adverse effects after conversion.",
        "Consider individual patient factors when prescribing (renal/hepatic function, comorbidities).",
        "Monitor for signs of withdrawal or overdose, especially when converting to methadone or fentanyl.",
        "Consider breakthrough pain medication at 10-20% of the total daily dose."
    ];
    if (request.target_opioid === OpioidType.METHADONE) notes.push("Note: Methadone has a long half-life and risk of accumulation.");
    if (request.target_opioid === OpioidType.FENTANYL && request.target_route === Route.TRANSDERMAL) notes.push("Note: Fentanyl patches are generally not recommended for opioid-naive patients.");

    return {
        total_ome: totalOme,
        adjusted_ome: adjustedOme,
        calculated_target_dose: unroundedDose,
        target_dose: roundedDose,
        steps: allSteps,
        notes: notes
    };
}

// --- DOM MANIPULATION & EVENT LISTENERS (Run after DOM is loaded) ---
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('conversionForm');
    if (!form) return;

    const addOpioidBtn = document.getElementById('addOpioidBtn');
    const opioidRowsContainer = document.getElementById('opioidRowsContainer');
    const opioidRowTemplate = document.getElementById('opioidRowTemplate');
    let rowIdCounter = 0;

    function populateSelect(selectElement, options, defaultSelection) {
        selectElement.innerHTML = '';
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.id;
            option.textContent = opt.name;
            if (opt.id === defaultSelection) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }

    function calculateRow(rowEl) {
        const resultEl = rowEl.querySelector('.result-text');
        try {
            const request = {
                current_opioids: [{
                    drug: rowEl.querySelector('.opioid-drug').value,
                    dose: parseFloat(rowEl.querySelector('.opioid-dose').value),
                    unit: rowEl.querySelector('.opioid-unit').value,
                    route: rowEl.querySelector('.opioid-route').value,
                    frequency: rowEl.querySelector('.opioid-frequency').value
                }],
                target_opioid: rowEl.querySelector('.target-opioid').value,
                target_route: rowEl.querySelector('.target-route').value,
                is_switching: false,
                patient_factor: PatientFactor.NONE
            };

            if (isNaN(request.current_opioids[0].dose) || request.current_opioids[0].dose <= 0) {
                resultEl.textContent = 'Enter valid dose';
                return;
            }

            const result = convertOpioidDose(request);
            resultEl.textContent = `Recommended: ${result.target_dose} mg/day (calc ${result.calculated_target_dose.toFixed(2)} mg)`;
        } catch (err) {
            resultEl.textContent = 'Error: ' + err.message;
        }
    }

    function addOpioidRow() {
        const frag = opioidRowTemplate.content.cloneNode(true);
        const rowEl = frag.querySelector('.opioid-row');

        rowIdCounter += 1;
        const collapse = rowEl.querySelector('.advanced-section');
        const toggle = rowEl.querySelector('.advanced-toggle');
        const collapseId = `adv${rowIdCounter}`;
        collapse.id = collapseId;
        toggle.setAttribute('data-bs-target', `#${collapseId}`);

        const drugSelect = rowEl.querySelector('.opioid-drug');
        const routeSelect = rowEl.querySelector('.opioid-route');
        const frequencyDatalist = rowEl.querySelector('datalist');
        const targetDrugSelect = rowEl.querySelector('.target-opioid');
        const targetRouteSelect = rowEl.querySelector('.target-route');

        populateSelect(drugSelect, AVAILABLE_OPIOIDS, OpioidType.MORPHINE);
        populateSelect(routeSelect, AVAILABLE_ROUTES, Route.ORAL);
        populateSelect(targetDrugSelect, AVAILABLE_OPIOIDS, OpioidType.MORPHINE);
        populateSelect(targetRouteSelect, AVAILABLE_ROUTES, Route.ORAL);
        frequencyDatalist.innerHTML = COMMON_FREQUENCIES.map(f => `<option value="${f}"></option>`).join('');

        rowEl.querySelector('.remove-opioid-btn').addEventListener('click', (e) => {
            e.target.closest('.opioid-row').remove();
        });

        rowEl.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', () => calculateRow(rowEl));
            el.addEventListener('change', () => calculateRow(rowEl));
        });

        opioidRowsContainer.appendChild(rowEl);
        calculateRow(rowEl);
    }

    form.addEventListener('reset', () => {
        opioidRowsContainer.innerHTML = '';
        addOpioidRow();
    });

    addOpioidBtn.addEventListener('click', addOpioidRow);

    addOpioidRow();
});
