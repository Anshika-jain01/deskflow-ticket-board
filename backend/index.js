const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const ticketRoutes = require('./routes/tickets');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://deskflow-user:Anshika%40123@cluster0.fgi69er.mongodb.net/deskflow?appName=Cluster0';

let cachedDb = null;
const connectDB = async () => {
  if (cachedDb) return cachedDb;
  try {
    cachedDb = await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    return cachedDb;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
};

// Route middleware that ensures DB is connected
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes
app.use('/tickets', ticketRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'DeskFlow API is running' });
});

// Error handler
app.use(errorHandler);

// Start server locally if not in serverless environment
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
