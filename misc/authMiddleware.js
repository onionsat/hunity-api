function createAuthMiddleware(db) {
    return async function authMiddleware(req, res, next) {
      console.log('Request body2:', req.body); // Debug log
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            code: "AuthenticationHeaderMissing",
            message: "Missing authorization header. (Bearer token)",
        });
      }
  
      const apiKey = auth.split(' ')[1];
      const ip = req.ip;
      console.log(req.ip);
  
      try {
        const [rows] = await db.query(`SELECT id, api_keys, allowed_ips FROM experiments`);
  
        for (const row of rows) {
          const keys = JSON.parse(row.api_keys || '[]');
          const ips = JSON.parse(row.allowed_ips || '[]');
  
          if (keys.includes(apiKey)) {
            if (!ips.includes(ip) || !ips.includes("*")) {
                return res.status(403).json({
                    success: false,
                    code: "AuthenticationFailed",
                    message: "The API authentication failed, either the API key is incorrect or the IP is not whitelisted.",
                });
            }
  
            req.experimentId = row.id;
            return next();
          }
        }
  
        return res.status(403).json({
            success: false,
            code: "AuthenticationFailed",
            message: "The API authentication failed, either the API key is incorrect or the IP is not whitelisted.",
        });
  
      } catch (err) {
        console.error('[AUTH ERROR]', err);
        return res.status(500).json({
            success: false,
            code: "AuthenticationFailed",
            message: "The API authentication failed, either the API key is incorrect or the IP is not whitelisted.",
        });
      }
    };
  }
  
  module.exports = createAuthMiddleware;