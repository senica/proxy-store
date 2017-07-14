describe('Store Tests', ()=>{

  it('single default', async (done)=>{
    try{

      let {window} = await jsdom(``, [])

      window.ProxyStore.login.email.defaults = 'senica';
      assert(window.ProxyStore.login.email, 'senica');

      // cannot reassign defaults
      window.ProxyStore.login.email.defaults = 'bob';
      assert(window.ProxyStore.login.email, 'senica');
      done()
    }catch(e){
      done(e)
    }
  })

  it('default overrides', async (done)=>{
    try{

      let {window} = await jsdom(``, [])

      window.ProxyStore.login.email.defaults = 'senica';
      assert(window.ProxyStore.login.email, 'senica');
      window.ProxyStore.login.defaults = {
        email: 'bob',
        name: 'senica'
      }
      assert(window.ProxyStore.login.email, 'senica'); // still senica, not bob
      assert(window.ProxyStore.login.name, 'senica');
      window.ProxyStore.defaults = {
        login: {
          email: 'bob',
          street: 'hackberry'
        }
      }
      require('assert').deepEqual(window.ProxyStore, {
        login: {
          email: 'senica',
          name: 'senica',
          street: 'hackberry'
        }
      })
      window.ProxyStore.defaults = 'hi'
      require('assert').deepEqual(window.ProxyStore, {
        login: {
          email: 'senica',
          name: 'senica',
          street: 'hackberry'
        }
      })
      window.ProxyStore.login.defaults = 'hi'
      require('assert').deepEqual(window.ProxyStore, {
        login: {
          email: 'senica',
          name: 'senica',
          street: 'hackberry'
        }
      })
      done()
    }catch(e){
      done(e)
    }
  })

  it('object defaults', async (done)=>{
    try{
      let {window} = await jsdom(``, [])
      window.ProxyStore.login.defaults = {
        name: 'senica',
        address: {
          street: 'hackberry'
        }
      }
      require('assert').deepEqual(window.ProxyStore.login, {
        name: 'senica',
        address: {
          street: 'hackberry'
        }
      });
      done()
    }catch(e){
      done(e)
    }
  })

  it('array defaults', async (done)=>{
    try{
      let {window} = await jsdom(``, [])
      window.ProxyStore.names.defaults = [
        {name: 'senica'}
      ]
      require('assert').deepEqual(window.ProxyStore.names, [
        {name: 'senica'}
      ]);
      done()
    }catch(e){
      done(e)
    }
  })

  it('Get initial store. Should be initialized as a proxy', async (done)=>{
    try{
      let {window} = await jsdom(``, [])
      assert(window.ProxyStore.__proxy__, true);
      done()
    }catch(e){
      done(e)
    }
  })

  it('Assign store directly from window.ProxyStore', async (done)=>{
    try{
      let {window} = await jsdom(``, [])
      window.ProxyStore = {
        hi: 'senica'
      }
      require('assert').deepEqual(window.ProxyStore, {
        hi: 'senica'
      });
      done()
    }catch(e){
      done(e)
    }
  })

  it('Assign to another object', async (done)=>{
    try{
      let {window} = await jsdom(``, [])

      // This will not work because it will break references
      let store = Object.assign({}, window.ProxyStore);
      store = {
        hi: 'senica'
      }
      assert(store.__proxy__, undefined);

      // This is the proper way.
      let store2 = window.ProxyStore;
      store2 = store2.set({
        hi: 'bob'
      })
      assert(store2.__proxy__, true);
      require('assert').deepEqual(store2, {
        hi: 'bob'
      })
      require('assert').deepEqual(window.ProxyStore, {
        hi: 'bob'
      })

      done()
    }catch(e){
      done(e)
    }
  })

  it('Set store as object', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      window.ProxyStore = {
        names: [
          {
            name: 'senica'
          }
        ]
      }
      console.dir(window.ProxyStore);
      assert(window.ProxyStore.__proxy__, true);
      assert(window.ProxyStore.names.__proxy__, true);
      assert(window.ProxyStore.names[0].__proxy__, true);
      // Primatives don't get proxied
      assert(typeof window.ProxyStore.names[0].name.__proxy__, 'undefined');
      done()
    }catch(e){
      done(e)
    }
  })

  it('Store must be an array or object', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      window.ProxyStore = 'senica'
      assert(true, false, 'This should have thrown an error.')
    }catch(e){
      try{
        assert(e.message, 'Store must be an array or an object.')
        done();
      }catch(e){
        done(e)
      }
    }
  })

  it('Set store as array.', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      window.ProxyStore = ['senica', 'bob']
      assert(window.ProxyStore.__proxy__, true);
      // Primatives don't get proxied
      assert(typeof window.ProxyStore[0].__proxy__, 'undefined');
      assert(window.ProxyStore[0], 'senica');
      done()
    }catch(e){
      done(e)
    }
  })

  it('Chain object or arrays. Auto create', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      window.ProxyStore.names[1].name = 'senica'
      assert(window.ProxyStore.names[1].name, 'senica')
      assert(window.ProxyStore.names.length, 2)
      done()
    }catch(e){
      done(e)
    }
  })

  it('Cannot chain primatives.', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      window.ProxyStore.names[1].name = 'senica'
      assert(window.ProxyStore.names[1].name, 'senica')
      assert(window.ProxyStore.names.length, 2)
      done()
    }catch(e){
      done(e)
    }
  })

  it('Get length', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      window.ProxyStore.names[1].name = 'senica'
      assert(window.ProxyStore.names[1].name.length, 6) // primitive string uses internal functions.
      assert(window.ProxyStore.names.length, 2) // counts blank values also
      assert(window.ProxyStore.test.length, 0); // object
      window.ProxyStore.test = [];
      assert(window.ProxyStore.test.length, 0);
      window.ProxyStore.test = ['hi'];
      assert(window.ProxyStore.test.length, 1); // array length
      window.ProxyStore.test = {test: 'length', again: 'test'};
      assert(window.ProxyStore.test.length, 2); // object keys
      window.ProxyStore.test = {test: 'length', again: 'test', length: 10};
      assert(window.ProxyStore.test.length, 10); // if property exists on object, return that
      done()
    }catch(e){
      done(e)
    }
  })

  it('Check labels', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      window.ProxyStore = {
        names: [
          {
            name: 'senica'
          }
        ]
      }
      assert(window.ProxyStore.names[0].__label__, 'store.names.0');
      done()
    }catch(e){
      done(e)
    }
  })

  it('Test ON event handler presence', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      assert(typeof window.ProxyStore.on, 'function');
      window.ProxyStore = {
        names: [
          {
            name: 'senica'
          }
        ]
      }
      assert(typeof window.ProxyStore.on, 'function');
      done()
    }catch(e){
      done(e)
    }
  })

  it('Test events', async (done)=>{
    try{
      let { window } = await jsdom(``, [])

      let before = ()=>{
        return new Promise((resolve, reject)=>{
          window.ProxyStore.on('store.names', (value)=>{
            resolve({place: 'first', value: value});
          })
        })
      }

      window.ProxyStore = {
        names: [
          {
            name: 'senica'
          }
        ]
      }

      let after = ()=>{
        return new Promise((resolve, reject)=>{
          window.ProxyStore.on('store.names', (value)=>{
            resolve({place: 'second', value: value});
          })
        })
      }

      Promise.all([before(), after()])
      .then((values)=>{
        require('assert').deepEqual(values[0], {place: 'first', value: [{name: 'senica'}]})
        require('assert').deepEqual(values[1], {place: 'second', value: [{name: 'senica'}]})
        done()
      })
      .catch((e)=>{
        done(e);
      })

    }catch(e){
      done(e)
    }
  })

  it('Test non-lazy events', async (done)=>{
    try{
      let { window } = await jsdom(``, [])

      let before = ()=>{
        return new Promise((resolve, reject)=>{
          window.ProxyStore.on('store.names', (value)=>{
            resolve({place: 'first', value: value});
          })
        })
      }

      window.ProxyStore = {
        names: [
          {
            name: 'senica'
          }
        ]
      }

      // This event was registered after, but lazy is turned off, so it does not run.
      let after = ()=>{
        return new Promise((resolve, reject)=>{
          window.ProxyStore.on('store.names', (value)=>{
            resolve({place: 'second', value: value});
          }, false) // <-- lazy is set to false.
          setTimeout(()=>{
            resolve({place: 'second', value: false});
          }, 500)
        })
      }

      Promise.all([before(), after()])
      .then((values)=>{
        require('assert').deepEqual(values[0], {place: 'first', value: [{name: 'senica'}]})
        require('assert').deepEqual(values[1], {place: 'second', value: false})
        done()
      })
      .catch((e)=>{
        done(e);
      })

    }catch(e){
      done(e)
    }
  })

  it('Test looping events; events should only trigger if they are different', async (done)=>{
    try{
      let { window } = await jsdom(``, [])

      let count = 0;

      window.ProxyStore.name = 'hi'

      let timer = null;
      window.ProxyStore.on('store.name', (value)=>{
        count++;
        window.ProxyStore.name = 'hello';
        clearTimeout(timer);
        timer = setTimeout(()=>{
          assert(count, 2)
          assert(window.ProxyStore.name, 'hello')
          done();
        }, 10);
      })

    }catch(e){
      done(e)
    }
  })

  /*
  it('Test looping events with array; events should only trigger if they are different', async (done)=>{
    try{
      let { window } = await jsdom(``, [])

      let count = 0;

      window.ProxyStore.name = ['hello']

      let timer = null;
      window.ProxyStore.on('store.name.0', (value)=>{
        console.log('here')
        count++;
        window.ProxyStore.name = [0, 'o'];
        clearTimeout(timer);
        timer = setTimeout(()=>{
          assert(count, 2)
          assert(window.ProxyStore.name, [0, 'o']);
          done();
        }, 10);
      })

    }catch(e){
      done(e)
    }
  })
  */

})
