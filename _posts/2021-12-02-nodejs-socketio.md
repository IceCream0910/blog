---
layout: post
title: "node.js로 socket.io API 서버 만들기"
author: sal
categories: [ node.js, socket.io ]
image: 
---

운영중인 코로나 현황 앱(코로나콕)에서는 실시간 확진자 정보를 제공하고 있다. 실시간 확진자 정보는 1분마다 갱신되는데 이때마다 서버에 새로운 요청(ajax 이용)을 주게 되면 불필요한 트래픽이 발생해 서버에 부하를 줄 수 있다.

- ajax : 클라이언트에서 서버로 요청하여 데이터 수신, 필요하지 않아도 특정 주기마다 서버 호출 발생 -> 서버 부하

이걸 해결하기 위해서 WebSocket이라는 기술을 사용했다.
- 웹소켓 : 서버에서 클라이언트로 데이터 전송, 필요할때만 데이터 전송 -> 불필요한 트래픽 방지

우선 node.js로 서버를 만들어준다.

```js
const express = require('express');
const socketIO = require('socket.io');
var request = require("request");


const PORT = process.env.PORT || 3000;

const server = express()
  .use((req, res) => res.send('Server working...'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  getLiveData()
  
  socket.on('disconnect', () => console.log('Client disconnected'));
});

setInterval(() => getLiveData(), 60000);

function getLiveData() {
  var data = new Object();
request({
  uri: "api"
}, function(error, response, body) {
    var result= JSON.parse(body.toString());
    data.init = result;
    var jsonString = JSON.stringify(data);
    io.emit('live', jsonString);
    
  });
  
});
}
```

1분마다 데이터를 웹에서 받아와서 socket으로 클라이언트에게 뿌려준다.

클라이언트에서는 한번만 서버와 연결되어 있으면 1분 마다 새로운 데이터를 받아와 갱신해줄 수 있다.
```js
let socket = io('socket서버');

 socket.on('connect', function() {
   console.log("실시간 확진자 서버 연결");
 });

socket.on('live', (data) => {
	var data_json = JSON.parse(data);
    console.log(data_json);
});
```