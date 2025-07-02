const getEXPData = require('./getEXPData');
const login = require('./login');
const sendCommand = require('./sendCommand');
const getCMDWindows = require('./getCMDWindows');
const getCMDQueue = require('./getCMDQueue');
const deleteCommand = require('./deleteCommand');

const commands = {
    // Felhasználói parancsok
    login: login.login,
    getEXPData: getEXPData.getEXPData,
    sendCommand: sendCommand.sendCommand,
    getCMDWindows: getCMDWindows.getCMDWindows,
    getCMDQueue: getCMDQueue.getCMDQueue,
    deleteCommand: deleteCommand.deleteCommand,

};

function handleSocketMessage(ws, message, wss, db) {
    try {
        const commandRegex = /^([a-zA-Z0-9_]+)\((.*)\)$/;
        const match = message.match(commandRegex);

        if (match) {
            const commandName = match[1];
            const argsString = match[2];

            let args = [];
            if (argsString) {
                try {
                    args = JSON.parse(`[${argsString}]`);
                } catch (e) {
                    args = argsString.split(',').map(arg => arg.trim());
                }
            }
            
            const commandHandler = commands[commandName];

            if (commandHandler) {
                console.log(`Parancs feldolgozása: ${commandName} args:`, args);
                commandHandler(ws, db, ...args);
            } else {
                console.warn(`Ismeretlen parancs: ${commandName}`);
                ws.send(`Hiba: Ismeretlen parancs - ${commandName}`);
            }
        } else {
            console.log(`Nem parancs formátumú üzenet: ${message}`);
            ws.send(`Szerver válasz: Kaptam az üzenetedet: "${message}" (nem parancs formátum)`);
        }
    } catch (error) {
        console.error(`Hiba a parancs feldolgozása során: ${error.message}`);
        ws.send(`Szerver hiba a parancs feldolgozása során: ${error.message}`);
    }
}

module.exports = handleSocketMessage;