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

    // Test Case 5: 100mcg IV Fentanyl to Oral Morphine
    try {
        const request5 = {
            current_opioids: [{ drug: 'fentanyl', dose: 100, unit: 'mcg', route: 'iv', frequency: 'q24h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const result5 = convertOpioidDose(request5);
        const expectedDose5 = 20;
        testResults.push({
            name: 'Test 5: IV Fentanyl (100mcg) to Oral Morphine',
            success: Math.abs(result5.target_dose - expectedDose5) < 0.1,
            details: `Expected: ${expectedDose5}, Got: ${result5.target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 5', success: false, details: e.message });
    }

    // Test Case 6: Oral Hydromorphone to Morphine with switching
    try {
        const request6 = {
            current_opioids: [{ drug: 'hydromorphone', dose: 2, unit: 'mg', route: 'oral', frequency: 'q4h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result6 = convertOpioidDose(request6);
        const expectedDose6 = 36; // calculated_target_dose before rounding
        testResults.push({
            name: 'Test 6: Oral Hydromorphone to Morphine (with reduction)',
            success: Math.abs(result6.calculated_target_dose - expectedDose6) < 0.1,
            details: `Expected: ${expectedDose6}, Got: ${result6.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 6', success: false, details: e.message });
    }

    // Test Case 7: Oral Morphine to IV Morphine
    try {
        const request7 = {
            current_opioids: [{ drug: 'morphine', dose: 30, unit: 'mg', route: 'oral', frequency: 'q4h' }],
            target_opioid: 'morphine',
            target_route: 'iv',
            is_switching: true,
            patient_factor: 'none'
        };
        const result7 = convertOpioidDose(request7);
        const expectedDose7 = 67.5;
        testResults.push({
            name: 'Test 7: Oral Morphine to IV Morphine',
            success: Math.abs(result7.calculated_target_dose - expectedDose7) < 0.1,
            details: `Expected: ${expectedDose7}, Got: ${result7.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 7', success: false, details: e.message });
    }

    // Test Case 8: Oxycodone Oral to Hydrocodone Oral
    try {
        const request8 = {
            current_opioids: [{ drug: 'oxycodone', dose: 10, unit: 'mg', route: 'oral', frequency: 'q8h' }],
            target_opioid: 'hydrocodone',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result8 = convertOpioidDose(request8);
        const expectedDose8 = 33.75;
        testResults.push({
            name: 'Test 8: Oxycodone to Hydrocodone',
            success: Math.abs(result8.calculated_target_dose - expectedDose8) < 0.1,
            details: `Expected: ${expectedDose8}, Got: ${result8.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 8', success: false, details: e.message });
    }

    // Test Case 9: Hydrocodone to Oxycodone
    try {
        const request9 = {
            current_opioids: [{ drug: 'hydrocodone', dose: 25, unit: 'mg', route: 'oral', frequency: 'q6h' }],
            target_opioid: 'oxycodone',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result9 = convertOpioidDose(request9);
        const expectedDose9 = 50;
        testResults.push({
            name: 'Test 9: Hydrocodone to Oxycodone',
            success: Math.abs(result9.calculated_target_dose - expectedDose9) < 0.1,
            details: `Expected: ${expectedDose9}, Got: ${result9.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 9', success: false, details: e.message });
    }

    // Test Case 10: IV Oxymorphone to Oral Morphine
    try {
        const request10 = {
            current_opioids: [{ drug: 'oxymorphone', dose: 5, unit: 'mg', route: 'iv', frequency: 'q4h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result10 = convertOpioidDose(request10);
        const expectedDose10 = 225;
        testResults.push({
            name: 'Test 10: IV Oxymorphone to Oral Morphine',
            success: Math.abs(result10.calculated_target_dose - expectedDose10) < 0.1,
            details: `Expected: ${expectedDose10}, Got: ${result10.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 10', success: false, details: e.message });
    }

    // Test Case 11: Oral Oxymorphone to Oral Hydromorphone
    try {
        const request11 = {
            current_opioids: [{ drug: 'oxymorphone', dose: 7.5, unit: 'mg', route: 'oral', frequency: 'q8h' }],
            target_opioid: 'hydromorphone',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result11 = convertOpioidDose(request11);
        const expectedDose11 = 12.66;
        testResults.push({
            name: 'Test 11: Oxymorphone to Hydromorphone',
            success: Math.abs(result11.calculated_target_dose - expectedDose11) < 0.1,
            details: `Expected: ${expectedDose11}, Got: ${result11.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 11', success: false, details: e.message });
    }

    // Test Case 12: Codeine to Morphine (no switch)
    try {
        const request12 = {
            current_opioids: [{ drug: 'codeine', dose: 60, unit: 'mg', route: 'oral', frequency: 'q6h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const result12 = convertOpioidDose(request12);
        const expectedDose12 = 36;
        testResults.push({
            name: 'Test 12: Codeine to Morphine',
            success: Math.abs(result12.calculated_target_dose - expectedDose12) < 0.1,
            details: `Expected: ${expectedDose12}, Got: ${result12.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 12', success: false, details: e.message });
    }

    // Test Case 13: Methadone to Buprenorphine
    try {
        const request13 = {
            current_opioids: [{ drug: 'methadone', dose: 10, unit: 'mg', route: 'oral', frequency: 'qd' }],
            target_opioid: 'buprenorphine',
            target_route: 'sublingual',
            is_switching: true,
            patient_factor: 'none'
        };
        const result13 = convertOpioidDose(request13);
        const expectedDose13 = 0.4;
        testResults.push({
            name: 'Test 13: Methadone to Buprenorphine',
            success: Math.abs(result13.calculated_target_dose - expectedDose13) < 0.1,
            details: `Expected: ${expectedDose13}, Got: ${result13.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 13', success: false, details: e.message });
    }

    // Test Case 14: Hydromorphone to Oxycodone
    try {
        const request14 = {
            current_opioids: [{ drug: 'hydromorphone', dose: 4, unit: 'mg', route: 'oral', frequency: 'q6h' }],
            target_opioid: 'oxycodone',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result14 = convertOpioidDose(request14);
        const expectedDose14 = 32;
        testResults.push({
            name: 'Test 14: Hydromorphone to Oxycodone',
            success: Math.abs(result14.calculated_target_dose - expectedDose14) < 0.1,
            details: `Expected: ${expectedDose14}, Got: ${result14.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 14', success: false, details: e.message });
    }

    // Test Case 15: Tramadol to Morphine
    try {
        const request15 = {
            current_opioids: [{ drug: 'tramadol', dose: 100, unit: 'mg', route: 'oral', frequency: 'q6h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: false,
            patient_factor: 'none'
        };
        const result15 = convertOpioidDose(request15);
        const expectedDose15 = 40;
        testResults.push({
            name: 'Test 15: Tramadol to Morphine',
            success: Math.abs(result15.target_dose - expectedDose15) < 0.1,
            details: `Expected: ${expectedDose15}, Got: ${result15.target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 15', success: false, details: e.message });
    }

    // Test Case 16: Tapentadol to Oxycodone
    try {
        const request16 = {
            current_opioids: [{ drug: 'tapentadol', dose: 50, unit: 'mg', route: 'oral', frequency: 'q8h' }],
            target_opioid: 'oxycodone',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result16 = convertOpioidDose(request16);
        const expectedDose16 = 30;
        testResults.push({
            name: 'Test 16: Tapentadol to Oxycodone',
            success: Math.abs(result16.target_dose - expectedDose16) < 0.1,
            details: `Expected: ${expectedDose16}, Got: ${result16.target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 16', success: false, details: e.message });
    }

    // Test Case 17: Oxycodone IV to Methadone Oral
    try {
        const request17 = {
            current_opioids: [{ drug: 'oxycodone', dose: 20, unit: 'mg', route: 'iv', frequency: 'q4h' }],
            target_opioid: 'methadone',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result17 = convertOpioidDose(request17);
        const expectedDose17 = 67.5;
        testResults.push({
            name: 'Test 17: Oxycodone IV to Methadone',
            success: Math.abs(result17.calculated_target_dose - expectedDose17) < 0.1,
            details: `Expected: ${expectedDose17}, Got: ${result17.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 17', success: false, details: e.message });
    }

    // Test Case 18: Morphine Oral to Fentanyl IV
    try {
        const request18 = {
            current_opioids: [{ drug: 'morphine', dose: 30, unit: 'mg', route: 'oral', frequency: 'q8h' }],
            target_opioid: 'fentanyl',
            target_route: 'iv',
            is_switching: true,
            patient_factor: 'none'
        };
        const result18 = convertOpioidDose(request18);
        const expectedDose18 = 0.34;
        testResults.push({
            name: 'Test 18: Morphine to Fentanyl IV',
            success: Math.abs(result18.calculated_target_dose - expectedDose18) < 0.01,
            details: `Expected: ${expectedDose18}, Got: ${result18.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 18', success: false, details: e.message });
    }

    // Test Case 19: Hydromorphone IV to Codeine Oral
    try {
        const request19 = {
            current_opioids: [{ drug: 'hydromorphone', dose: 5, unit: 'mg', route: 'iv', frequency: 'q6h' }],
            target_opioid: 'codeine',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result19 = convertOpioidDose(request19);
        const expectedDose19 = 2000;
        testResults.push({
            name: 'Test 19: Hydromorphone IV to Codeine',
            success: Math.abs(result19.calculated_target_dose - expectedDose19) < 1,
            details: `Expected: ${expectedDose19}, Got: ${result19.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 19', success: false, details: e.message });
    }

    // Test Case 20: Oxycodone to Morphine
    try {
        const request20 = {
            current_opioids: [{ drug: 'oxycodone', dose: 15, unit: 'mg', route: 'oral', frequency: 'q6h' }],
            target_opioid: 'morphine',
            target_route: 'oral',
            is_switching: true,
            patient_factor: 'none'
        };
        const result20 = convertOpioidDose(request20);
        const expectedDose20 = 67.5;
        testResults.push({
            name: 'Test 20: Oxycodone to Morphine',
            success: Math.abs(result20.calculated_target_dose - expectedDose20) < 0.1,
            details: `Expected: ${expectedDose20}, Got: ${result20.calculated_target_dose.toFixed(2)}`
        });
    } catch (e) {
        testResults.push({ name: 'Test 20', success: false, details: e.message });
    }

    return testResults;
};
