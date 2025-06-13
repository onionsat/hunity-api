const express = require('express');

module.exports = function (db) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    let results = parseInt(req.query.results, 10);
    const startId = parseInt(req.query.startId, 10);
    const endId = parseInt(req.query.endId, 10);
    let startTimestamp = req.query.startTimestamp;
    let endTimestamp = req.query.endTimestamp;

    try {
      if (isNaN(results) || results <= 0) results = 10;
      if (results > 1000) results = 1000;

      let query = 'SELECT * FROM bmedata';
      const params = [];

      if (!isNaN(startId)) {
        query += params.length ? ' AND id >= ?' : ' WHERE id >= ?';
        params.push(startId);
      }

      if (!isNaN(endId)) {
        query += params.length ? ' AND id <= ?' : ' WHERE id <= ?';
        params.push(endId);
      } if (!isNaN(startId)) {
        query += params.length ? ' AND id >= ?' : ' WHERE id >= ?';
        params.push(startId);
      }

      if (!isNaN(endId)) {
        query += params.length ? ' AND id <= ?' : ' WHERE id <= ?';
        params.push(endId);
      }

      if (startTimestamp) {
        startTimestamp = new Date(startTimestamp).getTime() / 1000;
      }

      if (endTimestamp) {
        endTimestamp = new Date(endTimestamp).getTime() / 1000;
      }

      if (!isNaN(startTimestamp)) {
        query += params.length ? ' AND timestamp >= FROM_UNIXTIME(?)' : ' WHERE timestamp >= FROM_UNIXTIME(?)';
        params.push(startTimestamp);
      }
      
      if (!isNaN(endTimestamp)) {
        query += params.length ? ' AND timestamp <= FROM_UNIXTIME(?)' : ' WHERE timestamp <= FROM_UNIXTIME(?)';
        params.push(endTimestamp);
      }

      query += ' ORDER BY id DESC LIMIT ?';
      console.log(query);
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
