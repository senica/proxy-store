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

  function traversable(value){
    if(Array.isArray(value) || (typeof value === 'object' && value !== null)){
      return true;
    }
    return false;
  }

  class ProxyArray extends Array{}
  class ProxyObject extends Object{}

  function fillDefaults(value, proxy){
    if(!traversable(value)){
      if(proxy !== null && typeof proxy === 'object'){
        if(!Object.keys(proxy).length) proxy.__parent__[proxy.__key__] = value;
      }else if(Array.isArray(proxy)){
        // This is not sophisticated at all! does not do deep checking on array.
        if(!proxy.length) proxy.__parent__[proxy.__key__] = value;
      }
      // it's already set manually
    }else{
      // we know the proxy is traversable otherwise we could not call .defaults
      for(i in value){
       fillDefaults(value[i], proxy[i])
      }
    }
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

        // Return length of object keys or array
        if(name === 'length'){
          return typeof target === 'object' ? Object.keys(target).length : target.length;
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
          if(!Array.isArray(target)){ // TODO: what does this do for strings?
            log('converting parent to array', name)
            makeProxy(new ProxyArray(), target.__parent__, target.__key__)
            makeProxy(new ProxyObject(), target.__parent__[target.__key__], i)
            return target.__parent__[target.__key__][i]
          }else{
            log('parent is already an array', name)
            makeProxy(new ProxyArray(), target, i);
            return target[i];
          }
        }else{
          log(name, 'is not a number')
          // We are trying to access an object, but it's not, convert it
          if(Array.isArray(target)){
            log('converting parent to object', name)
            makeProxy(new ProxyObject(), target.__parent__, target.__key__)
            makeProxy(new ProxyObject(), target.__parent__[target.__key__], name)
            return target.__parent__[target.__key__][name]
          }else{
            log('parent is already an object', name)
            makeProxy(new ProxyObject(), target, name);
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
        console.log('setting', target, name, value)
        if(traversable(value)){
          // Check if they are the same first
          makeProxy(Array.isArray(value) ? [] : {}, target, name);

          for(i in value){
            log('checking value', i)
            if(traversable(value[i])){
              makeProxy(value[i], target[name], i);
            }else{
              target[name][i] = value[i];
            }
          }

          // trigger after children are set so the value is the whole object
          lazy.emit(target.__label__ + '.' + name.toString(), target[name])

        }else{
          //let same = target[name] == value;
          target[name] = value;
          lazy.emit(target.__label__ + '.' + name.toString(), target[name])
          return true;
        }

        /*
        log('setting value', name, target.__label__)
        if(traversable(value)){
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
        // primitive or already a proxy
        target[name] = value;
        lazy.emit(target.__label__ + '.' + name.toString(), target[name])
        return true;
        */
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
    Object.defineProperty(proxy, 'default', {
      get: ()=>{
        return (value)=>{
          fillDefaults(value, proxy, __target__)
        }
      },
    })

    // They are wanting to make a proxy of full object or array
    // All the children need to be proxied as well.
    /*
    if(traversable(proxy)){
      for(i in proxy){
        log('checking value', i)
        if(traversable(proxy[i])){
          log('converting to proxy', i)
          proxy[i] = makeProxy(proxy[i], proxy, i);
        }else{
          // this is necessary so the 'setter' will trigger
          proxy[i] = proxy[i];
        }
      }
    }
    */

    console.log('should set', parent, key, proxy)
    parent[key] = proxy;
  }

  // This is so we have something to actually proxy.
  const root = {};

  let proxy = new Proxy(root, {
    get: (target, name)=>{

      // Request to turn object to JSON from JSON.stringify
      if(name === 'toJSON'){
        return JSON.stringify(target);
      }

      if(name === 'store'){
        return target[name]
      }
    },

    set: (target, name, value, receiver)=>{
      if(name == 'store'){
        console.log('setting store')

        if(!traversable(value)){
          throw new Error('Store must be an array or an object.')
        }

        target[name] = value;

        // add event handler back on.
        Object.defineProperty(target[name], 'on', {
          enumerable: false,
          configurable: false,
          writable:  false,
          value: lazy.on
        });
        Object.defineProperty(target[name], 'one', {
          enumerable: false,
          configurable: false,
          writable: false,
          value: lazy.one
        });
        Object.defineProperty(target[name], 'off', {
          enumerable: false,
          configurable: false,
          writable: false,
          value: lazy.off
        });

        Object.defineProperty(target[name], 'set', {
          enumerable: false,
          get: ()=>{
            return (value)=>{
              proxy.store = value;
            }
          }
        });

      }else{
        // don't add it!
      }
    }
  })

  // Kick it off so set and event functions are bound to store property
  proxy.store = {};

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = root.store;
  }else if(typeof define === 'function' && define.amd) {
    define([], function() {
      return proxy;
    });
  }
  if(typeof window === 'object'){
    Object.defineProperty(window, 'ProxyStore', {
      set:(value)=>{
        proxy.store = value;
      },
      get: ()=>{
        return proxy.store;
      }
    })
  }

  /*
  function set(value){

    if(!traversable(value)){
      throw new Error('Store must be an array or an object.')
    }

    log('setting proxy')

    makeProxy(value, root, 'store')

    log('done')

    // add event handler back on.
    Object.defineProperty(root.store, 'on', {
      enumerable: false,
      configurable: false,
      writable:  false,
      value: lazy.on
    });
    Object.defineProperty(root.store, 'one', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: lazy.one
    });
    Object.defineProperty(root.store, 'off', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: lazy.off
    });

    Object.defineProperty(root.store, 'set', {
      enumerable: false,
      get: ()=>{
        return set;
      }
    });

    return root.store
  }

  set({})



  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = root.store;
  }else if(typeof define === 'function' && define.amd) {
    define([], function() {
      return root.store;
    });
  }
  if(typeof window === 'object'){
    Object.defineProperty(window, 'ProxyStore', {
      set:(value)=>{
        console.warn('You are using this the wrong way. Use ProxyStore.set instead of ProxyStore =')
        set(value);
      },
      get: ()=>{
        return root.store;
      }
    })
  }
  */
})()
