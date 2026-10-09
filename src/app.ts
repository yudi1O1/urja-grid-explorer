import express from 'express';
import meterRoutes from './routes/meter.routes';
import transformerRoutes from './routes/transformer.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/meters', meterRoutes);
app.use('/api/transformers', transformerRoutes);

app.use(errorHandler);

export default app;
