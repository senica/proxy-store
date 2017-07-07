'use strict';

const ug = require('uglify-es');
const fs = require('fs');
const simplyimport = require('simplyimport');
global.assert = require('assert').equal;


// override mocha "it" method to support async
// https://gist.github.com/senica/d793f871fa437b68aee7ba8b3227d330
let _it = it;
global.it = function(txt, cb){
  _it(txt, (done)=>{
    cb(done);
  });
}

const args = require('minimist')(process.argv.slice(2));

describe('Compiling ProxyStore', ()=>{

  it('Running tests...', (done)=>{

    let stream = simplyimport(__dirname + '/src/proxy-store.js', {
      //uglify: true,
    }, {
      isStream: false,
      context: __dirname + '/src/'
    })

    stream.on('error', (e)=>{
      done(e)
    })

    let code = ''
    stream.on('data', (chunk)=>{
      code += chunk;
    })

    stream.on('end', ()=>{
      let result = ug.minify(code);
      if(result.error) return done(result.error);

      code = result.code;

      fs.writeFileSync(__dirname + '/dist/proxy-store.min.js', code);


      // Make jsdom a little easier to use.
      const __jsdom = require("jsdom");
      const { JSDOM } = __jsdom;

      global.jsdom = function(html, scripts = []){
        return new Promise((resolve, reject)=>{
          try{
            let _scripts = [];
            for(let script of scripts){
              _scripts.push(`<script src="${script}"></script>`)
            }
            let dom = new JSDOM(`<body>
              ${html}
              <script>
                ${code}
              </script>
              ${_scripts.join('\n')}
            </body>`, {
              resources: 'usable',
              runScripts: 'dangerously'
            });
            dom.window.addEventListener('load', ()=>{
              resolve(dom);
            })
          }catch(e){
            reject(e);
          }
        });
      }

      var files = fs.readdirSync(__dirname + '/tests');

      describe('Starting tests on ' + __dirname + '/tests', function(){

        before((done)=>{
          done();
        });

        beforeEach((done)=>{
          done()
        });

        // only pull in the tests specified on the command line npm test case
        let tests = (args._ || []); tests.shift(); // remove test.js from array stack, this is for specifying what tests to run only
        (files || []).forEach((file)=>{
          let name = file.split('.'); let ext = name.pop(); name = name.join('.');
          if(ext != 'js') return; // only test javascript files
          if(!tests.length || tests.indexOf(name) > -1) {
            require(__dirname + '/tests/' + file);
          }
        });

        done();

      })
    })

  }); // end it
}); // end done
