require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


// Import routes
const teachersRoutes = require('./routes/teachers.routes');
const degreeRoutes = require('./routes/degree.routes');
const juniorRoutes = require('./routes/junior.routes');
const juniorGatepassRoutes = require("./routes/JuniorGatepass.routes");
const degreeGatepassRoutes = require("./routes/DegreeGatepass.routes");
const securityRoutes = require("./routes/security.routes");
const juniorExitRoutes = require("./routes/juniorExit.routes");
const degreeExitRoutes = require("./routes/degreeExit.routes");
const adminRoutes = require("./routes/admin.routes");


// Middleware
app.use(cors());
app.use(express.json());


// Basic route
app.get('/', (req, res) => {
    res.send('Hi from College Exit System Backend!');
});

// API routes
app.use('/api/teachers', teachersRoutes);
app.use('/api/degree', degreeRoutes);
app.use('/api/junior', juniorRoutes);
app.use('/api/degree/gatepasses', degreeGatepassRoutes);
app.use('/api/junior/gatepasses', juniorGatepassRoutes);
app.use('/api/junior-gatepasses', juniorGatepassRoutes);
app.use("/api/degree-gatepasses", degreeGatepassRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/junior/exit", juniorExitRoutes);
app.use("/api/junior-exit", juniorExitRoutes);
app.use("/api/degree/exit", degreeExitRoutes);
app.use("/api/admin", adminRoutes);


const expireGatepasses = require('./jobs/expireGatepass');

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    // Run initial expiration check and start periodic background check
    expireGatepasses();
    setInterval(expireGatepasses, 60 * 1000);
});