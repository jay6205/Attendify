
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import './config/passport.js'; // Passport config

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(origin => origin.trim()) : [];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Route files (V2)
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import aiAttendanceRoutes from './routes/aiAttendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import marksRoutes from './routes/marksRoutes.js';

// Mount routers
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/admin', adminRoutes);
app.use('/api/v2/academic', academicRoutes);
app.use('/api/v2/attendance', attendanceRoutes);
app.use('/api/v2/attendance/ai', aiAttendanceRoutes); // New AI Attendance Route
app.use('/api/v2/leaves', leaveRoutes);
app.use('/api/v2/health', healthRoutes);
app.use('/api/v2/ai', aiRoutes);
app.use('/api/v2/marks', marksRoutes);


// Root
app.get('/', (req, res) => {
    res.send('Attendify API v2 is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
