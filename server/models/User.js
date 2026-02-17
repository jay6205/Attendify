
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
        required: function () { return !this.googleId; } // Required if not using Google Auth
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'student', 'parent'],
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
    // --- Telegram Integration ---
    telegramChatId: {
        type: String,
        default: null
    },
    telegramLinked: {
        type: Boolean,
        default: false
    },
    // --- Parent Phone Support ---
    phoneNumber: {
        type: String,
        default: null
    },
    phoneVerified: {
        type: Boolean,
        default: false
        // TODO: Future — OTP verification, WhatsApp opt-in, notification preferences
    },
    phoneRequired: {
        type: Boolean,
        default: function () {
            return this.role === 'parent';
        }
    },
    // --- End Parent Phone Support ---
    createdAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: function () {
            // Super admins technically don't belong to a single org, but everyone else DOES
            return this.role !== 'super_admin';
        }
    }
});

// Keep phoneRequired in sync with role on every save
userSchema.pre('save', function (next) {
    if (this.isModified('role')) {
        this.phoneRequired = (this.role === 'parent');
    }
    next();
});

// Keep phoneRequired in sync with role on atomic updates
function syncPhoneRequiredOnUpdate() {
    const update = this.getUpdate();
    if (!update) return;

    // Handle role in $set or top-level fields
    const setRole = update.role || update.$set?.role;
    if (setRole) {
        const phoneRequired = (setRole === 'parent');
        update.$set = update.$set || {};
        update.$set.phoneRequired = phoneRequired;
    }

    // Handle role in $setOnInsert for upserts
    const setOnInsertRole = update.$setOnInsert?.role;
    if (setOnInsertRole) {
        update.$setOnInsert.phoneRequired = (setOnInsertRole === 'parent');
    }
}

userSchema.pre('findOneAndUpdate', syncPhoneRequiredOnUpdate);
userSchema.pre('updateOne', syncPhoneRequiredOnUpdate);
userSchema.pre('updateMany', syncPhoneRequiredOnUpdate);

export default mongoose.model('User', userSchema);
