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
  var events = req.body.entry[0].messaging
  for (var i = 0; i < events.length; i++) {
    var event = events[i]
    if (event.message && event.message.text) {
      sendMessage(event.sender.id, event.message.text)
    }
  }
  res.sendStatus(200)
})

// generic function sending messages
function sendMessage (recipientId, symbol) {
  yahooFinance.snapshot({
    symbol,
    fields: ['s', 'n', 'd1', 'l1', 'y', 'r']
  }, function (err, snapshot) {
    if (err) return err
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: recipientId},
        message: {text: snapshot}
      }
    }, function (error, response, body) {
      if (error) {
        console.log('Error sending message: ', error)
      } else if (response.body.error) {
        console.log('Error: ', response.body.error)
      }
    })
  })
}
