# Hypergate
This library provides a single class called [`Hypergate`](#Hypergate) which controls the execution
of resource-specific applications (plugins) and emits events or messages about their status and data obtained.

Depending of the type of execution and the communication mode needed, a plugin can be defined inside of one of three categories: 
* __Routines__: applications that are executed with the aim of obtaining a result (measurement or 
data acquisition) and may only need to receive input data at the begining of their execution and
may only return output data at the end. The exchange of input and output data with this mode of
plugins can be done thorugh a JSON file. 
* __Tasks__: applications that may need to be executed independently of the parent process and may 
need/produce formatted input/output data to/from the standard I/O. 
* __Services__: applications that may need to be executed all the time or for a exteded period of 
time and may need to periodically o episodically send or receive information. This type of 
plugins can provide a [ZeroMQ](http://zeromq.org) endpoint to which the Hypergate instance can connect a [ZMQ_DEALER
socket](http://api.zeromq.org/4-2:zmq-socket#toc24) for establishing a bidirectional any-time communication channel.

# Example
```js
const Hypergate = require('hypergate')

const hypergate = new Hypergate({
routines: {
    myRoutine: {
        command: 'myRoutine.exe',
        args: ['myArg1', 'myArg2'],
        path: '/path/to/myRoutine',
        jsonFile: 'temp.json',
        jsonFileSchema: {
            type: 'object',
            properties: { 
                foo: { type: 'string'},
                bar: { type: 'array'}
            }
        }
    }  
}
 });
 
 hypergate.once('routines/myRoutine/completed', (outputData) =>  {
 	console.log('myRoutine was completed with the following result: ' + outputData.bar);
 });
 
 hypergate.once('routines/myRoutine/error', (error) =>  {
 	console.error('Error while executing myRoutine: ' + error);
 });

 var inputData = { foo: 'val1' };

 hypergate.command('routines/myRoutine/start', inputData)
 .then(() => {
 	console.log('myRoutine is executing!');
 }); 
 .catch((error) => {
 	console.error('myRoutine could not be executed ' + error);
 }); 
 ```

# API Reference

<a id="Hypergate"></a>

## Hypergate ⇐ `EventEmitter`
**Extends**: `EventEmitter`  
**Emits**: [`_pluginType_/_pluginName_/start`](#Hypergate--event__pluginType_-_pluginName_-start), [`_pluginType_/_pluginName_/error`](#Hypergate--event__pluginType_-_pluginName_-error), [`_pluginType_/_pluginName_/exit`](#Hypergate--event__pluginType_-_pluginName_-exit), [`_pluginType_/_pluginName_/stdout`](#Hypergate--event__pluginType_-_pluginName_-stdout), [`_pluginType_/_pluginName_/stderr`](#Hypergate--event__pluginType_-_pluginName_-stderr), [`routines/_routineName_/completed`](#Hypergate--event_routines-_routineName_-completed), [`services/_serviceName_/output`](#Hypergate--event_services-_serviceName_-output)  

* [Hypergate](#Hypergate) ⇐ `EventEmitter`
    * [new Hypergate(plugins)](#new_Hypergate_new)
    * [.getStatus()](#Hypergate--getStatus) ⇒ [`status`](#status)
    * [.command(command, payload)](#Hypergate--command) ⇒ `promise`
    * [.stop()](#Hypergate--stop) ⇒ `promise`
    * ["_pluginType_/_pluginName_/start"](#Hypergate--event__pluginType_-_pluginName_-start)
    * ["_pluginType_/_pluginName_/error" (error)](#Hypergate--event__pluginType_-_pluginName_-error)
    * ["_pluginType_/_pluginName_/exit" (exitMessage)](#Hypergate--event__pluginType_-_pluginName_-exit)
    * ["_pluginType_/_pluginName_/stdout" (data)](#Hypergate--event__pluginType_-_pluginName_-stdout)
    * ["_pluginType_/_pluginName_/stderr" (data)](#Hypergate--event__pluginType_-_pluginName_-stderr)
    * ["routines/_routineName_/completed" (data)](#Hypergate--event_routines-_routineName_-completed)
    * ["services/_serviceName_/output" (data)](#Hypergate--event_services-_serviceName_-output)

<a id="new_Hypergate_new"></a>

### new Hypergate(plugins)
An instance of the Hypergate class is a [EventEmitters](https://www.npmjs.com/package/eventemitter2) that represents a controller of a set of applications called plugins. 
A plugin is a script or an executable that can be spawned as a child process of the application that instaciate the Hypergate class.


| Param | Type | Description |
| --- | --- | --- |
| plugins | `object` | Definition of the plugins to use. |
| plugins.tasks | `object` | Defines the plugins of type 'tasks'. This type of plugins will be spawned as decoupled child processes which means that they will continue to execute if the main application is closed before the plugins ends their execution. |
| plugins.tasks._taskName_ | `object` | Parameters for executing _taskName_ plugin. |
| plugins.tasks._taskName_.command | `string` | The command for executing the plugin |
| plugins.tasks._taskName_.args | `array` | List of string arguments. |
| plugins.tasks._taskName_.path | `string` | Current working directory of the plugin. |
| plugins.tasks._taskName_.detached | `boolean` | Specify if the plugin should be executed detached from the main application. Default: `true` |
| plugins.tasks._taskName_.stdinSchema | `string` | JSON schema object that specifies the schema for validating the data received with the 'start' command and that will be sent to the standard input of the plugin. |
| plugins.tasks._taskName_.stdoutSchema | `string` | JSON schema object that specifies the schema for validating the data received from the plugin standard output and that will be sent in the payload of the 'stdout' event. |
| plugins.routines | `object` | Defines the plugins of type 'routines'. This type of plugins can read input data from a JSON file and can write the output data that results from their execution in the same file.  The input data can be provided with the command [routines/_routineName_/start](#Hypergate--command).  The output data will be present in the payload of the event  [routines/_routineName_/completed](#Hypergate--event_routines-_routineName_-completed). |
| plugins.routines._routineName_ | `object` | Parameters for executing _routineName_ plugin. |
| plugins.routines._routineName_.command | `string` | The command for executing the plugin |
| plugins.routines._routineName_.args | `array` | List of string arguments. |
| plugins.routines._routineName_.path | `string` | Current working directory of the plugin. |
| plugins.routines._routineName_.jsonFile | `string` | Name of the JSON file to use as communication channel with the routine. |
| plugins.routines._routineName_.jsonFileSchema | `object` | JSON schema object that specifies the schema for validating the data to be written or read to or from the JSON file |
| plugins.services | `object` | Defines the plugins of type 'services'. This type of plugins can automatically start with the creation of the hypergate instance and can send and receive messages using [ZeroMQ](http://zeromq.org/).  Messages with input data can be sent to the plugins with the command  [services/_serviceName_/input](#Hypergate--command).  Messages with output data generated by the plugin can be received by listening to an event [services/_serviceName_/output](#Hypergate--event_services-_serviceName_-output) |
| plugins.services._serviceName_ | `object` | Parameters for executing _serviceName_ plugin |
| plugins.services._serviceName_.command | `string` | The command for executing the plugin |
| plugins.services._serviceName_.args | `array` | List of string arguments. |
| plugins.services._serviceName_.path | `string` | Current working directory of the plugin. |
| plugins.services._serviceName_.autoStarts | `number` | Indicates the number of times (n) that the plugin will begin to execute automatically. If n = 1 indicates that it will start inmediately but will remain inactive once the execution ends (either by itself or by command). If n > 1, it will automatically restart n - 1 times during the application lifetime. |
| plugins.services._serviceName_.zeromqHost | `string` | [ZeroMQ](http://zeromq.org/) endpoint to establish the communication channel with the plugin. This is done by creating an outgoing conection from a socket of type [ZMQ_DEALER](http://api.zeromq.org/4-2:zmq-socket#toc24). It is a string consisting of a transport :// followed by an address. The transport specifies the underlying protocol to use. The address specifies the transport-specific address to connect to. The plugin application should accept incoming connections. |
| plugins.services._serviceName_.inputSchema | `object` | JSON schema object that specifies the schema for validating the input data. |
| plugins.services._serviceName_.outputSchema | `object` | JSON schema object that specifies the schema for validating the payload of the messages received from the plugin. |

<a id="Hypergate--getStatus"></a>

### hypergate.getStatus() ⇒ [`status`](#status)
Returns the status of the hypergate instance

<a id="Hypergate--command"></a>

### hypergate.command(command, payload) ⇒ `promise`
Execute a command for communicating or controlling a plugin or requesting the status of the hypergate instance


| Param | Type | Description |
| --- | --- | --- |
| command | `string` | A string that specifices the command for a plugin as '_pluginType_/_pluginName_/_action_' or request the status of the hypergate instance if equal to 'hypergate/status/request'. **_pluginType_** should be equal to 'tasks', 'routines' or 'services'. Any other value will return a rejected promise.   **_pluginName_** should be equal to one of the plugin names specified during the creation of the hypergate instance. Any other value will return a rejected promise. **_action_** should be equal to 'start' or 'kill'. For plugins of type 'services' it could also be equal to 'input' or 'restart'. Any other value will return a rejected promise. If **_action_** = 'start' it spawns the a child process with the parameters defined for the plugin during the creation of the hypergate instance.  If the plugin is of type 'routines', the payload with the data to be written in the JSON file (if specified) will be validated against the JSON schema provided during the plugin definition. If **_action_** = 'kill' and the plugin is runnig it sends the signal 'SIGTERM' to the related child process If **_action_** =  'input' it sends a ZeroMQ message to the plugin with the provided payload which will be validated against the input JSON schema provided during the plugin definition. If **_action_** = 'restart' and the plugins if of type 'services' it will have the same effect as a 'kill' command followed by a 'start' command. |
| payload | `object` | Payload data |

<a id="Hypergate--stop"></a>

### hypergate.stop() ⇒ `promise`
Stop all running plugins. Returns a promise that is full filled when all process are stopped

<a id="Hypergate--event__pluginType_-_pluginName_-start"></a>

### "_pluginType_/_pluginName_/start"
Emmitted when the process of the plugin is launched. This event do not guarantee that the plugin sucesfully started to execute.

<a id="Hypergate--event__pluginType_-_pluginName_-error"></a>

### "_pluginType_/_pluginName_/error" (error)
Emmitted when an error occurred during the execution of the plugin is launched. This event do not guarantee that the plugin sucesfully started to execute.


| Param | Type | Description |
| --- | --- | --- |
| error | `any` | Error message or error object. |

<a id="Hypergate--event__pluginType_-_pluginName_-exit"></a>

### "_pluginType_/_pluginName_/exit" (exitMessage)
Emmitted when the process of the plugin ends.


| Param | Type | Description |
| --- | --- | --- |
| exitMessage | `string` | Exit message. |

<a id="Hypergate--event__pluginType_-_pluginName_-stdout"></a>

### "_pluginType_/_pluginName_/stdout" (data)
Emmitted when a chunk of data is received from the stdout of the process of the plugin.


| Param | Type | Description |
| --- | --- | --- |
| data | `string` | The chunk of data. |

<a id="Hypergate--event__pluginType_-_pluginName_-stderr"></a>

### "_pluginType_/_pluginName_/stderr" (data)
Emmitted when a chunk of data is received from the stderr of the process of the plugin.


| Param | Type | Description |
| --- | --- | --- |
| data | `string` | The chunk of data. |

<a id="Hypergate--event_routines-_routineName_-completed"></a>

### "routines/_routineName_/completed" (data)
Emmitted when a plugin of type 'routines' completes its execution and its output data is successfully retrieved.


| Param | Type | Description |
| --- | --- | --- |
| data | `object` | The output data resulting from the plugin execution. |

<a id="Hypergate--event_services-_serviceName_-output"></a>

### "services/_serviceName_/output" (data)
Emmitted when a message is received from a plugin of type 'services'.


| Param | Type | Description |
| --- | --- | --- |
| data | `object` | The payload of the message received. |

<a id="status"></a>

## status : `object`
The status of an hypergate instance.

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| version | `string` | Semantic version of the hypergate library used (see [https://semver.org/](https://semver.org/)). |
| tasks | `object` | Specifies the status of the plugins of type 'tasks'. |
| tasks._taskName_ | `boolean` | Status of the _taskName_ plugin |
| tasks._taskName_.running | `boolean` | Indicate if the task is running. |
| tasks._taskName_.lastStart | `boolean` | Date of the last start event specified as the the number of milliseconds from 01 January, 1970 in UTC. |
| routines | `object` | Specifies the status of the plugins of type 'routines'. |
| routines._routineName_ | `boolean` | Status of the _routineName_ plugin |
| routines._routineName_.running | `boolean` | Indicate if the routine is running. |
| routines._routineName_.lastStart | `boolean` | Date of the last start event specified as the the number of milliseconds from 01 January, 1970 in UTC. |
| services | `object` | Specifies the status of the plugins of type 'services'. |
| services._serviceName_ | `boolean` | Status of the _serviceName_ plugin |
| services._serviceName_.running | `boolean` | Indicate if the service is running. |
| services._serviceName_.lastStart | `boolean` | Date of the last start event specified as the the number of milliseconds from 01 January, 1970 in UTC. |

