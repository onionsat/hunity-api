async function getCMDQueue(ws, db, experimentId, startTimestamp, endTimestamp) {
    console.log(`Parancsok lekérdezése: experimentId=${experimentId}, startTimestamp=${startTimestamp}, endTimestamp=${endTimestamp}`);

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
        const experiments = ['capysat', 'celeritas', 'kulinsat', 'onionsat', 'seat', 'seraph', 'cspd'];
        const now = Math.floor(Date.now() / 1000); // Jelenlegi idő UNIX formátumban
        startTimestamp = parseInt(startTimestamp, 10) || 0;
        endTimestamp = parseInt(endTimestamp, 10) || 0;

        // Relatív idő kezelése
        if (startTimestamp < 0) startTimestamp = now + startTimestamp;
        if (endTimestamp < 0) endTimestamp = now + endTimestamp;

        // Ha mindkét timestamp 0, akkor az utolsó parancsot adjuk vissza
        let query;
        let params;
        if (startTimestamp === 0 && endTimestamp === 0) {
            query = `
                SELECT wc.id AS command_id,
                       UNIX_TIMESTAMP(wc.sent_to_master) AS unixtimestamp,
                       e.name AS experiment_id,
                       wc.command AS data,
                       wc.sent
                FROM writecommands wc
                JOIN experiments e ON wc.experimentid = e.id
                WHERE e.name = ?
                ORDER BY wc.id DESC
                LIMIT 1
            `;
            params = [experimentId];
        } else {
            // Ellenőrizzük, hogy a startTimestamp kisebb, mint az endTimestamp
            if (startTimestamp >= endTimestamp && endTimestamp !== 0) {
                ws.send(JSON.stringify({
                    success: false,
                    code: "InvalidTimeRange",
                    message: "A kezdési időnek kisebbnek kell lennie, mint a befejezési idő.",
                }));
                return;
            }

            // Ha az experimentId "all", akkor az összes kísérletet lekérdezzük
            const experimentFilter = experimentId === 'all' ? '' : 'AND wc.experimentid = (SELECT id FROM experiments WHERE name = ?)';

            // Parancsok lekérdezése az adott időintervallumra
            query = `
                SELECT wc.id AS command_id,
                       UNIX_TIMESTAMP(wc.sent_to_master) AS unixtimestamp,
                       e.name AS experiment_id,
                       wc.command AS data,
                       wc.sent
                FROM writecommands wc
                JOIN experiments e ON wc.experimentid = e.id
                WHERE (wc.sent_to_master >= FROM_UNIXTIME(?) ${endTimestamp > 0 ? 'AND wc.sent_to_master <= FROM_UNIXTIME(?)' : ''})
                ${experimentFilter}
                ORDER BY wc.sent_to_master ASC
            `;
            params = [startTimestamp];
            if (endTimestamp > 0) params.push(endTimestamp);
            if (experimentId !== 'all') params.push(experimentId);
        }

        console.log(`Lekérdezés: ${query} | Paraméterek: ${params}`);
        const [rows] = await db.execute(query, params);

        // Eredmény formázása
        const result = {
            commandqueue: rows.map(row => ({
                command_id: row.command_id,
                unixtimestamp: row.unixtimestamp,
                experiment_id: row.experiment_id,
                data: row.data,
                sent: row.sent,
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
    getCMDQueue,
};