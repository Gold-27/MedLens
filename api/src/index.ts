import dotenv from 'dotenv';
// Load environment variables immediately before other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import { searchMedication, generateELI12, autocomplete } from './controllers/search.controller';
import { getCabinetItems, saveCabinetItem, deleteCabinetItem } from './controllers/cabinet.controller';
import { requireAuth } from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: {
      openfda: !!process.env.OPENFDA_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      supabase: !!process.env.SUPABASE_URL && process.env.SUPABASE_URL.startsWith('http'),
    },
  });
});

// ── Search Routes ────────────────────────────────────────────────────────────
app.post('/api/search', searchMedication);
app.get('/api/autocomplete', autocomplete);
app.post('/api/eli12', generateELI12);

// ── Cabinet Routes (Auth Required) ───────────────────────────────────────────
app.get('/api/cabinet/items', requireAuth, getCabinetItems);
app.post('/api/cabinet/save', requireAuth, saveCabinetItem);
app.delete('/api/cabinet/items/:drugKey', requireAuth, deleteCabinetItem);

// ── Interaction Checker ──────────────────────────────────────────────────────
// PRD Rule: Never say "safe" — always advise professional consultation
app.post('/api/interactions', (req, res) => {
  const { drug_keys } = req.body;

  if (!drug_keys || !Array.isArray(drug_keys) || drug_keys.length < 2) {
    return res.status(400).json({ error: 'At least two drug keys are required' });
  }

  res.json({
    status: 'insufficient_data',
    message: 'We cannot confirm drug interactions from this data. Please consult a healthcare professional.',
    consult_professional: true,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MedLens API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
