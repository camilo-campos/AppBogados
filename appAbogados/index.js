// handle form using AI and the database
const { handleClientForm } = require("./scripts/handleClientForm");
const { handleAbogadoForm } = require("./scripts/handleAbogadoForm");
const { getAssistantPrompt } = require("./scripts/databaseProcess");
const {
  //insertSolicitante,
  insertAbogado,
  //insertft_ambitos,
  //insert_dim_validados,
  databaseInsert,
  databaseGet,
} = require("./scripts/databaseControl");

require("dotenv").config();

// --- Configuraciones miscelaneas ---
// [i] Subir los abogados y solicitantes a la base de datos
const subirABaseDeDatos = true;
// [i] Numero maximo de abogados a los que se les enviara el caso de un cliente
const maxAbogadosPerClient = 10;

// require expressjs
const express = require("express");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const { lawyerVerify } = require("./scripts/lawyerVerify");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();

// define port 8080
const PORT = 8080;

// Setup cookie parser middleware
app.use(cookieParser());

// Setup CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// Use json and urlencoded middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static("public"));

// use router to bundle all routes to /
const router = express.Router();
app.use("/", router);

// Endpoint para exponer variables de entorno
app.get("/api/config", (req, res) => {
  res.json({
    apiUrl: process.env.url_regula, // Exponiendo la URL de la API
  });
});

// get on root route
router.get("/", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/index_cliente.html");
});

router.get("/registro", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/formulario_abogado_validacion.html");
});

router.get("/validacion-abogados", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/validacion_abogados.html");
});

router.get("/contacto", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/formulario_cliente.html");
});

router.get("/equipo", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/equipo.html");
});

router.get("/equipo_abogado", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/equipo.abogado.html");
});

router.get("/terminos_condiciones_cliente", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/terminos_condiciones_cliente.html");
});

router.get("/terminos_condiciones_abogado", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/terminos_condiciones_abogado.html");
});

router.get("/politicas_cliente", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/politicas.cliente.html");
});

router.get("/politicas_abogado", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/politicas.abogado.html");
});

router.get("/preguntas", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/preguntas.html");
});

router.get("/preguntas_abogado", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/preguntas.abogado.html");
});

router.get("/nosotros", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/nosotros.html");
});

router.get("/nosotros_abogado", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/nosotros.abogado.html");
});

router.get("/abogado", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/index_abogado.html");
});

router.get("/exito_abogado", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/exito_abogado.html");
});

router.get("/exito_cliente", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/exito_cliente.html");
});

// es el caso con el formulario que no esta funcionando !!!
// debe ser actualizado cuando haya sido corregido
router.get("/consultas", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/contacto_cliente.html");
});

//router.get("/consultas", csrfProtection, (req, res) => {
//  res.sendFile(__dirname + "/public/consultas_cliente.html");
//});

//router.get("/consultas_abogado", csrfProtection, (req, res) => {
//  res.sendFile(__dirname + "/public/consultas_abogados.html");
//});

router.get("/consultas_abogado", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/contacto_abogado.html");
});

//router.get("/formulario-validacion", csrfProtection, (req, res) => {
//  res.sendFile(__dirname + "/public/formulario_abogado.html");
//});

router.get("/soporte", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/soporte.html");
});

// Ruta para la página de verificación con Regula
router.get("/regula-verificacion", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/regula_verificacion.html");
});

const multer = require("multer"); // Para manejar la carga de archivos
// To parse this data:
//
//   const Convert = require("./file");
//

// Directorio temporal de carga de archivos

// Ruta para manejar la verificación con Regula

//ruta para envio de correo de contacto

const nodemailer = require("nodemailer");

// Nueva ruta POST para enviar correos
router.post("/enviar", async (req, res) => {
  const { nombre, email, mensaje } = req.body; // Extraer datos del formulario

  // Configuración del transporte de correo
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.correo, // Correo de origen
      pass: process.env.clave_correo, // Contraseña segura (mover a variables de entorno)
    },
  });

  // Configurar el correo
  const mailOptions = {
    from: email,
    to: "jaguilera@technonest.cl",
    subject: `Consulta solicitante - ${nombre}`, // Asunto dinámico con nombre
    text: mensaje,
  };

  try {
    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", info.response);
    res.status(200).json({ message: "Correo enviado correctamente" });
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    res.status(500).json({ error: "Error al enviar el correo" });
  }
});

// Route to serve CSRF token
router.get("/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Route to handle form submission
router.post("/submit-form", csrfProtection, async (req, res) => {
  const formData = req.body;
  console.log("Form Data Received:", formData);

  try {
    if (formData.formType === "validacion") {
      // Validar que el RUT esté presente
      if (!formData.rut_abogado) {
        return res.status(400).json({ error: "RUT is required" });
      }

      // Validar el formato del RUT (opcional, ajusta según sea necesario)
      console.log(`Validando RUT: ${formData.rut_abogado}`);

      // Revisar si el abogado se encuentra en "dim_abogados"
      const abogados = await databaseGet({
        table: "dim_abogados",
        rut: formData.rut_abogado,
      });

      if (abogados.length === 0) {
        // El abogado no se encuentra en la base de datos
        return res.status(400).json({
          error: "Lawyer not found in appbogado database",
        });
      }

      // Revisar si ya se encuentran en "dim_validados"
      const validados = await databaseGet({
        table: "dim_validados",
        rut_abogado: formData.rut_abogado,
      });

      if (validados.length > 0) {
        // El abogado ya está validado
        return res
          .status(400)
          .json({ error: "Lawyer already validated in verified database" });
      }

      if (subirABaseDeDatos) {
        //const result = await insert_dim_validados(formData);
        let dataRequest = { ...formData };
        delete dataRequest.formType;
        
        const result = await databaseInsert("dim_validados", dataRequest);
        console.log("[ok] Data inserted into dim_validados database:", result);
      }

      // Respuesta exitosa
      return res
        .status(200)
        .json({ message: "Form of type 'validacion' processed successfully" });
    } else if (formData.formType === "cliente") {
      if (formData.caso) {
        /*
          Insertar datos del formulario del cliente en la base de datos
          y enviar respuesta al cliente
          [i] Verificamos al usuario ANTES de procesar el formulario para que el usuario no tenga que esperar a que se complete el procesamiento
        */

        const id_solicitud = uuidv4(); // Genera un UUID único
        if (subirABaseDeDatos) {
          //await insertSolicitante({ ...formData, id_solicitud }); 
          let dataRequest = { ...formData, id_solicitud };
          delete dataRequest.formType;

          await databaseInsert("ft_solicitudes", dataRequest);
        }

        res.status(200).json({ message: "Client form processed successfully" });

        /*
          Procesar el formulario del cliente con la AI y enviar correos a los abogados
        */

        const assistantData = getAssistantPrompt();

        const promptProblema = formData.caso;
        const promptSystem = assistantData[0];
        const promptAmbitoList = assistantData[1];

        // Process AFTER we send the response to the client
        // So the client doesn't have to wait for the processing to complete
        await handleClientForm(
          formData,
          { promptProblema, promptSystem, promptAmbitoList },
          maxAbogadosPerClient,
          id_solicitud
        );
      } else {
        console.error("Error: No 'caso' field in client form data");
        res.status(400).json({ error: "No 'caso' field in client form data" });
      }
    } else if (formData.formType === "abogado") {
      if (formData.nombres && formData.apellidos) {
        console.log("Processing Abogado form data");
        try {
          // Verificar si el abogado existe en la base de datos del PJUD
          if (await lawyerVerify(formData.rut)) {
            // Insertar datos del abogado en la tabla correspondiente
            if (subirABaseDeDatos) {
              await insertAbogado(formData);
            }

            // Insertar datos en la tabla ft_ambitos para cada ámbito seleccionado
            const selectedSpecialties = formData.especialidades; // IDs de los ámbitos seleccionados
            const rut = formData.rut;
            const vigencia = "SI";

            // Esperar que todas las inserciones se completen antes de enviar la respuesta
            await Promise.all(
              selectedSpecialties.map(async (id_ambito) => {
                const id_rut_ambito = `${rut}-${id_ambito}`; // Combina rut y id_ambito
                /*await insertft_ambitos({
                  id_rut_ambito,
                  rut,
                  id_ambito,
                  vigencia,
                });*/
                await databaseInsert("ft_ambitos", {
                  id_rut_ambito,
                  rut,
                  id_ambito,
                  vigencia,
                });
              })
            );
            res.status(200).json({ message: "Data inserted successfully" });

            // Enviar correo de confirmación al abogado
            try {
              await handleAbogadoForm(formData);
            } catch (error) {
              console.error("Error sending email to abogado:", error);
            }
          } else {
            console.error("Error: Lawyer not found in PJUD database");
            res
              .status(400)
              .json({ error: "Lawyer not found in PJUD database" });
          }
        } catch (error) {
          console.error("Error inserting data into DB:", error);
          if (error.code === "RUT_ALREADY_REGISTERED") {
            res.status(400).json({ error: "Lawyer already registered" });
          } else {
            res.status(500).json({ message: "Error inserting data into DB" });
          }
        }
      } else {
        console.error("Error: Missing required form fields");
        res.status(400).json({ error: "Invalid form data" });
      }
    } else {
      res.status(400).json({ error: "Unknown form type" });
    }
  } catch (error) {
    console.error("Error processing form:", error);
    res.status(500).json({ error: "Error processing form" });
  }
});

router.get("/success", csrfProtection, (req, res) => {
  // Envia la página de éxito al usuario
  res.sendFile(__dirname + "/public/index_cliente.html");
});

// start server
const server = app.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}!!`);
});

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received.");
  server.close(() => {
    console.log("Http server closed.");
  });
});
