# SBP By Example

SBP is remarkably simple (only about 77 lines or so), but it does have a bit of depth that's worth covering.

This file will covering everything, including all built-in selectors, as well as the per-domain selectors that are created for you, of which there is currently only one: `_init`.

- `'sbp/selectors/register'` (required)
- `'sbp/selectors/unregister'`
- `'sbp/selectors/overwrite'`
- `'sbp/selectors/fn'`
- `'sbp/domains/lock'`
- `'sbp/filters/global/add'` (required)
- `'sbp/filters/domain/add'`
- `'sbp/filters/selector/add'`

### `'sbp/selectors/register'`

Registers new selectors, leaving them unlocked to allow possiblity of override with `'sbp/selectors/overwrite'`.

For each domain in the given selector-map, also registers `<domain>/_init` that acts as a constructor for the entire domain, to give selectors access to a domain-wide state via the `this` variable. Since `this` is a JavaScript-specific feature, the domain-specific state will be accessed differently in different languages.

Example:

```js

```