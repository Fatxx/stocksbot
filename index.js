var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()
var yahooFinance = require('yahoo-finance')

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.listen((process.env.PORT || 3000))

// Server frontpage
app.get('/', function (req, res) {
  res.send('This is TestBot Server')
})

// Facebook Webhook
app.get('/webhook', function (req, res) {
  if (req.query['hub.verify_token'] === 'testbot_verify_token') {
    res.send(req.query['hub.challenge'])
  } else {
    res.send('Invalid verify token')
  }
})

// handler receiving messages
app.post('/webhook', function (req, res) {
  var data = req.body

  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach((entry) => {
      // var pageID = entry.id
      // var timeOfEvent = entry.time

      // Iterate over each messaging event
      entry.messaging.map((event) => {
        if (event.message) {
          receivedMessage(event)
        } else {
          console.log('Webhook received unknown event: ', event)
        }
      })
    })

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200)
  }
})

// generic function sending messages
function receivedMessage (event) {
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

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    sendGenericMessage(senderID, messageText)
    // switch (messageText) {
    //   case 'generic':
    //     sendGenericMessage(senderID, messageText)
    //     break
    //
    //   default:
    //     sendTextMessage(senderID, messageText)
    // }
  } else if (messageAttachments) {
    sendTextMessage(senderID, 'Message with attachment received')
  }
}

function sendGenericMessage (recipientId, messageText) {
  yahooFinance.snapshot({
    symbol: messageText,
    fields: ['s', 'n', 'd1', 'l1', 'y', 'r']
  }, function (err, snapshot) {
    console.log(`Name: ${snapshot.name}, lastTraded: ${snapshot.lastTradeDate}, lastTradePriceOnly: ${snapshot.lastTradePriceOnly}`)
    if (err) return err
    return sendTextMessage(`Name: ${snapshot.name}, lastTraded: ${snapshot.lastTradeDate}, lastTradePriceOnly: ${snapshot.lastTradePriceOnly}`)
  })
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
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
  }

  callSendAPI(messageData)
}

function sendTextMessage (recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  }

  callSendAPI(messageData)
}

function callSendAPI (messageData) {
  return new Promise((resolve, reject) => {
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: messageData
    }, function (error, response, body) {
      if (error) {
        reject('Error sending message: ', error)
      } else if (response.body.error) {
        reject('Error: ', response.body.error)
      }
      resolve({response, body})
    })
  })
}
