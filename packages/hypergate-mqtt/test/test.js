const chai = require('chai');
const expect = chai.expect;
const HypergateMqtt = require('../index');
const mqtt = require('mqtt');

const Hypergate = require('@josefransaenz/hypergate-core');
function logger(hypergate) {
    hypergate.onAny(function(event, value) {
        console.log(`*** Event: ${event}, *** Payload: ${JSON.stringify(value)}.`);
    })
}

const baseTopic = 'f1/ap1';   
const hypergate = new Hypergate({ routines: { testRoutine: {}}});
const client = new HypergateMqtt(hypergate, baseTopic, 'mqtt://test.mosquitto.org'); 
client.on('connect', () => {           
    console.log('local connected');
}); 

describe('hypergate-mqtt', function() {
    after(() => {
        client.end();
        hypergate.stop(); 
    })
    it('should sent and receive the status', function(done) {
        this.timeout(0);
        const remoteClient  = mqtt.connect('mqtt://test.mosquitto.org');
        
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
        const remoteClient  = mqtt.connect('mqtt://test.mosquitto.org');
        
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