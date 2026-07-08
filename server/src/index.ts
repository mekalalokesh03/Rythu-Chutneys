import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import deliveryRoutes from './routes/delivery';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for testing/development. Can narrow in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);

// Serve frontend static files
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Rythu Chutneys API is running smoothly.' });
});

// Fallback to React Router index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.send(`
        <html>
          <head>
            <title>Rythu Chutneys API</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #FAF7F0; color: #2B2621; }
              h1 { color: #8B0000; }
              p { color: #6E655C; }
            </style>
          </head>
          <body>
            <h1>🌾 Rythu Chutneys API Server</h1>
            <p>API is running smoothly. Access the client at http://localhost:5173 in development.</p>
          </body>
        </html>
      `);
    }
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

