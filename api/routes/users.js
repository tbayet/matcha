const express = require('express')
const router = express.Router()
const fs = require('fs')
const nodemailer = require('nodemailer')

let resetPassword = []
let confirmMail = []
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'qsfdjhspeorigjzmerjnsv@gmail.com',
    pass: 'azertyQSDFGH'
  }
});
const addReset = (nickname) => {
  const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  resetPassword[nickname] = key
  return key
}
const addConfirm = (nickname, password) => {
  const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  confirmMail[key] = {
    nickname: nickname,
    password: password
  }
  return key
}
const sendResetMail = (nickname, key, email) => {
  const mailOptions = {
    from: 'qsfdjhspeorigjzmerjnsv@gmail.com',
    to: email,
    subject: 'MATCHA Recover your password',
    text: 'Follow this link to define a new password : http://localhost/#/resetpassword?nickname='+nickname+'&key=' + key
  }
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  })
}
const sendConfirmMail = (key, email) => {
  const mailOptions = {
    from: 'qsfdjhspeorigjzmerjnsv@gmail.com',
    to: email,
    subject: 'MATCHA Confirmation mail',
    text: 'Follow this link to confirm your mail adress : http://localhost/api/users/mailconfirm?key=' + key
  }
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  })
}

/* token = {nickname : {key, date}} */
let token =  {}
const generateKey = (id) => {
  let key = {
    'key': Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    'date': new Date()
  }
  token["p"+id] = key
  return key.key
}
const expirate = (date) => {
  let expiration_hours = 48
  return (new Date().getTime() - date.getTime() >  expiration_hours * 3600 * 1000)
}
const check_key = (id, key) => (("p"+id in token) && token["p"+id].key == key && !expirate(token["p"+id].date))


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

const validName = (v) => {
  if (!v || v.length < 2 || v.length > 16)
    return false
  return true
}
const validEmail = (v) => {
  if (!v || !/.+@.+/.test(v) || v.length > 32)
    return false
  return true
}
const validPassword = (v) => {
  if (!v || v.length < 8 || v.length > 26 || !/[0-9]/.test(v) || !/[A-Z]/.test(v) || !/[a-z]/.test(v))
    return false
  return true
}

/* Valid user connection */
//  PENSER AU LOWERCASE
router.post('/connect', function(req, res, next) {
  if (validName(req.body.nickname) && validPassword(req.body.password)) {
    res.locals.connection.query("SELECT id, password FROM users WHERE nickname=?", [req.body.nickname, req.body.password], function(err, result) {
      if (err) throw err
      if (result.length == 1) {
        if (result[0].password == req.body.password && result[0].password != ".") {
          let key = generateKey(result[0].id)
          res.send({token: key, id: result[0].id})
        } else
          res.send(false)
      } else
        res.send(false)
    })
  } else
    res.send(false)
});

/* Add a user after registering */
router.post('/add', function(req, res, next) {
  let data = req.body.user
  console.log(data)
  if (validName(data.nickname) && validEmail(data.email) && validName(data.firstname) && validName(data.lastname) && validPassword(data.password)) {
    res.locals.connection.query("SELECT nickname FROM users WHERE nickname=?", [data.nickname], function(err, result) {
      if (err) throw err
      if (result.length == 0) {
        res.locals.connection.query("INSERT INTO users (nickname, email, firstname, lastname, password) VALUES (?)", [[data.nickname, data.email, data.firstname, data.lastname, "."]], function(err, result) {
          if (err) throw err
          let key = addConfirm(data.nickname, data.password)
          sendConfirmMail(key, data.email)
          res.send(true)
        })
      } else
        res.send(false)
    })
  } else
    res.send(false)
});
router.get('/mailconfirm', function(req, res, next) {
  if (req.query.key in confirmMail) {
    res.locals.connection.query("UPDATE users SET password=? WHERE nickname=?", [confirmMail[req.query.key].password, confirmMail[req.query.key].nickname], function(err, result) {
      if (err) throw err
      delete confirmMail[req.query.key]
      res.set('Content-Type', 'text/html')
      res.send("<p>Your email is validated. You will be redirected for loggin in 3 seconds. Else, click <a href='http://localhost'>HERE</a></p><script>setTimeout(() => {window.location='http://localhost/'}, 3000)</script>")
    })
  } else {
    res.redirect('http://localhost/')
  }
})
router.post('/mailpassword', function(req, res, next) {
  if (validName(req.body.nickname)) {
    res.locals.connection.query("SELECT email FROM users WHERE nickname=?", [req.body.nickname], function(err, result) {
      if (err) throw err
      if (result && result.length) {
        const key = addReset(req.body.nickname)
        sendResetMail(req.body.nickname, key, result[0].email)
        res.send(result[0].email)
      } else
        res.send(false)
    })
  } else {
    res.send(false)
  }
})

router.get('/resetpassword', function(req, res, next) {
  if (req.query.nickname in resetPassword && resetPassword[req.query.nickname] == req.query.key) {
    res.send(true)
  } else {
    res.send(false)
  }
})

router.post('/edit', function(req, res, next) {
  if (check_key(req.body.id, req.body.token)) {
    let props = req.body.props
    //CHECK if NICKNAME or EMAIL (unwanted updates) and cancel
    if (!props.email || !validPassword(props.email))
      delete props.email
    if (!props.password || !validPassword(props.password))
      delete props.password
    if (!props.firstname || !validName(props.firstname))
      delete props.firstname
    if (!props.lastname || !validName(props.lastname))
      delete props.lastname
    if (!props.age || !validName(props.age))
      delete props.age
    if (!props.gender || !validName(props.gender))
      delete props.gender
    if (!props.orientation || !validName(props.orientation))
      delete props.orientation
    const columns = Object.keys(props)
    if (columns.length) {
      let data = ""
      columns.map(key => {
        data += (data.length ? ", " : "") + key + "=\'" + props[key] + "\'"
      })
      res.locals.connection.query("UPDATE users SET " + data + " WHERE id=?", [req.body.id], function(err, result) {
        if (err) throw err
        res.send(true)
      })
    }
    else {
      res.send(true)
    }
  } else
    res.send(false)
});

/* Change an user password */
router.post('/password', function(req, res, next) {
  if (validName(req.body.nickname) && validPassword(req.body.password) && req.body.nickname in resetPassword && resetPassword[req.body.nickname] == req.body.key) {
    res.locals.connection.query("UPDATE users SET password=? WHERE nickname=?", [req.body.password, req.body.nickname], function(err, result) {
      if (err) throw err
      delete resetPassword[req.body.nickname]
      res.send(true)
    })
  } else
    res.send(false)
});

router.post('/check', function(req, res, next) {
    res.send(check_key(req.body.id, req.body.token))
});

router.get('/profile/:id', function(req, res, next) {
  if (check_key(req.query.id, req.query.token)) {
    let sql = "SELECT nickname, email, popularity, firstname, lastname, age, gender, orientation FROM users WHERE id=?"
    res.locals.connection.query(sql, [req.params.id], function(err, result) {
      if (err) throw err
      if (req.params.id != req.query.id)
        delete result[0].email
      res.send(result[0]);
    })
  }
  else
    res.send(false)
});

router.post('/bio', function(req, res, next) {
  if (check_key(req.body.id, req.body.token)) {
    res.locals.connection.query("UPDATE bio SET content=? WHERE idUser=?", [req.body.bio, req.body.id], function(err, result) {
      if (err) throw err
      res.send(true);
    })
  }
  else
    res.send(false)
});
router.get('/bio', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT content FROM bio WHERE idUser=?", [req.query.id], function(err, result) {
      if (err) throw err
      if (!result || result.length == 0) {
        if (req.query.userId == req.query.id) {
          res.locals.connection.query("INSERT INTO bio (idUser, content) VALUES (?, ?)", [req.query.id, ""], function(err, result) {
            res.send("")
          })
        } else {
          res.send("")
        }
      } else
        res.send(result[0])
    })
  }
  else
    res.send(false)
});

router.post('/addtag', function(req, res, next) {
  if (check_key(req.body.id, req.body.token)) {
    res.locals.connection.query("INSERT IGNORE INTO tags (name) VALUES (?)", [req.body.tag.toLowerCase()], function(err, result) {
      res.locals.connection.query("SELECT id FROM tags WHERE name=?", [req.body.tag.toLowerCase()], function(err, result) {
        let id = result[0].id
        res.locals.connection.query("SELECT idUser FROM taglink WHERE idUser=? AND idTag=?", [req.body.id, id], function(err, result) {
          if (!(result && result.length > 0)) {
            res.locals.connection.query("INSERT INTO taglink (idUser, idTag) VALUES (?,?)", [req.body.id, id], function(err, result) {
              res.send(true);
            })
          }
          else {
            res.send(true)
          }
        })
      })
    })
  }
  else
    res.send(false)
});
router.post('/removetag', function(req, res, next) {
  if (check_key(req.body.id, req.body.token)) {
    res.locals.connection.query("SELECT id FROM tags WHERE name=?", [req.body.tag], function(err, result) {
      if (result && result.length > 0) {
        res.locals.connection.query("DELETE FROM taglink WHERE idUser=? AND idTag=?", [req.body.id, result[0].id], function(err, result) {
          res.send(true)
        })
      } else
        res.send(true)
    })
  } else
    res.send(false)
});
router.get('/tags', function(req, res, next) {
  if (check_key(req.query.id, req.query.token)) {
    res.locals.connection.query("SELECT name FROM tags WHERE id IN (SELECT idTag FROM taglink WHERE idUser=?)", [req.query.id], function(err, result) {
      res.send(result);
    })
  }
  else
    res.send(false)
});

router.post('/addpicture', function(req, res, next) {
  if (check_key(req.body.id, req.body.token)) {
    const baseUrl = "@/assets/images/"
    const url = req.body.id + "-" + new Date().getTime()
    const wid = req.body.picture.substring(req.body.picture.indexOf(',') + 1)
    const format = req.body.picture.substring(req.body.picture.indexOf('/') + 1, req.body.picture.indexOf(';'))
    fs.appendFile("public/images/" +  url + '.' + format, wid, 'base64', function (err) {
      if (err) throw err;
      res.locals.connection.query("INSERT INTO pictures (idUser, picture, date) VALUES (?)", [[req.body.id, url + '.' + format, new Date()]], function(err, result) {
        if (err) throw err
        res.send(true)
      })
    });
  } else
    res.send(false)
});
router.post('/favpicture', function(req, res, next) {
  if (check_key(req.body.user.id, req.body.user.token)) {
    res.locals.connection.query("UPDATE pictures SET date=? WHERE id=?", [new Date(), req.body.imgId], function(err, result) {
      if (err) throw err
      res.send(true)
    })

  } else
    res.send(false)
});
router.post('/deletepicture', function(req, res, next) {
  if (check_key(req.body.user.id, req.body.user.token)) {
    res.locals.connection.query("DELETE FROM pictures WHERE id=?", [req.body.imgId], function(err, result) {
      if (err) throw err
      res.send(true)
    })

  } else
    res.send(false)
});
router.get('/pictures', function(req, res, next) {
  if (check_key(req.query.id, req.query.token)) {
    res.locals.connection.query("SELECT id, picture, date FROM pictures WHERE idUser=? ORDER BY date DESC", [req.query.id], function(err, result) {
      res.send(result);
    })
  }
  else
    res.send(false)
});

module.exports = router;
