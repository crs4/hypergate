const Hypergate = require('hypergate');
const HypergateAWSMqtt = require('hypergate-aws-mqtt');
const fs = require('fs');
const jsonfile = require('jsonfile');
const cryptoJSON = require('crypto-json');
const localApp = require('./localApp');

const privateKey = 'qytY3QuBKQmJ';
const icareIotApiKey = "1GtgzVF4Ew7ghj22dTme48e9jsDfXQmV35k0QRhP";

getCredentials()
.then((encrypted) => {
    return cryptoJSON.decrypt(encrypted, privateKey, { keys: ['clientId', 'host', 'caCert'] });
})
.then((credentials) => {
    baseTopic = credentials.clientId;
    const AWSMqttOptions = {
        clientCert: Buffer.from(credentials.clientCert),
        privateKey: Buffer.from(credentials.privateKey),
        caCert: Buffer.from(credentials.caCert),
        clientId: credentials.clientId,
        host: credentials.host,
        keepalive: 15
    }
    let plugins = jsonfile.readFileSync('plugins.json');
    const hypergate = new Hypergate(plugins);
    localApp.start();
    const mqttClient = new HypergateAWSMqtt(hypergate, baseTopic, AWSMqttOptions); 
    mqttClient.on('reconnect', ()=> {
        console.log('reconnecting');
    })
    mqttClient.on('offline', ()=> {
        console.log('offline');
    })

    mqttClient.on('error', function (error) {
        console.error('MQTT error: ' + error);
    })

    console.log('*** Listen to topics: ' + baseTopic + '/command/#');

    hypergate.onAny(function(event, payload) {
        console.log(`*** Event: ${event}, *** Payload: ${JSON.stringify(payload)}.`);
    });

    mqttClient.on('message', function (topic, message) {
        console.log(`*** Topic: '${topic}',  Payload: ${message.toString()}`);
    });
    mqttClient.on('connect', function () {
        console.log('*** Connect');
    });
    mqttClient.on('close', () => {
        console.log('** Disconect');
    });
})
.catch((error) => {
    console.error('** ERROR: ', error);
})

function getCredentials() {
    const config = jsonfile.readFileSync('config.json');    
    if (!config.clientId) {
        const api = require('axios'); 
        api.defaults.baseURL = config.registrationUrl;
        api.defaults.headers.common['x-api-key'] = icareIotApiKey;
        return api.post('/register', { key: privateKey })
        .then((response) => {
            let credentials = {
                clientCert: response.data.result.certificate,
                privateKey: response.data.result.privateKey, 
                caCert: fs.readFileSync('./certificate/caCert.pem', 'utf8'),
                host: config.host,
                clientId: response.data.result.id
            };           
            saveCredentials(credentials);
            config.clientId = credentials.clientId;
            jsonfile.writeFileSync('config.json', config);
            return credentials;
        })
    }
    let credentials = {
        clientCert: fs.readFileSync('./certificate/clientCert','utf8'),
        privateKey: fs.readFileSync('./certificate/privateKey', 'utf8'), 
        caCert: fs.readFileSync('./certificate/caCert.pem', 'utf8'),
        host: config.host,
        clientId: config.clientId
    };
    return Promise.resolve(credentials);
}

function saveCredentials(credentials) {
    fs.writeFileSync('./certificate/clientCert', credentials.clientCert);
    fs.writeFileSync('./certificate/privateKey', credentials.privateKey);
}

