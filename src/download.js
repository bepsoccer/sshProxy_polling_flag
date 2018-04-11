var settings = require('./settings.json');
var Client = require('ssh2-sftp-client');
var restClient = require('node-rest-client').Client;
var fs = require('fs');
var sleep = require('sleep');

sleep.sleep(10);

function poller(target){
  var fileName = makeid();
  fileName = fileName + ".txt";
  
  var body = {
    "team": target.id,
    "boxName": settings.flag.boxname,
    "flagName": settings.flag.name,
    "token": settings.flag.payload
  };
  var args = {
    data: body,
    headers: { "Content-Type": "application/json" }
  };

  var sftp = new Client();
  sftp.connect({
    readyTimeout: 1000,
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
      console.log("Hash values: Server = " + hashedKey + " <> Client = " + settings.HASH);
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
  })
  .then(() => {
    sftp.delete(fileName);
    sftp.end();
  })
  .catch((err) => {
      //close sftp connection
      sftp.end();
      console.log(err.message);
      
      if (err.message === "This user is not authorized to read from the server.") {
        console.log("Team" + target.id + " will have their flag populated");
        
        //Create rest client instance
        var submission = new restClient();
        //Submit flag via rest
        var req = submission.post(settings.flagSubmissionUrl, args, function(data, response) {
          
          console.log(response.statusCode + " " + response.statusMessage);
          
          //If status code of the response is 200
          //write file indicatingflag has been posted
          if (response.statusCode = 200) {
            fs.writeFile('/var/poller/flag' + target.id + '.txt', 'flagFound', (err) => {
              if (err) throw err;
              console.log('Team' + target.id + ' file has been saved!');
            });
          }
        });
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
  if (!(fs.existsSync('/var/poller/flag' + target.id + '.txt'))) {
    poller(target);
  }
});