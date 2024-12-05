const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user/UserController');
const { isAuthenticated } = require('../../controllers/user/LoginController');

router.put('/profile', isAuthenticated, userController.updateProfile);
router.get('/profile', isAuthenticated, userController.getProfile);

module.exports = router;