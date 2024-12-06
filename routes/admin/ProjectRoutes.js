const express = require('express');
const router = express.Router();
const projectController = require('../../controllers/admin/projectController');
const { isAuthenticated } = require('../../controllers/admin/loginController');
const { upload, uploadFields } = require('../../middleware/admin/UploadMiddleware');

// Route to create a new project
// This route is protected and requires the user to be authenticated
// It also supports file uploads through the upload middleware
router.post('/', isAuthenticated, upload.fields(uploadFields), projectController.createProject);

// Route to retrieve all projects
// This route is also protected and requires user authentication
router.get('/', isAuthenticated, projectController.getAllProjects);

// Route to retrieve a specific project by its ID
// This route requires authentication to ensure that only logged-in users can access project details
router.get('/:id', isAuthenticated, projectController.getProjectById);

// Route to update an existing project by its ID
// This route is protected and requires user authentication
// It supports file uploads, allowing project-related files to be updated
router.put('/:id', isAuthenticated, upload.fields(uploadFields), projectController.updateProject);

// Route to delete a project by its ID
// This route requires authentication to prevent unauthorized deletions
// router.delete('/:id', isAuthenticated, projectController.deleteProject);

module.exports = router;


const { verifyUserForAdminRoutes } = require('../../shared/crossSiteAuth');
router.get('/public',verifyUserForAdminRoutes, projectController.getAllProjects);