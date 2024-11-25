const zlib =require('zlib');
const fs = require('fs');
const path = require('path')
const s = fs.readFileSync(path.join(process.cwd(),".git","objects","fb","40e3ba1e8288e70e41e24f8df753bf95cfabf3"));;

const buffer = Buffer.from(s,'base64');
zlib.unzip(buffer, (err, buffer) => {
    if (err) {
      console.error('An error occurred:', err);
      process.exitCode = 1;
    }
    
    console.log(buffer.toString());
});