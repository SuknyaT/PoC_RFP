import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import rfpRoutes from './routes/rfp.routes.js';
import proposalRoutes from './routes/proposal.routes.js';
import competitorRoutes from './routes/competitor.routes.js';
import historicalRoutes from './routes/historical.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { competitorRfpRoutes } from './routes/competitorRfp.routes.js';
import companyProfileRoutes from './routes/companyProfile.routes.js';
import requirementRoutes from './routes/requirement.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rfps', rfpRoutes);
app.use('/api/rfps', proposalRoutes);
app.use('/api/rfps', competitorRfpRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/historical-bids', historicalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/company-profile', companyProfileRoutes);
app.use('/api/rfps', requirementRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export default app;
