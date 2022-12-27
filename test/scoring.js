const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../scoring.js').app;

chai.should()
chai.use(chaiHttp)


before(function (done) {
  app.on("appStarted", function(){
    done();
  });
});

describe('List of individuals', () => {

  it('responds with HTTP 200 and a list of individuals', () => {
    return chai.request(app)
      .get('/individuals/scoring')
      .then(res => {
        res.should.have.status(200)
      })
      .catch(err => {
        throw err
      })
  })

})


after((done) => {
  app.emit('shutdown');
  console.log('Call for shutdown');
});