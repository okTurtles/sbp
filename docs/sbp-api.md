# SBP API

The SBP function and its core API are remarkably simple (only about 80 lines or so).

SBP has 3 core concepts:

1. Selectors: unchanging strings that describe the intent of a piece of code.
2. Domains: a group of related selectors.
3. Filters: functions that can intercept calls to selectors. They can also prevent a selector's function from running by returning `false`.

This file will cover everything, including all built-in selectors, as well as the per-domain selectors that are created for you, of which there is currently only one: `_init`.

- [`'sbp/selectors/register'`](#sbpselectorsregister)
- [`'sbp/selectors/unregister'`](#sbpselectorsunregister)
- [`'sbp/selectors/overwrite'`](#sbpselectorsoverwrite)
- [`'sbp/selectors/fn'`](#sbpselectorsfn)
- [`'sbp/selectors/unsafe'`](#sbpselectorsunsafe)
- [`'sbp/selectors/lock'`](#sbpselectorslock)
- [`'sbp/domains/lock'`](#sbpdomainslock)
- [`'sbp/filters/global/add'`](#sbpfiltersglobaladd)
- [`'sbp/filters/domain/add'`](#sbpfiltersdomainadd)
- [`'sbp/filters/selector/add'`](#sbpfiltersselectoradd)

## Core API

### `'sbp/selectors/register'`

- Function signature: `function (sels: {[string]: Function}): Array<string>`

Registers new selectors, leaving them unlocked to allow possiblity of override with `'sbp/selectors/overwrite'`.

For each domain in the given selector-map, also registers `<domain>/_init` that acts as a constructor for the entire domain, to give selectors access to a domain-wide state via the `this` variable. Since `this` is a JavaScript-specific feature, the domain-specific state will be accessed differently in different languages.

Example:

```js
sbp('sbp/selectors/register', {
  'mydomain/_init' () {
    this.domainName = 'mydomain'
  },
  'mydomain/say-hello' () {
    console.log('hello from:', this.domainName)
  },
  'mydomain/async-action': async function () {
    await db.load()
  }
})

sbp('mydomain/say-hello') // prints "hello from: mydomain"
await sbp('mydomain/async-action') // waits on the database to load
```

### `'sbp/selectors/unregister'`

- Function signature: `function (sels: string[])`

Allows you to unregister selectors that were [marked unsafe](#sbpselectorsunsafe).

Called internally by `'sbp/selectors/overwrite'`.

### `'sbp/selectors/overwrite'`

- Function signature: `function (sels: {[string]: Function}): Array<string>`

Overwrite the implementation of a selector. Remember to call `'sbp/selectors/lock'` after overwriting.

Only works on selectors that were marked unsafe using [`'sbp/selectors/unsafe'`](#sbpselectorsunsafe).

Here's a real-world example of an application using this feature to dynamically switch its behavior from storing data in memory to storing it on disk:

```js
if (production || process.env.GI_PERSIST) {
  sbp('sbp/selectors/overwrite', {
    // we cannot simply map this to readFile, because 'gi.db/log/getEntry'
    // calls this and expects a string, not a Buffer
    // 'gi.db/get': sbp('sbp/selectors/fn', 'backend/db/readFile'),
    'gi.db/get': async function (filename: string) {
      const value = await sbp('backend/db/readFile', filename)
      return Boom.isBoom(value) ? null : value.toString('utf8')
    },
    'gi.db/set': sbp('sbp/selectors/fn', 'backend/db/writeFile')
  })
  sbp('sbp/selectors/lock', ['gi.db/get', 'gi.db/set', 'gi.db/delete'])
}
```

### `'sbp/selectors/fn'`

- Function signature: `function (sel: string): Function`

Returns the function bound to the given selector.

### `'sbp/selectors/unsafe'`

- Function signature: `function (sels: string[])`

Marks these selectors as overwritable via [`'sbp/selectors/overwrite'`](#sbpselectorsoverwrite).

To use, must be called before registering these selectors.

Selectors that are overwritten will also have access to the internal state of the domain via the `this` variable!

Remember to call `'sbp/selectors/lock'` or `'sbp/domains/lock'` after overwriting!

### `'sbp/selectors/lock'`

- Function signature: `function (sels: string[])`

Prevents these selectors from being unregistered and overwritten.

Always call either this or `'sbp/domains/lock'` after overwriting selectors unless they're designed to be left unsafe.

Once a selector is locked it cannot be unlocked.

### `'sbp/domains/lock'`

- Function signature: `function (domains?: string[])`

If `domains` are passed in, prevents new selectors from being registered on the domains and also prevents existing selectors from being unregistered or overwritten.
If no argument is passed in, locks all currently registered domains.

This selector is ensures that rogue code cannot get access to domain state by registering a new selector on that domain, and therefore is preferred to `'sbp/selectors/lock'`.

Once a domain is locked it cannot be unlocked.

### `'sbp/filters/global/add'`

- Function signature: `function (filter: TypeFilter)`
- Where `TypeFilter` is a function of the form: `type TypeFilter = (domain: string, selector: string, data: any) => ?boolean`

Adds a global filter that will be run on every call to every selector.

Verify useful for logging and inspecting the behavior of an app.

Example:

```js
sbp('sbp/filters/global/add', (domain, selector, data) => {
  console.debug(`[sbp] ${selector}`, data)
})
```

Note that if a filter returns `false` it will prevent any affected selectors from running.

### `'sbp/filters/domain/add'`

- Function signature: `function (domain: string, filter: TypeFilter)`

Adds a filter that gets run on every call to all selectors within this specific domain.

### `'sbp/filters/selector/add'`

- Function signature: `function (selector: string, filter: TypeFilter)`

Adds a filter that gets run on every call to this specific selector.
