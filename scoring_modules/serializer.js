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
        const probabilidades = new Array();

        dataStream.forEach(v => {

          v['id'] = v['id'].replace(/^0+/, '');
          v['name'] = v['name'].replace(/\s\s+/g, ' ').replace(' ,', ',').trim();
          // me lo guardo para calcular la mediana
          probabilidades.push(v['defaultProbability12months']/100.0);

          var default_probabilities = {
            within_12_months: v['defaultProbability12months']/100.0
          };

          v.default_probability = default_probabilities;

          basePath = "/models/scoring/";

          switch (filePath) {
            case("resources/ResultadoScoringIndividuos.csv"):
              basePath+="individuals/";
              break;
            case("resources/ResultadoScoringSMEs.csv"):
              basePath+="sme/";
              break;
          }

          var links = {
            href:basePath+v.id
          };
          v['_links'] = links;

          delete v['defaultProbability12months'];
        });

        // orderno por probabilidad de default para poder contar
        dataStream.sort((a,b) => a.default_probability.within_12_months - b.default_probability.within_12_months);
        var percentileRanks = Math.floor(dataStream.length/10);
        var rankLimits = [];
        for (i=0; i<=9; i++) {
          limit = dataStream[i*percentileRanks].default_probability.within_12_months;
          rankLimits.push(limit);
        };

        config.logger.debug(`RANK LIMITS: ${rankLimits}`);

        // me guardo la mediana de las deudas para dar un indicador relativo
        // de la deuda de cada deudor
        var medianaDeuda = ss.median(probabilidades);
        var desviacion = ss.standardDeviation(probabilidades);
        var mediaDeuda = ss.mean(probabilidades);

        dataStream.forEach(d => {
          d.median = medianaDeuda;
          d.mean = mediaDeuda;
          d.stdDev = desviacion;
          d.rank = 10;
          for (i=0; i<=9; i++) {
            if (d.default_probability.within_12_months >= rankLimits[i]) {
              d.rank = i+1;
            }
          };
        });

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
  });
};


function watchOnce(filePath) {
  const watcher = fs.watch(filePath, (evt, file) => {
    watcher.close();
    config.logger.info(Date(), evt, file);
    // resurrecting watcher after changes processed
    getRecordset(filePath, function(newData) {
      if (fileName = config.settings.data.individuals.source)
        config.settings.data.individuals.recordSet = newData
      else
        config.settings.data.sme.recordSet = newData
    });
    watchOnce(filePath);

  })
};



module.exports = { setupDataSources };

