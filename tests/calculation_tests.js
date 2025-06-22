const runCalculationTests = () => {
    const testResults = [];

    // Test Case 1: Simple conversion, no switch
    try {
        const request1 = {
            current_opioids: [{ drug: 'morphine', dose: 30, unit: 'mg', route: 'oral', frequency: 'q12h' }],
            target_opioid: 'oxycodone',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const result1 = convertOpioidDose(request1);
        const expectedDose1 = 40;
        testResults.push({ 
            name: 'Test 1: Simple Conversion (Morphine to Oxycodone, no switch)', 
            success: Math.abs(result1.target_dose - expectedDose1) < 0.1,
            details: `Expected: ${expectedDose1}, Got: ${result1.target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 1', success: false, details: e.message });
    }

    // Test Case 2: Conversion with switching and dose reduction
    try {
        const request2 = {
            current_opioids: [{ drug: 'hydromorphone', dose: 8, unit: 'mg', route: 'iv', frequency: 'q4h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result2 = convertOpioidDose(request2);
        const expectedDose2 = 720; // (8mg * 6) * 20 (factor) = 960 OME -> 960 * 0.75 = 720 adjusted OME -> 720mg morphine
        testResults.push({ 
            name: 'Test 2: IV Hydromorphone to Oral Morphine with 25% reduction',
            success: Math.abs(result2.calculated_target_dose - expectedDose2) < 1,
            details: `Expected: ${expectedDose2}, Got: ${result2.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 2', success: false, details: e.message });
    }

    // Test Case 3: Elderly patient with 50% reduction
    try {
        const request3 = {
            current_opioids: [{ drug: 'oxycodone', dose: 20, unit: 'mg', route: 'oral', frequency: 'q6h' }],
            target_opioid: 'fentanyl',
            target_route: 'transdermal',
            is_switching: true,
            patient_factor: 'elderly'
        };
        const result3 = convertOpioidDose(request3);
        const expectedDose3 = 25; // (20mg * 4) * 1.5 = 120 OME -> 120 * 0.5 = 60 adjusted OME -> 60 / 2.4 = 25mcg fentanyl
        testResults.push({ 
            name: 'Test 3: Oral Oxycodone to Fentanyl Patch (Elderly)',
            success: Math.abs(result3.target_dose - expectedDose3) < 1,
            details: `Expected: ${expectedDose3}, Got: ${result3.target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 3', success: false, details: e.message });
    }
    
    // Test Case 4: Multiple opioids to one
    try {
        const request4 = {
            current_opioids: [
                { drug: 'morphine', dose: 15, unit: 'mg', route: 'oral', frequency: 'q4h' },
                { drug: 'hydrocodone', dose: 10, unit: 'mg', route: 'oral', frequency: 'q6h' }
            ],
            target_opioid: 'hydromorphone',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result4 = convertOpioidDose(request4);
        // Morphine: 15*6*1=90 OME. Hydrocodone: 10*4*1=40 OME. Total=130 OME. 
        // 130 * 0.75 = 97.5 adjusted OME. 97.5 / 4 = 24.375mg. Rounded to 24 (or maybe needs better rounding logic for this case).
        // Let's check the rounded value. Common forms are [2, 4, 8, 12, 16, 32]. Closest is not obvious. Let's check calculated.
        const expectedDose4 = 24.38;
        testResults.push({ 
            name: 'Test 4: Multiple Opioids to Single Target',
            success: Math.abs(result4.calculated_target_dose - expectedDose4) < 0.1,
            details: `Expected: ${expectedDose4}, Got: ${result4.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 4', success: false, details: e.message });
    }

    return testResults;
};
