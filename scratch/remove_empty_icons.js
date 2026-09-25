const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

walkDir(path.join(__dirname, '../client/src'), (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('icon={}')) {
      content = content.replace(/\s*icon=\{\}/g, '');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed icon={} in:', filePath);
    }
  }
});
