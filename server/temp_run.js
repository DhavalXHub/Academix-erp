process.on('uncaughtException', err => require('fs').writeFileSync('error.log', err.stack));
process.on('unhandledRejection', err => require('fs').writeFileSync('error.log', err.stack));
try {
  require('./server.js');
} catch (err) {
  require('fs').writeFileSync('error.log', err.stack);
}
