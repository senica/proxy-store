let ug = require('uglify-es');
let fs = require('fs');
let code = fs.readFileSync(__dirname + '/src/proxy-store.js');
let result = ug.minify(code.toString());
if(result.error){
  throw new Error(result.error);
}
fs.writeFileSync(__dirname + '/dist/proxy-store.min.js', result.code);
