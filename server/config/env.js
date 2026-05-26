const requiredInProduction = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_ORIGIN'];

const validateEnv = () => {
    const missing = requiredInProduction.filter((key) => !process.env[key]);

    if (process.env.NODE_ENV === 'production' && missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
        console.warn('[CONFIG] JWT_SECRET is missing or too short. Use a long random value before deployment.');
    }
};

const getAllowedOrigins = () => {
    const raw = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const origins = raw.split(',').map((origin) => origin.trim()).filter(Boolean);
    if (process.env.NODE_ENV !== 'production' && origins.includes('http://localhost:5173') && !origins.includes('http://127.0.0.1:5173')) {
        origins.push('http://127.0.0.1:5173');
    }
    return origins;
};

module.exports = { validateEnv, getAllowedOrigins };
