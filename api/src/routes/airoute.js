const express = require('express');
const router = express.Router();
const { handleChatRequest, handleChatStream } = require('../controllers/chatcontroller');
const { handleImageRequest } = require('../controllers/imagecontroller');
const { handleFileExport, handleImageExport } = require('../controllers/filecontroller');
const { handleIntentDetection } = require('../controllers/intentcontroller');
const { getHistory } = require('../controllers/historycontroller');
const { register, login, getCurrentUser, forgotPassword, resetPasswordHandler } = require('../controllers/authcontroller');
const { requireAuth } = require('../middleware/authmiddleware');

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, getCurrentUser);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPasswordHandler);

router.get('/history', requireAuth, getHistory);
router.post('/detect-intent', requireAuth, handleIntentDetection);
router.post('/chat', requireAuth, handleChatRequest);
router.post('/chat/stream', requireAuth, handleChatStream);
router.post('/generate-image', requireAuth, handleImageRequest);
router.post('/export', requireAuth, handleFileExport);
router.post('/export-image', requireAuth, handleImageExport);

module.exports = router;
