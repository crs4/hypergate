console.log(process.argv[2]);
console.error('err1');
const jsonfile = require('jsonfile');
const zeromq = require("zeromq");
sock = zeromq.socket('push');

sock.bindSync('tcp://127.0.0.1:9998');
console.log('Producer bound to port 9998');


jsonfile.readFile('temp.json', (error, data) => {
    if (error) {
        console.error(error);
        process.exit(1);
    }
    data.val1 = data.param1;
    
    data.val2 = process.argv[2];
    data.val3 = 3;
    jsonfile.writeFileSync('temp.json', data);
    sock.send('OUTPUT-READY');
    //process.exit();
});
setTimeout(() => {
    sock.close();
    process.exit();
}, 1000); 