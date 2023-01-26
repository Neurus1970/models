const config = require('../config');
const router = require('express').Router();


function isResourceImplemented(res) {

  var implemented = ["individuals", "sme"];
  var index = implemented.find(element => element == res);

  return(index === undefined ? false : true);

};


router.get(config.settings.basePath+':kind/:id', (req, res) => {
  var initialTime = new Date();
  var data = config.settings.data;
  var posicionElemento = data[req.params.kind].recordSet.findIndex(({id}) => id == req.params.id);
  
  if (posicionElemento == -1) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("404 Not found");
    res.end();
  } else {
   var salida = {
      searchTime: new Date().getTime() - initialTime.getTime(),
      hits: 1,
      debtors: data[req.params.kind].recordSet[posicionElemento]
    }
    res.status(200).json(salida);
  }
});


router.get(config.settings.basePath+':kind', (req, res) => {

  if (isResourceImplemented(req.params.kind)) {

    var initialTime = new Date();
    var deudores = [];
    var deudoresAmostrar = [];
    var data = config.settings.data;

    if (req.query.pageSize === undefined || req.query.pageSize > config.settings.maxPageSize)
      pageSize = config.settings.maxPageSize
    else
      pageSize = parseInt(req.query.pageSize);

    if (req.query.name !== undefined) {
      names = req.query.name.toUpperCase().split(" ");
      data[req.params.kind].recordSet.forEach(v => {
        if(names.every(name => v.name.includes(name))) deudores.push(v);
      });
    } else
      deudores = data[req.params.kind].recordSet;

    if (deudores.length == 0) {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found");

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
      };

      if (deudoresAmostrar.length != 0) {

        var cantidadPaginas = Math.floor(deudores.length / pageSize);
        if (deudores.length % pageSize != 0)
          cantidadPaginas++;

        nextPage = config.settings.basePath+req.params.kind+'?page='.concat(pageNumber+2);
        prevPage = config.settings.basePath+req.params.kind+'?page='.concat(pageNumber);

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
      }

    }

  } else {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("404 Not Found");
  }

  res.end();


});

module.exports = router;
