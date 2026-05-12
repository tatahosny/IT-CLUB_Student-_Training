const express = require('express');
const router = express.Router();
const { login, refreshToken, changePassword, getProfile, logout, updateProfile } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authMiddleware, logout);
router.post('/change-password', authMiddleware, changePassword);
router.get('/profile', authMiddleware, getProfile);
router.put('/update-profile', authMiddleware, updateProfile);

module.exports = router;
