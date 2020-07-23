const chai = require('chai');
const expect = chai.expect;
const HypergateAWSMqtt = require('../');
const aws_mqtt_client_1 = require("aws-mqtt-client");

const AWSMqttOptions_remote = {
    accessKeyId: 'AKIAIJ264HMQXBZPAGMA',
    secretAccessKey: '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',
    sessionToken: undefined,
    endpointAddress: 'a3tk5mzwsmjqfw.iot.eu-central-1.amazonaws.com',
    region: 'eu-central-1'
};

const AWSMqttOptions_local = {
    keyPath: './test/appliance-manager-test.private.key',
    certPath: './test/appliance-manager-test.cert.pem',
    caPath: './test/root-CA.crt',
    clientId: 'appliance-manager-test',
    host: 'a3tk5mzwsmjqfw.iot.eu-central-1.amazonaws.com'
};

const Hypergate = require('@josefransaenz/hypergate-core');
function logger(hypergate) {
    hypergate.onAny(function(event, value) {
        console.log(`*** Event: ${event}, *** Payload: ${JSON.stringify(value)}.`);
    })
}

const baseTopic = 'f1/ap1';   
const hypergate = new Hypergate({ routines: { testRoutine: {}}});
const client = new HypergateAWSMqtt(hypergate, baseTopic, AWSMqttOptions_local); 
client.on('connect', () => {           
    console.log('local connected');
});    

describe('hypergate-aws-mqtt', function() {
    after(() => {
        client.end();
        hypergate.stop(); 
    })
    it('should sent and receive the status', function(done) {
        this.timeout(0);
        const remoteClient  = new aws_mqtt_client_1["default"](AWSMqttOptions_remote);
        
        remoteClient.on('message', (topic, message) =>  {
            if (topic === (baseTopic + '/event/hypergate/status/request/done')) {
                let payload = JSON.parse(message.toString());
                expect(payload).to.have.all.keys('version', 'routines', 'services', 'tasks');
                remoteClient.end();               
                done(); 
            }
            console.log('topic: ' + topic + '. msg: ' + message.toString())
        });
        remoteClient.on('connect', () =>  {
            console.log('remote connected');
            remoteClient.subscribe(baseTopic + '/event/hypergate/status/request/done');            
            remoteClient.publish(baseTopic + '/command/hypergate/status/request', JSON.stringify({ greet: 'hi' }));            
        });
    })
    it('should respond to the status command', function(done) {
        this.timeout(0);
        const remoteClient  = new aws_mqtt_client_1["default"](AWSMqttOptions_remote);
        
        remoteClient.on('message', (topic, message) =>  {
            if (topic === (baseTopic + '/event/routines/testRoutine/error')) {
                remoteClient.end();            
                done(); 
            }
            console.log('topic: ' + topic + '. msg: ' + message.toString())
        });
        remoteClient.on('connect', () =>  {
            console.log('remote connected');
            remoteClient.subscribe(baseTopic + '/event/routines/testRoutine/error');            
            remoteClient.publish(baseTopic + '/command/routines/testRoutine/start');            
        });
    })
})