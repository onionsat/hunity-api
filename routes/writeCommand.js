const express = require('express');

module.exports = function (db, authMiddleware) {
    const router = express.Router();
  
    // A writeCommand végpont, amely az authMiddleware-t használja
    router.post('/', authMiddleware, async (req, res) => {
        console.log('Request body:', req.body); // Debug log
      const { command, experimentid } = req.body;
  
      try {
        if (!command || !experimentid) {
          return res.status(400).json({
            success: false,
            code: "MissingFields",
            message: "Command and experiment ID are required!",
          });
        }
  
        if (Number(experimentid) !== Number(req.experimentId)) {
          return res.status(403).json({
            success: false,
            code: "Forbidden",
            message: "Experiment ID does not match the authenticated experiment.",
          });
        }
  
        const query = 'INSERT INTO writecommands (experimentid, command, sent) VALUES (?, ?, ?)';
        const params = [experimentid, command, 0];
  
        await db.execute(query, params);
  
        res.status(201).json({
          success: true,
          message: "Command inserted successfully!",
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          code: "ServerError",
          message: "An error occurred while inserting the command.",
        });
      }
    });
  
    return router;
  };