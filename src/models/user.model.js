const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['USER', 'ADMIN'],
            default: 'USER',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },

        // Email Verification
        emailVerificationOtp: {
            type: String,
            default: null,
        },
        emailVerificationOtpExpiresAt: {
            type: Date,
            default: null,
        },

        // Password Reset
        resetPasswordOtp: {
            type: String,
            default: null,
        },
        resetPasswordOtpExpiresAt: {
            type: Date,
            default: null,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordTokenExpiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
