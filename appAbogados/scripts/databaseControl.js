const { Pool } = require('pg');
const fs = require('fs');


// Create a new pool instance to manage the database connection
const pool = new Pool({
  host:'7add7be1-1f6c-47e1-987f-3a8a50eb78bd.4b2136ddd30a46e9b7bdb2b2db7f8cd0.databases.appdomain.cloud',
  port:32293,
  database:'ibmclouddb',
  user:'ibm_cloud_de5d629e_3196_40cf_ab94_2365fef098f9',
  //password:"srh1Pemn1k697bmu5c6JKg==:dDDs2uYRBhM6ATxdUllQXs2KKONHlK8txfLvVt5Zfmm7CLgYdXLBk97gdRWtp4ErSQpOMO1NTVSX6nhproIYjg==",
  password:"6dc898c24ff1a476bee1acad7ed6bfc5fe1e8f652d4e2f2735ba34c162b66080",
  ssl: {
    ca: fs.readFileSync(__dirname + '/rds-combined-ca-bundle.pem').toString(),
    rejectUnauthorized: true
  }
});


let validTables = [];

// Fill valid tables with the tables in the database
databaseGet().then((tables) => {
  validTables = tables.map(table => table.table_name);
  //console.log("Tables in 'public' schema:", validTables);
}).catch(error => console.error(error));


async function databaseStore(formData) {
  try {
    const client = await pool.connect();
    let query;
    const baseValues = [formData.nombre, formData.apellido, formData.rut, formData.region, formData.vigencia];

    //if (!isNaN(idAsNumber) && Number.isInteger(idAsNumber)) { // Use instead if we have issues validating the ID value
    if (formData.id !== undefined) {
      // Update existing record
      query = `UPDATE "${abogadosTable}" SET nombre = $1, apellido = $2, rut = $3, region = $4, vigencia = $5 WHERE id = $6 RETURNING *`;
      baseValues.push(formData.id);
    } else {
      // Insert new record
      query = `INSERT INTO "${abogadosTable}"(nombre, apellido, rut, region, vigencia) VALUES($1, $2, $3, $4, $5) RETURNING *`;
    }
    const res = await client.query(query, baseValues);
    console.log(res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Error executing query', err.stack);
  }
}


async function databaseGet({ table, ...filters } = {}) {

  let selectQuery;
  if (table) {
    selectQuery = `SELECT * FROM "public"."${table}"`;
  } else {
    // Get all tables from public
    selectQuery = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
  }

  let tableList = JSON.parse(JSON.stringify(validTables));
  if (tableList.length === 0) {
    tableList = ['dim_credenciales', 'ft_comunas', 'ft_ambitos', 'dim_ambitos', 'dim_abogados', 'dim_comunas', 'ft_solicitudes', 'ft_operacion', 'ft_envio'];
  }
  // Fill tables from the database
  if (!tableList.includes(table) && table !== undefined) {
    throw new Error('Invalid table name');
  }

  try {
    const client = await pool.connect();
    
    const conditions = [];
    const values = [];

    Object.entries(filters).forEach(([key, value], index) => {
      if (Array.isArray(value)) {
        conditions.push(`"${key}" = ANY($${index + 1})`);
      } else {
        conditions.push(`"${key}" = $${index + 1}`);
      }
      values.push(value);
    });

    if (conditions.length > 0) {
      selectQuery += ' WHERE ' + conditions.join(' AND ');
    }

    console.log("CONSULTING", selectQuery, values)

    const res = await client.query(selectQuery, values);
    client.release();
    return res.rows;
  } catch (err) {
    console.error('Error executing select query', err.stack);
    throw err; // Rethrow or handle as needed
  }
}

module.exports = { databaseGet, databaseStore };