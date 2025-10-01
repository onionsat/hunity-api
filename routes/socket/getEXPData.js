async function getEXPData(ws, db, experimentId, startTimestamp, endTimestamp) {
    console.log(`Adatlekérdezés: experimentId=${experimentId}, startTimestamp=${startTimestamp}, endTimestamp=${endTimestamp}`);

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
        const result = { datas: {} };

        // Időbélyegek kezelése
        const now = Math.floor(Date.now() / 1000); // Jelenlegi idő UNIX formátumban
        startTimestamp = parseInt(startTimestamp, 10) || 0;
        endTimestamp = parseInt(endTimestamp, 10) || 0;

        if (startTimestamp < 0) startTimestamp = now + startTimestamp; // Relatív idő
        if (endTimestamp < 0) endTimestamp = now + endTimestamp; // Relatív idő

        // Ha az experimentId "all", akkor az összes kísérletet lekérdezzük
        const experimentNames = experimentId === 'all' ? experiments : [experimentId];

        for (const experimentName of experimentNames) {
            if (!experiments.includes(experimentName)) {
                ws.send(JSON.stringify({
                    success: false,
                    code: "InvalidExperiment",
                    message: `A megadott kísérlet (${experimentName}) nem érvényes.`,
                }));
                return;
            }

            if ((endTimestamp - startTimestamp > 604800)) {
                ws.send(JSON.stringify({
                    success: false,
                    code: "TimeRangeExceeded",
                    message: "A lekérdezhető időintervallum maximum 168 óra lehet.",
                }));
                return;
            }

            // Alapértelmezett lekérdezés
            let query = 'SELECT id,UNIX_TIMESTAMP(timestamp) AS unixtimestamp, expdata FROM experimentdata WHERE experimentid = (SELECT id FROM experiments WHERE name = ?)';
            const params = [experimentName];

            if (startTimestamp === 0 && endTimestamp === 0) {
                query += ' ORDER BY id DESC LIMIT 1'; // Legújabb adat lekérdezése
            } else {
                if (startTimestamp > 0) {
                    query += ' AND timestamp >= FROM_UNIXTIME(?)';
                    params.push(startTimestamp);
                }
                if (endTimestamp > 0) {
                    query += ' AND timestamp <= FROM_UNIXTIME(?)';
                    params.push(endTimestamp);
                }
                query += ' ORDER BY id DESC'; // Legújabb adatok lekérdezése
            }

            console.log(`Lekérdezés: ${query} | Paraméterek: ${params}`);
            const [rows] = await db.execute(query, params);
            console.log(rows);

            // Adatok hozzáadása az eredményhez
            result.datas[experimentName] = rows.map(row => ({
                unixtimestamp: row.unixtimestamp,
                data: row.expdata,
            }));
        }

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
    getEXPData,
};