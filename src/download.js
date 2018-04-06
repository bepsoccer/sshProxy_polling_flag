require('dotenv').load();
var Client = require('ssh2-sftp-client');
var fs = require('fs');
var sftp = new Client();

sftp.connect({
  host: process.env.SERVER,
  hostHash: 'md5',
  hostVerifier: function(hashedKey) {
    if (process.env.HASH === "") {
      //No expected hash so save save what was received from the host (hashedKey)
      //console.log("Server hash: " + hashedKey);
      return true;
    } else if (hashedKey === process.env.HASH) {
      //console.log("Hash values matched");
      return true;
    }
    //Output the failed comparison to the console if you want to see what went wrong
    //console.log("Hash values: Server = " + hashedKey + " <> Client = " + process.env.HASH);
    return false;
  },
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
  console.log("no proxy in place");
  sftp.end();
})
.catch((err) => {
    console.log(err.message);
    sftp.end();
});