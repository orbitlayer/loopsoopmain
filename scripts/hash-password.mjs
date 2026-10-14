// Generate a bcrypt hash for the admin password — run LOCALLY, never commit output.
//
//   node scripts/hash-password.mjs "your-chosen-password"
//
// Then in phpMyAdmin:
//   INSERT INTO users (id, email, password_hash)
//   VALUES (UUID(), 'you@example.com', '<paste the hash here>');
import bcrypt from "bcryptjs";

const pw = process.argv[2];
if (!pw) {
  console.error('Usage: node scripts/hash-password.mjs "your-chosen-password"');
  process.exit(1);
}
console.log(bcrypt.hashSync(pw, 10));
