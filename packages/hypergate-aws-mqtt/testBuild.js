const HypergateAWSMqtt = require('./');
const aws_mqtt_client_1 = require("aws-mqtt-client");

const AWSMqttOptions = {
    accessKeyId: 'AKIAIJ264HMQXBZPAGMA',
    secretAccessKey: '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',
    sessionToken: undefined,
    endpointAddress: 'a3tk5mzwsmjqfw.iot.eu-central-1.amazonaws.com',
    region: 'eu-central-1'
};

const hypergate = require('hypergate');
hypergate.onAny(function (event, value) {
    console.log(`*** Event: ${event}, *** Payload: ${JSON.stringify(value)}.`);
});

const baseTopic = 'farma1/appl1';
const client = new HypergateAWSMqtt(hypergate, baseTopic, AWSMqttOptions);

hypergate.start({});
client.on('connect', () => {
    console.log('Local connected');
    const remoteClient = new aws_mqtt_client_1["default"](AWSMqttOptions);
    //hypergate.start({});
    
    let sent = false;
    let received = false;
    
    function ok() {
        if (sent && received) {
            remoteClient.end();
            client.end();
            hypergate.stop();
            console.log('OK')
        }
    }
    remoteClient.on('message', (topic, message) => {
        if (topic === (baseTopic + '/event/hypergate/status/online')) {
            let payload = JSON.parse(message.toString());
            sent = true;
            ok();
        }
        console.log('topic: ' + topic + '. msg: ' + message.toString())
    });
    remoteClient.on('connect', () => {
        console.log('Remote connected');
        remoteClient.subscribe(baseTopic + '/event/hypergate/status/online', { qos: 1 });
        remoteClient.publish(baseTopic + '/command/hypergate/status/request', JSON.stringify({ greet: 'hi' }), { qos: 1 });
        //remoteClient.publish(baseTopic + '/command/hypergate/status/request', JSON.stringify({ greet: 'hi' }));            
    });
    remoteClient.on('close', () => {
        console.log('Remote disconnected');
    });
    client.on('close', () => {
        console.log('Local disconnected');
    });
    hypergate.on('command/hypergate/status/request', (payload) => {
        received = true;
        ok();
    })
});
