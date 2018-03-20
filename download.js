require('dotenv').load();
var Client = require('ssh2-sftp-client');
var fs = require('fs');
var sftp = new Client();

sftp.connect({
  host: process.env.SERVER,
  port: '22',
  username: process.env.UN,
  password: process.env.PASS
})
.then(() => {
  return sftp.put('results.xml', 'resultsUpload.xml');
})
.then(() => {
  return sftp.get('results.xml');
})
.then((stream) => {
  stream.pipe(fs.createWriteStream('results.xml'));
  sftp.end();
})
.catch((err) => {
    console.log(err.message);
    sftp.end();
});