var settings = require('./settings.json');
var Client = require('ssh2-sftp-client');
var fs = require('fs');
var sleep = require('sleep');
var amqp = require('amqplib/callback_api');

sleep.sleep(10);

function poller(target){
  var fileName = makeid();
  fileName = fileName + ".txt";
  var sftp = new Client();
  sftp.connect({
    readyTimeout: '1000',
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
    //poller(target);
  })
  .catch((err) => {
      sftp.end();
      console.log(err.message);
      if (err.message === "This user is not authorized to read from the server.") {
        amqp.connect('amqp://ctfadmin:adminctf@10.10.0.30/', function(err, conn) {
          conn.createChannel(function(err, ch) {
          var q = 'flags';
         
           ch.assertQueue(q, {durable: true});
           ch.sendToQueue(q, new Buffer.from('\{\"team\": ' + target.id + ', \"boxName\": \"BoxName\", \"flagName\": \"Gimme\", \"token\": \"FLAG=NoFlag\"\}'));
          });
        setTimeout(function() { conn.close(); process.exit(0) }, 500);
        });
        console.log("Team" + target.id + " will have their flag populated");
        fs.writeFile('/var/poller/flag' + target.id + '.txt', 'flagFound', (err) => {
          if (err) throw err;
          console.log('Team' + target.id + ' file has been saved!');
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