
const EventEmitter2 = require('eventemitter2').EventEmitter2;
const Routine = require('./src/Routine');
const Service = require('./src/Service');
const Task = require('./src/Task');
const UrlPattern = require('url-pattern');

/**
 * An instance of the Hypergate class is a {@link https://www.npmjs.com/package/eventemitter2|EventEmitters} that represents a controller of a set of applications called plugins. 
 * A plugin is a script or an executable that can be spawned as a child process of the application that instaciate the Hypergate class. 
 * 
 * @class Hypergate
 * @extends {EventEmitter}
 * @param {object} plugins - Definition of the plugins to use.
 * @param {object} plugins.tasks - Defines the plugins of type 'tasks'. This type of plugins will be spawned as decoupled child processes which means that they will continue to execute if the main application is closed before the plugins ends their execution.
 * @param {object} plugins.tasks._taskName_ - Parameters for executing _taskName_ plugin.
 * @param {string} plugins.tasks._taskName_.command - The command for executing the plugin
 * @param {array} plugins.tasks._taskName_.args - List of string arguments.
 * @param {string} plugins.tasks._taskName_.path - Current working directory of the plugin.
 * @param {boolean} plugins.tasks._taskName_.detached - Specify if the plugin should be executed detached from the main application. Default: `true`
 * @param {string} plugins.tasks._taskName_.stdinSchema - JSON schema object that specifies the schema for validating the data received with the 'start' command and that will be sent to the standard input of the plugin.
 * @param {string} plugins.tasks._taskName_.stdoutSchema - JSON schema object that specifies the schema for validating the data received from the plugin standard output and that will be sent in the payload of the 'stdout' event.
 * @param {object} plugins.routines - Defines the plugins of type 'routines'. This type of plugins can read input data from a JSON file and can write the output data that results from their execution in the same file. 
 * The input data can be provided with the command [routines/_routineName_/start]{@link Hypergate#command}. 
 * The output data will be present in the payload of the event  {@link Hypergate#event:routines/_routineName_/completed}.
 * @param {object} plugins.routines._routineName_ - Parameters for executing _routineName_ plugin.
 * @param {string} plugins.routines._routineName_.command - The command for executing the plugin
 * @param {array} plugins.routines._routineName_.args - List of string arguments.
 * @param {string} plugins.routines._routineName_.path - Current working directory of the plugin.
 * @param {string} plugins.routines._routineName_.jsonFile - Name of the JSON file to use as communication channel with the routine.
 * @param {object} plugins.routines._routineName_.jsonFileSchema - JSON schema object that specifies the schema for validating the data to be written or read to or from the JSON file
 * @param {object} plugins.services - Defines the plugins of type 'services'. This type of plugins can automatically start with the creation of the hypergate instance and can send and receive messages using [ZeroMQ]{@link http://zeromq.org/}. 
 * Messages with input data can be sent to the plugins with the command  [services/_serviceName_/input]{@link Hypergate#command}. 
 * Messages with output data generated by the plugin can be received by listening to an event {@link Hypergate#event:services/_serviceName_/output}
 * @param {object} plugins.services._serviceName_ - Parameters for executing _serviceName_ plugin
 * @param {string} plugins.services._serviceName_.command - The command for executing the plugin
 * @param {array} plugins.services._serviceName_.args - List of string arguments.
 * @param {string} plugins.services._serviceName_.path - Current working directory of the plugin. 
 * @param {number} plugins.services._serviceName_.autoStarts - Indicates the number of times (n) that the plugin will begin to execute automatically. If n = 1 indicates that it will start inmediately but will remain inactive once the execution ends (either by itself or by command). If n > 1, it will automatically restart n - 1 times during the application lifetime. 
 * @param {string} plugins.services._serviceName_.zeromqHost - [ZeroMQ]{@link http://zeromq.org/} endpoint to establish the communication channel with the plugin. This is done by creating an outgoing conection from a socket of type [ZMQ_DEALER]{@link http://api.zeromq.org/4-2:zmq-socket#toc24}.
 * It is a string consisting of a transport :// followed by an address. The transport specifies the underlying protocol to use. The address specifies the transport-specific address to connect to.
 * The plugin application should accept incoming connections.
 * @param {object} plugins.services._serviceName_.inputSchema - JSON schema object that specifies the schema for validating the input data.
 * @param {object} plugins.services._serviceName_.outputSchema - JSON schema object that specifies the schema for validating the payload of the messages received from the plugin.
 * 
 * @emits Hypergate#_pluginType_/_pluginName_/start
 * @emits Hypergate#_pluginType_/_pluginName_/error
 * @emits Hypergate#_pluginType_/_pluginName_/exit
 * @emits Hypergate#_pluginType_/_pluginName_/stdout
 * @emits Hypergate#_pluginType_/_pluginName_/stderr
 * @emits Hypergate#routines/_routineName_/completed
 * @emits Hypergate#services/_serviceName_/output
 * 
 */
class Hypergate extends EventEmitter2 {	
	constructor(plugins) {
		super(/*{
			wildcard: true,
			delimiter: '/'
		}*/);
		this.routines = {};
		this.services = {};
		this.tasks = {};
		// Activate routines
		//this.publish('hypergate/log/info', `Activating routines...`);
		for (const routineName in plugins.routines) {
			//this.publish('hypergate/log/info', `Activating routine: ${routineName}...`);
			let params = plugins.routines[routineName];
			this.routines[routineName] = new Routine(routineName, params, this);
		}
		// Start services
		//this.publish('hypergate/log/info', `Starting services...`);
		for (var serviceName in plugins.services) {
			//this.publish('hypergate/log/info', 'Starting service: ' + serviceName);
			let params = plugins.services[serviceName];
			this.services[serviceName] = new Service(serviceName, params, this);
		}
		// Activate tasks
		//this.publish('hypergate/log/info', `Activating tasks...`);
		for (var taskName in plugins.tasks) {
			//this.publish('hypergate/log/info', 'Activating task: ' + taskName);
			let params = plugins.tasks[taskName];
			this.tasks[taskName] = new Task(taskName, params, this);
		}
	}		

	/**
	 * Returns the status of the hypergate instance
	 * 
	 * @returns {status}
	 */
	getStatus() {
		/**
		 * The status of an hypergate instance.
		 * @typedef {object} status
		 * @property {string} version - Semantic version of the hypergate library used (see {@link https://semver.org/}).
		 * @property {object} tasks - Specifies the status of the plugins of type 'tasks'.
		 * @property {boolean} tasks._taskName_ - Status of the _taskName_ plugin
		 * @property {boolean} tasks._taskName_.running - Indicate if the task is running.
		 * @property {boolean} tasks._taskName_.lastStart - Date of the last start event specified as the the number of milliseconds from 01 January, 1970 in UTC.
		 * @property {object} routines - Specifies the status of the plugins of type 'routines'.
		 * @property {boolean} routines._routineName_ - Status of the _routineName_ plugin
		 * @property {boolean} routines._routineName_.running - Indicate if the routine is running.
		 * @property {boolean} routines._routineName_.lastStart - Date of the last start event specified as the the number of milliseconds from 01 January, 1970 in UTC.
		 * @property {object} services - Specifies the status of the plugins of type 'services'.
		 * @property {boolean} services._serviceName_ - Status of the _serviceName_ plugin
		 * @property {boolean} services._serviceName_.running - Indicate if the service is running.
		 * @property {boolean} services._serviceName_.lastStart - Date of the last start event specified as the the number of milliseconds from 01 January, 1970 in UTC.
		 */
		let status = {
			version: '0.1.0',
			routines: {},
			services: {},
			tasks: {}
		};
		for (let routine in this.routines) {
			status.routines[routine] = this.routines[routine].status;
		}
		for (let service in this.services) {
			status.services[service] = this.services[service].status;
		}
		for (let task in this.tasks) {
			status.tasks[task] = this.tasks[task].status;
		}
		//this.publish('hypergate/status/online', status);
		return status;
	}
	
	/**
	 * Execute a command for communicating or controlling a plugin or requesting the status of the hypergate instance
	 * 
	 * @param {string} command - A string that specifices the command for a plugin as '_pluginType_/_pluginName_/_action_' or request the status of the hypergate instance if equal to 'hypergate/status/request'.
	 * **_pluginType_** should be equal to 'tasks', 'routines' or 'services'. Any other value will return a rejected promise.  
	 * **_pluginName_** should be equal to one of the plugin names specified during the creation of the hypergate instance. Any other value will return a rejected promise.
	 * **_action_** should be equal to 'start' or 'kill'. For plugins of type 'services' it could also be equal to 'input' or 'restart'. Any other value will return a rejected promise.
	 * If **_action_** = 'start' it spawns the a child process with the parameters defined for the plugin during the creation of the hypergate instance. 
	 * If the plugin is of type 'routines', the payload with the data to be written in the JSON file (if specified) will be validated against the JSON schema provided during the plugin definition.
	 * If **_action_** = 'kill' and the plugin is runnig it sends the signal 'SIGTERM' to the related child process
	 * If **_action_** =  'input' it sends a ZeroMQ message to the plugin with the provided payload which will be validated against the input JSON schema provided during the plugin definition.
	 * If **_action_** = 'restart' and the plugins if of type 'services' it will have the same effect as a 'kill' command followed by a 'start' command. 
	 * @param {object} payload - Payload data
	 * @returns {promise}
	 * @memberof Hypergate
	 */
	command(command, payload) {
		if (command === 'hypergate/status/request') {
			return Promise.resolve(this.getStatus());
		}
		const commandPattern = new UrlPattern(':pluginType(/:pluginName)(/:action)');	
		try {
			if (!commandPattern) throw new Error('Invalid command!');
			let {pluginType, pluginName, action} = commandPattern.match(command);
			if (!this[pluginType]) throw new Error('Invalid plugin type!');
			if (!this[pluginType][pluginName]) throw new Error('Invalid plugin name!');
			if (typeof this[pluginType][pluginName][action] !== 'function') throw new Error('Invalid action!');
			return this[pluginType][pluginName][action](payload)
		} catch (error) {
			return Promise.reject(error);
		}
	}
	/**
	 * Stop all running plugins. Returns a promise that is full filled when all process are stopped
	 * 
	 * @returns {promise}
	 * @memberof Hypergate
	 */
	stop() {
		let plugins = []
		for (var routineName in this.routines) {
			plugins.push(this.routines[routineName].kill());
		}
		for (var serviceName in this.services) {
			plugins.push(this.services[serviceName].kill());
		}
		for (var taskName in this.tasks) {
			plugins.push(this.tasks[taskName].kill());
		}
		return Promise.all(plugins);
	}
}

/** 
 * Emmitted when the process of the plugin is launched. This event do not guarantee that the plugin sucesfully started to execute.
 * @event Hypergate#_pluginType_/_pluginName_/start
 * 
*/
/** 
 * Emmitted when an error occurred during the execution of the plugin is launched. This event do not guarantee that the plugin sucesfully started to execute.
 * @event Hypergate#_pluginType_/_pluginName_/error
 * @param {any} error  - Error message or error object.
 * 
*/
/** 
 * Emmitted when the process of the plugin ends. 
 * @event Hypergate#_pluginType_/_pluginName_/exit
 * @param {string} exitMessage  - Exit message.
 * 
*/
/** 
 * Emmitted when a chunk of data is received from the stdout of the process of the plugin.
 * @event Hypergate#_pluginType_/_pluginName_/stdout
 * @param {string} data  - The chunk of data.
 * 
*/
/** 
 * Emmitted when a chunk of data is received from the stderr of the process of the plugin. 
 * @event Hypergate#_pluginType_/_pluginName_/stderr
 * @param {string} data  - The chunk of data.
 * 
*/
/** 
 * Emmitted when a plugin of type 'routines' completes its execution and its output data is successfully retrieved. 
 * @event Hypergate#routines/_routineName_/completed
 * @param {object} data  - The output data resulting from the plugin execution. 
 * 
*/
/** 
 * Emmitted when a message is received from a plugin of type 'services'. 
 * @event Hypergate#services/_serviceName_/output
 * @param {object} data  - The payload of the message received. 
 * 
*/

module.exports = Hypergate;
