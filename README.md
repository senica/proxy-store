ProxyStore - Simplified State Store for Web Apps
====================================================

*NOTE* This only works with ES6 browsers.

***Minified is 3KB***

History
-------
There are lots of State Management stores out there [Redux](http://redux.js.org/) and [Flux](https://facebook.github.io/flux/). Note that generally speaking, this is a pattern more than a framework.

While these patterns can be great, from my personal experience they add a lot of extra coding. In practice that is not a bad thing if it makes your app fail-proof. What made me write this little script is my journey using [RiotJS](http://riotjs.com/).

One of the patterns with Redux is to write functions to modify your state. This does not work very well with RiotJS and is very clunky.

What Is ProxyStore?
-------------------
An App State Store, in my humble opinion, should do a few things:
1. Provide a natural, intuitive means of storing the state of your app.
2. Every action must be traceable and discoverable. Meaning that one part of your app should not be able to change it's state without other parts of the app being aware of the change.
3. Patterns should be consistent. Writing arbitrary functions like `open` which could apply to multiple items should not be allowed.

ProxyStore addresses these items by allowing you to manage your state with a standard object, and adds a proxy to your state object which takes care of notifying your app of changes.

That's it. There isn't a whole lot of magic. There are ***two*** primary functions to be aware of (*set* and *on*), beyond that, you know the rest.

Usage
-----

#### Browser

Sorry, haven't added to bower repo yet. Let me know if it will be helpful to you.

Add `dist/proxy-store.min.js` to your project.

Include the file in your html page.
`<script src="path to proxy-store.min.js"></script>`

Initialize your store (if necessary):
```javascript
ProxyStore = {
  login: {
    name: '',
    email: '',
    password: '',
    open: true
  }
}
ProxyStore.on('store.login.open', (value)=>{
  // Do something because the login.open value changed.
  console.log((value ? 'Login screen to be opened.' : 'Close sesame.'))
})
```

#### NodeJs

Sorry, haven't added to npm repo yet. Let me know if it will be helpful to you.
I really don't know if this library would useful in a nodejs app. I haven't
tried anything with. Let me know in issues if you find a good use-case.

Add to your project.
```bash
npm install https://github.com/senica/proxy-store.git --save
```

```js
let proxy = require('proxy-store')
proxy.set({
  intro: 'hi'
})
proxy.on('store.intro', (value)=>{
  console.log('Hi', value)
})
```

## Features and Caveats

If you reassign `ProxyStore` to another variable, you cannot directly assign a
store to it. See the *set* API method below.

The store will auto-create (or auto-chain) properties as you request them.
```js
// This works, even though we have not specified any values on the ProxyStore
let store = ProxyStore;
console.log(store.names[0].name); // Result: {}
```

You can auto-chain to assign.
```js
let store = ProxyStore;
store.names[0].name = 'senica';

console.log(store) // Results in: { name: [ {name: 'senica'} ] }
```

Once you assign a primitive to a value, it will not auto-chain.
```js
let store = ProxyStore;
store.name = 'senica';
console.log(store.name[0].hi) // will error out because name is not an array.
```

It will auto-correct
```js
let store = ProxyStore;
store.names.one.name = 'senica';
console.log(store); // result { names: { one: { name: 'senica' } } }
store.names[1].name = 'senica';
console.log(store); // result { names: [ <empty>, {name: 'senica' } ] }
```

You can assign objects an arrays and it will add them to the proxy.
```js
let store = ProxyStore;
store.names = [ {name: 'senica'} ]
console.log(store.name[0].name); // result 'senica'
store.names[0].address.street = 'Fair Lane';
console.log(store); // result { names: [ {name: 'senica', address: { street: 'Fair Lane' } } ] }
```

As with all primitives, after setting a default primitive value, you cannot
set defaults again as there is not default method.
```js
let store = ProxyStore;
store.login.defaults = {
  name: 'bob',
  address: {
    street: 'hackberry'
  }
}
console.log(store.login.name.defaults) // error
```

It will return length of objects and arrays
If an object has the property of length, it will return that instead of the count of the keys
```js
let store = ProxyStore;
console.log(store.login.length) // 0
```

## Recommendations

Namespace everything! In RiotJS this is easy. Since every component has a filename,
we use this filename for namespacing.

If I have a riot tag called *login.tag* then may namespace on the store for the login
tag is *login*.  Easy right ;)
```js
let store = ProxyStore;
// Get initial values from localstorage or Redis if they have visited before.
store.login = {
  open: true,
  name: 'Senica',
  email: ''
  password: ''
}

// Then in riot, I can use if={store.login.open} to show my login screen or not.
// That is oversimplified, but you get the idea.
```


## API

### defaults

Set a default value for some part of the store.

```js
let store = ProxyStore;
store = {
  login: {
    name: 'senica'
  }
}
store.login.defaults = {
  name: 'bob',
  address: {
    street: 'hackberry'
  }
}
console.log(store) // { login: { name: 'senica', address: { street: 'hackberry'} } }
```

### set(object)

If you reassign `ProxyStore` to another variable to use in your app, you will
not be able to directly set the store with an initial value. Instead you will
have to call `set`

This will NOT work. `store` will just contain an plain object and not the
proxy store.
```js
let store = ProxyStore;
store = { hi: 'bob' }
```

Instead do one of the following:
```js
let store = ProxyStore;
store = store.set({
  hi: 'bob'
})

// OR

let store = ProxyStore.set({hi: 'bob'})

// OR assign the ProxyStore first
ProxyStore.set({hi: 'bob'})
let store = ProxyStore;
```

### on(event, callback[, lazy])

This uses [lazy-events](https://github.com/senica/lazy-events). See that page
for more documentation.

Listens for *event* to be emitted and then run *callback* with emitted values.

***event*** starts with the word *store* and then runs down the chain of the store.

Assume you have a store like this:
```js
ProxyStore.set({
  names: [
    {name: 'senica'},
    {name: 'bob'}
  ]
})
```

Then you can listen to events on:
```js
ProxyStore.on('store', (value)=>{})
ProxyStore.on('store.names', (value)=>{})
ProxyStore.on('store.names.0', (value)=>{})
ProxyStore.on('store.names.0.name', (value)=>{})
ProxyStore.on('store.names.1', (value)=>{})
ProxyStore.on('store.names.1.name', (value)=>{})
```

You can also bind to the asterisk namespace:

```js
ProxyStore.on('*', (label, value)=>{})
```

Note that when listening to all events, *label* is passed in as the first value
instead of value.

***callback*** will receive the newly set value.

***lazy*** is a boolean that defaults to **true**. When set to true, event listeners that are created after an event has been emitted will still be triggered. This is very helpful for dynamic applications where race conditions may occur and you do not know the specific order in which data may arrive from there server and the order in which resources are loaded in your app.

```js
ProxyStore.hello = 'senica';
// runs as lazy
ProxyStore.on('hello', (value)=>{}) // value is 'senica'
// does not run; lazy flag set to false.
events.on('hello', (value)=>{}, false)
```


### one(event, callback[, lazy])

This is the same as ***on*** except that the callback will only run **ONE TIME** and then turn itself off.

### off(event[, callback])

***event*** is required and specifies the event that you want to turn off.

***callback*** is optional. If specified, it will turn off the *event* with the *callback*. This means that you will have to separate your callbacks instead of using anonymous functions.

If *callback* is not specified, it will remove **ALL** *event* s.

```js
ProxyStore.on('intro', event);
ProxyStore.on('intro', ()=>{ console.log('what'); })

// Turn off single event.
ProxyStore.off('intro', event);

// Turn off all events of type intro.
ProxyStore.off('intro');
```


Contribution Guides
--------------------------------------

Contributions are always welcome!

1. Fork this repository. `https://github.com/senica/proxy-store.git`
2. Clone your forked repository.
3. Run `npm install`
4. Make your changes.
5. Write tests in the tests directory. You may make another file if appropriate.
6. Run `npm test`.
7. Make a pull request.


Environments in which to use ProxyStore
--------------------------------------

- This is currently only intended for browsers. It would be fairly painless
to make available for nodejs, but it's not done.

How to build your own ProxyStore
--------------------------------

Clone or fork a copy of the main ProxyStore git repo by running:

```bash
git clone https://github.com/senica/proxy-store.git
```

Enter the proxy-store directory:
```bash
cd proxy-store
```

Install dependencies:
```bash
npm install
```

Run the build script:
```bash
npm test
```
The built version of ProxyStore will be put in the `dist/` subdirectory, along with the minified copy and associated map file.


Running the Unit Tests
--------------------------------------

Make sure you have the necessary dependencies:

```bash
npm install
```

Then:

```bash
npm test
```


Questions?
----------

Open an issue and I'll try and reply.
