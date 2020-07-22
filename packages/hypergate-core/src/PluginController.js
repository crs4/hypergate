const { spawn } = require('child_process');

/**
 * Define a program that will be excecuted upon request of a remote application through a connection
 * 
 * @class PluginController
 * @author Jose F. Saenz
 */
class PluginController {
    /**
     * Creates an instance of PluginController.
     * @param {any} pluginType 
     * @param {any} pluginName 
     * @param {any} params 
     * @param {any} hypergate 
     * @memberof PluginController
     */
    constructor(pluginType, pluginName, params, hypergate) {
        this.type = pluginType;
        this.name = pluginName;
        this.baseTopic = this.name + '/' + this.type;
        this.hypergate = hypergate; 
        this.process;
        this.command = params.command || `${this.name}.exe`;
        this.args = params.args || [];
        this.options = {
            cwd: params.path || `./`,
            stdio: 'pipe'
        };
        this.process = null;
        this.status = {
            running: false,
            lastStart: 0
        };               
    }

    start() {
        if (this.process) {
            const msg = `Plugin ${this.name} is already active.`;
            return Promise.reject(msg);
        }
        this.process = spawn(this.command, this.args, this.options);
        this.status.running = true;
        this.status.lastStart = Date.now();

        this.publish('start', `Starting '${this.name}'...`);

        this.process.on('error', (err) => {
            this.status.running = false;
            this.publish('error', `Failed to communicate with plugin '${this.name}': ${err}`);
            this.process = null;
        });

        this.process.on('exit', (code) => {
            this.status.running = false;
            this.publish('exit', `${this.name} process exited with code: ${code}`);
            this.process = null;
        });

        this.process.stdout.on('data', (data) => {
            this.publish('stdout', data.toString());
        });
        
        this.process.stderr.on('data', (data) => {
            this.publish('stderr', data.toString());                
        });

        return Promise.resolve();
    }
    /**
     * Handle the emition of events through the connection, setting the topic full name and verifiying schema
     * 
     * @param {any} topic - short name of the topic 
     * @param {any} data  - data to be send
     * @memberof PluginController
     */
    publish(topic, data) {
        return this.hypergate.emit(this.type + '/' + this.name + '/' + topic, data);
    }

    kill() {
        if (this.process) {
            if (typeof this.process.kill === 'function') {
                this.process.kill();
            }
        }
        return Promise.resolve();
    }
}

module.exports = PluginController;