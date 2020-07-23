
const chai = require('chai');
const expect = chai.expect;
const Hypergate = require('../');

function logger(hypergate) {
    hypergate.onAny(function(event, value) {
        console.log(`*** Event: ${event}, *** Payload: ${JSON.stringify(value)}.`);
    })
}

describe('hypergate', () => {
    it('should have method that return the status with the version number and active plugins', function(done) {
        const hypergate = new Hypergate({});
        const status = hypergate.getStatus();
        expect(status).to.have.all.keys('version', 'routines', 'services', 'tasks');
        done();
    })
    it('should return the status event when requested', function(done) {
        const hypergate = new Hypergate({});
        hypergate.command('hypergate/status/request')
        .then((payload) => {
            expect(payload).to.have.all.keys('version', 'routines', 'services', 'tasks');
            done(); 
        })
    })
    it('should receive a start command for a defined but not installed routine', function() {
        const hypergate = new Hypergate({ routines: { testRoutine: {} } })
        return hypergate.command('routines/testRoutine/start')
    })
    it('should receive a start command for a test service', function() {
        const hypergate = new Hypergate({ services: { testService: {} } })
        return hypergate.command('services/testService/start')    
    })
    
    it('should receive a start command for a test task', function() {
        const hypergate = new Hypergate({ tasks: { testTask: {} } })
        return hypergate.command('tasks/testTask/start')  
    })
    it('should communicate with a routine through arguments and stdio', function(done) {
        let count = 0;
        const hypergate = new Hypergate({
            routines: {
                testRoutine1: {
                    path: './sample',
                    command: 'node',
                    args: ['sampleRoutineJSON.js', 'arg1']
                }
            }
        })
        hypergate.once('routines/testRoutine1/stdout', (payload) =>  {
            expect(payload).to.include('arg1');
            count++;
            if (count === 2) done();  
        });
        hypergate.once('routines/testRoutine1/stderr', (payload) =>  {
            expect(payload).to.include('err1');  
            count++;
            if (count === 2) done();  
        });
        hypergate.command('routines/testRoutine1/start')
        .catch(done);
    })
    it('should communicate with a routine through a json file', function(done) {      

        const hypergate = new Hypergate({
            routines: {
                testRoutine: {
                    path: './sample',
                    command: 'node',
                    args: ['sampleRoutineJSON.js', 'arg1'],
                    jsonFile: 'temp.json',
                    jsonFileSchema: {
                        "type": "object",
                        "properties": {
                            "param1": {
                                "type": "string"
                            },
                            "val1": {
                                "type": "string"
                            },
                            "val2": {
                                "type": "string"
                            },
                            "val3": {
                                "type": "integer"
                            }
                        }
                    }
                }
            }
        });
        hypergate.once('routines/testRoutine/completed', (payload) =>  {
            expect(payload).to.include({
                val1: 'val1',
                val2: 'arg1',
                val3: 3
            });
            done();
        });
        hypergate.command('routines/testRoutine/start', { param1: 'val1' } )
        .catch(done);        
    })
    it('should communicate with a routine through a zeroMQ socket', function(done) {
        
        const hypergate = new Hypergate({
            routines: {
                testRoutine: {
                    path: './sample',
                    command: 'node',
                    args: ['sampleRoutineZeroMQ.js', 'arg1', "-f temp.json", "-z tcp://127.0.0.1:9998"],
                    jsonFile: 'temp.json',
                    zeromqHost: "tcp://127.0.0.1:9998",
                    jsonFileSchema: {
                        "type": "object",
                        "properties": {
                            "param1": {
                                "type": "string"
                            },
                            "val1": {
                                "type": "string"
                            },
                            "val2": {
                                "type": "string"
                            },
                            "val3": {
                                "type": "integer"
                            }
                        }
                    }
                }
            }
        })
        hypergate.once('routines/testRoutine/completed', (payload) =>  {
            expect(payload).to.include({
                val1: 'val1',
                val2: 'arg1',
                val3: 3
            });
            done();
        });
        hypergate.command('routines/testRoutine/start', { param1: 'val1' } )
        .catch(done); 
    })
    it('should communicate with a test service through arguments and stdio', function(done) {
        let count = 0;
        function ok() {         
            if (count === 2) done();
        }
        
        const hypergate = new Hypergate({ services: { 
            testService: {
                path: './sample',
                command: 'node',
                args: ['sampleService.js', 'arg1'],
                autoStarts: 1
            } 
        } });
        hypergate.on('services/testService/stdout', (payload) =>  {
            expect(payload).to.include('val1');
            count++;
            ok(); 
        });
        hypergate.on('services/testService/stderr', (payload) =>  {
            expect(payload).to.include('err1');
            count++;
            ok();  
        });       
    })
    it('should receive a restart command for a defined but not installed service', function() {
        const hypergate = new Hypergate({ services: { testService: {
            path: './sample',
            command: 'node',
            args: ['sampleService.js', 'arg1'],
            autoStarts: 1
        }  } })
        return hypergate.command('services/testService/restart')  
    })
    it('should communicate with a test service through a zeroMQ socket', function(done) {
        

        const hypergate = new Hypergate({ services: { 
            testService: {
                path: './sample',
                command: 'node',
                args: ['sampleService.js', 'arg1'],
                autoStarts: 0,
                zeromqHost: "tcp://127.0.0.1:9998",
                inputSchema: {
                    "type": "object",
                    "properties": {
                        "param1": {
                            "type": "string"
                        }
                    }
                },
                outputSchema: {
                    "type": "object",
                    "properties": {
                        "val1": {
                            "type": "string"
                        },
                        "val2": {
                            "type": "integer"
                        }
                    }
                }
            } 
        } })
        hypergate.once('services/testService/output', (payload) =>  {
            expect(payload).to.have.all.keys('val1', 'val2');        
            done(); 
        });
        hypergate.command('services/testService/start')
        .then(() => {
            hypergate.command('services/testService/input', { param1: 'ciao'})
        })
        .catch(done);        
    })
    it('should start a test task', function(done) {
        //this.timeout(100);
        const jsonfile = require('jsonfile');
        jsonfile.writeFileSync('./sample/temp.json', { systemParam: false});
        const hypergate = new Hypergate({ 
            tasks: { 
                testTask: {
                    path: './sample',
                    command: 'node',
                    args: ['sampleTask.js']
                } 
            } 
        });
        hypergate.command('tasks/testTask/start')
        .then(() => {
            setTimeout(() => {
                jsonfile.readFile('./sample/temp.json', (error, data) => {
                    if (error) return done(error);
                    expect(data).to.include({ systemParam: true });
                    done();
                })
            }, 500); 
        })
        .catch(done);

    })
    it('should communicate with a test task through stdin and stdout', function(done) {     
        const hypergate = new Hypergate({ tasks: { 
            testTask: {
                path: './sample',
                command: 'node',
                args: ['sampleTaskStdio.js'],
                stdinSchema: {
                    "type": "object",
                    "properties": {
                        "param1": {
                            "type": "string"
                        }
                    }
                },
                stdoutSchema: {
                    "type": "object",
                    "properties": {
                        "val1": {
                            "type": "string"
                        },
                        "val2": {
                            "type": "integer"
                        }
                    }
                }
            } 
        } })
        //logger(hypergate);
        hypergate.once('tasks/testTask/stdout', (payload) =>  {
            expect(payload).to.have.all.keys('val1', 'val2');        
            done(); 
        });
        hypergate.command('tasks/testTask/start',{ param1: 'ciao'})
        .catch(done);        
    })
})