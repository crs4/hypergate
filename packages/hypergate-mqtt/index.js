const mqtt = require('mqtt');
/**
 * An instance of the HypergateMqtt class is a {@link https://www.npmjs.com/package/mqtt#client|mqtt.js Client instance}.
 * 
 * @class HypergateMqtt
 * @param {object} hypergate - The instance of the Hypergate class to use
 * @param {string} baseTopic - string that will be appended to the topics related to the hypergate instance.
 * The instance of the HypergateMqtt class will be subscribed to topic '_baseTopic_/command/#' and will redirect the related messages to the hypergate.command method.
 * All hypergate events will be automatically published as '_baseTopic_/event/{original_hypergate_event}'.
 * @param {object} url - MQTT broker url
 * @param {object} options - MQTT.js options
 * @example
 * ```js
 * const Hypergate = require('hypergate'); 
 * const HypergateMqtt = require('hypergate-mqtt');
 * 
 * const hypergate = new Hypergate(<YourPluginsSpecification>);
 *
 * const baseTopic = <YourBaseTopicString>;
 * 
 * const mqttClient = new HypergateMqtt(hypergate, baseTopic, 'mqtt://test.mosquitto.org'); 
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
class HypergateMqtt {
    constructor(hypergate, baseTopic, url, options) {
        const client = mqtt.connect(url, options);
        client.on('connect', function () {
            client.subscribe(baseTopic + '/command/#');
            client.on('message', function (topic, message) {
                // message is Buffer
                //console.log('*** Receiving Topic: ' + topic + '. Message: ' + message.toString());
                let payload;
                const hgTopic = topic.slice(baseTopic.length + 9);
                try {
                    payload = JSON.parse(message.toString());
                } catch(error) {
                    payload = message.toString();
                } finally {
                    hypergate.command(hgTopic, payload)
                    .then((data) => {
                        client.publish(baseTopic + '/event/' + hgTopic + '/done', JSON.stringify(data));
                    }) 
                    .catch((error) => {                        
                        client.publish(baseTopic + '/event/' + hgTopic + '/failed', JSON.stringify(error));
                    })
                }
            })
            hypergate.onAny(function (event, payload) {
                //console.log('*** Topic: ' + baseTopic + '/event/' + event );
                client.publish(baseTopic + '/event/' + event, JSON.stringify(payload));
            });
        })

        return client;
    }
}

module.exports = HypergateMqtt;