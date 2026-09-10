const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Potential variants for Rp90blx39B3DOJYO
const chars4 = ['0', 'O'];
const chars6 = ['l', '1', 'I'];
const chars13 = ['O', '0'];
const chars16 = ['O', '0'];

async function testAll() {
  for (const c4 of chars4) {
    for (const c6 of chars6) {
      for (const c13 of chars13) {
        for (const c16 of chars16) {
          const pass = `Rp9${c4}b${c6}x39B3D${c13}JY${c16}`;
          const uri = `mongodb+srv://lathavairamuthu1004_db_user:${encodeURIComponent(pass)}@cluster0.ruon290.mongodb.net/VCAS?authSource=admin&retryWrites=true&w=majority`;
          try {
            console.log(`Testing password: ${pass}...`);
            const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 4000 }).asPromise();
            console.log(`>>> SUCCESS! Correct password is: ${pass} <<<`);
            await conn.close();
            return pass;
          } catch (e) {
            // failed
          }
        }
      }
    }
  }
  console.log('No permutation matched.');
}

testAll().then(() => process.exit(0));
