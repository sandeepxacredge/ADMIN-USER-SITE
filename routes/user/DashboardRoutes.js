const express = require('express');
const router = express.Router();
const DashboardController = require('../../controllers/user/DashboardController');
const { isAuthenticated } = require('../../controllers/user/LoginController');

// User stats route
router.get('/user/stats', isAuthenticated, DashboardController.getUserStats);

// Property stats route
router.get('/properties/stats', isAuthenticated, DashboardController.getPropertyStats);

module.exports = router;