const fs = require('fs');
const { databaseGet } = require('./databaseControl');

function dataTest(dataTables) {
  dataTables.forEach((table) => {
    databaseGet({ table: table }, true)
      .then((data) => {
        fs.writeFileSync(`${__dirname}/temp/${table}.json`, JSON.stringify(data, null, 2));
      })
      .catch(error => console.error(error));
  });
}

const testMode = false;

module.exports = { dataTest, testMode };
