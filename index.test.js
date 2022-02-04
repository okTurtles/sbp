'use strict'

/* eslint-env mocha */

import should from 'should'
import sinon from 'sinon'
import sbp from '@sbp/sbp'
import 'should-sinon'
import './dist/module.mjs'

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
  // TODO: test filters
})
