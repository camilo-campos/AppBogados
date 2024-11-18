const { Pool } = require("pg");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Create a new pool instance to manage the database connection
const pool = new Pool({
  host: "7add7be1-1f6c-47e1-987f-3a8a50eb78bd.4b2136ddd30a46e9b7bdb2b2db7f8cd0.databases.appdomain.cloud",
  port: 32293,
  database: "ibmclouddb",
  user: "ibm_cloud_de5d629e_3196_40cf_ab94_2365fef098f9",
  //password:"srh1Pemn1k697bmu5c6JKg==:dDDs2uYRBhM6ATxdUllQXs2KKONHlK8txfLvVt5Zfmm7CLgYdXLBk97gdRWtp4ErSQpOMO1NTVSX6nhproIYjg==",
  password: "6dc898c24ff1a476bee1acad7ed6bfc5fe1e8f652d4e2f2735ba34c162b66080",
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



async function insertSolicitante(formData) {
  const {
    rut,
    nombres,
    apellidos,
    mail,
    region,
    comuna,
    caso,
    tipo_costo,
    tipo_requerimiento,
    antecedentes_penales,
    antecedentes_comerciales,
    residencia,
  } = formData;

  const id_solicitud = uuidv4(); // Genera un UUID único

  try {
    const client = await pool.connect();
    const query = `
      INSERT INTO ft_solicitudes 
      (id_solicitud, rut, nombres, apellidos, mail, region, comuna, caso, tipo_costo, tipo_requerimiento, antecedentes_penales, antecedentes_comerciales, residencia)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *;
    `;
    const values = [
      id_solicitud,
      rut,
      nombres,
      apellidos,
      mail,
      region,
      comuna,
      caso,
      tipo_costo,
      tipo_requerimiento,
      antecedentes_penales,
      antecedentes_comerciales,
      residencia,
    ];

    const result = await client.query(query, values);
    client.release();

    console.log("Form Data Inserted:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error executing query", error.stack);
    throw error;
  }
}

async function insertft_ambitos(formData) {
  const { id_rut_ambito, rut, id_ambito, vigencia } = formData;

  try {
    const client = await pool.connect();
    const query = `
      INSERT INTO ft_ambitos (id_rut_ambito, rut, id_ambito, vigencia)
      VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [id_rut_ambito, rut, id_ambito, vigencia];

    const result = await client.query(query, values);
    client.release();

    console.log("Form Data Inserted:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error executing query", error.stack);
    throw error;
  }
}

async function insertAbogado(formData) {
  const {
    rut,
    nombres,
    apellidos,
    mail,
    telefono,
    costo_ser_primer_adelant,
    costo_ser_cuota_litis,
    costo_ser_gastos_tramitacion,
    horario_at_dias_hab,
    horario_at_horas_hab,
    req_cliente_sin_ant_penales,
    req_cliente_sin_ant_com,
    req_cliente_residencia_regular,
    nivel_coincidencia,
    descripcion,
    region,
    comuna,
  } = formData;

  try {
    const client = await pool.connect();

    // Check if the RUT already exists
    const checkQuery = `SELECT 1 FROM dim_abogados WHERE rut = $1`;
    const checkResult = await client.query(checkQuery, [rut]);

    if (checkResult.rows.length > 0) {
      client.release();
      const error = new Error("Lawyer already registered");
      error.code = "RUT_ALREADY_REGISTERED";
      throw error;
    }

    const query = `
      INSERT INTO dim_abogados (rut, nombres, apellidos, mail, telefono, costo_ser_primer_adelant, costo_ser_cuota_litis, costo_ser_gastos_tramitacion, horario_at_dias_hab, horario_at_horas_hab, req_cliente_sin_ant_penales, req_cliente_sin_ant_com, req_cliente_residencia_regular, nivel_coincidencia, descripcion, region, comuna)
      VALUES ($1,$2, $3, $4, $5, $6, $7, $8, $9, $10, $11 , $12 , $13 , $14 , $15 , $16 , $17) RETURNING *`;
    const values = [
      rut,
      nombres,
      apellidos,
      mail,
      telefono,
      costo_ser_primer_adelant,
      costo_ser_cuota_litis,
      costo_ser_gastos_tramitacion,
      horario_at_dias_hab,
      horario_at_horas_hab,
      req_cliente_sin_ant_penales,
      req_cliente_sin_ant_com,
      req_cliente_residencia_regular,
      nivel_coincidencia,
      descripcion,
      region,
      comuna,
    ];

    const result = await client.query(query, values);
    client.release();

    console.log("Form Data Inserted:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error executing query", error.stack);
    throw error;
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
    tableList = [
      "dim_comunas_chile",
      "ft_pagos",
      "dim_credenciales",
      "ft_ambitos",
      "dim_ambitos",
      "dim_abogados",
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
    return res.rows;
  } catch (err) {
    console.error("Error executing select query", err.stack);
    throw err; // Rethrow or handle as needed
  }
}

module.exports = {
  databaseGet,
  insertSolicitante,
  insertAbogado,
  insertft_ambitos,
};
