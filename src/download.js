var settings = require('./settings.json');
var Client = require('ssh2-sftp-client');
var fs = require('fs');
var sftp = new Client();
var sleep = require('sleep');

function poller(target){
  sleep.sleep(10);
  var fileName = makeid();
  fileName = fileName + ".txt";
  sftp.connect({
    host: target.ip,
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
    port: target.port,
    username: settings.UN,
    password: settings.PASS
  })
  .then(() => {
    return sftp.put(settings.uploadFileName, fileName);
  })
  .then(() => {
    return sftp.get(fileName);
  })
  .then((stream) => {
    console.log("no proxy in place");
    //sftp.end();
    //poller(target);
  })
  .then(() => {
    sftp.delete(fileName);
    sftp.end();
    poller(target);
  })
  .catch((err) => {
      console.log(err.message);
      sftp.end();
      poller(target);
  });
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

settings.sshServers.forEach(function(target) {
  poller(target);
});