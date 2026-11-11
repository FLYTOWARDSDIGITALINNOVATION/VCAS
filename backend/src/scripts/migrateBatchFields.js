/**
 * One-time migration script: backfill batchStartYear & courseDurationYears
 * for all existing students based on their stored `batch` field.
 *
 * Run from project root:
 *   node src/scripts/migrateBatchFields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student  = require('../models/Student');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/vcas';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', MONGO_URI);

  const students = await Student.find(
    { $or: [{ batchStartYear: null }, { batchStartYear: { $exists: false } }] },
    'batch course courseDurationYears batchStartYear'
  ).lean();

  console.log(`📋 Found ${students.length} students to migrate...`);

  let updated = 0;
  let skipped = 0;

  const bulkOps = [];

  for (const s of students) {
    const batch = (s.batch || '').replace('–', '-').trim();
    let startYear = null;
    let duration  = 3;

    if (batch.includes('-')) {
      const parts = batch.split('-');
      const start = parseInt(parts[0], 10);
      const end   = parseInt(parts[1], 10);
      if (!isNaN(start) && start >= 2000 && start <= 2100) {
        startYear = start;
      }
      if (!isNaN(start) && !isNaN(end) && end - start > 0 && end - start <= 6) {
        duration = end - start;
      }
    }

    // If still no startYear, skip (don't corrupt data)
    if (!startYear) {
      console.log(`  ⚠️  Skipping ${s._id} — cannot parse batch: "${s.batch}"`);
      skipped++;
      continue;
    }

    // Auto-detect PG/UG if duration still defaulting
    if (duration === 3 && s.course) {
      const c = s.course.toUpperCase();
      if (c.startsWith('M.') || c.includes('PG') || c.includes('M.SC') || c.includes('MBA') || c.includes('MCA')) {
        duration = 2;
      } else if (c.includes('B.E') || c.includes('B.TECH') || c.includes('B.ARCH')) {
        duration = 4;
      }
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: s._id },
        update: { $set: { batchStartYear: startYear, courseDurationYears: duration } }
      }
    });
    updated++;
  }

  if (bulkOps.length > 0) {
    const result = await Student.bulkWrite(bulkOps, { ordered: false });
    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated : ${result.modifiedCount}`);
    console.log(`   Skipped : ${skipped}`);
  } else {
    console.log('\n✅ Nothing to update — all students already have batch fields.');
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

