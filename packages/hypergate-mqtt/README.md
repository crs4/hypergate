# hypergate-mqtt
hypergate-mqtt is built on top of [MQTT.js](https://github.com/mqttjs/MQTT.js)
and can be used to connect a hypergate instance to a MQTT broker.

# API Reference

<a name="HypergateMqtt"></a>

## HypergateMqtt
**Kind**: global class  
<a name="new_HypergateMqtt_new"></a>

### new HypergateMqtt(hypergate, baseTopic, url, options)
An instance of the HypergateMqtt class is a [mqtt.js Client instance](https://www.npmjs.com/package/mqtt#client).


| Param | Type | Description |
| --- | --- | --- |
| hypergate | <code>object</code> | The instance of the Hypergate class to use |
| baseTopic | <code>string</code> | string that will be appended to the topics related to the hypergate instance. The instance of the HypergateMqtt class will be subscribed to topic '_baseTopic_/command/#' and will redirect the related messages to the hypergate.command method. All hypergate events will be automatically published as '_baseTopic_/event/{original_hypergate_event}'. |
| url | <code>object</code> | MQTT broker url |
| options | <code>object</code> | MQTT.js options |

**Example**  
```js
const Hypergate = require('hypergate'); 
const HypergateMqtt = require('hypergate-mqtt');

const hypergate = new Hypergate(<YourPluginsSpecification>);

const baseTopic = <YourBaseTopicString>;

const mqttClient = new HypergateMqtt(hypergate, baseTopic, 'mqtt://test.mosquitto.org'); 

mqttClient.on('message', function (topic, message) {
  console.log(`*** Topic: '${topic}',  Payload: ${message.toString()}`);
});

mqttClient.on('connect', function () {
  console.log('*** Connect');
});

mqttClient.on('close', () => {
  console.log('** Disconect');
});
```
