const { signToken } = require('../services/authservice');
const { createUser, authenticateUser } = require('../services/userservice');

const validateAuthPayload = ({ name, email, password }, requireName = false) => {
    if (requireName && String(name || '').trim().length < 2) {
        return 'Name must be at least 2 characters.';
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return 'A valid email is required.';
    }

    if (String(password || '').length < 8) {
        return 'Password must be at least 8 characters.';
    }

    return null;
};

const register = (req, res) => {
    const { name, email, password } = req.body;
    const validationError = validateAuthPayload({ name, email, password }, true);

    if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
    }

    try {
        const user = createUser({ name, email, password });
        const token = signToken({ userId: user.id, email: user.email });
        return res.status(201).json({ success: true, user, token });
    } catch (error) {
        return res.status(409).json({ success: false, error: error.message });
    }
};

const login = (req, res) => {
    const { email, password } = req.body;
    const validationError = validateAuthPayload({ email, password });

    if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
    }

    try {
        const user = authenticateUser({ email, password });
        const token = signToken({ userId: user.id, email: user.email });
        return res.status(200).json({ success: true, user, token });
    } catch (error) {
        return res.status(401).json({ success: false, error: error.message });
    }
};

const getCurrentUser = (req, res) => {
    res.status(200).json({ success: true, user: req.user });
};

module.exports = {
    register,
    login,
    getCurrentUser
};
