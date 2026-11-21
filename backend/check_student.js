require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const s = await db.collection('students').findOne({ name: /ASHOKKUMAR/i });
  if (s) {
    console.log(JSON.stringify({
      name: s.name, rollNo: s.rollNo, batch: s.batch,
      department: s.department, course: s.course, academicYear: s.academicYear
    }, null, 2));
  } else {
    console.log('Student not found');
    // Show all distinct batches
    const batches = await db.collection('students').distinct('batch');
    console.log('All batches in DB:', batches);
  }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
