import sbp from './index.js'
import { type Mock, describe, it } from 'node:test'
import * as assert from 'node:assert/strict'

sbp('sbp/selectors/unsafe', ['test/unsafe'])

describe('Test SBP core selectors', () => {
  let fn: Mock<(...args: unknown[]) => void>

  it('should register selectors', (context) => {
    fn = context.mock.fn()
    const sels = sbp('sbp/selectors/register', {
      'test/safe1' () {},
      'test/safe2': fn,
      'test/unsafe' () {}
    })
    assert.deepEqual(sels, ['test/safe1', 'test/safe2', 'test/unsafe'])
    assert.equal(typeof sbp('sbp/selectors/fn', 'test/safe1'), 'function')
  })
  it('should call function', () => {
    const testData = {}
    sbp('test/safe2', testData)
    assert.equal(fn.mock.callCount(), 1)
    assert.equal(fn.mock.calls[0].arguments.length, 1)
    assert.equal(fn.mock.calls[0].arguments[0], testData)
  })
  it('should fail to overwrite', () => {
    assert.throws(() => {
      sbp('sbp/selectors/overwrite', {
        'test/safe1': function () { console.log('foo') }
      })
    })
  })
  it('should overwrite', () => {
    sbp('sbp/selectors/overwrite', {
      'test/unsafe': function () { return 'foo' }
    })
    assert.equal(sbp('test/unsafe'), 'foo')
  })
  it('should fail to lock a non-existent domain', () => {
    assert.throws(() => {
      sbp('sbp/domains/lock', ['testDomain'])
    })
  })
  it('should lock a given domain', () => {
    sbp('sbp/selectors/register', {
      'testDomain/s1' () {}
    })
    sbp('sbp/domains/lock', ['testDomain'])
    assert.deepEqual(sbp('sbp/selectors/register', { 'testDomain/s2' () {} }), [])
  })
  it('should lock several domains at once', () => {
    sbp('sbp/selectors/register', {
      'domain1/test' () {},
      'domain2/test' () {},
      'domain3/test' () {}
    })
    sbp('sbp/domains/lock', ['domain1', 'domain2'])
    assert.deepEqual(sbp('sbp/selectors/register', { 'domain1/test2' () {} }), [])
    assert.deepEqual(sbp('sbp/selectors/register', { 'domain2/test2' () {} }), [])
    // Fo now domain3 should not have been locked.
    assert.deepEqual(sbp('sbp/selectors/register', { 'domain3/test2' () {} }), ['domain3/test2'])
  })
  it('should lock all domains at once', () => {
    sbp('sbp/domains/lock')
    // Now domain3 should also have been locked.
    assert.deepEqual(sbp('sbp/selectors/register', { 'domain3/test2' () {} }), [])
  })
  it('should not unregister selectors on a locked domain', () => {
    sbp('sbp/domains/lock', ['test'])
    assert.throws(() => {
      sbp('sbp/selectors/unregister', 'test/unsafe')
    })
  })
  // TODO: test filters
})
