const config = require('../config');

const fs = require('fs');
const ss = require('simple-statistics');

const csvParser = require('csv-parser');

let result = [];

// MAIN DATA READER
fs.createReadStream(config.filePath)
  .pipe(csvParser())
  .on("data", (data) => {
    result.push(data);
  })
  .on("end", (err) => {
    if (err) {
      logger.error("An error has occurred reading file ", config.filePath);
      logger.error(err)
    } else {
      logger.info("Receiving financial information about debts...");
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

    // orderno por probabilidad de default para poder contar
    result.sort((a,b) => a.default_probability.within_12_months - b.default_probability.within_12_months);
    var percentileRanks = Math.floor(result.length/10);
    var rankLimits = [];
    for (i=0; i<=9; i++) {
      limit = result[i*percentileRanks].default_probability.within_12_months;
      rankLimits.push(limit);
    };

    logger.debug(`RANK LIMITS: ${rankLimits}`);

    // me guardo la mediana de las deudas para dar un indicador relativo
    // de la deuda de cada deudor
    var medianaDeuda = ss.median(probabilidades);
    var desviacion = ss.standardDeviation(probabilidades);
    var mediaDeuda = ss.mean(probabilidades);

    result.forEach(d => {
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

    logger.info("DONE. Financial records updated");
    app.emit('ready');

  }
});


fs.watch(config.filePath, function(event, filename) {
  if(filename){
    logger.info('Event : ' + event);
    logger.info(filename + ' file Changed ...');
    //file = fs.readFileSync(config.filePath);
    //console.log('File content at : ' + new Date() + ' is \n' + file);
  }
  else{
    logger.error('filename not provided')
  }
});


module.exports = { result }

