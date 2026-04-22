import * as dotenv from 'dotenv';
import path from 'path';
import OpenFDAService from '../src/services/openfda.service';
import DeepSeekService from '../src/services/deepseek.service';

// Load .env from api directory
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSimplification() {
  const drugName = 'Aspirin';
  console.log(`\n=== Testing Simplification for: ${drugName} ===\n`);

  try {
    // 1. Fetch Raw FDA Data
    console.log('[Step 1] Fetching data from OpenFDA...');
    const rawData = await OpenFDAService.searchDrug(drugName);
    
    if (!rawData) {
      console.error('Drug not found in OpenFDA');
      return;
    }

    console.log('--- Raw FDA Data (Sample - Indications) ---');
    console.log(rawData.indications?.substring(0, 300) + '...');
    console.log('-------------------------------------------\n');

    // 2. Layer 1: Base Summary
    console.log('[Step 2] Generating Layer 1 Summary (DeepSeek)...');
    const layer1 = await DeepSeekService.generateSummary(rawData);
    
    console.log('--- Layer 1 (Simplified Medical) ---');
    console.log('WHAT IT DOES:', layer1.what_it_does);
    console.log('HOW TO TAKE:', layer1.how_to_take);
    console.log('WARNINGS:', layer1.warnings);
    console.log('SIDE EFFECTS:', layer1.side_effects);
    console.log('------------------------------------\n');

    // 3. Layer 2: ELI12 (Explain Like I\'m 12)
    console.log('[Step 3] Generating Layer 2 ELI12 (DeepSeek)...');
    const layer2 = await DeepSeekService.generateELI12(layer1);
    
    console.log('--- Layer 2 (ELI12 - Child-friendly) ---');
    console.log('WHAT IT DOES:', layer2.what_it_does);
    console.log('HOW TO TAKE:', layer2.how_to_take);
    console.log('WARNINGS:', layer2.warnings);
    console.log('SIDE EFFECTS:', layer2.side_effects);
    console.log('----------------------------------------\n');

    console.log('Simplification test COMPLETED.');
  } catch (error: any) {
    console.error('Simplification test FAILED:', error.message);
  }
}

testSimplification();
