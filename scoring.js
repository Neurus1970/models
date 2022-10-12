const fs = require("fs");
const csvParser = require("csv-parser");

const express = require('express');
const app = express();
const querystring = require('querystring');

const port = 2000;

const result = [];
const maxPageSize = 50;

Array.prototype.findByValueOfObject = function(key, value) {
  return this.filter(function(item) {
    return (item[key] === value);
  });
}


fs.createReadStream("resources/ResultadoScoringIndividuos.csv")
  .pipe(csvParser())
  .on("data", (data) => {
    result.push(data);
  })
  .on("end", (err) => {
    if (err) console.log("An error has occurred");
    else {
      console.log("Recibido nuevo modelo de prediccion de score futuro!");
    }
  });

  
app.listen(port, () => console.log(`model scoring API listening on port ${port}!`));


app.get('/models/scoring/individuals/:id', (req, res) => {

  var initialTime = new Date();
  var deudores = result.findByValueOfObject("NRO_DOCUMENTO_1", req.params.id.padStart(18, "0"));
  if (deudores.length == 0) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("404 Not found");
    res.end();
  } else
    deudores[0].NOMBRE_DEUDOR = deudores[0].NOMBRE_DEUDOR.replace(/\s\s+/g, ' ').replace(' ,', ',');
    
    var salida = {
      searchTime: new Date().getTime() - initialTime.getTime(),
      hits: deudores.length,
      debtors: deudores
    }

    res.status(200).json(salida);
});


app.get('/models/scoring/individuals', (req, res) => {

  var initialTime = new Date();
  var deudores = [];
  var deudoresAmostrar = [];

  if (req.query.pageSize === undefined || req.query.pageSize > maxPageSize)
    pageSize = maxPageSize
  else
    pageSize = parseInt(req.query.pageSize);


  if (req.query.NOMBRE_DEUDOR !== undefined) {
    names = req.query.NOMBRE_DEUDOR.toUpperCase().split(" ");
    result.forEach(v => {
      if(names.every(name => v.NOMBRE_DEUDOR.includes(name))) deudores.push(v);
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
      deudor.NOMBRE_DEUDOR = deudor.NOMBRE_DEUDOR.replace(/\s\s+/g, ' ').replace(' ,', ',');
      deudoresAmostrar.push(deudor);
    }

    if (deudoresAmostrar.length != 0) {
      var cantidadPaginas = Math.floor(deudores.length / pageSize);
      if (deudores.length % pageSize != 0)
        cantidadPaginas++;

      nextPage = '/models/scoring/individuals?page='.concat(pageNumber+2);
      prevPage = '/models/scoring/individuals?page='.concat(pageNumber);

      if (req.query.NOMBRE_DEUDOR !== undefined) {
        nextPage = nextPage.concat("&NOMBRE_DEUDOR=").concat(req.query.NOMBRE_DEUDOR).replace(" ", "%20");
        prevPage = prevPage.concat("&NOMBRE_DEUDOR=").concat(req.query.NOMBRE_DEUDOR).replace(" ", "%20");
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
