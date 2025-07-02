async function getCMDWindows(ws, db, startTimestamp, endTimestamp) {
    console.log(`Parancsablakok lekérdezése: startTimestamp=${startTimestamp}, endTimestamp=${endTimestamp}`);

    // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
    if (!ws.isAuthenticated) {
        ws.send(JSON.stringify({
            success: false,
            code: "NotAuthenticated",
            message: "A művelet végrehajtásához be kell jelentkezni.",
        }));
        return;
    }

    try {
        const now = Math.floor(Date.now() / 1000); // Jelenlegi idő UNIX formátumban
        startTimestamp = parseInt(startTimestamp, 10) || 0;
        endTimestamp = parseInt(endTimestamp, 10) || 0;

        let query;
        let params;

        // Ha mindkét timestamp 0, akkor az utolsó sort adjuk vissza
        if (startTimestamp === 0 && endTimestamp === 0) {
            query = `
                SELECT UNIX_TIMESTAMP(start_time) AS unixtimestampStart,
                       UNIX_TIMESTAMP(end_time) AS unixtimestampStop
                FROM command_windows
                ORDER BY id DESC
                LIMIT 1
            `;
            params = [];
        } else {
            // Relatív idő kezelése
            if (startTimestamp < 0) startTimestamp = now + startTimestamp;
            if (endTimestamp < 0) endTimestamp = now + endTimestamp;

            // Ellenőrizzük, hogy a startTimestamp kisebb, mint az endTimestamp
            if (startTimestamp >= endTimestamp) {
                ws.send(JSON.stringify({
                    success: false,
                    code: "InvalidTimeRange",
                    message: "A kezdési időnek kisebbnek kell lennie, mint a befejezési idő.",
                }));
                return;
            }

            // Parancsablakok lekérdezése az adott időintervallumra
            query = `
                SELECT UNIX_TIMESTAMP(start_time) AS unixtimestampStart,
                       UNIX_TIMESTAMP(end_time) AS unixtimestampStop
                FROM command_windows
                WHERE start_time >= FROM_UNIXTIME(?) AND end_time <= FROM_UNIXTIME(?)
                ORDER BY start_time ASC
            `;
            params = [startTimestamp, endTimestamp];
        }

        console.log(`Lekérdezés: ${query} | Paraméterek: ${params}`);
        const [rows] = await db.execute(query, params);

        // Eredmény formázása
        const result = {
            commandwindows: rows.map(row => ({
                unixtimestampStart: row.unixtimestampStart,
                unixtimestampStop: row.unixtimestampStop,
            })),
        };

        // Eredmény visszaküldése a WebSocket kliensnek
        ws.send(JSON.stringify(result));
    } catch (err) {
        console.error('DB error:', err);
        ws.send(JSON.stringify({
            success: false,
            code: "ServerError",
            message: "Váratlan szerverhiba történt. Kérjük, lépjen kapcsolatba az adminisztrátorral.",
        }));
    }
}

module.exports = {
    getCMDWindows,
};