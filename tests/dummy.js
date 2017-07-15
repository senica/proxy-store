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
