const chai = require('chai');
const chaiHttp = require('chai-http');
const config = require('../config.js');

config.log.level = "info"

const app = require('../scoring.js').app;


chai.should()
chai.use(chaiHttp)


before(function (done) {
  app.on("appStarted", function(){
    done();
  });
});

describe('When I GET the list of scored debtors', () => {

  it('responds with HTTP 200 and a list of individuals', () => {
    return chai.request(app)
      .get('/models/scoring/individuals')
      .then(res => {
        res.should.have.status(200)
      })
      .catch(err => {
        throw err
    })
  });


  it('contains a list with '+ config.maxPageSize +' elements', () => {
    return chai.request(app)
      .get('/models/scoring/individuals')
      .then(res => {
        res.body.debtors.should.have.length(config.maxPageSize)
      })
      .catch(err => {
        throw err
    })
  });

  it('should contain a list of 10 debtors when specified', () => {
    return chai.request(app)
      .get('/models/scoring/individuals?pageSize=10')
      .then(res => {
        res.body.debtors.should.have.length(10)
      })
      .catch(err => {
        throw err
    })
  });

})


after((done) => {
  app.emit('shutdown');
  console.log('Call for shutdown');
});