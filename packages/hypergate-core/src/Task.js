
const PluginController = require('./PluginController');
const Ajv = require('ajv');
const ajv = new Ajv();
/**
 * Define a  task that will be executed upon request of a remote application through a connection
 * 
 * @class 
 */
class Task extends PluginController {
    constructor(name, params, eventEmitter) {
        super('tasks', name, params, eventEmitter);
        this.options.detached = params.detached || true;
        this.stdinSchema = params.stdinSchema || {};
        this.stdoutSchema = params.stdoutSchema || {};
    }
    /**
     * Start the task application as a child process
     * 
     * @memberof Task
     */
    start(data) {
        if (!ajv.validate(this.stdinSchema, data)) {
            const msg = `Invalid input json schema for task  ${this.name}: ${JSON.stringify(ajv.errors)}`;                 
            return Promise.reject(msg);
        }
        return super.start()
        .then(() => {  
            if (this.process) {
                if (typeof this.process.on === 'function') {
                    
                    if (data) {
                        this.process.stdin.write(JSON.stringify(data));
                        this.process.stdin.end();
                    }
                    this.process.stdout.removeAllListeners('data');
                    this.process.stdout.on('data', (chunk) => {
                        let data;
                        try {
                            data = JSON.parse(chunk.toString());
                        } catch (e) {
                            console.log(chunk.toString()); 
                            this.publish('error', `Invalid json output string for task  ${this.name}: ${JSON.stringify(e)}`); 
                            return;
                        }
                        if (!ajv.validate(this.stdoutSchema, data)) {
                            console.log(data); 
                            this.publish('error', `Invalid json output schema for task  ${this.name}: ${JSON.stringify(ajv.errors)}`);  
                            return
                        } 
                        this.publish('stdout', data);
                    });
                }
            }  
            return Promise.resolve();
        });
    }
}

module.exports = Task;