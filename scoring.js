const fs = require("fs");
const csvParser = require("csv-parser");
const ss = require('simple-statistics')

const express = require('express');
const app = express();
const querystring = require('querystring');

const port = 2000;

const result = [];
const maxPageSize = 50;

var medianaDeuda = 0;

// COMMON FUNCTIONS
Array.prototype.findByValueOfObject = function(key, value) {
  return this.filter(function(item) {
    return (item[key] === value);
  });
}


// MAIN DATA READER
fs.createReadStream("resources/ResultadoScoringIndividuos.csv")
  .pipe(csvParser())
  .on("data", (data) => {
    result.push(data);
  })
  .on("end", (err) => {
    if (err) console.debug("An error has occurred");
    else {
      console.debug("Receiving financial information about debts...");
      const probabilidades = new Array();

      result.forEach(v => {

        v['id'] = v['id'].replace(/^0+/, '');
        v['name'] = v['name'].replace(/\s\s+/g, ' ').replace(' ,', ',').trim();
        // me lo guardo para calcular la mediana
        probabilidades.push(v['defaultProbability12months']/100.0);

        var default_probabilities = {
          within_3_months: 0,
          within_6_months: 0,
          within_9_months: 0,
          within_12_months: v['defaultProbability12months']/100.0
        };

        v.default_probability = default_probabilities;

        var links = {
          href:"/models/scoring/individuals/"+v.id
        };
        v['_links'] = links;

        delete v['defaultProbability12months'];
      });

      // me guardo la mediana de las deudas para dar un indicador relativo
      // de la deuda de cada deudor
      medianaDeuda = ss.median(probabilidades);
      desviacion = ss.standardDeviation(probabilidades);
      mediaDeuda = ss.mean(probabilidades);

      result.forEach(d => {
        d.percentile = 100 * ((d.default_probability.within_12_months - medianaDeuda) / desviacion);
        d.median = medianaDeuda;
        d.mean = mediaDeuda;
        d.standardDeviation = desviacion;
        d.stdUp = mediaDeuda + desviacion;
        d.stdDown = mediaDeuda - desviacion
      });


      console.debug("DONE. Financial records updated\n");
      //console.debug("\nMedian value of debt: %d\n", medianaDeuda);

      // ahora que tengo cargada en memoria la actualizacion, levanto la API.
      app.listen(port, () => console.debug(`Scoring model API listening on port ${port}!`));
    }
  });


app.get('/models/scoring/individuals/:id', (req, res) => {

  var initialTime = new Date();
  
  var deudores = result.findByValueOfObject("id", req.params.id);

  if (deudores.length == 0) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("404 Not found");
    res.end();
  } else {
   var salida = {
      searchTime: new Date().getTime() - initialTime.getTime(),
      hits: deudores.length,
      debtors: deudores
    }
    res.status(200).json(salida);
  }

});

app.delete('/models/scoring/individuals/:id', (req, res) => {

  var deudorX = result.findByValueOfObject("id", req.params.id);

  if (deudorX.length == 0) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("404 Not found");
  } else {
    result.splice(deudorX, 1);
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write("200 OK")
  }
  
  res.end()

});

app.get('/models/scoring/individuals', (req, res) => {

  var initialTime = new Date();
  var deudores = [];
  var deudoresAmostrar = [];

  if (req.query.pageSize === undefined || req.query.pageSize > maxPageSize)
    pageSize = maxPageSize
  else
    pageSize = parseInt(req.query.pageSize);


  if (req.query.name !== undefined) {
    names = req.query.name.toUpperCase().split(" ");
    result.forEach(v => {
      if(names.every(name => v.name.includes(name))) deudores.push(v);
    });
  } else
    deudores = result;

  if (deudores.length == 0) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("404 Not found");
    res.end();
  } else {
    if (deudores.length < pageSize)
      pageSize = deudores.length;

    if (req.query.page === undefined)
      pageNumber = 0
    else
      pageNumber = parseInt(req.query.page)-1;

    var offset = pageNumber*pageSize;
    var lastRecord = (offset+pageSize > deudores.length ? deudores.length : offset+pageSize);

    for (i=offset; i<lastRecord; i++) {
      deudor = deudores[i];
      deudoresAmostrar.push(deudor);
    }

    if (deudoresAmostrar.length != 0) {

      var cantidadPaginas = Math.floor(deudores.length / pageSize);
      if (deudores.length % pageSize != 0)
        cantidadPaginas++;

      nextPage = '/models/scoring/individuals?page='.concat(pageNumber+2);
      prevPage = '/models/scoring/individuals?page='.concat(pageNumber);

      if (req.query.name !== undefined) {
        nextPage = nextPage.concat("&name=").concat(req.query.name).replace(" ", "%20");
        prevPage = prevPage.concat("&name=").concat(req.query.name).replace(" ", "%20");
      }

      if (req.query.pageSize !== undefined) {
        nextPage = nextPage.concat("&pageSize=").concat(req.query.pageSize);
        prevPage = prevPage.concat("&pageSize=").concat(req.query.pageSize);
      }

      var salida = {
        searchTime: new Date().getTime() - initialTime.getTime(),
        hits: deudores.length,
        pageSize: pageSize,
        dataPages: cantidadPaginas
      }

      if (offset!=0)
        salida.prevPage = prevPage

      if (pageNumber+1 < cantidadPaginas)
        salida.nextPage = nextPage

      salida.debtors = deudoresAmostrar; 

      res.status(200).json(salida);      
    } else {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not found");
      res.end();
    }

  }

});
