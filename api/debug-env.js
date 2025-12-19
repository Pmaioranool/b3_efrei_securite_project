const fs = require('fs');
const path = require('path');

console.log("--- DEBUG START ---");
console.log("CWD:", process.cwd());

const envPath = path.join(process.cwd(), '.env');
console.log(".env exists?", fs.existsSync(envPath));

require('dotenv').config();

console.log("PGUSER:", process.env.PGUSER ? "DEFINED" : "UNDEFINED");
console.log("PGHOST:", process.env.PGHOST ? "DEFINED" : "UNDEFINED");
console.log("PGNAME:", process.env.PGNAME ? "DEFINED" : "UNDEFINED");
console.log("PGDATABASE:", process.env.PGDATABASE ? "DEFINED" : "UNDEFINED");
console.log("PGPASSWORD:", process.env.PGPASSWORD ? "DEFINED (Type: " + typeof process.env.PGPASSWORD + ")" : "UNDEFINED");
console.log("MONGODB_URI:", process.env.MONGODB_URI);

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const passwordLine = lines.find(l => l.trim().startsWith('PGPASSWORD'));
    console.log("Raw PGPASSWORD line found in file:", passwordLine ? "YES" : "NO");
    if (passwordLine) {
        console.log("Raw line content (masked):", passwordLine.replace(/=.*/, '=*****'));
    }
}
console.log("--- DEBUG END ---");
