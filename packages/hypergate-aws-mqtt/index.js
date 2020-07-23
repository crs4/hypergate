"use strict";
exports.__esModule = true;

//const aws_mqtt_client = require("aws-mqtt-client");
const awsIot = require('aws-iot-device-sdk');
/**
 * An instance of the HypergateAWSMqtt class is a {@link https://www.npmjs.com/package/mqtt#client|mqtt.js Client instance} created by using the {@link https://www.npmjs.com/package/aws-iot-device-sdk|aws-iot-device-sdk} library.
 * 
 * @class HypergateAWSMqtt
 * @param {object} hypergate - The instance of the Hypergate class to use
 * @param {string} baseTopic - string that will be appended to the topics related to the hypergate instance.
 * The instance of the HypergateAWSMqtt class will be subscribed to topic '_baseTopic_/command/#' and will redirect the related messages to the hypergate.command method.
 * All hypergate events will be automatically published as '_baseTopic_/event/{original_hypergate_event}'.
 * @param {object} AWSMqttOptions - AWSIoT-specific arguments as specified in the {@link https://www.npmjs.com/package/aws-iot-device-sdk#device|aws-iot-device-sdk documentation}
 * @example
 * ```js
 * const Hypergate = require('@josefransaenz/hypergate-core');
 * const HypergateAWSMqtt = require('@josefransaenz/hypergate-aws-mqtt');
 * 
 * const hypergate = new Hypergate(<YourPluginsSpecification>);
 * 
 * const AWSMqttOptions = {
 *   keyPath: <YourPrivateKeyPath>,
 *   certPath: <YourCertificatePath>,
 *   caPath: <YourRootCACertificatePath>,
 *   clientId: <YourUniqueClientIdentifier>,
 *   host: <YourCustomEndpoint>
 * };
 * const baseTopic = <YourBaseTopicString>;
 * 
 * const mqttClient = new HypergateAWSMqtt(hypergate, baseTopic, AWSMqttOptions); 
 * 
 * mqttClient.on('message', function (topic, message) {
 *   console.log(`*** Topic: '${topic}',  Payload: ${message.toString()}`);
 * });
 * 
 * mqttClient.on('connect', function () {
 *   console.log('*** Connect');
 * });
 * 
 * mqttClient.on('close', () => {
 *   console.log('** Disconect');
 * });
 * ```
 */
class HypergateAWSMqtt {
    constructor(hypergate, baseTopic, AWSMqttOptions) {
        //const client = new aws_mqtt_client["default"](AWSMqttOptions);
        const client = awsIot.device(AWSMqttOptions);
        client.on('connect', function (connack) {
            //console.log('*** Connect event: ' + JSON.stringify(connack));
            client.subscribe(baseTopic + '/command/#', { qos: 1 });
        })
        
        client.on('message', function (topic, message) {
            // message is Buffer
            //console.log('*** Receiving Topic: ' + topic + '. Message: ' + message.toString());
            let payload;
            const hgTopic = topic.slice(baseTopic.length + 9);
            try {
                payload = JSON.parse(message.toString());
            } catch (e) {
                payload = message.toString()
            } finally {
                hypergate.command(hgTopic, payload)
                .then((data) => {
                    //console.log('*** Publishing Topic: ' + baseTopic + '/event/' + hgTopic + '/done. Message: ' + data + JSON.stringify(data) );                        
                    client.publish(baseTopic + '/event/' + hgTopic + '/done', JSON.stringify(data));
                }) 
                .catch((error) => {                        
                    //console.log('*** Publishing Topic: ' + baseTopic + '/event/' + hgTopic + '/failed. Message: ' + error + JSON.stringify(error) );                        
                    client.publish(baseTopic + '/event/' + hgTopic + '/failed', error.toString());
                })
            }
        })
        hypergate.onAny(function (event, payload) {
            //console.log('*** Publishing Topic: ' + baseTopic + '/event/' + event + '. Message: ' + JSON.stringify(payload) );
            client.publish(baseTopic + '/event/' + event, JSON.stringify(payload)) 
        });
        return client;
    }
}

module.exports = HypergateAWSMqtt;