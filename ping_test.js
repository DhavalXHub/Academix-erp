const express = require('express');
const app = express();
app.get('/ping', (req, res) => res.send('pong'));
app.listen(5001, () => {
  require('fs').writeFileSync(__dirname + '/ping_ready.txt', 'READY');
});
