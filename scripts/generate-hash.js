const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.error('Usage: node scripts/generate-hash.js <password>');
    process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
});
