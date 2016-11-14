var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var { receivedMessage } = require('./MessageHandler')

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
        console.log('event', event)
        if (event.message) {
          receivedMessage(event)
            .then((data) => console.log(data))
            .error((error) => console.error(error))
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
