require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");

// User Routes
const userLoginRoutes = require("./routes/user/LoginRoute");
const userRoutes = require("./routes/user/UserRoutes");
const userProfileImageRoutes = require("./routes/user/ProfileImageRoutes");
const userPropertyRoutes = require('./routes/user/PropertyRoutes');
const userDashboardRoutes = require("./routes/user/DashboardRoutes");
const userSearchRoutes = require('./routes/user/SearchRoutes');

// Admin Routes
const adminLoginRoutes = require("./routes/admin/LoginRoutes");
const adminDeveloperRoutes = require("./routes/admin/DeveloperRoutes");
const adminProjectRoutes = require("./routes/admin/ProjectRoutes");
const adminTowerRoutes = require("./routes/admin/TowerRoutes");
const adminSeriesRoutes = require("./routes/admin/SeriesRoutes");
const adminDashboardRoutes = require("./routes/admin/DashboardRoutes");
const adminAmenityRoutes = require('./routes/admin/AmenityRoutes');
const { handleUploadError } = require('./middleware/admin/UploadMiddleware');

const app = express();

// Global Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// User Routes
app.use("/api/user/auth", userLoginRoutes);
app.use("/api/user", userRoutes);
app.use("/api/user/profile-image", userProfileImageRoutes);
app.use('/api/user/properties', userPropertyRoutes);
app.use('/api/user/dashboard', userDashboardRoutes);
app.use('/api/user/search', userSearchRoutes);

// Admin Routes
app.use("/api/admin/auth", adminLoginRoutes);
app.use("/api/admin/developers", adminDeveloperRoutes);
app.use("/api/admin/projects", adminProjectRoutes);
app.use("/api/admin/towers", adminTowerRoutes);
app.use("/api/admin/series", adminSeriesRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/amenities', adminAmenityRoutes);

// Admin Error Handler
app.use(handleUploadError);

const PORT = process.env.PORT || 3000;

//Default route
app.get('/', (req, res) => {
    res.send('Acredge Backend');
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});