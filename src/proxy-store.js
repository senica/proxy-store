(function(){

  // Look at Reflect.get and see if we can access target and bypass proxy?

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
       fillDefaults(value[i], proxy[i]) // < proxy[i] will create missing value
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
          // https://github.com/tvcutsem/harmony-reflect/issues/38
          return function(){
            // If we auto-created an object or array simply to access it, but
            // no data has been set on it, it is undefined.
            if(target.__auto__) return undefined;
            return target;
          }
        }

        if(name in target){
          log('fetch', name, target)
          return target[name]
        }

        // Return length of object keys or array
        if(name === 'length'){
          log('getting length', typeof target, target)
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
            makeProxy([], target.__parent__, target.__key__)
            delete target.__parent__[target.__key__].__auto__; // no longer assumed to be auto set;
            makeProxy({}, target.__parent__[target.__key__], i)
            return target.__parent__[target.__key__][i]
          }else{
            log('parent is already an array', name)
            delete target.__auto__; // no longer assumed to be auto set;
            makeProxy({}, target, i); // default to object otherise names[1].name would be {names: [name]} property on array rather than object in array
            log('returning', target[i])
            return target[i];
          }
        }else{
          log(name, 'is not a number')
          // We are trying to access an object, but it's not, convert it
          if(Array.isArray(target)){
            log('converting parent to object', name)
            makeProxy({}, target.__parent__, target.__key__)
            delete target.__parent__[target.__key__].__auto__; // no longer assumed to be auto set;
            makeProxy({}, target.__parent__[target.__key__], name)
            return target.__parent__[target.__key__][name]
          }else{
            log('parent is already an object', name)
            delete target.__auto__; // no longer assumed to be auto set;
            makeProxy({}, target, name);
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

        delete target.__auto__;

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
            log('making proxy', name, value, target, Array.isArray(value))
            // They are not the same type or the target[name] is not a proxy
            // we'll start with a blank array or object and add properties
            makeProxy(Array.isArray(value) ? [] : {}, target, name);
          }

          // Suspend any events until I'm done setting all my data
          Object.defineProperty(target[name], '__suspended__', {
            enumerable: false,
            configurable: true,
            get: ()=>{
              return true;
            }
          })

          for(let i in value){
            if(JSON.stringify(value[i]) == JSON.stringify(target[name][i])){
              log('child values are the same', value[i]);
              continue; // no change, don't trigger or change it. remember the incoming value is not a proxy most likely
            }

            // set handler will trigger events and change to proxy if necessary
            target[name][i] = value[i];
          }

          delete target[name].__suspended__;

          // Notify all children and itself that it was updated in bulk
          // We do this after, so all data is set and children and siblings can
          // use the data freely in their event handlers.
          if(!target.__suspended__){
            function notify_children(_target){
              for(let t in _target){
                if(traversable(_target[t])){
                  notify_children(_target[t])
                  lazy.emit(_target.__label__ + '.' + t.toString(), _target[t])
                }else{
                  lazy.emit(_target.__label__ + '.' + t.toString(), _target[t])
                }
              }
            }
            notify_children(target[name])
            lazy.emit(target.__label__ + '.' + name.toString(), target[name])
          }

          // Notify parents up the chain of a change. But only if it's not
          // suspended from a bulk update
          if(!target.__suspended__ && traversable(target) && target.__label__){
            let t = target;
            lazy.emit(t.__label__, t)
            while(t = t.__parent__){
              if(!t.__label__) break; // break on proxy
              lazy.emit(t.__label__, t)
            }
          }

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

          // Don't immediately trigger events if a bulk update is happening.
          // The listeners may depend on children or sibling data in the
          // event handler.
          if(!target.__suspended__){
            lazy.emit(target.__label__ + '.' + name.toString(), target[name])
          }

          // Notify parents up the chain of a change. But only if it's not
          // suspended from a bulk update
          if(!target.__suspended__ && traversable(target) && target.__label__){
            let t = target;
            lazy.emit(t.__label__, t)
            while(t = t.__parent__){
              if(!t.__label__) break;  // break on proxy
              lazy.emit(t.__label__, t)
            }
          }
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

    // Was this autocreated? Assume always yes until it is SET in the setter.
    Object.defineProperty(proxy, '__auto__', {
      configurable: true,
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
