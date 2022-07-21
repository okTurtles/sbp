# SBP Language Support

SBP is designed to work well no matter what programming language you're using.

Current implementations include:

- [sbp-js](https://github.com/okTurtles/sbp-js/) - JavaScript

## Implementing SBP In Your Favorite Language

To implement SBP, you just need to implement the [core SBP API](/docs/sbp-api.md).

This involves:

- Implementing the core SBP selectors (the `sbp` domain)
- Making sure that your implementation of the core selectors has the same exact behavior as this one.
  - **Exception:** you can ignore all parts of the JS code that have to do with domain-specific state, as that relies on a JS-specific feature. See comment below for more details.

Optional:

- Implementing support for the `_init` domain "constructor" to add domain-specific state. Since most languages do not have the equivalent of a `this` dynamically scoped variable, how you approach implementing the domain-state can be unique and idiomatic to your langauge. **If implementing this feature is awkward, it is best to avoid implementing it at all to avoid unnecessarily exposing state.** Instead, you may encourage users to simply access a variable containing a map/object/dictionary for their state that is scoped in such a way that it is accessible to domain-specific selectors, and inaccessible to other functions.

_Feel free to send us a PR adding your implementation to the list above!_
