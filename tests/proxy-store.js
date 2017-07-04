describe('Store Tests', ()=>{

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

})
