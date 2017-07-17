(function(){

  const lazy = require('lazy-events')({});

  /**
   * TODO: Save and restore
   * after some consideration, I do not allow multiple stores, as I feel
   * the store should be global.
   */

  let debug = false;
  function log(){
    if(debug) log.apply(console, arguments);
  }

  // Check if two values are both arrays, or both objects
  function sameType(first, second){
    if(Array.isArray(first) && Array.isArray(second)) return true;
    // both object, neither is an array, and neither is null
    if( (!Array.isArray(first) && typeof first === 'object' && first !== null) &&
        (!Array.isArray(second) && typeof second === 'object' && second !== null)
      ) return true;
    return false;
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
   * @param {boolean} init If this is the main store being set
   * @return {Proxy Object} Use your object like normal.
   */
  function makeProxy(__target__, parent, key, init = false){
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
        log('setting ', name, ' on ', target, ' to ', value);

        if(traversable(value)){
          // Is the incoming value the same, and it's already a proxy
          if(sameType(target[name], value) && target[name].__proxy__){
            // We do not need to set the value again, it's the same
            if(JSON.stringify(target[name]) == JSON.stringify(value)){
              log('values are the same', value);
              return true; // don't set the value or change it
            }

            // Make them the same length
            if(Array.isArray(target[name])){
              let removed = target[name].splice(value.length);
              // TODO: trigger event here notifying that the items were removed
              // if we do this, should we traverse children and trigger?
              // see if deleteProperty proxy handler will work for this

            // Remove properties in target that are not in value
            }else{
              for(let k in target[name]){
                if(typeof value[k] === 'undefined'){
                  delete target[name][k];
                  // TODO: trigger event here notifying that the items were removed
                  // If we do that, should be trigger on all children?
                  // see if deleteProperty proxy handler will work for this
                }
              }
            }
          }else{
            // They are not the same type or the target[name] is not a proxy
            // we'll start with a blank array or object and add properties
            makeProxy(Array.isArray(value) ? [] : {}, target, name);
          }

          for(let i in value){
            if(JSON.stringify(value[i]) == JSON.stringify(target[name][i])){
              log('child values are the same', value[i]);
              continue; // no change, don't trigger or change it. remember the incoming value is not a proxy most likely
            }

            // set handler will trigger events and change to proxy if necessary
            target[name][i] = value[i];
          }

          // trigger after children are set so the value is the whole object
          lazy.emit(target.__label__ + '.' + name.toString(), target[name])

          return true;

        // incoming value is not traversable
        }else{
          // if we decide to trigger above, then we should check that the
          // target[name] is not currently traversable, if it is, we need to
          // send triggers for each removed property
          if(target[name] == value){
            log('values are the same', value);
            return true; // nothign to change or trigger
          }
          target[name] = value;
          lazy.emit(target.__label__ + '.' + name.toString(), target[name])
          return true;
        }
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
        if(init) return false; // remove proxy namespace
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

    log('should set', parent, key, proxy)
    parent[key] = proxy;
  }

  // This is so we have something to actually proxy.
  const root = {};
  makeProxy({}, root, 'proxy', true);
  root.proxy.store = {}; // the store has to be set so the setter gets triggered
  bind();

  // Bind events to store
  function bind(){
    Object.defineProperty(root.proxy.store, 'on', {
      enumerable: false,
      configurable: false,
      writable:  false,
      value: lazy.on
    });
    Object.defineProperty(root.proxy.store, 'one', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: lazy.one
    });
    Object.defineProperty(root.proxy.store, 'off', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: lazy.off
    });

    Object.defineProperty(root.proxy.store, 'set', {
      enumerable: false,
      get: ()=>{
        return (value)=>{
          if(!traversable(value)){
            throw new Error('Store must be an array or an object.')
          }
          log('set function', value)
          root.proxy.store = value;
          //bind();
          return root.proxy.store
        }
      }
    });
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = root.proxy.store;
  }else if(typeof define === 'function' && define.amd) {
    define([], function() {
      return root.proxy.store;
    });
  }
  if(typeof window === 'object'){
    Object.defineProperty(window, 'ProxyStore', {
      set:(value)=>{
        throw new Error('Do not set the store like this. Use .set function instead. e.g. window.Proxy.store.set({})')
        // root.proxy.store = value;
        // bind();
      },
      get: ()=>{
        return root.proxy.store;
      }
    })
  }
})()
