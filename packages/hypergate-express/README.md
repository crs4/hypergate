# hypergate-express
hypergate-express is built on top of [Express](http://expressjs.com)
and can be used to create a web service to interact  with a hypergate instance usign a REST interface.
Hypergate commands can be triggered with POST requests made to `/command/{hypergate command}` with the command 
payload inside the request body. Hypergate events can be read with GET requests made to `/event/{hypergate event}`. 
For each type of event only the data of the last event is available. The response object of the GET request contains two attributes:

* `data`: payload of the event
* `date`: Number of milliseconds from 01 January, 1970 of the event time in UTC 


# API Reference

<a name="module_hypergateExpress"></a>

## hypergateExpress ⇒ <code>object</code>
The module provides a single method for creating an Express object .

**Returns**: <code>object</code> - Express object app  

| Param | Type | Description |
| --- | --- | --- |
| hypergate | <code>object</code> | The instance of the Hypergate class to use |

**Example**  
```js
const Hypergate = require('hypergate'); 
const hypergate = new Hypergate(<YourPluginsSpecification>);
const hgExpress = require('hypergate-express');
const app = hgExpress(hypergate);

// On the client...
curl -X POST -H "Content-Type: application/json" -d {{<your data>}} {{http://localhost/command/routines/testRoutine/start}}

curl -X GET -H "Content-Type: application/json" {{http://localhost/event/routines/testRoutine/start/error}}
```
