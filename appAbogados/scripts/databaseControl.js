const { Pool } = require("pg");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// Create a new pool instance to manage the database connection
const pool = new Pool({
  host: process.env.host,
  port: process.env.port,
  database: process.env.database,
  user: process.env.user,

  password: process.env.password,
  ssl: {
    ca: fs.readFileSync(__dirname + "/rds-combined-ca-bundle.pem").toString(),
    rejectUnauthorized: true,
  },
});

let validTables = [];

// Fill valid tables with the tables in the database
databaseGet()
  .then((tables) => {
    validTables = tables.map((table) => table.table_name);
    //console.log("Tables in 'public' schema:", validTables);
  })
  .catch((error) => console.error(error));

async function databaseInsert(table, data) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`);

  const query = `
    INSERT INTO ${table} (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING *;
  `;

  console.log("INSERTING", query, values);

  const client = await pool.connect();
  const result = await client.query(query, values);
  client.release();

  return result.rows[0];
}

async function insertAbogado(formData) {
  // Perform uniqueness check
  const client = await pool.connect();
  const checkQuery = `SELECT 1 FROM dim_abogados WHERE rut = $1`;
  const checkResult = await client.query(checkQuery, [formData.rut]);
  client.release();
  
  if (checkResult.rows.length > 0) {
    const error = new Error("Lawyer already registered");
    error.code = "RUT_ALREADY_REGISTERED";
    throw error;
  }

  // Properly adjust formData to our database schema
  delete formData.formType;
  delete formData.especialidades;

  formData.costo_ser_primer_adelant = null;
  formData.costo_ser_cuota_litis = null;
  formData.costo_ser_gastos_tramitacion = null;
  formData.req_cliente_sin_ant_penales = null;
  formData.req_cliente_sin_ant_com = null;
  formData.req_cliente_residencia_regular = null;

  return databaseInsert("dim_abogados", formData);
}


async function getTableColumns(table) {
  const client = await pool.connect();
  try {
    const colQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `;
    const colResult = await client.query(colQuery, [table]);
    return colResult.rows.map(r => r.column_name);
  } finally {
    client.release();
  }
}

async function databaseGet({ table, ...filters } = {}, regEmpty = false) {
  let selectQuery;
  if (table) {
    selectQuery = `SELECT * FROM "public"."${table}"`;
  } else {
    // Get all tables from public
    selectQuery = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
  }

  let tableList = JSON.parse(JSON.stringify(validTables));
  if (tableList.length === 0) {
    tableList = [
      "dim_comunas_chile",
      "ft_pagos",
      "ft_casos_perdidos",
      "dim_credenciales",
      "ft_ambitos",
      "dim_ambitos",
      "dim_abogados",
      "dim_validados",
      "dim_comunas",
      "ft_solicitudes",
      "ft_operacion",
      "ft_envio",
    ];
  }
  // Fill tables from the database
  if (!tableList.includes(table) && table !== undefined) {
    throw new Error("Invalid table name");
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
      selectQuery += " WHERE " + conditions.join(" AND ");
    }

    console.log("CONSULTING", selectQuery, values);

    const res = await client.query(selectQuery, values);
    client.release();

    // If a table was requested and the result set is empty, return a single object with null fields
    if (regEmpty && table && res.rows.length === 0) {
      const columns = await getTableColumns(table);
      const emptyObj = {};
      columns.forEach((col) => {
        emptyObj[col] = null;
      });
      return [emptyObj]; 
    }

    return res.rows;
  } catch (err) {
    console.error("Error executing select query", err.stack);
    throw err; // Rethrow or handle as needed
  }
}

module.exports = {
  databaseGet,
  insertAbogado,
  databaseInsert,
};
