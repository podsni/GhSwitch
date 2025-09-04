const fs = require('fs');
let s = fs.readFileSync('src/gh.ts','utf8');
// crude removal of template strings and quotes
s = s.replace(/`[\s\S]*?`/g, '');
s = s.replace(/"[^"\n]*"/g, '');
s = s.replace(/'[^'\n]*'/g, '');
let depth=0, extraCloseAt=-1;
for (let i=0;i<s.length;i++){
  const c=s[i];
  if (c==='{' ) depth++;
  if (c==='}' ) depth--, (depth<0)&&(extraCloseAt=i, i=s.length);
}
console.log('depth:', depth, 'extraCloseAt:', extraCloseAt);
