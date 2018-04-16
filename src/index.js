"use strict"
var settings = require('./settings.json');
var Client = require('ssh2-sftp-client');
var ctfFlagSubmission = require('ctf-flag-submission');

function poller(target){
  var flag = 0;
  var fileName = makeid();
  fileName = fileName + ".txt";

  var sftp = new Client();
  sftp.connect({
    readyTimeout: 1000,
    host: target.ip,
    hostHash: 'md5',
    hostVerifier: function(hashedKey) {
      if (settings.HASH === "") {
        //No expected hash so save log what was received from the host (hashedKey)
        console.log("Server hash: " + hashedKey);
        return true;
      } else if (hashedKey === settings.HASH) {
        return true;
      }
      //Output the failed comparison to the console if you want to see what went wrong
      console.log("Team" + target.id + " - Hash values: Server = " + hashedKey + " <> Client = " + settings.HASH);
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
    console.log("Team" + target.id + " has no proxy in place");
  })
  .then(() => {
    return sftp.delete(fileName);
  })
  .then(() => {
    return sftp.end();
  })
  .catch((err) => {

    if (err.message === "This user is not authorized to read from the server.") {
      console.log("Team" + target.id + " will have their flag populated");
      
      var input = {
        "id": target.id,
        "boxName": settings.flag.boxname,
        "flag": settings.flag,
        "host": settings.host,
        "port": settings.hostPort
      };

      ctfFlagSubmission(input, function(result) {
        if (result.success) {flag = 1;}
        console.log(result);
        //close sftp connection
        return sftp.end();
      });
    } else {
      console.log("Team" + target.id + " - " + err.message);
      
      //close sftp connection
      return sftp.end();
    }
  });

  sftp.on("close", function() {
    if (!(flag)) {
      //wait ~10s to start the next poll
      setTimeout(poller, 10000, target);
    }
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