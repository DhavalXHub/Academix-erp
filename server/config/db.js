const mongoose = require('mongoose');
mongoose.set('strictPopulate', false);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/academix');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[DB] Connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;

