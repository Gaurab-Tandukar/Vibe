// One-time migration: backfill fields that were added to userSchema
// after some users were already created.
//
// Run with: node scripts/backfillUserFields.js
// Make sure this matches your project's real .env variable name below.

// require("dotenv").config();
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const User = require("../model/userModel");

const MONGO_URI = process.env.MONGO_URI;
    
if (!MONGO_URI) {
    console.error(
        "No Mongo connection string found. Check your .env file and make sure " +
        "the variable name here matches what your app already uses (e.g. " +
        "look inside your config/db.js or server.js for process.env.XXX).",
    );
    process.exit(1);
}

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected. Backfilling missing fields...");

    const result = await User.updateMany(
        { badges: { $exists: false } },
        {
            $set: {
                badges: [],
                selectedBadges: [],
                isVerified: false,
                activity: null,
                stats: { messagesSent: 0, totalChats: 0, groupsJoined: 0 },
            },
        },
    );

    console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount}`);
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});