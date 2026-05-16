const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
    else if (dirPath.endsWith('.ts')) callback(dirPath);
  });
}

const botDirs = ['apps/bot/src', 'apps/bot-public/src'];

botDirs.forEach(botDir => {
  const isPublic = botDir.includes('public');
  const botType = isPublic ? 'PUBLIC' : 'PRIVATE';
  
  walkDir(path.join('e:/discord bot', botDir), (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    // Replace: where: { discordId: xxx }
    const regex1 = /where:\s*\{\s*discordId:\s*([^,}]+)\s*\}/g;
    if (regex1.test(content)) {
      content = content.replace(regex1, `where: { discordId_botType: { discordId: $1, botType: '${botType}' } }`);
      changed = true;
    }

    // Replace: where: { discordId }
    const regex2 = /where:\s*\{\s*discordId\s*\}/g;
    if (regex2.test(content)) {
      content = content.replace(regex2, `where: { discordId_botType: { discordId, botType: '${botType}' } }`);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated', filePath);
    }
  });
});
