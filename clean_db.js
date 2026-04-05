const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./server/models/Course');
const Enrollment = require('./server/models/Enrollment');
const Invoice = require('./server/models/Invoice');
const Assignment = require('./server/models/Assignment');
const Quiz = require('./server/models/Quiz');
const Submission = require('./server/models/Submission');

dotenv.config();

const cleanDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/academix');
        console.log('Connected to DB');

        const db = mongoose.connection.db;

        const collections = ['courses', 'enrollments', 'invoices', 'assignments', 'quizzes', 'submissions'];
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;

        for (const collName of collections) {
            const collection = db.collection(collName);
            const docs = await collection.find({}).toArray();

            for (const doc of docs) {
                let updated = false;
                
                // Fields to check
                const fields = ['primaryFaculty', 'student', 'course', 'faculty'];
                
                for (const field of fields) {
                    if (doc[field]) {
                        const val = doc[field].toString();
                        if (!objectIdRegex.test(val)) {
                            console.log(`[${collName}] Invalid ObjectId found in document ${doc._id} for field ${field}: "${val}". Setting to null.`);
                            doc[field] = null;
                            updated = true;
                        }
                    }
                }

                if (updated) {
                    await collection.updateOne({ _id: doc._id }, { $set: doc });
                }
            }
        }
        
        console.log('Database cleanup completed.');

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

cleanDB();
