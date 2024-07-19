const fs = require('fs');
const { databaseGet } = require('./databaseControl');

/*

  Tables in 'public' schema: [
    { table_name: 'dim_credenciales' },
    { table_name: 'ft_comunas' },
    { table_name: 'ft_ambitos' }, // Rut abogado -> Las tag que le corresponde (ids)
    { table_name: 'dim_ambitos' }, // id Tag -> Nombre tag
    { table_name: 'dim_abogados' },
    { table_name: 'dim_comunas' }, // id -> Territorio
    { table_name: 'ft_solicitudes' }, // Solicitudes de prueba
    { table_name: 'ft_operacion' },
    { table_name: 'ft_envio' }
  ]

  --> dim Data corresponds to the Text data information corresponding to each table
  --> ft Data corresponds to the registry of each table

  Cliente form data format:
  formData {
    _csrf: '',
    name: '',
    Apellidos: '',
    email: 'a@b.c',
    Region: '',
    Comuna: '',
    Problema: '',
    archivo: {}
  }
*/

function dataTest(dataTables) {
  dataTables.forEach((table) => {
    databaseGet({ table: table })
      .then((data) => {
        fs.writeFileSync(`${__dirname}/temp/${table}.json`, JSON.stringify(data, null, 2));
      })
      .catch(error => console.error(error));
  });
}

module.exports = { dataTest };