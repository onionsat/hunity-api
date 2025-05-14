const express = require('express');

module.exports = function (db) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const experiment = req.query.experiment;
    let results = parseInt(req.query.results, 10);

    try {
      if (!experiment) {
        return res.status(400).json({
          success: false,
          code: "MissingFields",
          message: "Please define experiment ID!",
        });
      }

      if (isNaN(results) || results <= 0) results = 10;
      if (results > 100) results = 100;

      let query = 'SELECT * FROM experimentdata';
      const params = [];

      if (experiment !== 'all') {
        query += ' WHERE experimentid = ?';
        params.push(experiment);
      }

      query += ' ORDER BY id DESC LIMIT ?';
      params.push(results);

      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (err) {
      console.error('DB error:', err);
      return res.status(500).json({
        success: false,
        code: "ServerError",
        message: "Unexpected server error had ocurred. Please contact administrator.",
      });
    }
  });

  return router;
};
