/* eslint-env mocha */
var { receivedMessage } = require('../MessageHandler')

var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

const mockedEvent = {
  sender: {
    id: 12313
  },
  recipient: {
    id: 312313
  },
  timestamp: new Date(),
  message: {
    text: 'googl'
  }
}

describe('MessageHandler', function () {
  it('should return a successfull response', function () {
    console.log('receivedMessage', receivedMessage(mockedEvent))
    return receivedMessage(mockedEvent).should.eventually.be.fulfilled
  })

  it('should return a bad request', function () {
    return receivedMessage().should.eventually.be.rejected
  })
})
