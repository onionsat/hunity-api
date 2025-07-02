// routes/socket/user.js

async function login(ws, db, username, password) {
    console.log(`Bejelentkezési kísérlet: ${username}`);
    
    try {
        const query = 'SELECT id, name, api_keys FROM experiments WHERE name = ?';
        const [rows] = await db.query(query, [username]);

        if (rows.length > 0) {
            const user = rows[0];
            const keys = JSON.parse(user.api_keys || '[]');

            if (keys.includes(password)) {
                ws.isAuthenticated = true;
                ws.username = user.name;
                ws.experimentId = user.id;
                ws.send(`${user.name} logged in`);
                console.log(`${user.name} logged in`);
            } else {
                ws.send('Login failed');
                console.warn(`Sikertelen bejelentkezési kísérlet: ${username} (érvénytelen API kulcs)`);
            }
        } else {
            ws.send('Login failed');
            console.warn(`Sikertelen bejelentkezési kísérlet: ${username} (érvénytelen felhasználónév)`);
        }
    } catch (error) {
        console.error('Hiba történt a bejelentkezés során:', error);
        ws.send('Login database error');
    }
}

module.exports = {
    login
};