// require expressjs
const express = require("express");
const app = express();
// define port 8080
const PORT = 8080;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from the "public" directory
app.use(express.static("public"));
// use router to bundle all routes to /
const router = express.Router();
app.use("/", router);
// get on root route
router.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index_cliente.html");
});

router.get("/contacto", (req, res) => {
  res.sendFile(__dirname + "/public/formulario_cliente.html");
});

router.get("/abogado", (req, res) => {
  res.sendFile(__dirname + "/public/index_abogado.html");
});

router.get("/registro", (req, res) => {
  res.sendFile(__dirname + "/public/formulario_abogado.html");
});

// Route to handle form submission
router.post("/submit-form", (req, res) => {
  const formData = req.body;
  console.log("Form Data Received:", formData);
  // Aquí puedes guardar los datos del formulario o realizar cualquier otra acción necesaria
  res.redirect("/success"); // Redirige al usuario a una página de éxito
});

router.get("/success", (req, res) => {
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
