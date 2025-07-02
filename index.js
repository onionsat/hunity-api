const express = require('express');
const rateLimit = require('express-rate-limit');
const initDB = require('./misc/database');
const createAuthMiddleware = require('./misc/authMiddleware');
const WebSocket = require('ws');
const handleSocketMessage = require('./routes/socket'); // Importáljuk a parancskezelő modult

require('dotenv').config();

const app = express();
const port = 3000;

app.set('trust proxy', 'loopback');
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // URL-encoded formátumú adatokhoz

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 300, // limit each IP to 300 requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests! Please retry after " + Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000 + " seconds.",
      retryAt: req.rateLimit.resetTime
    });
  }
});

app.use(limiter);

/* Route definitions start here */
const getExperimentData = require('./routes/getExperimentData');
const getTemperatureData = require('./routes/getTemperatureData');
const writeCommand = require('./routes/writeCommand');
const getExperiments = require('./routes/getExperiments');
const getCommands = require('./routes/getCommands');
/* Route definitions end here */



(async () => {
  try {
    const db = await initDB();

    const auth = createAuthMiddleware(db);


    // Do NOT forget to add db if nescessary!
    /* Route definitions start here */
    app.use('/v1/getExperimentData', auth, getExperimentData(db));
    app.use('/v1/getTemperatureData', auth, getTemperatureData(db));
    app.use('/v1/writeCommand', auth, writeCommand(db, auth));
    app.use('/v1/getExperiments', auth, getExperiments(db));
    app.use('/v1/getCommands', auth, getCommands(db));
    /* Route definitions end here */

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });

    const wss = new WebSocket.Server({ port: 8080 });

    console.log('WebSocket szerver elindult a ws://localhost:8080 címen');

    wss.on('connection', ws => {
        console.log('Új kliens csatlakozott');

        // Minden klienshez egyedi azonosító generálása
        ws.clientId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        console.log(`Kliens ID: ${ws.clientId}`);
    
        // Eseménykezelő a kliensről érkező üzenetekhez
        ws.on('message', message => {
            const receivedMessage = message.toString();
            console.log(`Üzenet érkezett a klienstől (${ws.clientId}): ${receivedMessage}`);
            handleSocketMessage(ws, receivedMessage, wss, db); 
        });
      
        // Eseménykezelő, amikor a kliens bezárja a kapcsolatot
        ws.on('close', () => {
            console.log(`A kliens (${ws.clientId}) leválasztódott`);
        });
      
        // Eseménykezelő hibákhoz
        ws.on('error', error => {
            console.error(`WebSocket hiba történt a kliensnél (${ws.clientId}): ${error}`);
        });
      
        ws.send(`Hunity GRU WebSocket (${getFormattedDate()})`);
    });

    wss.on('error', error => {
        console.error(`Szerver szintű WebSocket hiba: ${error}`);
    });

    console.log('Váró a kliens csatlakozásra...');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Hónap (0-indexelt, ezért +1)
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}