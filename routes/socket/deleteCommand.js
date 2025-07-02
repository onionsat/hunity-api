async function deleteCommand(ws, db, experimentId, commandId) {
    console.log(`Parancs törlése: experimentId=${experimentId}, commandId=${commandId}`);

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

        // Ellenőrizzük, hogy az experimentId érvényes-e
        if (!experiments.includes(experimentId)) {
            ws.send(JSON.stringify({
                success: false,
                code: "InvalidExperiment",
                message: `A megadott kísérlet (${experimentId}) nem érvényes.`,
            }));
            return;
        }

        // Ellenőrizzük, hogy a commandId érvényes szám-e
        commandId = parseInt(commandId, 10);
        if (isNaN(commandId) || commandId <= 0) {
            ws.send(JSON.stringify({
                success: false,
                code: "InvalidCommandId",
                message: "A megadott command_id érvénytelen.",
            }));
            return;
        }

        // Ellenőrizzük, hogy a parancs a felhasználóhoz tartozik-e, és még nem lett elküldve
        const query = `
            SELECT wc.id
            FROM writecommands wc
            JOIN experiments e ON wc.experimentid = e.id
            WHERE wc.id = ? AND e.name = ? AND wc.sent = 0
        `;
        const [rows] = await db.execute(query, [commandId, experimentId]);

        if (rows.length === 0) {
            ws.send(JSON.stringify({
                success: false,
                code: "CommandNotFoundOrUnauthorized",
                message: "A parancs nem található, már elküldték, vagy nem jogosult a törlésére.",
            }));
            return;
        }

        // Parancs törlése
        const deleteQuery = `DELETE FROM writecommands WHERE id = ?`;
        await db.execute(deleteQuery, [commandId]);

        ws.send("OK");
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
    deleteCommand,
};