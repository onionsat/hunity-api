const express = require('express');
const rateLimit = require('express-rate-limit');
const initDB = require('./misc/database');
const createAuthMiddleware = require('./misc/authMiddleware');

require('dotenv').config();

const app = express();
const port = 3000;

app.set('trust proxy', 'loopback');
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // URL-encoded formátumú adatokhoz

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 80, // limit each IP to 100 requests
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
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();