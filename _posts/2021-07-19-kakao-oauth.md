---
layout: post
title: "node.js: 카카오계정 정보 연동하기"
author: sal
categories: [ node.js ]
image: 
---

서비스를 만들다 보면 로그인 기능을 만들어야 할 때가 많다. 이 때 OAuth라는 것을 이용하면 카카오, 네이버와 같은 다른 서버의 정보를 가지고 올 수 있다.

본 글에서는 카카오계정을 이용해 로그인하고, 사용자 정보를 받아오는 예제를 실습해보겠다.

우선 카카오 개발자센터에 로그인하고 새로운 애플리케이션을 만들어준다.
[https://developers.kakao.com/console/app](https://developers.kakao.com/console/app)

![](https://i.imgur.com/odV9XhN.jpg)

그러면 앱 키를 얻을 수 있다.

![](https://i.imgur.com/PTvTHGr.jpg)

그 후 왼쪽에 카카오 로그인을 눌러서 활성화해주고 리다이렉트 url을 등록해준다. 여기서는 'http://localhost:3000/auth/kakao/callback' 이라고 하면 된다.

![](https://i.imgur.com/p9EIEHg.jpg)

본격적인 시작에 앞서 공식 문서를 첨부한다.
[https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#before-you-begin](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#before-you-begin)

먼저 node.js 서버를 만들어준다.
```js
const express = require("express");
const path = require("path");
const http = require("http");
const app = express();
const server = http.createServer(app);
const nunjucks = require('nunjucks');
const axios = require('axios');
const qs = require('qs');
const session = require('express-session');

// Server all the static files from www folder
app.use(express.static(path.join(__dirname, "www")));
app.use(express.static(path.join(__dirname, "icons")));
app.use(express.static(path.join(__dirname, "node_modules/vue/dist/")));


app.set('view engine', 'html');
nunjucks.configure('www', {
    express: app,
})

app.use(session({
        secret: 'ras',
        resave: true,
        secure: false,
        saveUninitialized: false,
    })) //세션을 설정할 때 쿠키가 생성된다.&&req session의 값도 생성해준다. 어느 라우터든 req session값이 존재하게 된다.

const kakao = {
        clientID: '발급받은 clientID(앱키>REST API 키)',
        clientSecret: '발급받은 clientSecret(카카오로그인 > 보안에서 발급)',
        redirectUri: 'http://localhost:3000/auth/kakao/callback'
    }
    
app.get('/auth/kakao', (req, res) => {
    const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${kakao.clientID}&redirect_uri=${kakao.redirectUri}&response_type=code&scope=profile_nickname,profile_image,account_email`;
    //scope 파라미터에 접근할 권한들을 명시해주면 된다.
    res.redirect(kakaoAuthURL);
})


app.get('/auth/kakao/callback', async(req, res) => {
    //axios>>promise object
    try { //access토큰을 받기 위한 코드
        token = await axios({ //token
            method: 'POST',
            url: 'https://kauth.kakao.com/oauth/token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: qs.stringify({
                    grant_type: 'authorization_code', //특정 스트링
                    client_id: kakao.clientID,
                    client_secret: kakao.clientSecret,
                    redirectUri: kakao.redirectUri,
                    code: req.query.code, //결과값을 반환했다. 안됐다.
                }) //객체를 string 으로 변환
        })
    } catch (err) {
        res.json(err.data);
    }
    //access토큰을 받아서 사용자 정보를 알기 위해 쓰는 코드
    let user;
    try {
        console.log(token); //access정보를 가지고 또 요청해야 정보를 가져올 수 있음.
        user = await axios({
            method: 'get',
            url: 'https://kapi.kakao.com/v2/user/me',
            headers: {
                Authorization: `Bearer ${token.data.access_token}`
            } //헤더에 내용을 보고 보내주겠다.
        })
    } catch (e) {
        res.json(e.data);
    }
    console.log(user);

    req.session.kakao = user.data;
    res.redirect('/auth/profile');
})


app.get('/auth/profile', (req, res) => {
    if (req.session.kakao) {
        let { id } = req.session.kakao;
        let { nickname } = req.session.kakao.properties;
        let { email } = req.session.kakao.kakao_account;
        res.send({ 'id': id, 'nickname': nickname, 'email': email });

    } else {
       res.redirect('/login');
    }

});


app.get('/login', (req, res) => {
    res.render('auth/index');
});

app.get(kakao.redirectUri)

const PORT = process.env.PORT || 3000;
server.listen(PORT, null, () => console.log("Listening on port " + PORT));
```

코드에 대한 설명은 주석을 참고하기 바란다.

이제 실행시켜보자.
'http://localhost:3000/login' 으로 접속하면 된다.
그럼 카카오 로그인으로 연결될 것이다. 카카오계정으로 로그인하고 나면 /auth/profile로 연결될 건데, json형태로 id와 nickname, email이 표시된다면 성공이다.

![](https://i.imgur.com/h13sNvW.jpg)