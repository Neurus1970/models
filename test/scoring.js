const config = require('../config.js');
const app = require('../scoring.js').app;

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

var first_individual = 0;
var dataPages = 0;

chai.should();
chai.use(chaiHttp);

before(function (done) {
  app.on("appStarted", function() {
    config.settings.log.level = "info";
    done();
  });
});


describe('When a consumer application call the API, to GET the list of scored individuals', () => {

  it('responds with HTTP 200 response code', () => {
    return chai.request(app)
      .get('/models/scoring/individuals')
      .then(res => {
        res.should.have.status(200);
        first_individual = res.body.debtors[0];
        dataPages = res.body.dataPages;
      })
      .catch(err => {
        throw err
    })
  });

  it('contains a list with '+ config.settings.maxPageSize +' elements', () => {
    return chai.request(app)
      .get('/models/scoring/individuals')
      .then(res => {
        res.body.debtors.should.have.length(config.settings.maxPageSize)
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


  it('should return a 404 error when a client request a page out of bounds', () => {
    return chai.request(app)
      .get('/models/scoring/individuals?page='+dataPages+1)
      .then(res => {
        res.should.have.status(404);
      })
      .catch(err => {
        throw err
    })
  });


});

describe('When a consumer application navigates to a specific scored individual', () => {

  it('responds with HTTP 404 response code when the SME does not exist', () => {
    return chai.request(app)
      .get('/models/scoring/individuals/0')
      .then(res => {
        res.should.have.status(404)
      })
      .catch(err => {
        throw err
    })
  });

  it('responds with HTTP 200 response code when the individual does exists', () => {
    return chai.request(app)
      .get(first_individual._links.href)
      .then(res => {
        res.should.have.status(200)
      })
      .catch(err => {
        throw err
    })
  });

});

describe('When a consumer application apply a filter by individual name', () => {

  it('responds with HTTP 404 response code when the individual does not exist', () => {
    return chai.request(app)
      .get('/models/scoring/individuals?name=INEXISTENTE')
      .then(res => {
        res.should.have.status(404)
      })
      .catch(err => {
        throw err
    })
  });

  it('displays a list of individuals whose names are cointained in the filter ', () => {
    return chai.request(app)
      .get('/models/scoring/individuals?name='+first_individual.name.split(',')[0])
      .then(res => {
        var notMatching = [];
        var names = first_individual.name.split(',')[0].split(' ');

        res.body.debtors.forEach(v => {
          if(names.every(name => v.name.includes(name))) {
            config.logger.debug(v.name + ' COINCIDE CON LAS PALABRAS CLAVE: ' +first_individual.name.split(',')[0]);
          } else { notMatching.push(v.name) }
        });
        notMatching.should.have.lengthOf(0);
      })
      .catch(err => {
        throw err
    })
  });


})


describe('When a consumer application call the API, to GET the list of scored SME', () => {

  it('responds with HTTP 200 response code', () => {
    return chai.request(app)
      .get('/models/scoring/sme')
      .then(res => {
        res.should.have.status(200);
        first_individual = res.body.debtors[0];
        dataPages = res.body.dataPages;
      })
      .catch(err => {
        throw err
    })
  });

  it('contains a list with '+ config.settings.maxPageSize +' elements', () => {
    return chai.request(app)
      .get('/models/scoring/sme')
      .then(res => {
        res.body.debtors.should.have.length(config.settings.maxPageSize)
      })
      .catch(err => {
        throw err
    })
  });

  it('should contain a list of 10 SME when specified', () => {
    return chai.request(app)
      .get('/models/scoring/sme?pageSize=10')
      .then(res => {
        res.body.debtors.should.have.length(10)
      })
      .catch(err => {
        throw err
    })
  });


  it('should return a 404 error when a client request a page out of bounds', () => {
    return chai.request(app)
      .get('/models/scoring/sme?page='+dataPages+1)
      .then(res => {
        res.should.have.status(404);
      })
      .catch(err => {
        throw err
    })
  });


});

describe('When a consumer application navigates to a specific scored SME', () => {

  it('responds with HTTP 404 response code when the SME does not exist', () => {
    return chai.request(app)
      .get('/models/scoring/sme/0')
      .then(res => {
        res.should.have.status(404)
      })
      .catch(err => {
        throw err
    })
  });

  it('responds with HTTP 200 response code when the SME does exist', () => {
    return chai.request(app)
      .get(first_individual._links.href)
      .then(res => {
        res.should.have.status(200)
      })
      .catch(err => {
        throw err
    })
  });

});

describe('When a consumer application apply a filter by SME name', () => {

  it('responds with HTTP 404 response code when the SME does not exist', () => {
    return chai.request(app)
      .get('/models/scoring/sme?name=INEXISTENTE')
      .then(res => {
        res.should.have.status(404)
      })
      .catch(err => {
        throw err
    })
  });

  it('displays a list of SME whose names are cointained in the filter ', () => {
    return chai.request(app)
      .get('/models/scoring/sme?name='+first_individual.name.split(',')[0])
      .then(res => {
        var notMatching = [];
        var names = first_individual.name.split(',')[0].split(' ');

        res.body.debtors.forEach(v => {
          if(names.every(name => v.name.includes(name))) {
            config.logger.debug(v.name + ' COINCIDE CON LAS PALABRAS CLAVE: ' +first_individual.name.split(',')[0]);
          } else { notMatching.push(v.name) }
        });
        notMatching.should.have.lengthOf(0);
      })
      .catch(err => {
        throw err
    })
  });

});


after((done) => {
  app.emit('shutdown');
  config.logger.info('Call for shutdown');
});
