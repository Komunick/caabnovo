const fs = require('fs');
const { marked } = require('C:/Projetos/caabnovo/node_modules/.pnpm/marked@14.0.0/node_modules/marked');
const bodies = JSON.parse(fs.readFileSync(__dirname + '/applied-page-bodies.json', 'utf8'));
fs.writeFileSync(__dirname + '/applied-page-html.json', JSON.stringify(Object.fromEntries(Object.entries(bodies).map(([id, md]) => [id, marked.parse(md)])), null, 2));
