import * as dotenv from 'dotenv';
import path from 'path';
import OpenFDAService from '../src/services/openfda.service';
import DeepSeekService from '../src/services/deepseek.service';

// Load .env from api directory
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testHeavyDrug() {
  const drugName = 'Metformin'; // Metformin usually has a long label
  console.log(`\n=== Testing Pipeline Hardening for: ${drugName} ===\n`);

  try {
    // 1. Fetch Raw FDA Data (now sanitized)
    console.log('[Step 1] Fetching sanitized data from OpenFDA...');
    const rawData = await OpenFDAService.searchDrug(drugName);
    
    if (!rawData) {
      console.error('Drug not found in OpenFDA');
      return;
    }

    console.log(`Raw Field Sizes (chars):`);
    console.log(`- Indications: ${rawData.indications?.length}`);
    console.log(`- Dosage: ${rawData.dosage?.length}`);
    console.log(`- Warnings: ${rawData.warnings?.length}`);
    console.log(`- Side Effects: ${rawData.side_effects?.length}`);
    console.log('-------------------------------------------\n');

    // 2. Layer 1: Base Summary (with truncation and timeout)
    console.log('[Step 2] Generating Layer 1 Summary (DeepSeek)...');
    const startTime = Date.now();
    const layer1 = await DeepSeekService.generateSummary(rawData);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`--- Layer 1 (Success in ${duration.toFixed(1)}s) ---`);
    console.log('WHAT IT DOES (Sample):', layer1.what_it_does.substring(0, 150) + '...');
    console.log('------------------------------------\n');

    console.log('Hardening test COMPLETED successfully.');
  } catch (error: any) {
    console.error('Hardening test FAILED:', error.message);
  }
}

testHeavyDrug();
