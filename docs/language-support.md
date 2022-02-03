# SBP Language Support

SBP is designed to work well no matter what programming language you're using.

Current implementations include:

- [sbp-js](https://github.com/okTurtles/sbp-js/) - JavaScript

## Implementing SBP In Your favorite language

To implement SBP, you just need to implement the [core SBP API](/docs/sbp-api.md).

This involves:

- Implementing the core SBP selectors (the `sbp` domain)
- Implementing support for the `_init` domain "constructor" to add domain-specific state. Since most languages do not have the equivalent of a `this` dynamically scoped variable, how you approach implementing the domain-state can be unique and idiomatic to your langauge.
- Making sure that your implementation of the core selectors has the same exact behavior as this one.

_Feel free to send us a PR adding your implementation to the list above!_