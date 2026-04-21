import express from 'express';
const app = express();
const PORT = 3002;

app.get('/test', (req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running on port ${PORT}`);
});
