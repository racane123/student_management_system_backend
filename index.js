import express from 'express';
import studentRoutes from './src/modules/students/student.routes.js';
import cors from 'cors';
import authRoutes from './src/modules/auth/auth.routes.js';
import examRoutes from './src/modules/exams/exam.routes.js';
import enrollmentRoutes from './src/modules/enrollments/enrollment.routes.js';
import classRoutes from './src/modules/classes/class.routes.js';
import teacherRoutes from './src/modules/teachers/teacher.routes.js';

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 5000;

app.use(express.json());



const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teachers', teacherRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Global error handler (transaction/DB errors, etc.)
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});