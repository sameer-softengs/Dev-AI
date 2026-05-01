const { verifyToken } = require('../services/authservice');
const { findUserById, sanitizeUser } = require('../services/userservice');

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    try {
        const payload = verifyToken(token);
        const user = findUserById(payload.userId);

        if (!user) {
            return res.status(401).json({ success: false, error: 'Account not found.' });
        }

        req.user = sanitizeUser(user);
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }
};

module.exports = { requireAuth };
