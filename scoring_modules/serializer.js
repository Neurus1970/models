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
  console.log(filePath);
  console.log(getResourceNameByFileName(filePath));

  var dataStream = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (data) => {
      data.id = data.id.replace(/^0+/, '');
      data.name = data.name.replace(/\s\s+/g, ' ').replace(' ,', ',').trim();
      data.default_probability = {
        within_12_months: data['defaultProbability12months']/100.0
      };
      data['_links'] = {
        href:config.settings.basePath+getResourceNameByFileName(filePath)+'/'+data.id
      };;
      delete data.defaultProbability12months;

      dataStream.push(data);
    })
    .on("end", (err) => {
      if (err) {
        config.logger.error("An error has occurred reading file "+filePath);
        config.logger.error(err)
      } else {
        config.logger.info("Receiving new scoring information... "+filePath);

        // orderno por probabilidad de default para poder contar
        dataStream.sort((a,b) => parseFloat(a.defaultProbability12months) - parseFloat(b.defaultProbability12months));

        getResourceNameByFileName(filePath);
        var rankLimits = computeRankLimits(dataStream, Math.floor(dataStream.length/config.settings.ranks));
        
        // calculo los datos del mercado
        computeStats(dataStream, rankLimits);

        config.logger.info("DONE. Scoring records updated");
        onRecordsetRed(dataStream);
      }
  })
};


function readFile(filePath, fileRed) {
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


function getSampleStats(ds) {
  const p = new Array();
  var x = new Object();
  ds.forEach(d => {
    p.push(d.default_probability.within_12_months);
  });
  x.medianaDeuda = ss.median(p);
  x.desviacion = ss.standardDeviation(p);
  x.mediaDeuda = ss.mean(p);
  return(x);
};


function computeStats(dat, l) {
  // me guardo la mediana de las deudas para dar un indicador relativo
  // de la deuda de cada deudor

  var stats = getSampleStats(dat);

  dat.forEach(d => {
    d.median = stats.medianaDeuda;
    d.mean = stats.mediaDeuda;
    d.stdDev = stats.desviacion;
    d.rank = config.settings.ranks;
    for (i=0; i<=config.settings.ranks-1; i++) {
      if (d.default_probability.within_12_months >= l[i]) {
        d.rank = i+1;
      }
    }
  })
};


function getResourceNameByFileName (fileName) {

  if (fileName == "resources/ResultadoScoringIndividuos.csv")
    return "individuals"
  else
    return "sme"
  /*
  var res;
  config.settings.data.forEach(fs => {
    if(fs.source = fileName)
      resource = fs.resourceName;
  })
  return(res)
  */
};


module.exports = { setupDataSources };

