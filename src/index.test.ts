'use strict'

/* eslint-env mocha */

import should from 'should'
import 'should-sinon'
import sinon from 'sinon'
import sbp from './index.js'

sbp('sbp/selectors/unsafe', ['test/unsafe'])

const fn = sinon.spy()

describe('Test SBP core selectors', () => {
  it('should register selectors', () => {
    const sels = sbp('sbp/selectors/register', {
      'test/safe1' () {},
      'test/safe2': fn,
      'test/unsafe' () {}
    })
    should(sels).have.length(3)
    should(typeof sbp('sbp/selectors/fn', 'test/safe1')).equal('function')
  })
  it('should call function', () => {
    const testData = 1
    sbp('test/safe2', testData)
    fn.should.be.calledWith(testData)
  })
  it('should fail to overwrite', () => {
    should.throws(() => {
      sbp('sbp/selectors/overwrite', {
        'test/safe1': function () { console.log('foo') }
      })
    })
  })
  it('should overwrite', () => {
    sbp('sbp/selectors/overwrite', {
      'test/unsafe': function () { return 'foo' }
    })
    should(sbp('test/unsafe')).equal('foo')
  })
  it('should fail to lock a non-existent domain', () => {
    should.throws(() => {
      sbp('sbp/domains/lock', ['testDomain'])
    })
  })
  it('should lock a given domain', () => {
    sbp('sbp/selectors/register', {
      'testDomain/s1' () {}
    })
    sbp('sbp/domains/lock', ['testDomain'])
    should(sbp('sbp/selectors/register', { 'testDomain/s2' () {} }).length).equal(0)
  })
  it('should lock several domains at once', () => {
    sbp('sbp/selectors/register', {
      'domain1/test' () {},
      'domain2/test' () {},
      'domain3/test' () {}
    })
    sbp('sbp/domains/lock', ['domain1', 'domain2'])
    should(sbp('sbp/selectors/register', { 'domain1/test2' () {} }).length).equal(0)
    should(sbp('sbp/selectors/register', { 'domain2/test2' () {} }).length).equal(0)
    // Fo now domain3 should not have been locked.
    should(sbp('sbp/selectors/register', { 'domain3/test2' () {} }).length).equal(1)
  })
  it('should lock all domains at once', () => {
    sbp('sbp/domains/lock')
    // Now domain3 should also have been locked.
    should(sbp('sbp/selectors/register', { 'domain3/test2' () {} }).length).equal(0)
  })
  it('should not unregister selectors on a locked domain', () => {
    sbp('sbp/domains/lock', ['test'])
    should.throws(() => {
      sbp('sbp/selectors/unregister', 'test/unsafe')
    })
  })
  // TODO: test filters
})
