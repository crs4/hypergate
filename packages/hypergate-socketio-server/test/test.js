const chai = require('chai');
const expect = chai.expect;
const HgSocketIoServer = require('../index');
const io = require('socket.io-client');

const httpServer = require('http').createServer();
const port = 3000;
httpServer.listen(port);

const options = {
    serveClient: false
};

const Hypergate = require('hypergate');


describe('hypergate-socketio-server', function() {
    it('should respond to the status command', function(done) {
        this.timeout(5000);
        const hypergate = new Hypergate({ routines: { testRoutine: {}}});
        hypergate.onAny(function(event, value) {
            //console.log(`*** Event: ${event}, *** Payload: ${JSON.stringify(value)}.`);
        })
        const socketServer = new HgSocketIoServer(hypergate, httpServer, options);
        
        const socketClient = io(`http://localhost:${port}`);        
        
        let initialStatus = false;
        socketClient.on('routines/testRoutine/error', (payload) =>  {
            socketClient.close();
            socketServer.close();
            hypergate.stop();
            done();  
        });

        socketClient.on('routines/testRoutine/start/done', (payload) =>  {
            console.log('Done: '+payload)
        })
        socketClient.on('routines/testRoutine/start/failed', (payload) =>  {
            console.log('Failed: '+payload)
        })
        socketClient.on('connect', (payload) =>  {
            socketClient.emit('routines/testRoutine/start');
        });
    })
})