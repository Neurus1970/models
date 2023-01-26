const config = require('../config');

const fs = require('fs');
const ss = require('simple-statistics');
const csvParser = require('csv-parser');


// MAIN DATA READER
function setupDataSources(dataSource, dataSourceConfigured) {

  readFile(dataSource.individuals.source, function(data) {
    dataSource.individuals.recordSet = data;
    readFile(dataSource.sme.source, function(data) {
      dataSource.sme.recordSet = data;
      dataSourceConfigured(dataSource);
    })
  })
};


function getRecordset(filePath, onRecordsetRed) {

  var dataStream = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (data) => {
      dataStream.push(data);
    })
    .on("end", (err) => {
      if (err) {
        config.logger.error("An error has occurred reading file ", filePath);
        config.logger.error(err)
      } else {
        config.logger.info("Receiving financial information about debts...");

        var probabilidades = getProbabilities(dataStream, filePath);

        // orderno por probabilidad de default para poder contar
        dataStream.sort((a,b) => a.default_probability.within_12_months - b.default_probability.within_12_months);
        var percentileRanks = Math.floor(dataStream.length/10);
        var rankLimits = computeRankLimits(dataStream, percentileRanks);
        
        // calculo los datos del mercado
        computeStats(dataStream, rankLimits, probabilidades);

        config.logger.info("DONE. Scoring records updated");
        onRecordsetRed(dataStream);
      }
  })
};


function readFile(filePath, fileRed) {
  // resurrecting watcher after changes processed
  getRecordset(filePath, function(data) {
    watchOnce(filePath);
    fileRed(data)
  })
};


function watchOnce(filePath) {
  const watcher = fs.watch(filePath, (evt, file) => {
    watcher.close();
    config.logger.info(Date(), evt, file);
    
    // refreshing recordset
    getRecordset(filePath, function(newData) {
      if (filePath == config.settings.data.individuals.source)
        config.settings.data.individuals.recordSet = newData
      else
        config.settings.data.sme.recordSet = newData
    });

    // resurrecting watcher after changes processed
    watchOnce(filePath);

  })
};


function computeRankLimits(ds, pr) {
  var rl = new Array;
  for (i=0; i<=9; i++)
    rl.push(ds[i*pr].default_probability.within_12_months);
  config.logger.debug(`RANK LIMITS: ${rl}`);
  return(rl)
};


function computeStats(dat, l, p) {
  // me guardo la mediana de las deudas para dar un indicador relativo
  // de la deuda de cada deudor
  var medianaDeuda = ss.median(p);
  var desviacion = ss.standardDeviation(p);
  var mediaDeuda = ss.mean(p);

  dat.forEach(d => {
    d.median = medianaDeuda;
    d.mean = mediaDeuda;
    d.stdDev = desviacion;
    d.rank = 10;
    for (i=0; i<=9; i++) {
      if (d.default_probability.within_12_months >= l[i]) {
        d.rank = i+1;
      }
    }
  })
};


function getProbabilities(ds, fp) {

  const p = new Array();
  ds.forEach(v => {
    v['id'] = v['id'].replace(/^0+/, '');
    v['name'] = v['name'].replace(/\s\s+/g, ' ').replace(' ,', ',').trim();
    // me lo guardo para calcular la mediana
    p.push(v['defaultProbability12months']/100.0);

    var default_probabilities = {
      within_12_months: v['defaultProbability12months']/100.0
    };

    v.default_probability = default_probabilities;

    var basePath = config.settings.basePath;

    switch (fp) {
      case(config.settings.data.individuals.source):
        basePath+="individuals/";
        break;
      case(config.settings.data.sme.source):
        basePath+="sme/";
        break;
    };

    var links = {
      href:basePath+v.id
    };
    v['_links'] = links;

    delete v['defaultProbability12months'];

  });

  return (p)

};

module.exports = { setupDataSources };
