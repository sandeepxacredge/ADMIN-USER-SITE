const express = require('express');
const router = express.Router();
const SearchController = require('../../controllers/user/SearchController');

router.post('/', SearchController.search);
router.post('/sync', SearchController.syncPropertiesToSearch);

module.exports = router;