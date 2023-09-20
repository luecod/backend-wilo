import express from "express";
import initializeRoutes from "./src/startup/routes.js";

const app = express();
const port = process.env.PORT || 3000;

initializeRoutes(app);

app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
