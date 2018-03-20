var Client = require('ssh2-sftp-client');
var fs = require('fs');
var sftp = new Client();

sftp.connect({
    host: '10.5.20.123',
    port: '22',
    username: 'sshuser',
    password: 'P@$$w0rd'
}).then(() => {
    sftp.get('results.xml')
	.then((stream) => {
  		stream.pipe(fs.createWriteStream('results.xml'));
  		sftp.end();
	})
})
.catch((err) => {
    console.log(err, 'catch error');
});