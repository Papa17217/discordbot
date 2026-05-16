const fs = require('fs');
const path = require('path');

function processFile(filePath, botType) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let result = '';
  let inGuildCall = false;
  let braceCount = 0;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (line.includes('prisma.guild.') || line.includes('this.prisma.guild.')) {
      inGuildCall = true;
      braceCount = 0;
    }
    
    if (inGuildCall) {
      const openMatches = (line.match(/\{/g) || []).length;
      const closeMatches = (line.match(/\}/g) || []).length;
      braceCount += openMatches - closeMatches;
      
      if (line.includes('where: { discordId:')) {
        line = line.replace(/where:\s*\{\s*discordId:\s*([^,}]+)\s*\}/, `where: { discordId_botType: { discordId: $1, botType: '${botType}' } }`);
      } else if (line.includes('where: { discordId }')) {
        line = line.replace(/where:\s*\{\s*discordId\s*\}/, `where: { discordId_botType: { discordId, botType: '${botType}' } }`);
      }
      
      if (braceCount <= 0 && closeMatches > 0) {
        inGuildCall = false;
      }
    }
    
    result += line + (i < lines.length - 1 ? '\n' : '');
  }
  
  if (content !== result) {
    fs.writeFileSync(filePath, result, 'utf-8');
    console.log('Updated', filePath);
  }
}

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
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
    processFile(filePath, botType);
  });
});
