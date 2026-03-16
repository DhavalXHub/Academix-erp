const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/academix')
  .then(() => {
    require('fs').writeFileSync('db_status.txt', 'Connected');
    process.exit(0);
  })
  .catch(e => {
    require('fs').writeFileSync('db_status.txt', e.toString());
    process.exit(1);
  });
