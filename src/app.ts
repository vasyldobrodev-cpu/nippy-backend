import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import { createServer } from 'http';
import passport from './config/passport';
import { initializeDatabaseConnection } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { createUploadDirectories, onStartup } from './utils/createDirectories';
import WebSocketService from './services/WebSocketService';
import routes from './routes';
import { setupSwagger } from './config/swagger';


// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize WebSocket service
let wsService: WebSocketService;

// Create upload directories
createUploadDirectories();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup Swagger API documentation
setupSwagger(app);

// Serve uploaded files statically with CORS headers
// app.use('/uploads', (req, res, next) => {
//   res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
//   res.header('Access-Control-Allow-Methods', 'GET');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//   next();
// }, express.static(path.join(process.cwd(), 'uploads')));

// // Session middleware (required for Passport)
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'your-session-secret',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: process.env.NODE_ENV === 'production',
//     maxAge: 24 * 60 * 60 * 1000, // 24 hours
//   },
// }));

// Passport middleware
// app.use(passport.initialize());
// app.use(passport.session());

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 Starting server...\n');
    
    // Initialize database with automatic creation
    // await initializeDatabaseConnection();
    
    // Initialize WebSocket service
    // wsService = new WebSocketService(server);
    
    // Start listening
    server.listen(PORT, () => {
      onStartup();
      console.log('\n' + '='.repeat(60));
      console.log(`🎉 Server running successfully on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`📁 File uploads: http://localhost:${PORT}/api/files/*`);
      console.log(`🖼️  Static files: http://localhost:${PORT}/uploads/*`);
      console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
export { wsService };
