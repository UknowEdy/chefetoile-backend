const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'server.log');

const write = (level, message, meta) => {
  const entry = `[${new Date().toISOString()}] [${level}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}\n`;
  fs.appendFile(logFile, entry, () => {});
  // Console pour visibilité temps réel
  if (level === 'ERROR') {
    console.error(entry.trim());
  } else if (level === 'WARN') {
    console.warn(entry.trim());
  } else {
    console.log(entry.trim());
  }
};

module.exports = {
  info: (message, meta) => write('INFO', message, meta),
  warn: (message, meta) => write('WARN', message, meta),
  error: (message, meta) => write('ERROR', message, meta),
};
