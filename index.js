const express = require('express');
const initDB = require('./misc/database');

require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json());


/* Route definitions start here */
const getExperimentData = require('./routes/getExperimentData');
/* Route definitions end here */



(async () => {
  try {
    const db = await initDB();

    // Do NOT forget to add db if nescessary!
    /* Route definitions start here */
    app.use('/getExperimentData', getExperimentData(db));
    /* Route definitions end here */

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();