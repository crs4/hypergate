# hypergate-aws-mqtt
hypergate-aws-mqtt is built on top of [aws-iot-device-sdk](https://www.npmjs.com/package/aws-iot-device-sdk)
and can be used to connect a hypergate instance to the AWS IoT Platform via MQTT or MQTT over the Secure WebSocket Protocol.

# API Reference

<a name="HypergateAWSMqtt"></a>

## HypergateAWSMqtt
**Kind**: global class  
<a name="new_HypergateAWSMqtt_new"></a>

### new HypergateAWSMqtt(hypergate, baseTopic, AWSMqttOptions)
An instance of the HypergateAWSMqtt class is a [mqtt.js Client instance](https://www.npmjs.com/package/mqtt#client) created by using the [aws-iot-device-sdk](https://www.npmjs.com/package/aws-iot-device-sdk) library.


| Param | Type | Description |
| --- | --- | --- |
| hypergate | <code>object</code> | The instance of the Hypergate class to use |
| baseTopic | <code>string</code> | string that will be appended to the topics related to the hypergate instance. The instance of the HypergateAWSMqtt class will be subscribed to topic '_baseTopic_/command/#' and will redirect the related messages to the hypergate.command method. All hypergate events will be automatically published as '_baseTopic_/event/{original_hypergate_event}'. |
| AWSMqttOptions | <code>object</code> | AWSIoT-specific arguments as specified in the [aws-iot-device-sdk documentation](https://www.npmjs.com/package/aws-iot-device-sdk#device) |

**Example**  
```js
const Hypergate = require('@josefransaenz/hypergate-core'); 
const HypergateAWSMqtt = require('@josefransaenz/hypergate-aws-mqtt');

const hypergate = new Hypergate(<YourPluginsSpecification>);

const AWSMqttOptions = {
  keyPath: <YourPrivateKeyPath>,
  certPath: <YourCertificatePath>,
  caPath: <YourRootCACertificatePath>,
  clientId: <YourUniqueClientIdentifier>,
  host: <YourCustomEndpoint>
};
const baseTopic = <YourBaseTopicString>;

const mqttClient = new HypergateAWSMqtt(hypergate, baseTopic, AWSMqttOptions); 

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
