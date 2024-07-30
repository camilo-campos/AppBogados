// handle form using AI and the database
const { handleForm } = require("./scripts/handleForm");
const { getAssistantPrompt } = require("./scripts/databaseProcess");
const { insertFormDataToDB } = require("./scripts/databaseControl");

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
router.post("/submit-form", csrfProtection, (req, res) => {
  const formData = req.body;
  console.log("Form Data Received:", formData);

  if (formData.formType === "cliente") {
    // Process client form data and get AI response
    if (formData.Problema) {
      const prompt = "User: " + formData.Problema + getAssistantPrompt();
      handleForm(formData, prompt);
    } else {
      console.error("Error: No 'Problema' field in client form data");
    }
  } else if (formData.formType === "abogado") {
    // Process abogado form data
    if (formData.nombres && formData.apellidos) {
      console.log("Processing Abogado form data");
      // <-- Handle Abogado form data here :J -->
      // ...
      // <--
    } else {
      console.error("Error: Missing required fields in abogado form data");
    }
  } else {
    console.error("Error: Unknown form type");
  }

  res.redirect("/success"); // Redirige al usuario a una página de éxito
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
