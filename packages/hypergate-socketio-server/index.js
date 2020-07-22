
const Io = require('socket.io');
/**
 * An instance of the HypergateAWSMqtt class is a {@link https://socket.io/docs/server-api/ | Socket.io Server instance}.
 * 
 * @class HypergateSocketioServer
 * @param {object} hypergate - The instance of the Hypergate class to use
 * @param {string} httpServer -  the server to bind to.
 * @param {object} options - Socket.io options
 * @example
 * ```js
 * const Hypergate = require('hypergate'); 
 * const HgSocketIoServer = require('hypergate-socketio-server');
 * const io = require('socket.io-client');
 * const httpServer = require('http').createServer();
 * const port = 3000;
 * httpServer.listen(port);
 * const options = { serveClient: false };
 * const hypergate = new Hypergate(<YourPluginsSpecification>);
 * const socketServer = new HgSocketIoServer(hypergate, httpServer, options);
 * const socketClient = io(`http://localhost:${port}`);        
 * 
 * socketClient.on('routines/testRoutine/start/done', (payload) =>  {
 *     console.log('Done: ' + payload)
 * })
 * socketClient.on('routines/testRoutine/start/failed', (payload) =>  {
 *     console.log('Failed: '+payload)
 * })
 * socketClient.on('connect', (payload) =>  {
 *     socketClient.emit('routines/testRoutine/start');
 * });
 * ```
 */
class Server extends Io {
    constructor(hypergate, httpServer, options) {
        super(httpServer, options);
        this.on('connection', function (socket) {
            socket.use((packet, next) => {
                const topic = packet[0];
                const payload = packet[1];
                hypergate.command(topic, payload)
                .then((data) => {
                    socket.emit(topic + '/done', data);
                }) 
                .catch((error) => {
                    socket.emit(topic + '/failed', error.toString());
                })
            });
            hypergate.onAny(function(event, payload) {
                socket.emit(event, payload)
            });
        });
    }
}
module.exports = Server;