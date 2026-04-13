import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchMedication, toggleELI12 } from './controllers/search.controller';
import { getAutocomplete } from './controllers/autocomplete.controller';
import { checkInteractions } from './controllers/interactions.controller';
import { saveCabinetItem, getCabinetItems, deleteCabinetItem } from './controllers/cabinet.controller';
import { authenticate } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authenticate);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'MedLens API',
    version: '1.0.0'
  });
});

// Autocomplete endpoint
app.get('/api/autocomplete', getAutocomplete);

// Medication search endpoint
app.post('/api/search', searchMedication);

// ELI12 toggle endpoint
app.post('/api/eli12', toggleELI12);

// Interaction checker endpoint
app.post('/api/interactions', checkInteractions);

// Cabinet endpoints
app.post('/api/cabinet/save', saveCabinetItem);
app.get('/api/cabinet/items', getCabinetItems);
app.delete('/api/cabinet/items/:drugKey', deleteCabinetItem);

// 404 handler
app.all('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later.'
  });
});

app.listen(PORT, () => {
  console.log(`MedLens API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});