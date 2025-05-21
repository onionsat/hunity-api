const express = require('express');

module.exports = function (db, authMiddleware) {
    const router = express.Router();
  
    // A writeCommand végpont, amely az authMiddleware-t használja
    router.post('/', authMiddleware, async (req, res) => {
      console.log('Request body:', req.body); // Debug log

      if (!req.body) {
        return res.status(400).json({
          success: false,
          code: "MalformedRequestBody",
          message: "Request body is required for POST requests.",
        });
      }

      const { command, experiment } = req.body;
  
      try {
        if (!command || !experiment) {
          return res.status(400).json({
            success: false,
            code: "MissingFields",
            message: "Command and experiment ID are required!",
          });
        }

        const hexRegex = /^[0-9a-fA-F]{16}$/;
        if (!hexRegex.test(command)) {
            return res.status(400).json({
                success: false,
                code: "InvalidCommand",
                message: "Command must be exactly 16 ASCII characters representing 8 hexadecimal bytes (without '0x' prefix).",
            });
        }
  
        if (Number(experiment) !== Number(req.experimentId)) {
          return res.status(403).json({
            success: false,
            code: "Forbidden",
            message: "Experiment ID does not match the authenticated experiment.",
          });
        }
  
        const query = 'INSERT INTO writecommands (experimentid, command, sent) VALUES (?, ?, ?)';
        const params = [experiment, command, 0];
  
        const [result] = await db.execute(query, params);
        const insertedId = result.insertId;

        res.status(201).json({
          success: true,
          message: "Command inserted successfully!",
          commandId: insertedId
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