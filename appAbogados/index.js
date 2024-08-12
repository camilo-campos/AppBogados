// handle form using AI and the database
const { handleForm } = require("./scripts/handleForm");
const { getAssistantPrompt } = require("./scripts/databaseProcess");
const {
  insertFormDataToDB,
  insertAbogado,
  insertft_ambitos,
} = require("./scripts/databaseControl");

// require expressjs
const express = require("express");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");

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
      const prompt = "User: " + formData.Problema + getAssistantPrompt();
      await handleForm(formData, prompt);
      res.status(200).json({ message: "Client form processed successfully" });
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
        // Insertar datos del abogado en la tabla correspondiente
        await insertAbogado(formData);

        // Insertar datos en la tabla ft_ambitos para cada ámbito seleccionado
        const selectedSpecialties = formData.especialidades; // IDs de los ámbitos seleccionados
        const rut = formData.rut;
        const vigencia = "SI";

        // Esperar que todas las inserciones se completen antes de enviar la respuesta
        await Promise.all(
          selectedSpecialties.map(async (id_ambito) => {
            const id_rut_ambito = `${rut}-${id_ambito}`; // Combina rut y id_ambito
            await insertft_ambitos({ id_rut_ambito, rut, id_ambito, vigencia });
          })
        );

        res.status(200).json({ message: "Data inserted successfully" });
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

router.post("/submit-db", csrfProtection, async (req, res) => {
  const formData = req.body;
  console.log("Form Data for DB Insert:", formData);

  try {
    await insertFormDataToDB(formData);
    res.status(200).json({ message: "Data inserted successfully" });
  } catch (error) {
    console.error("Error inserting data into DB:", error);
    res.status(500).json({ message: "Error inserting data into DB" });
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
