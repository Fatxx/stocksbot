const request = require('request')
const yahooFinance = require('yahoo-finance')
const R = require('ramda')
var sendMessageToSenderId

// generic function sending messages
exports.receivedMessage = (event) => {
  return new Promise((resolve, reject) => {
    try {
      var senderID = event.sender.id
      var recipientID = event.recipient.id
      var timeOfMessage = event.timestamp
      var message = event.message

      console.log('Received message for user %d and page %d at %d with message:',
      senderID, recipientID, timeOfMessage)
      console.log(JSON.stringify(message))

      // var messageId = message.mid
      var messageText = message.text
      var messageAttachments = message.attachments
      sendMessageToSenderId = callSendAPI(senderID)

      if (messageText) {
        // If we receive a text message, check to see if it matches a keyword
        // and send back the example. Otherwise, just echo the text we received.
        // return sendGenericMessage(senderID, messageText)
        return sendTextMessage(messageText)
        // switch (messageText) {
        //   case 'generic':
        //     sendGenericMessage(senderID, messageText)
        //     break
        //
        //   default:
        //     sendTextMessage(senderID, messageText)
        // }
      } else if (messageAttachments) {
        return sendTextMessage('Message with attachment received')
      }
    } catch (error) {
      console.log('error', error)
      reject(error)
    }
  })
}

function sendGenericMessage (messageText) {
  var message = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [{
          title: 'rift',
          subtitle: 'Next-generation virtual reality',
          item_url: 'https://www.oculus.com/en-us/rift/',
          image_url: 'http://messengerdemo.parseapp.com/img/rift.png',
          buttons: [{
            type: 'web_url',
            url: 'https://www.oculus.com/en-us/rift/',
            title: 'Open Web URL'
          }, {
            type: 'postback',
            title: 'Call Postback',
            payload: 'Payload for first bubble'
          }]
        }, {
          title: 'touch',
          subtitle: 'Your Hands, Now in VR',
          item_url: 'https://www.oculus.com/en-us/touch/',
          image_url: 'http://messengerdemo.parseapp.com/img/touch.png',
          buttons: [{
            type: 'web_url',
            url: 'https://www.oculus.com/en-us/touch/',
            title: 'Open Web URL'
          }, {
            type: 'postback',
            title: 'Call Postback',
            payload: 'Payload for second bubble'
          }]
        }]
      }
    }
  }
  return sendMessageToSenderId(message)
}

function sendTextMessage (messageText) {
  return getStockBySymbol(messageText)
    .then((data) => sendMessageToSenderId(data))
}

function getStockBySymbol (symbol) {
  return new Promise((resolve, reject) => {
    yahooFinance.snapshot({
      symbol,
      fields: ['s', 'n', 'd1', 'l1', 'y', 'r']
    }, (error, snapshot) => {
      if (error) return reject(error)
      console.log(`
        Name: ${snapshot.name},
        lastTraded: ${snapshot.lastTradeDate},
        lastTradePriceOnly: ${snapshot.lastTradePriceOnly}`
      )
      let data = `
        Name: ${snapshot.name},
        lastTraded: ${snapshot.lastTradeDate},
        lastTradePriceOnly: ${snapshot.lastTradePriceOnly}`
      return resolve(data)
    })
  })
}

const callSendAPI = R.curry((recipientId, message) => {
  return new Promise((resolve, reject) => {
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {
          id: recipientId
        },
        message
      }
    }, function (error, response, body) {
      if (error) {
        reject('Error sending message: ', error)
      } else if (response.body.error) {
        reject('Error: ', response.body.error)
      }
      console.log('response', response)
      console.log('body', body)
      resolve(response)
    })
  })
})
