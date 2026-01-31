
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: function() { return !this.googleId; } // Required if not using Google Auth
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'student'],
        default: 'student', // Default to student if not specified, though usually should be explicit
        required: true
    },
    // Flexible container for role-specific details
    details: {
        // Teacher specific
        department: { type: String },
        qualification: { type: String },
        
        // Student specific
        studentId: { type: String, unique: true, sparse: true, trim: true },
        batch: { type: String }, // e.g. "2023-2027"
        currentSemester: { type: Number },
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('User', userSchema);
