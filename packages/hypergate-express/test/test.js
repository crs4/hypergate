
const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const Hypergate = require('@josefransaenz/hypergate-core');
const hgExpress = require('../index'); 


describe('POST /command/*', function () {
    it('respond to a POST /command', function (done) {
        const hypergate = new Hypergate({ routines: { testRoutine: {}}});
        const app = hgExpress(hypergate);
        request(app)
        .post('/command/hypergate/status/request')
        .set('Accept', 'application/json')
        .expect(200)
        .then((response) => {
            expect(response.body).to.have.all.keys('version', 'routines', 'services', 'tasks');  
            hypergate.stop(); 
            done();
        })
        .catch(done);
    });
    it('respond to GET /event/*', function (done) {
        const hypergate = new Hypergate({ routines: { testRoutine: {}}});
        const app = hgExpress(hypergate);
        request(app)
        .post('/command/routines/testRoutine/start')
        .set('Accept', 'application/json')
        .expect(200)      
        .then((response) => {
            //console.log(Date.now())
            return request(app)
            .get('/event/routines/testRoutine/error')
            .set('Accept', 'application/json')
            .expect(200)
        })
        .then((response) => {
            expect(response.body).to.have.all.keys('data', 'date'); 
            //console.log(response.body.date)             
            hypergate.stop();  
            done();
        })
        .catch(done);
    });
});