describe('Store Tests', ()=>{

  it('checks set', async (done)=>{
    try{
      let { window } = await jsdom(``, [])

      assert(window.ProxyStore.__proxy__, true);

      window.ProxyStore.set({'hi': 'senica'})
      assert(window.ProxyStore.__proxy__, true);
      require('assert').deepEqual(window.ProxyStore, {
        hi: 'senica'
      })

      window.ProxyStore.set({'bob': 'was here'})
      assert(window.ProxyStore.__proxy__, true);
      require('assert').deepEqual(window.ProxyStore, {
        bob: 'was here'
      })

      /**
       * Don't do this as it will break the getter.
       *
       * window.ProxyStore = {'hi': 'senica'}
       * assert(window.ProxyStore.__proxy__, true);
       * require('assert').deepEqual(window.ProxyStore, {
       *   hi: 'senica'
       * })
       * window.ProxyStore = {'bob': 'was here'}
       * assert(window.ProxyStore.__proxy__, true);
       * require('assert').deepEqual(window.ProxyStore, {
       *   bob: 'was here'
       * })
       */

      done()
    }catch(e){
      done(e)
    }
  })

  it('single default', async (done)=>{
    try{

      let {window} = await jsdom(``, [])

      window.ProxyStore.login.email.default('senica');
      assert(window.ProxyStore.login.email, 'senica');

      // cannot reassign defaults
      window.ProxyStore.login.default({
        email: 'bob'
      });
      assert(window.ProxyStore.login.email, 'senica');
      done()
    }catch(e){
      done(e)
    }
  })

  it('default overrides', async (done)=>{
    try{

      let {window} = await jsdom(``, [])

      window.ProxyStore.login.email.default('senica');
      assert(window.ProxyStore.login.email, 'senica');
      window.ProxyStore.login.default({
        email: 'bob',
        name: 'senica'
      })
      assert(window.ProxyStore.login.email, 'senica'); // still senica, not bob
      assert(window.ProxyStore.login.name, 'senica');
      window.ProxyStore.default({
        login: {
          email: 'bob',
          street: 'hackberry'
        }
      })
      require('assert').deepEqual(window.ProxyStore, {
        login: {
          email: 'senica',
          name: 'senica',
          street: 'hackberry'
        }
      })
      window.ProxyStore.default('hi')
      require('assert').deepEqual(window.ProxyStore, {
        login: {
          email: 'senica',
          name: 'senica',
          street: 'hackberry'
        }
      })
      window.ProxyStore.login.default('hi')
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
      window.ProxyStore.login.default({
        name: 'senica',
        address: {
          street: 'hackberry'
        }
      })
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
      window.ProxyStore.names.default([
        {name: 'senica'}
      ])
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
      window.ProxyStore.set({
        hi: 'senica'
      })
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
      // or just
      store2.set({
        hi: 'bob',
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
      window.ProxyStore.set({
        names: [
          {
            name: 'senica'
          }
        ]
      })
      let store = window.ProxyStore
      store.set({
        names: [
          {
            name: 'senica'
          }
        ]
      })
      assert(window.ProxyStore.__proxy__, true);
      assert(window.ProxyStore.names.__proxy__, true);
      assert(window.ProxyStore.names[0].__proxy__, true);
      // Primatives don't get proxied
      assert(typeof window.ProxyStore.names[0].name.__proxy__, 'undefined');
      require('assert').deepEqual(window.ProxyStore, { names: [{name: 'senica'}] })
      require('assert').deepEqual(store, { names: [{name: 'senica'}] })
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
        assert(e.message, 'Do not set the store like this. Use .set function instead. e.g. window.Proxy.store.set({})')
        done();
      }catch(e){
        done(e)
      }
    }
  })

  it('Set store as array.', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      window.ProxyStore.set(['senica', 'bob'])
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
      window.ProxyStore.set({
        names: [
          {
            name: 'senica'
          }
        ]
      })
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
      window.ProxyStore.set({
        names: [
          {
            name: 'senica'
          }
        ]
      })
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

      window.ProxyStore.set({
        names: [
          {
            name: 'senica'
          }
        ]
      })

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

      window.ProxyStore.set({
        names: [
          {
            name: 'senica'
          }
        ]
      })

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

  it('Test looping events with array; events should only trigger if they are different', async (done)=>{
    try{


      let { window } = await jsdom(``, [])

      let count = 0;

      window.ProxyStore.name = ['hello', 'john', 'senica']

      let timer = null;
      window.ProxyStore.on('store.name.0', (value)=>{

        count++;
        window.ProxyStore.name = [0, 'o'];
        clearTimeout(timer);
        timer = setTimeout(()=>{
          assert(count, 2)
          require('assert').deepEqual(window.ProxyStore.name, [0, 'o']);
          done();
        }, 10);
      })

    }catch(e){
      done(e)
    }
  })

  it('Test looping events with object; events should only trigger if they are different', async (done)=>{
    try{


      let { window } = await jsdom(``, [])

      let count = 0;

      window.ProxyStore.name = {bob: 'senica', name: 'yes'}

      let timer = null;
      window.ProxyStore.on('store.name', (value)=>{

        count++;
        window.ProxyStore.name = {bob: 'bob'};
        clearTimeout(timer);
        timer = setTimeout(()=>{
          assert(count, 2)
          require('assert').deepEqual(window.ProxyStore.name, {bob: 'bob'});
          done();
        }, 10);
      })

    }catch(e){
      done(e)
    }
  })

  it('Test looping events with primitives; events should only trigger if they are different', async (done)=>{
    try{


      let { window } = await jsdom(``, [])

      let count = 0;

      window.ProxyStore.name = 'senica'

      let timer = null;
      window.ProxyStore.on('store.name', (value)=>{

        count++;
        window.ProxyStore.name = 'hi';
        clearTimeout(timer);
        timer = setTimeout(()=>{
          assert(count, 2)
          require('assert').deepEqual(window.ProxyStore.name, 'hi');
          done();
        }, 10);
      })

    }catch(e){
      done(e)
    }
  })

  it('Test parent chained events', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      let count = 0, timer = null;

      window.ProxyStore.on('store.clients', (value)=>{
        count++;
        clearTimeout(timer);
        timer = setTimeout(()=>{
          assert(count, 2)
          require('assert').deepEqual(window.ProxyStore.clients, [
            {client: {name: 'senica'}},
            {client: {name: 'senica'}},
            {client: {name: 'george'}},
          ]);
          require('assert').deepEqual(value, [
            {client: {name: 'senica'}},
            {client: {name: 'senica'}},
            {client: {name: 'george'}},
          ]);
          done();
        }, 10);
      })

      window.ProxyStore.clients = [
        {client: {name: 'senica'}},
        {client: {name: 'bob'}},
        {client: {name: 'george'}},
      ]

      window.ProxyStore.clients[1].client.name = 'senica'

    }catch(e){
      done(e)
    }
  })

  it('Test parent chained events with objects', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      let count = 0, timer = null;

      window.ProxyStore.on('store.clients', (value)=>{
        count++;
        clearTimeout(timer);
        timer = setTimeout(()=>{
          assert(count, 1)
          require('assert').deepEqual(window.ProxyStore.clients, {
            name: 'senica',
            address: {
              street: 'blue ridge',
              box: {
                number: 1
              }
            }
          });
          require('assert').deepEqual(value, {
            name: 'senica',
            address: {
              street: 'blue ridge',
              box: {
                number: 1
              }
            }
          });
          done();
        }, 100);
      })

      window.ProxyStore.clients = {
        name: 'senica',
        address: {
          street: 'blue ridge',
          box: {
            number: 1
          }
        }
      }

    }catch(e){
      done(e)
    }
  })

  it('Child and peer events should be triggered after all data has been set, watching events may depend on them', async (done)=>{
    try{
      let { window } = await jsdom(``, [])
      let count = 0, timer = null;

      window.ProxyStore.on('store.clients.name', (value)=>{
        assert(window.ProxyStore.clients.address, 'cool way')
        done();
      })

      window.ProxyStore.clients = {
        name: 'senica',
        address: 'cool way'
      }

    }catch(e){
      done(e)
    }
  })

})
