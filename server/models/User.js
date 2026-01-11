import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    passwordHash: {
        type: String,
        required: false // Optional for Google Auth users
    },
    attendanceRequirement: {
        type: Number,
        default: 75,
        min: 0,
        max: 100
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('User', userSchema);
