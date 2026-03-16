const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/academix', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        require('fs').writeFileSync(__dirname + '/../db_error.log', `Error: ${error.message}\nStack: ${error.stack}`);
        console.error(`Error: ${error.message}`);
        // process.exit(1);
    }
};

module.exports = connectDB;
