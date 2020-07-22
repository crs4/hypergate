
const zeromq = require("zeromq");
sock = zeromq.socket('dealer');

sock.bindSync('tcp://127.0.0.1:9998');
let output = { val1: 'hi', val2: 0};
sock.on('message', (msg) => {
    let params = JSON.parse(msg.toString('utf8'));
    output.val1 = params.param1;
    output.val2 = 10;
    sock.send(JSON.stringify(output));
});
let count = 0;
setTimeout(() => {
    console.log(`val1=${count}`);
    console.error(`err1=${count}`);
    sock.send(JSON.stringify(output));
    count++;
    //process.exit();
}, 50);
setTimeout(() => {
    sock.close();
    process.exit();
}, 5000); 