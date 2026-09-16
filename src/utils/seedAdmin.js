const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const User = require('../models/user.model');

/**
 * Seed the initial Admin user into the database if not already present.
 *
 * Requirements:
 * - Credentials read from config/env.js
 * - If admin with ADMIN_EMAIL exists, do nothing
 * - Otherwise create admin with:
 *     fullName: "Admin"
 *     email: ADMIN_EMAIL
 *     password: hashed with bcryptjs
 *     role: "ADMIN"
 *     isVerified: true
 * - Never log the admin password
 *
 * @returns {Promise<Object|null>} The existing or newly created admin user document, or null if skipped
 */
const seedAdmin = async () => {
  try {
    const adminEmail = env.ADMIN_EMAIL || (env.ADMIN && env.ADMIN.EMAIL);
    const adminPassword = env.ADMIN_PASSWORD || (env.ADMIN && env.ADMIN.PASSWORD);

    if (!adminEmail || !adminPassword) {
      console.log('[Seed] Admin credentials (ADMIN_EMAIL / ADMIN_PASSWORD) not provided. Skipping admin seed.');
      return null;
    }

    const normalizedEmail = adminEmail.trim().toLowerCase();

    // Check if an admin user already exists with this email
    const existingAdmin = await User.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      console.log(`[Seed] Admin user already exists with email: ${normalizedEmail}`);
      return existingAdmin;
    }

    // Hash admin password using bcryptjs (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create the admin user
    const newAdmin = await User.create({
      fullName: 'Admin',
      email: normalizedEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
    });

    console.log(`[Seed] Admin user successfully created with email: ${newAdmin.email} (Role: ${newAdmin.role})`);
    return newAdmin;
  } catch (error) {
    console.error('[Seed] Failed to seed admin user:', error.message);
    throw error;
  }
};

// Allow standalone execution via `node src/utils/seedAdmin.js`
if (require.main === module) {
  const mongoose = require('mongoose');
  const connectDB = require('../../config/db');

  (async () => {
    try {
      await connectDB();
      await seedAdmin();
      await mongoose.connection.close();
      console.log('[Seed] Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('[Seed] CLI execution failed:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = seedAdmin;
module.exports.seedAdmin = seedAdmin;
