const express = require('express')
/**
 * The module provides a single method for creating an Express object .
 * 
 * @module hypergateExpress
 * @param {object} hypergate - The instance of the Hypergate class to use
 * @return {object} Express object app
 * @example
 * ```js
 * const Hypergate = require('hypergate'); 
 * const hypergate = new Hypergate(<YourPluginsSpecification>);
 * const hgExpress = require('hypergate-express');
 * const app = hgExpress(hypergate);
 * 
 * // On the client...
 * curl -X POST -H "Content-Type: application/json" -d {{<your data>}} {{http://localhost/command/routines/testRoutine/start}}
 * 
 * curl -X GET -H "Content-Type: application/json" {{http://localhost/event/routines/testRoutine/start/error}}
 * ```
 */
module.exports = function(hypergate) {
    const app = express();

    const events = {};
    hypergate.onAny(function(event, payload) {
        events[event] = {
            data: payload,
            date: Date.now()
        };
    });
    app.post('/command/*', (req, res) => {
        hypergate.command(req.path.slice(9), req.body)
        .then((payload) => {
            res.send(payload);
        })
        .catch((error) => {
            res.status(400).send(error);
        })
    });
    app.get('/event/*', (req, res) => {
        //console.log(`*** Events: ${JSON.stringify(events)}`);
        res.send(events[req.path.slice(7)]);
    });  
    return app;      
}
