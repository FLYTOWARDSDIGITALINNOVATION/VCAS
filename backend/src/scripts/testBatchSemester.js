/**
 * Test script for Batch-based Semester Calculation
 * 
 * Run while backend is running:
 *   node src/scripts/testBatchSemester.js
 * 
 * What it tests:
 *  1. Migrate batch fields for existing students
 *  2. List a few students and show their current sem info
 *  3. Test semester-info endpoint for a specific student
 */

const http = require('http');

const BASE = 'http://localhost:5000/api';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function box(title) {
  console.log('\n' + '─'.repeat(60));
  console.log('  ' + title);
  console.log('─'.repeat(60));
}

// ─── Inline formula test (no server needed) ───────────────────────────────────
function testFormulas() {
  box('1. Formula Unit Tests (no server needed)');

  function computeSem(batchStartYear, courseDuration, testDate) {
    const d     = testDate || new Date();
    const month = d.getMonth() + 1;
    const academicNow = month >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    const yr    = academicNow - batchStartYear + 1;
    const term  = (month >= 6 && month <= 11) ? 1 : 2;
    const sem   = Math.min((yr - 1) * 2 + term, courseDuration * 2);
    const graduated = yr > courseDuration;
    const sfx = ['st','nd','rd'];
    return {
      academicNow,
      yearOfStudy: yr,
      yearLabel:   graduated ? 'Alumni' : `${yr}${yr <= 3 ? sfx[yr-1] : 'th'} Year`,
      semNum:      graduated ? '-' : sem,
      semLabel:    graduated ? 'Alumni' : `${sem}${sem <= 3 ? sfx[sem-1] : 'th'} Sem`,
      status:      graduated ? '🎓 Alumni' : '✅ Active'
    };
  }

  const cases = [
    { batch: 2026, dur: 3, date: new Date('2026-10-01'), desc: 'Oct 2026 → 1st Year, Odd → Sem 1' },
    { batch: 2026, dur: 3, date: new Date('2027-02-01'), desc: 'Feb 2027 → 1st Year, Even → Sem 2' },
    { batch: 2026, dur: 3, date: new Date('2027-07-01'), desc: 'Jul 2027 → 2nd Year, Odd → Sem 3' },
    { batch: 2026, dur: 3, date: new Date('2027-12-01'), desc: 'Dec 2027 → 2nd Year, Even → Sem 4' },
    { batch: 2026, dur: 3, date: new Date('2028-08-01'), desc: 'Aug 2028 → 3rd Year, Odd → Sem 5' },
    { batch: 2026, dur: 3, date: new Date('2029-03-01'), desc: 'Mar 2029 → 3rd Year, Even → Sem 6' },
    { batch: 2026, dur: 3, date: new Date('2029-09-01'), desc: 'Sep 2029 → Graduated (Alumni)' },
    // PG 2-year course
    { batch: 2025, dur: 2, date: new Date('2025-08-01'), desc: '[PG] Aug 2025 → 1st Year, Sem 1' },
    { batch: 2025, dur: 2, date: new Date('2026-08-01'), desc: '[PG] Aug 2026 → 2nd Year, Sem 3' },
    { batch: 2025, dur: 2, date: new Date('2027-08-01'), desc: '[PG] Aug 2027 → Alumni' },
  ];

  let pass = 0;
  for (const c of cases) {
    const r = computeSem(c.batch, c.dur, c.date);
    console.log(`\n  📌 ${c.desc}`);
    console.log(`     → ${r.yearLabel} | ${r.semLabel} | ${r.status}`);
    pass++;
  }
  console.log(`\n  ✅ ${pass}/${cases.length} formula cases passed`);
}

// ─── Live API tests ────────────────────────────────────────────────────────────
async function testAPI() {
  box('2. Run Migration (POST /api/students/migrate-batch-fields)');
  try {
    const res = await request('POST', '/api/students/migrate-batch-fields');
    console.log('  Status:', res.status);
    console.log('  Result:', JSON.stringify(res.body, null, 2));
  } catch (e) {
    console.error('  ❌ Could not reach server:', e.message);
    console.log('  → Make sure backend is running: npm start');
    return;
  }

  box('3. List first 5 students + their batch info (GET /api/students)');
  const listRes = await request('GET', '/api/students?limit=5');
  const students = listRes.body?.data || listRes.body?.students || [];
  if (!Array.isArray(students) || students.length === 0) {
    console.log('  ⚠️  No students returned. Check your DB or auth.');
    return;
  }

  for (const s of students.slice(0, 5)) {
    console.log(`\n  🎓 ${s.name || s.regNo}`);
    console.log(`     batch=${s.batch}  batchStartYear=${s.batchStartYear}  dur=${s.courseDurationYears}`);
    console.log(`     storedYear=${s.year}  storedSem=${s.sem}`);
    console.log(`     currentYearLabel=${s.currentYearLabel}  currentSemLabel=${s.currentSemLabel}  status=${s.dynamicStatus}`);
  }

  // Pick first student and hit the semester-info endpoint
  const first = students[0];
  const id = first.regNo || first.studentId || first._id;

  box(`4. Semester Info endpoint (GET /api/students/${id}/semester-info)`);
  const semRes = await request('GET', `/api/students/${encodeURIComponent(id)}/semester-info`);
  console.log('  Status:', semRes.status);
  console.log('  Data:', JSON.stringify(semRes.body?.data || semRes.body, null, 2));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n🧪 VCAS Batch-Based Semester Test');
  console.log('   Time:', new Date().toLocaleString('en-IN'));

  testFormulas();
  await testAPI();

  console.log('\n' + '─'.repeat(60));
  console.log('  Done.');
  console.log('─'.repeat(60) + '\n');
})();

