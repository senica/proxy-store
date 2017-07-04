(function(){

  const lazy = require('lazy-events')({});

  /**
   * TODO: Save and restore
   * after some consideration, I do not allow multiple stores, as I feel
   * the store should be global.
   */

  let debug = false;
  function log(){
    if(debug) console.log.apply(console, arguments);
  }

  /**
   * The parent and key are necessary to modify the chain and not break
   * references
   * @param  {Object | Array} __target__ What we are making into a proxy
   * @param {Object} parent The parent of the __target__
   * @param {[type]} key   The key or property on the parent that defines the __target__
   * @return {Proxy Object} Use your object like normal.
   */
  function makeProxy(__target__, parent, key){
    let proxy = new Proxy(__target__, {
      get: (target, name)=>{
        log('getting', name)

        // Request to turn object to JSON from JSON.stringify
        if(name === 'toJSON'){
          log('making json', name)
          return JSON.stringify(target[name]);
        }

        if(name in target){
          log('returning', name)
          return target[name]
        }

        if(typeof name === 'symbol'){
          log('ignoring', name)
          return
        }

        if(name === 'inspect'){
          log('ignoring', name);
          return;
        }

        if(!isNaN(Number(name))){
          log(name, 'is a number')
          // We are trying to access an array, but it's not an array, convert it
          let i = Number(name);
          if(!Array.isArray(target)){
            log('converting parent to array', name)
            target.__parent__[target.__key__] = makeProxy([], target.__parent__, target.__key__)
            target.__parent__[target.__key__][i] = makeProxy({}, target.__parent__[target.__key__], i)
            return target.__parent__[target.__key__][i]
          }else{
            log('parent is already an array', name)
            target[i] = makeProxy([], target, i);
            return target[i];
          }
        }else{
          log(name, 'is not a number')
          // We are trying to access an object, but it's not, convert it
          if(Array.isArray(target)){
            log('converting parent to object', name)
            target.__parent__[target.__key__] = makeProxy({}, target.__parent__, target.__key__)
            target.__parent__[target.__key__][name] = makeProxy({}, target.__parent__[target.__key__], name)
            return target.__parent__[target.__key__][name]
          }else{
            log('parent is already an object', name)
            target[name] = makeProxy({}, target, name);
            return target[name]
          }
        }


        /**
         * Some of the values I know of that we are ignoring
         * {} Symbol(util.inspect.custom) true
         * {} 'valueOf' true
         * {} Symbol(Symbol.toStringTag) true
         * {} Symbol(Symbol.toStringTag) true
         */
      },

      set: (target, name, value, receiver)=>{
        log('setting value', name, target.__label__)
        if(Array.isArray(value) || (typeof value === 'object' && value !== null)){
          log('value is an array. is it already a proxy?', name)
          // if it already has a __proxy__, then it is being set from the getter.
          // we don't need to make it a proxy again.
          if(!value.__proxy__){
            log('it is not a proxy, we need to make it one', name)
            target[name] = makeProxy(value, target, name);
            lazy.emit(target.__label__ + '.' + name.toString(), target[name])
            return true;
          }
        }
        // primative
        target[name] = value;
        lazy.emit(target.__label__ + '.' + name.toString(), target[name])
        return true;
      }
    });

    Object.defineProperty(proxy, '__parent__', {
      get: ()=>{
        return parent;
      }
    })
    Object.defineProperty(proxy, '__key__', {
      get: ()=>{
        return key;
      }
    })
    Object.defineProperty(proxy, '__proxy__', {
      get: ()=>{
        return true;
      }
    })
    Object.defineProperty(proxy, '__label__', {
      get: ()=>{
        return (parent.__label__ ? (parent.__label__ + '.') : '') + key.toString();
      }
    })

    // They are wanting to make a proxy of full object or array
    // All the children need to be proxied as well.
    for(i in proxy){
      log('checking value', i)
      if(Array.isArray(proxy[i]) || (typeof proxy[i] === 'object' && proxy[i] !== null)){
        log('converting to proxy', i)
        proxy[i] = makeProxy(proxy[i], proxy, i);
      }else{
        // this is necessary so the 'setter' will trigger
        proxy[i] = proxy[i];
      }
    }

    return proxy;
  }

  // This is so we have something to actually proxy.
  const root = {
    store: {}
  };
  let proxy;

  function set(value){
    if(!Array.isArray(value) && (typeof value !== 'object' || value === null)){
      throw new Error('Store must be an array or an object.')
    }

    proxy = makeProxy(value, root, 'store')

    // add event handler back on.
    Object.defineProperty(proxy, 'on', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: lazy.on
    });
    Object.defineProperty(proxy, 'one', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: lazy.one
    });
    Object.defineProperty(proxy, 'off', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: lazy.off
    });

    // provide a means to set the proxy
    Object.defineProperty(proxy, 'set', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: set
    })

    return proxy
  }

  // build proxy
  set({})


  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = proxy;
  }else if(typeof define === 'function' && define.amd) {
    define([], function() {
      return proxy;
    });
  }
  if(typeof window === 'object'){
    Object.defineProperty(window, 'ProxyStore', {
      set: set,
      get: ()=>{
        return proxy;
      }
    })
  }
})()
