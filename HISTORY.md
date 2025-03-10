# History

#### 2.4.0

- Added `"types"` field to `package.json` for classic TypeScript module resolution.

#### 2.4.0

- Added support for star selectors (`domain/*`). When defined, the star selector
  will be used as a fallback for undefined selectors. The intended use of this
  feature is implementing domains that use some form of RPC.

#### 2.3.0

- Added `'sbp/domains/lock'`. Stronger protection than `'sbp/selectors/lock'`, prevents rogue code from accessing domain state. h/t **[@snowteamer](https://github.com/okTurtles/sbp-js/pull/4)**

#### 2.2.0

- Added `'sbp/selectors/lock'`. Make sure to call this after overwriting any unsafe selectors!
- Improved console warnings

#### 2.1.2

- Fixed typo in NPM description. No source changes.

#### 2.1.1

- reduced size of `dist/main.cjs` by updating `"browserslist"`

#### 2.1.0

- Remembered to build 2.0.0 this time and added some tests

#### 2.0.0

- Selectors are locked by default. Use `'sbp/selectors/unsafe'` before registering selectors that you intend to overwrite.
- Switched to MIT License with board approval.

#### 1.1.1

- Actually build the previous changes

#### 1.1.0

- Locked the `sbp` domain

#### 1.0.0

- Bump version to fix confusion caused by moving to scoped NPM package. This version is identical to the previous one.

#### 0.1.0

- initial release
