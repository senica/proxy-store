describe('dummy', ()=>{
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
      console.log(window.ProxyStore.set)
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
      done()
    }catch(e){
      done(e)
    }
  })
})

/*
describe('test', ()=>{
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
})
*/
