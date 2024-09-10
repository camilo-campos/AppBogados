// handle form using AI and the database
const { handleClientForm } = require("./scripts/handleClientForm");
const { getAssistantPrompt } = require("./scripts/databaseProcess");
const {
  insertSolicitante,
  insertAbogado,
  insertft_ambitos,
} = require("./scripts/databaseControl");

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

// get on root route
router.get("/", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/index_cliente.html");
});

router.get("/contacto", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/formulario_cliente.html");
});

router.get("/equipo", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/equipo.html");
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

router.get("/nosotros", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/nosotros.html");
});

router.get("/abogado", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/index_abogado.html");
});

router.get("/registro", csrfProtection, (req, res) => {
  res.sendFile(__dirname + "/public/formulario_abogado.html");
});

// Route to serve CSRF token
router.get("/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Route to handle form submission
router.post("/submit-form", csrfProtection, async (req, res) => {
  const formData = req.body;
  console.log("Form Data Received:", formData);

  if (formData.formType === "cliente") {
    if (formData.Problema) {
      /*
        Insertar datos del formulario del cliente en la base de datos
        y enviar respuesta al cliente
        [i] Verificamos al usuario ANTES de procesar el formulario para que el usuario no tenga que esperar a que se complete el procesamiento
      */

      if (subirABaseDeDatos) {
        await insertSolicitante(formData);
      }

      res.status(200).json({ message: "Client form processed successfully" });

      /*
        Procesar el formulario del cliente con la AI y enviar correos a los abogados
      */

      const assistantData = getAssistantPrompt();

      const promptProblema = formData.Problema;
      const promptSystem = assistantData[0];
      const promptAmbitoList = assistantData[1];

      await handleClientForm(
        formData,
        { promptProblema, promptSystem, promptAmbitoList },
        maxAbogadosPerClient
      );

      // Process AFTER we send the response to the client
      // So the client doesn't have to wait for the processing to complete
      await handleForm(formData, {
        promptProblema,
        promptSystem,
        promptAmbitoList,
      });
    } else {
      console.error("Error: No 'Problema' field in client form data");
      res
        .status(400)
        .json({ error: "No 'Problema' field in client form data" });
    }
  } else if (formData.formType === "abogado") {
    if (formData.nombre && formData.apellidos) {
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
              await insertft_ambitos({
                id_rut_ambito,
                rut,
                id_ambito,
                vigencia,
              });
            })
          );
          res.status(200).json({ message: "Data inserted successfully" });
        } else {
          console.error("Error: Lawyer not found in PJUD database");
          res.status(400).json({ error: "Lawyer not found in PJUD database" });
        }
      } catch (error) {
        console.error("Error inserting data into DB:", error);
        res.status(500).json({ message: "Error inserting data into DB" });
      }
    } else {
      console.error("Error: Missing required form fields");
      res.status(400).json({ error: "Invalid form data" });
    }
  } else {
    res.status(400).json({ error: "Unknown form type" });
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
