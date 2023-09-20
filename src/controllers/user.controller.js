import { getConnection } from "../database/database.js";
import { transporter } from "../config/mailer.js";
import { encriptyngPassword, comparePassword } from "../config/hash.js";
import { generateToken, verifyToken } from "../config/jwt.js";
const fs = require("fs");
const uuid = require("uuid");
const mimetypes = require("mime-types");

const {
  euclideanDistance,
  manhattanDistance,
  encryptBiometrics,
  decryptBiometrics,
  getInitializationVector,
} = require("../config/utils.js");

async function registerUser(req, res) {
  console.log("si entro registro");
  try {

    const connection = await getConnection();
    const { name, email, pin, screenshot, descriptor } = req.body;
    if (!(name && email && pin && screenshot && descriptor)) {
      return res.status(400).send("Información necesaria incompleta.");
    }

    const checkEmail = "SELECT * FROM mails WHERE mail = ?";
    const emailValues = [email];

    const resultExists = await connection.query(checkEmail, emailValues);
    console.log(resultExists);
    if (resultExists[0].length === 0) {
      return res.status(400).json({
        message: "El correo no existente en la base de datos.",
      });
    }

    // Verificar si el correo ya existe en la base de datos
    const queryCheckEmail = "SELECT * FROM users WHERE mail = ?";
    const checkEmailValues = [email];

    const result = await connection.query(queryCheckEmail, checkEmailValues);
    console.log(`Resultado ya registrado`);
    console.log(result.length);
    if (result.length > 0) {
      return res.status(400).json({
        message: "El correo ya está registrado a una cuenta.",
      });
    }

    const mime = screenshot.split(";")[0].split(":")[1];
    const ext = mimetypes.extension(mime);
    const path = "uploads/" + uuid.v4() + "." + ext;
    console.log(path);
    fs.writeFile(path, screenshot.split(",")[1], "base64", (e) => {
      if (e) {
        console.log(e);
        throw "No se puede guardar el archivo.";
      }
    });
    console.log("llego hasta aqui");
    const hash = await encriptyngPassword(pin);
    const token = generateToken({ email: email }, "1h");
    const iv = getInitializationVector(16);
    const image = path;
    const init_vector = Buffer.from(iv, "binary").toString("base64");
    const face_descriptor = encryptBiometrics(descriptor, iv);

    const query =
      "INSERT INTO users (full_name, mail, pin, image, token, init_vector, face_descriptor) VALUES (?, ?, ?, ?, ?, ?,?)";
    const values = [
      name,
      email,
      hash,
      image,
      token,
      init_vector,
      face_descriptor,
    ];

    const response = await connection.query(query, values);
    console.log(response);
    if (response.length === 0) {
      return res.status(400).json({
        message:
          "Error al registrar el usuario. Por favor, intenta nuevamente.",
      });
    }
    /*return res.status(200).json({
      message:
        "Usuario registrado. Por favor, verifica tu correo electrónico para activar tu cuenta.",
    });*/
    const activationLink = `http://localhost:3000/activation/${token}`;
    const groupTelegram = `https://t.me/+jW1E_Bs1-OkzOWVh`;
    const mailOptions = {
      from: "Department Dev - Code Mentor <ecuadorpro2000@gmail.com>",
      to: email,
      subject: "Activación de cuenta",
      html: `
            <h1>Bienvenido a Info - TIC</h1>
            <p>Por favor, haz clic en el siguiente enlace para activar tu cuenta:</p>
            <a href="${activationLink}" target="_blank">Activar cuenta</a>
            <p>Enlace para ingresar al grupo de Telegram:</p>
            <a href="${groupTelegram}" target="_blank">Unirme al grupo</a>
          `,
    };
    console.log("llego hasta aqui nodemailer");
    transporter.sendMail(mailOptions, (mailError, info) => {
      if (mailError) {
        console.error(
          "Error al enviar el correo electrónico de activación:",
          mailError
        );
        return res.status(500).json({
          message:
            "Error al enviar el correo electrónico de activación. Por favor, intenta nuevamente.",
        });
      } else {
        console.log("Correo electrónico de activación enviado:", info.response);
        return res.status(200).json({
          message:
            "Usuario registrado. Por favor, verifica tu correo electrónico para activar tu cuenta.",
        });
      }
    });
  } catch (error) {
    console.error("Error al encriptar la contraseña:", error);
    return res.status(500).json({
      message: "Error al registrar el usuario. Por favor, intenta nuevamente.",
    });
  }
}

async function loginUser(req, res) {
  try {
    const { email, pin, screenshot, descriptor } = req.body;
    if (!(email && pin && screenshot && descriptor)) {
      return res.status(400).send("Información necesaria incompleta.");
    }

    const connection = await getConnection();
    // Verificar si el correo existe en la base de datos
    const queryCheckEmail = "SELECT * FROM users WHERE mail = ?";
    const checkEmailValues = [email];

    const respuesta = await connection.query(
      queryCheckEmail,
      checkEmailValues);
    if (respuesta.length === 0) {
      return res.status(500).json({
        message:
          "No existe el correo proporcionado. Por favor, intenta nuevamente.",
      });
    }
    let threshold = 0.5;
    const iv = Buffer.from(respuesta[0].init_vector, "base64");
    const distance = euclideanDistance(
      descriptor,
      decryptBiometrics(respuesta[0].face_descriptor, iv)
    );
    if (distance > threshold) {
      return res
        .status(400)
        .json({ message: "Usuario no autorizado para acceder a esta cuenta" });
    }
    const respuestaComparacion = await comparePassword(
      pin,
      respuesta[0].pin
    );
    if (respuestaComparacion) {
      console.log(respuesta[0]);
      return res.status(200).json({
        message: `Bienvenido ${respuesta[0].full_name}`,
        user: respuesta[0],
      });
    } else {
      return res
        .status(400)
        .json({ message: "Inicio de sesion fallido, contraseña no valida" });
    }
  } catch (error) {
    console.error("Verifique que las credenciales sean correctas:", error);
    return res.status(500).json({
      message:
        "Verifique que las credenciales sean correctas. Por favor, intenta nuevamente.",
    });
  }
}

async function activationAccount(req, res) {
  const { token } = req.params;
  const connection = await getConnection();
  try {
    const decodedToken = verifyToken(token);
    console.log(decodedToken);
    const query = "SELECT * FROM users WHERE mail = ? AND token = ?";
    const values = [decodedToken.email, token];

    const respuesta = await connection.query(query, values);
    if (respuesta.length === 0) {
      return res.redirect("http://localhost:5173/activation-problems");
    }

    const updateQuery =
      "UPDATE users SET status = 1, token=NULL WHERE mail = ?";
    const updateValues = [decodedToken.email];

    const resultado = await connection.query(
      updateQuery,
      updateValues);
    console.log(resultado);
    if (resultado === 0) {
      console.log("Error al activar la cuenta. Por favor, intenta nuevamente.");
      return res.redirect("http://localhost:5173/activation-problems");
    }

    return res.redirect("http://localhost:5173/activation");

  } catch (error) {
    console.log(error);
    return res.redirect("http://localhost:5173/activation-problems");
  }
}

async function usersGender(req, res) {
  const query = `SELECT COUNT(*) AS Total, SUM(CASE WHEN gender = 'Masculino' THEN 1 ELSE 0 END) AS Hombres, SUM(CASE WHEN gender = 'Femenino' THEN 1 ELSE 0 END) AS Mujeres FROM users`;

  try {
    const [results] = await connectionDB.promise().query(query);

    const result = results.length > 0 ? results[0] : null;

    if (!result) {
      throw new Error("No se encontraron resultados");
    }

    const { Total, Hombres, Mujeres } = result;

    const data = {
      labels: ["Hombres", "Mujeres"],
      datasets: [
        {
          label: "Total de usuarios",
          data: [Hombres, Mujeres],
          backgroundColor: ["rgba(75,192,192,0.4)", "rgba(255,99,132,0.4)"], // Asignar diferentes colores aquí
          borderColor: ["rgba(75,192,192,1)", "rgba(255,99,132,1)"], // Asignar diferentes colores aquí
          borderWidth: 1,
        },
      ],
    };

    return res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}
async function getUsers(req, res) {
  try {
    const query = "SELECT * FROM users";
    const [data] = await connectionDB.promise().query(query);
    return res.json(data);
  } catch (error) {
    console.error(error);
  }
}

export { registerUser, activationAccount, loginUser, usersGender, getUsers };
