const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../controllers/user/LoginController');
const { uploadProfileImage } = require('../../middleware/user/UploadMiddleware');
const profileImageController = require('../../controllers/user/ProfileImageController');

router.post('/upload', isAuthenticated, uploadProfileImage, profileImageController.uploadProfileImage);
router.delete('/delete', isAuthenticated, profileImageController.deleteProfileImage);

module.exports = router;