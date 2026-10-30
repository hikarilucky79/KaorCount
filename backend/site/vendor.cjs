const fs = require('node:fs');
const path = require('node:path');

const entry = require.resolve('qrcode-generator');
const output = path.resolve(__dirname, '../public/js/vendor');
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(entry, path.join(output, 'qrcode.js'));
fs.copyFileSync(path.join(__dirname, 'qrcode-LICENSE.txt'), path.join(output, 'qrcode-LICENSE.txt'));
