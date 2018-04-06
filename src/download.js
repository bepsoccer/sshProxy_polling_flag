var settings = require('./settings.json');
var Client = require('ssh2-sftp-client');
var fs = require('fs');
var sftp = new Client();
var sleep = require('sleep');

function poller(target){
  sleep.sleep(10);
  sftp.connect({
    host: target,
    hostHash: 'md5',
    hostVerifier: function(hashedKey) {
      if (settings.HASH === "") {
        //No expected hash so save save what was received from the host (hashedKey)
        console.log("Server hash: " + hashedKey);
        return true;
      } else if (hashedKey === settings.HASH) {
        //console.log("Hash values matched");
        return true;
      }
      //Output the failed comparison to the console if you want to see what went wrong
      console.log("Hash values: Server = " + hashedKey + " <> Client = " + setting.HASH);
      return false;
    },
    port: '22',
    username: settings.UN,
    password: settings.PASS
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
    poller(target);
  })
  .catch((err) => {
      console.log(err.message);
      sftp.end();
      poller(target);
  });
}

settings.sshServers.forEach(function(target) {
  poller(target);
});