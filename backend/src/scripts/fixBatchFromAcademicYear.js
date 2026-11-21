/**
 * One-time migration: Recalculate batch, batchStartYear, courseDurationYears
 * for all existing students using:
 *   batchStart = academicYearStart - yearOfStudy + 1
 *   batch      = batchStart + '-' + (batchStart + duration)
 *
 * Run: node src/scripts/fixBatchFromAcademicYear.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

// Parse numeric year of study from stored label e.g. "2nd Year" → 2
function parseYearNum(yearLabel) {
  if (!yearLabel) return null;
  const s = String(yearLabel).toLowerCase().trim();
  if (s.startsWith('1') || s.startsWith('first')) return 1;
  if (s.startsWith('2') || s.startsWith('second')) return 2;
  if (s.startsWith('3') || s.startsWith('third')) return 3;
  if (s.startsWith('4') || s.startsWith('fourth')) return 4;
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
  console.log('✅ Connected to MongoDB');

  const students = await Student.find({}).lean();
  console.log(`📋 Total students: ${students.length}`);

  let updated = 0, skipped = 0, errors = 0;
  const ops = [];

  for (const s of students) {
    const acadYear = (s.academicYear || '').replace('–', '-').trim();
    const yearLabel = (s.year || '').trim();
    const course = (s.course || '').toUpperCase();

    const acadStart = parseInt((acadYear || '').split('-')[0], 10);
    const yearNum = parseYearNum(yearLabel);

    if (isNaN(acadStart) || !yearNum) {
      console.warn(`  ⚠️  Skip ${s.name} — cannot parse acadYear="${acadYear}" year="${yearLabel}"`);
      skipped++;
      continue;
    }

    const isPG = course.startsWith('M.') || course.includes('MBA') || course.includes('MCA') || course.includes('M.SC') || course.includes('MSC');
    const courseDurationYears = isPG ? 2 : 3;
    const batchStartYear = acadStart - yearNum + 1;
    const batch = `${batchStartYear}-${batchStartYear + courseDurationYears}`;

    if (s.batch === batch && s.batchStartYear === batchStartYear && s.courseDurationYears === courseDurationYears) {
      skipped++;
      continue; // already correct
    }

    console.log(`  🔄 ${s.name} | acadYear=${acadYear} yr=${yearNum} → batch: ${s.batch} → ${batch}`);
    ops.push({
      updateOne: {
        filter: { _id: s._id },
        update: { $set: { batch, batchStartYear, courseDurationYears } }
      }
    });
    updated++;
  }

  if (ops.length > 0) {
    await Student.bulkWrite(ops, { ordered: false });
    console.log(`\n✅ Updated ${updated} students, skipped ${skipped} (already correct or unparseable).`);
  } else {
    console.log(`\n✅ Nothing to update — all ${skipped} students already have correct batch.`);
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected.');
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
