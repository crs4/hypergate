
const PluginController = require('./PluginController');
const zeromq = require("zeromq");
const Ajv = require('ajv');
const ajv = new Ajv();
/**
 * Define a daemon process that provides a service during all the application life
 * 
 * @class Service
 * @author Jose F. Saenz
 */
class Service extends PluginController {
    /**
     * Creates an instance of Service.
     * @param {string} name - Name of the service
     * @param {object} params - Parameter for starting and managing the application
     * @param {object} connection - connection for emitting and handling events and commands from the remote application
     * @memberof Service
     */
    constructor(name, params, hypergate) {
        super('services', name, params, hypergate);
        this.autoStarts = params.autoStarts || 0;
        this.zeromqHost = params.zeromqHost;
        this.inputSchema = params.inputSchema || {};
        this.outputSchema = params.outputSchema || {};
        if (this.autoStarts > 0) {
            this.start();
        }
    }
    /**
     * Start the service application as a child process
     * 
     * @memberof Service
     */
    start() {
        super.start();
        this.autoStarts--;

        // Open zeroMQ connection if needed
        if (this.zeromqHost) {
            this.zeromqSocket = zeromq.socket('dealer');
            this.zeromqSocket.connect(this.zeromqHost);
            this.zeromqSocket.on('message', (msg) => {
                let payload;
                try {
                    payload = JSON.parse(msg.toString());
                } catch (error) {
                    this.publish('error', `Invalid ZeroMQ message "${msg.toString()}" format for service  ${this.name}: ${error}`);
                    return;
                } 
                if (ajv.validate(this.outputSchema, payload)) {
                    this.publish('output', payload);               
                } else {
                    this.publish('error', `Invalid output data schema for service  ${this.name}: ${ajv.errors}`);                        
                }                
            })
        }
        
        this.process.on('exit', (code) => { 
            if (this.zeromqHost) this.zeromqSocket.close();              
            if (this.autoStarts > 0) {
                setTimeout(() => {
                    this.start();
                }, 1000);
            }
        });
        return Promise.resolve();
    }
    /**
     * 
     * 
     * @param {any} payload 
     * @memberof Service
     */
    input(payload) {
        return new Promise((resolve, reject) => {
            if (!ajv.validate(this.inputSchema, payload)) {
                const msg = `Invalid input data schema for service  ${this.name}: ${ajv.errors}`;    
                return reject(msg);
            }
            //this.hypergate.emit('log/info', `${this.name} input: ${JSON.stringify(payload)}`);
            if (this.zeromqSocket) {
                if (typeof this.zeromqSocket.send === 'function') {
                    this.zeromqSocket.send(JSON.stringify(payload));
                } else {
                    return reject('zeromqSocket.send is not a function')
                }
            }
            resolve();
        });
    }
    /**
     * Restart the service application
     * 
     * @memberof Service
     */
    restart() {    
        return new Promise((resolve, reject) => {
            if (this.process) {
                if (typeof this.process.once === 'function') {
                    this.process.once('error', (err) => {
                        resolve(this.start());
                    });
            
                    this.process.once('exit', (code) => {
                        resolve(this.start());
                    });
                    return this.kill();
                }
            }
            resolve(this.start());
        })
    }
}

module.exports = Service;