const fs = require('fs');
try {
  require('./server/server.js');
} catch(e) {
  fs.writeFileSync('C:\\Users\\Dhaval\\Desktop\\Academix\\crash_report.log', e.stack);
}
