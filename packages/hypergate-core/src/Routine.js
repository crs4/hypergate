
const PluginController = require('./PluginController');
const jsonfile = require('jsonfile');
const zeromq = require("zeromq");
const Ajv = require('ajv');
const ajv = new Ajv();
const path = require('path');
/**
 * Define a program that will be excecuted upon request of a remote application through a connection
 * 
 * @class Routine
 * @author Jose F. Saenz
 */
class Routine extends PluginController {
    /**
     * Creates an instance of Routine.
     * @param {string} name - Name of the routine
     * @param {object} params - Parameter for starting and managing the application
     * @memberof Routine
     */
    constructor(name, params, hypergate) {
        super('routines', name, params, hypergate);
        this.jsonFile = params.jsonFile;
        this.zeromqHost = params.zeromqHost;
        this.jsonFileSchema = params.jsonFileSchema || {};
    }
    /**
     * Start the routine application as a child process
     * 
     * @memberof Routine
     */
    start(data) {
        
        if (!ajv.validate(this.jsonFileSchema, data)) {
            const msg = `Invalid json schema for routine  ${this.name}: ${JSON.stringify(ajv.errors)}`;                 
            return Promise.reject(msg);
        }
        
        if (this.jsonFile) {
            // Write input data in json file
            jsonfile.writeFileSync(path.join(this.options.cwd, this.jsonFile), data );
        }
        
        let zeromqSocket;
        // Open zeroMQ connection if needed
        if (this.zeromqHost) {
            zeromqSocket = zeromq.socket('pull');
            zeromqSocket.connect(this.zeromqHost);
            zeromqSocket.on('message', (msg) => {
                if (msg.toString('utf8') === 'OUTPUT-READY') {
                    //this.hypergate.publish('log/info', 'MESSAGE ZEROMQ RECEIVED: ' + msg.toString('utf8'));
                    done(0);
                } else {
                    //this.hypergate.publish('log/info', 'MESSAGE ZEROMQ NO RECEIVED' + msg.toString('utf8'));
                }
            })
        }        
        // Function to read and send results
        let alreadyDone = false;
        const done = (code) => {
            alreadyDone = true;
            if (this.zeromqHost) zeromqSocket.close();
            if (code !== 0) {
                this.publish('failed', `Routine ${this.name} finished with an error code: ${code}`);
                return;
            } 
            let jsonData = {};
            if (this.jsonFile) jsonData = jsonfile.readFileSync(path.join(this.options.cwd, this.jsonFile));
            const payload =  jsonData;

            if (ajv.validate(this.jsonFileSchema, payload)) {
                this.publish('completed', payload);
            } else {
                this.publish('error', `Invalid json schema for routine  ${this.name}: ${JSON.stringify(ajv.errors)}`);                            
            }
            this.kill();
        }

        return super.start()
        .then(() => {  
            if (this.process) {
                if (typeof this.process.on === 'function') {
                    this.process.on('close', (code) => {
                        if (!alreadyDone) {
                            done(code);
                        }
                    });
                }
            }  
            return Promise.resolve();
        })
    }
}

module.exports = Routine;