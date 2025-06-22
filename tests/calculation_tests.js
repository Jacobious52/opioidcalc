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

    // Test Case 5: 100mcg Fentanyl IV to Oral Morphine
    try {
        const req5 = {
            current_opioids: [{ drug: 'fentanyl', dose: 100, unit: 'mcg', route: 'iv', frequency: 'q24h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res5 = convertOpioidDose(req5);
        const expected5 = 20; // 100mcg IV fentanyl -> 20mg OME -> 20mg morphine
        testResults.push({
            name: 'Test 5: Fentanyl IV 100mcg to Oral Morphine',
            success: Math.abs(res5.calculated_target_dose - expected5) < 0.1,
            details: `Expected: ${expected5}, Got: ${res5.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 5', success: false, details: e.message });
    }

    // Test Case 6: Methadone Oral to Morphine
    try {
        const req6 = {
            current_opioids: [{ drug: 'methadone', dose: 10, unit: 'mg', route: 'oral', frequency: 'q12h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res6 = convertOpioidDose(req6);
        const expected6 = 80; // 10mg bid *4 factor
        testResults.push({
            name: 'Test 6: Methadone Oral to Morphine',
            success: Math.abs(res6.calculated_target_dose - expected6) < 0.1,
            details: `Expected: ${expected6}, Got: ${res6.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 6', success: false, details: e.message });
    }

    // Test Case 7: Codeine Oral to Morphine
    try {
        const req7 = {
            current_opioids: [{ drug: 'codeine', dose: 30, unit: 'mg', route: 'oral', frequency: 'q4h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res7 = convertOpioidDose(req7);
        const expected7 = 27; // 30mg q4h *0.15
        testResults.push({
            name: 'Test 7: Codeine Oral to Morphine',
            success: Math.abs(res7.calculated_target_dose - expected7) < 0.1,
            details: `Expected: ${expected7}, Got: ${res7.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 7', success: false, details: e.message });
    }

    // Test Case 8: Tapentadol Oral to Morphine
    try {
        const req8 = {
            current_opioids: [{ drug: 'tapentadol', dose: 100, unit: 'mg', route: 'oral', frequency: 'q12h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res8 = convertOpioidDose(req8);
        const expected8 = 80;
        testResults.push({
            name: 'Test 8: Tapentadol Oral to Morphine',
            success: Math.abs(res8.calculated_target_dose - expected8) < 0.1,
            details: `Expected: ${expected8}, Got: ${res8.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 8', success: false, details: e.message });
    }

    // Test Case 9: Oxycodone IV to Morphine
    try {
        const req9 = {
            current_opioids: [{ drug: 'oxycodone', dose: 5, unit: 'mg', route: 'iv', frequency: 'q6h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res9 = convertOpioidDose(req9);
        const expected9 = 60;
        testResults.push({
            name: 'Test 9: Oxycodone IV to Morphine',
            success: Math.abs(res9.calculated_target_dose - expected9) < 0.1,
            details: `Expected: ${expected9}, Got: ${res9.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 9', success: false, details: e.message });
    }

    // Test Case 10: Oxycodone Rectal to Morphine
    try {
        const req10 = {
            current_opioids: [{ drug: 'oxycodone', dose: 10, unit: 'mg', route: 'rectal', frequency: 'q8h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res10 = convertOpioidDose(req10);
        const expected10 = 45;
        testResults.push({
            name: 'Test 10: Oxycodone Rectal to Morphine',
            success: Math.abs(res10.calculated_target_dose - expected10) < 0.1,
            details: `Expected: ${expected10}, Got: ${res10.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 10', success: false, details: e.message });
    }

    // Test Case 11: Hydromorphone Oral to Oxycodone
    try {
        const req11 = {
            current_opioids: [{ drug: 'hydromorphone', dose: 4, unit: 'mg', route: 'oral', frequency: 'q6h' }],
            target_opioid: 'oxycodone',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res11 = convertOpioidDose(req11);
        const expected11 = 42.67;
        testResults.push({
            name: 'Test 11: Hydromorphone Oral to Oxycodone',
            success: Math.abs(res11.calculated_target_dose - expected11) < 0.1,
            details: `Expected: ${expected11}, Got: ${res11.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 11', success: false, details: e.message });
    }

    // Test Case 12: Hydromorphone IM to Morphine
    try {
        const req12 = {
            current_opioids: [{ drug: 'hydromorphone', dose: 2, unit: 'mg', route: 'im', frequency: 'q4h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res12 = convertOpioidDose(req12);
        const expected12 = 240;
        testResults.push({
            name: 'Test 12: Hydromorphone IM to Morphine',
            success: Math.abs(res12.calculated_target_dose - expected12) < 0.1,
            details: `Expected: ${expected12}, Got: ${res12.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 12', success: false, details: e.message });
    }

    // Test Case 13: Oxymorphone Oral to Morphine
    try {
        const req13 = {
            current_opioids: [{ drug: 'oxymorphone', dose: 10, unit: 'mg', route: 'oral', frequency: 'q12h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res13 = convertOpioidDose(req13);
        const expected13 = 60;
        testResults.push({
            name: 'Test 13: Oxymorphone Oral to Morphine',
            success: Math.abs(res13.calculated_target_dose - expected13) < 0.1,
            details: `Expected: ${expected13}, Got: ${res13.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 13', success: false, details: e.message });
    }

    // Test Case 14: Oxymorphone IV to Morphine
    try {
        const req14 = {
            current_opioids: [{ drug: 'oxymorphone', dose: 5, unit: 'mg', route: 'iv', frequency: 'q6h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res14 = convertOpioidDose(req14);
        const expected14 = 200;
        testResults.push({
            name: 'Test 14: Oxymorphone IV to Morphine',
            success: Math.abs(res14.calculated_target_dose - expected14) < 0.1,
            details: `Expected: ${expected14}, Got: ${res14.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 14', success: false, details: e.message });
    }

    // Test Case 15: Hydrocodone Oral to Morphine
    try {
        const req15 = {
            current_opioids: [{ drug: 'hydrocodone', dose: 10, unit: 'mg', route: 'oral', frequency: 'q6h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res15 = convertOpioidDose(req15);
        const expected15 = 40;
        testResults.push({
            name: 'Test 15: Hydrocodone Oral to Morphine',
            success: Math.abs(res15.calculated_target_dose - expected15) < 0.1,
            details: `Expected: ${expected15}, Got: ${res15.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 15', success: false, details: e.message });
    }

    // Test Case 16: Fentanyl IM to Morphine
    try {
        const req16 = {
            current_opioids: [{ drug: 'fentanyl', dose: 100, unit: 'mcg', route: 'im', frequency: 'q24h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res16 = convertOpioidDose(req16);
        const expected16 = 20;
        testResults.push({
            name: 'Test 16: Fentanyl IM to Morphine',
            success: Math.abs(res16.calculated_target_dose - expected16) < 0.1,
            details: `Expected: ${expected16}, Got: ${res16.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 16', success: false, details: e.message });
    }

    // Test Case 17: Codeine IM to Morphine
    try {
        const req17 = {
            current_opioids: [{ drug: 'codeine', dose: 60, unit: 'mg', route: 'im', frequency: 'q6h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res17 = convertOpioidDose(req17);
        const expected17 = 36;
        testResults.push({
            name: 'Test 17: Codeine IM to Morphine',
            success: Math.abs(res17.calculated_target_dose - expected17) < 0.1,
            details: `Expected: ${expected17}, Got: ${res17.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 17', success: false, details: e.message });
    }

    // Test Case 18: Tramadol Oral to Morphine
    try {
        const req18 = {
            current_opioids: [{ drug: 'tramadol', dose: 50, unit: 'mg', route: 'oral', frequency: 'q6h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res18 = convertOpioidDose(req18);
        const expected18 = 20;
        testResults.push({
            name: 'Test 18: Tramadol Oral to Morphine',
            success: Math.abs(res18.calculated_target_dose - expected18) < 0.1,
            details: `Expected: ${expected18}, Got: ${res18.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 18', success: false, details: e.message });
    }

    // Test Case 19: Tapentadol Oral (200mg) to Morphine
    try {
        const req19 = {
            current_opioids: [{ drug: 'tapentadol', dose: 200, unit: 'mg', route: 'oral', frequency: 'q24h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res19 = convertOpioidDose(req19);
        const expected19 = 80;
        testResults.push({
            name: 'Test 19: Tapentadol Oral 200mg to Morphine',
            success: Math.abs(res19.calculated_target_dose - expected19) < 0.1,
            details: `Expected: ${expected19}, Got: ${res19.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 19', success: false, details: e.message });
    }

    // Test Case 20: Buprenorphine Sublingual to Morphine
    try {
        const req20 = {
            current_opioids: [{ drug: 'buprenorphine', dose: 8, unit: 'mg', route: 'sublingual', frequency: 'q12h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res20 = convertOpioidDose(req20);
        const expected20 = 1200;
        testResults.push({
            name: 'Test 20: Buprenorphine Sublingual to Morphine',
            success: Math.abs(res20.calculated_target_dose - expected20) < 0.1,
            details: `Expected: ${expected20}, Got: ${res20.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 20', success: false, details: e.message });
    }

    // Test Case 21: Buprenorphine Transdermal to Morphine
    try {
        const req21 = {
            current_opioids: [{ drug: 'buprenorphine', dose: 10, unit: 'mg', route: 'transdermal', frequency: 'q24h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res21 = convertOpioidDose(req21);
        const expected21 = 1000;
        testResults.push({
            name: 'Test 21: Buprenorphine Transdermal to Morphine',
            success: Math.abs(res21.calculated_target_dose - expected21) < 0.1,
            details: `Expected: ${expected21}, Got: ${res21.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 21', success: false, details: e.message });
    }

    // Test Case 22: Methadone IV to Morphine
    try {
        const req22 = {
            current_opioids: [{ drug: 'methadone', dose: 10, unit: 'mg', route: 'iv', frequency: 'q12h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const res22 = convertOpioidDose(req22);
        const expected22 = 240;
        testResults.push({
            name: 'Test 22: Methadone IV to Morphine',
            success: Math.abs(res22.calculated_target_dose - expected22) < 0.1,
            details: `Expected: ${expected22}, Got: ${res22.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 22', success: false, details: e.message });
    }

    return testResults;
};
