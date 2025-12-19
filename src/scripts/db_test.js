import crypto from 'crypto';
import fs from 'fs';

const key = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // 32 bytes (256 bits) long key
const iv = crypto.randomBytes(16); // 16 bytes for AES-256-CBC
console.log(iv);

const inputPath = './src/migrations/mock_db.sql'; 
const outputPath = './src/migrations/mock_db.bin';

const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);

const input = fs.createReadStream(inputPath);
const output = fs.createWriteStream(outputPath);

input.pipe(cipher).pipe(output);

output.on('finish', () => {
  fs.appendFileSync(outputPath, iv);
  console.log('File encrypted successfully.');
});

output.on('finish', () => {
  console.log('Encrypted sample written to', outputPath)
})
