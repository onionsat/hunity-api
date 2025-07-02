async function sendCommand(ws, db, experimentId, commandBigHex, executeUnixTime) {
    console.log(`Parancs küldése: experimentId=${experimentId}, commandBigHex=${commandBigHex}, executeUnixTime=${executeUnixTime}`);

    // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
    if (!ws.isAuthenticated) {
        ws.send("Login required");
        return;
    }

    console.log(ws.username);
    if(ws.username.toLowerCase() !== experimentId.toLowerCase()) {
        ws.send("Unauthorized experiment access");
        return;
    }

    try {
        const experiments = ['capysat', 'celeritas', 'kulinsat', 'onionsat', 'seat', 'seraph', 'cspd'];
        if (!experiments.includes(experimentId)) {
            ws.send(JSON.stringify({
                success: false,
                code: "InvalidExperiment",
                message: `A megadott kísérlet (${experimentId}) nem érvényes.`,
            }));
            return;
        }

        // Ellenőrizzük, hogy a commandBigHex 16 karakter hosszú-e
        if (typeof commandBigHex !== 'string' || commandBigHex.length !== 16) {
            ws.send(JSON.stringify({
                success: false,
                code: "InvalidCommand",
                message: "A parancs (commandBigHex) érvénytelen. Pontosan 16 karakter hosszúnak kell lennie.",
            }));
            return;
        }

        // Az executeUnixTime értékének kezelése
        const now = Math.floor(Date.now() / 1000); // Jelenlegi idő UNIX formátumban
        if (executeUnixTime < 0) {
            executeUnixTime = now + executeUnixTime; // Relatív idő
        } else if (executeUnixTime === 0) {
            executeUnixTime = now; // Azonnali végrehajtás
        }

        // Az experiment ID lekérdezése
        const [experimentRows] = await db.execute('SELECT id FROM experiments WHERE name = ?', [experimentId]);
        if (experimentRows.length === 0) {
            ws.send(JSON.stringify({
                success: false,
                code: "ExperimentNotFound",
                message: `A megadott kísérlet (${experimentId}) nem található.`,
            }));
            return;
        }
        const experimentDbId = experimentRows[0].id;

        // Parancs beszúrása a writecommands táblába
        const query = `
            INSERT INTO writecommands (experimentid, sent, command, execution_time)
            VALUES (?, 0, ?, FROM_UNIXTIME(?))
        `;
        await db.execute(query, [experimentDbId, commandBigHex, executeUnixTime]);

        ws.send("Command sent");
    } catch (err) {
        console.error('DB error:', err);
        ws.send("Server error");
    }
}

module.exports = {
    sendCommand,
};