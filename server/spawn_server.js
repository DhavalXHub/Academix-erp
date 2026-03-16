const { spawn } = require('child_process');
const fs = require('fs');
const out = fs.openSync(__dirname + '/debug_server.log', 'w');
const err = fs.openSync(__dirname + '/debug_server.log', 'a');
const child = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: [ 'ignore', out, err ]
});
child.unref();
console.log('Server spawned. Check debug_server.log.');
