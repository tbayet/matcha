const express = require('express')
const router = express.Router()
const fs = require('fs')
const nodemailer = require('nodemailer')
const sha224 = require('js-sha256').sha224

let resetPassword = []
let confirmMail = []
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'qsfdjhspeorigjzmerjnsv@gmail.com',
    pass: 'azertyQSDFGH'
  }
})
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
    console.log(error ? error : 'Reset password email sent to ' + email)
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
    console.log(error ? error : 'Confirm email sent to ' + email);
  })
}

/* token = {nickname : {key, date}} */
let token =  {}
const generateKey = (id, res) => {
  let key = {
    'key': Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    'date': new Date()
  }
  token["p"+id] = key
  res.locals.connection.query("UPDATE users SET lastOnline=? WHERE id=?", [new Date(), id], function(err, result) {
    if (err) throw err
  })
  return key.key
}

const expirate = (date) => (new Date().getTime() - date.getTime() >  20 * 3600 * 1000) // 20 heures
const isOnline = (id) => (("p"+id in token) && (new Date().getTime() - token["p"+id].date.getTime() <= 5 * 60 * 1000)) // 5 minutes
const check_key = (id, key, res) => {
  if (("p"+id in token) && token["p"+id].key == key && !expirate(token["p"+id].date)) {
    now = new Date()
    if (res) {
      if (now.getTime() - token["p"+id].date.getTime() > 60 * 1000) {
        res.locals.connection.query("UPDATE users SET lastOnline=? WHERE id=?", [now, id], function(err, result) {
          if (err) throw err
          token["p"+id].date = now
        })
      }
    }
    return true
  }
  return false
}

router.get('/', function(req, res, next) {
  res.send('It works');
})

const validName = (v, req) => {
  if (!v || v.length < 2 || v.length > 16 || v != req.sanitize(v))
    return false
  return true
}
const validEmail = (v, req) => {
  if (!v || !/.+@.+/.test(v) || v.length > 32 || v != req.sanitize(v))
    return false
  return true
}
const validPosition = v => {
  if (!v || !/-?\d+\.\d+,-?\d+\.\d+,\d{4,5}/.test(v))
    return false
  return true
}
const validGender = v => (v >= 1 && v <=2)
const validOrientation = v => (v >= 1 && v <=3)

/* Valid user connection */
//  PENSER AU LOWERCASE
router.post('/connect', function(req, res, next) {
  if (validName(req.body.nickname, req)) {
    res.locals.connection.query("SELECT id, password FROM users WHERE nickname=?", [req.body.nickname], function(err, result) {
      if (err) throw err
      if (result.length == 1) {
        if (result[0].password == sha224(req.sanitize(req.body.password)) && result[0].password != ".") {
          let key = generateKey(result[0].id, res)
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
  if (validName(data.nickname, req) && validEmail(data.email, req) && validName(data.firstname, req) && validName(data.lastname, req)) {
    res.locals.connection.query("SELECT nickname FROM users WHERE nickname=?", [data.nickname], function(err, result) {
      if (!result.length) {
        res.locals.connection.query("INSERT INTO users (nickname, email, firstname, lastname, password) VALUES (?)", [[data.nickname, data.email, data.firstname, data.lastname, "."]], function(err, result) {
          let key = addConfirm(data.nickname, sha256(req.sanitize(data.password)))
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
  } else
    res.redirect('http://localhost/')
})
router.post('/mailpassword', function(req, res, next) {
  if (validName(req.body.nickname, req)) {
    res.locals.connection.query("SELECT email FROM users WHERE nickname=?", [req.body.nickname], function(err, result) {
      if (result.length) {
        sendResetMail(req.body.nickname, addReset(req.body.nickname), result[0].email)
        res.send(result[0].email)
      } else
        res.send(false)
    })
  } else
    res.send(false)
})

router.get('/resetpassword', function(req, res, next) {
  res,send(req.query.nickname in resetPassword && resetPassword[req.query.nickname] == req.query.key)
})

router.post('/edit', function(req, res, next) {
  if (check_key(req.body.id, req.body.token)) {
    let props = req.body.props
    //CHECK if NICKNAME or EMAIL (unwanted updates) and cancel
    if (props.nickname)
      delete props.nickname
    if (props.id)
      delete props.id
    if (props.popularity)
      delete props.popularity
    if (props.report)
      delete props.report
    if (props.lastOnline)
      delete props.lastOnline
    if (!props.email || !validEmail(props.email, req))
      delete props.email
    if (!props.password)
      delete props.password
    else
      props.password = sha224(req.sanitize(props.password))
    if (!props.firstname || !validName(props.firstname, req))
      delete props.firstname
    if (!props.lastname || !validName(props.lastname, req))
      delete props.lastname
    if (!props.age || !validName(props.age, req))
      delete props.age
    if (!props.gender || !validGender(props.gender))
      delete props.gender
    if (!props.orientation || !validOrientation(props.orientation))
      delete props.orientation
    if (!props.position || !validPosition(props.position))
      delete props.position
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
    } else
      res.send(true)
  } else
    res.send(false)
});

/* Change an user password */
router.post('/password', function(req, res, next) {
  if (validName(req.body.nickname, req) && req.body.password && req.body.nickname in resetPassword && resetPassword[req.body.nickname] == req.body.key) {
    res.locals.connection.query("UPDATE users SET password=? WHERE nickname=?", [sha224(req.sanitize(req.body.password)), req.body.nickname], function(err, result) {
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


/*
  age [min, max]
  popularity [min, max]
  distance km
  tags [list]
  sortBy : char
*/
router.post('/profiles', function(req, res, next) {
  const coordsToKm = (lat1, lng1, lat2, lng2) => {
		const radlat1 = Math.PI * lat1/180
		const radlat2 = Math.PI * lat2/180
		const theta = lng1-lng2
		const radtheta = Math.PI * theta/180
		let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
		if (dist > 1)
			dist = 1
		dist = Math.acos(dist)
		dist = dist * 180 / Math.PI
		dist = dist * 60 * 1.1515
		dist = dist * 1.609344
		return dist;
  }
  const lookingfor = (gender, orientation) => {
    if (gender == 1) {
      if (orientation == 1) return ([[2, 2], [1, 3]])
      else if (orientation == 2) return ([[1, 1], [2, 3]])
      return ([[2, 2, 1, 1], [1, 3, 2, 3]])
    } else {
      if (orientation == 1) return ([[1, 1], [1, 3]])
      else if (orientation == 2) return ([[2, 2], [2, 3]])
      return ([[1, 1, 2, 2], [1, 3, 2, 3]])
    }
  }
  const profiles_sort = (profiles, age, lat, lng, popularity, tags, sortBy) => {
    let birth = new Date(age)

    profiles.sort((a, b) => {
      let scoreA = 0
      let scoreB = 0
      let birthA = new Date(a.age)
      let birthB = new Date(b.age)

      if (sortBy == "1" || sortBy == "2") {
        scoreA += (new Date(Math.abs(birth - birthA)).getFullYear() - 1970) * 5
        scoreB += (new Date(Math.abs(birth - birthB)).getFullYear() - 1970) * 5
      }
      if (sortBy == "1" || sortBy == "3") {
        scoreA += parseInt(Math.sqrt(Math.abs(popularity - a.popularity))) * 4
        scoreB += parseInt(Math.sqrt(Math.abs(popularity - b.popularity))) * 4
      }
      if (sortBy == "1" || sortBy == "4") {      
        scoreA += parseInt(Math.sqrt(coordsToKm(lat, lng, parseFloat(a.position.split(",")[0]), parseFloat(a.position.split(",")[1])))) * 10
        scoreA += parseInt(Math.sqrt(coordsToKm(lat, lng, parseFloat(b.position.split(",")[0]), parseFloat(b.position.split(",")[1])))) * 10
      }
      if (sortBy == "1" || sortBy == "5") {
        scoreA -= a.tags.split(",").filter((curr) => (tags.indexOf(parseInt(curr)) != -1)).length * 10
        scoreB -= b.tags.split(",").filter((curr) => (tags.indexOf(parseInt(curr)) != -1)).length * 10
      }

      return (scoreA - scoreB)
    })
    return profiles
  }

  const q = req.body
  if (check_key(q.id, q.token)) {
    res.locals.connection.query("SELECT popularity, age, gender, orientation, position FROM users WHERE id=?", [q.id], function(err, result) {
      //check si le profil est completement rempli

      //ERROR HERE : Check if tags exists (len == 0)
      res.locals.connection.query("SELECT id FROM tags WHERE id IN (SELECT idTag FROM taglink WHERE idUser=?)", [q.id], function(err, result2) {
        if (err) throw err
        const gender_orientation = lookingfor(result[0].gender, result[0].orientation)
        const age = ((q.age && q.age.length == 2) ? q.age: [18,100]).map(years => {
          let birthdate = new Date()
          birthdate.setFullYear(birthdate.getFullYear() - years)
          birthdate = birthdate.toISOString()
          return (birthdate.substring(0, birthdate.indexOf("T")))
        })
        const popularity = (q.popularity && q.popularity.length == 2) ? q.popularity: [result[0].popularity / 2, result[0].popularity * 2]
        const distance = q.distance ? q.distance : 0

        let params = [q.id, gender_orientation[0], gender_orientation[1], age[1], age[0], parseInt(popularity[0]), parseInt(popularity[1]), q.id]
        let sql = "SELECT users.id, users.nickname, users.popularity, users.age, users.gender, users.position," +
        " GROUP_CONCAT(DISTINCT taglink.idTag) AS tags, GROUP_CONCAT(DISTINCT pictures.picture) AS picture, GROUP_CONCAT(DISTINCT pictures.date) AS pictureDate"+
        " FROM users LEFT OUTER JOIN taglink ON users.id=taglink.idUser LEFT OUTER JOIN pictures ON users.id=pictures.idUser" +
        " WHERE users.id<>? AND users.gender IN (?) AND users.orientation IN (?) AND (users.age BETWEEN ? AND ?) AND (users.popularity BETWEEN ? AND ?)"+
        " AND users.id NOT IN (SELECT idBlocked FROM blocks WHERE idUser=?)"
        if (q.tags && q.tags.length) {
          q.tags.forEach(elem => {
            sql += " AND users.id IN (SELECT idUser FROM taglink WHERE idTag=?)"
            params.push(parseInt(elem))
          })
        }
        sql += " GROUP BY users.id"
        res.locals.connection.query(sql, params, function(err, result3) {
          if (err) throw err
          if (result3 && result3.length) {
            let lat = parseFloat(result[0].position.split(",")[0])
            let lng = parseFloat(result[0].position.split(",")[1])

            let sorted = profiles_sort(result3, result[0].age, lat, lng, result[0].popularity, result2, q.sortBy)

            sorted.filter(elem => {
              return (!distance || coordsToKm(lat, lng, elem.position.split(",")[0], elem.position.split(",")[1]) <= distance)
            }).forEach(elem => {
              const dates = elem.pictureDate.split(",")
              if (dates.length > 1) {
                const pics = elem.picture.split(",")
                let min = dates[0]
                dates.forEach(date => {
                  if (Date.now() - date < min)
                    min = date
                })
                sorted.picture = pics[dates.indexOf(min)]
              }
              delete sorted.pictureDate
            })
            res.send(sorted)
          } else {
            res.send(true)
          }
        })
      })
    })
  } else
    res.send(false)
});

router.get('/profile/:id', function(req, res, next) {
  if (check_key(req.query.id, req.query.token) && req.params.id) {
    res.locals.connection.query("SELECT nickname, email, popularity, firstname, lastname, age, gender, orientation, position, lastOnline FROM users WHERE id=?", [parseInt(req.params.id)], function(err, result) {
      if (err) throw err
      if (result.length == 1) {
        result[0].lastOnline = isOnline(req.params.id) ? false : result[0].lastOnline
        if (req.params.id != req.query.id) {
          delete result[0].email
          res.locals.connection.query("SELECT idUser FROM visits WHERE idUser=? AND idVisited=?", [req.query.id, parseInt(req.params.id)], function(err, already) {
            if (err) throw err
            if (already.length) {
              res.locals.connection.query("UPDATE visits SET date=? WHERE idUser=? AND idVisited=?", [new Date(), req.query.id, parseInt(req.params.id)], function(err, result2) {
                if (err) throw err
                pushNotification(req.params.id, req.query.id, 2, res)
                res.send(result[0]);
              })
            } else {
              res.locals.connection.query("INSERT INTO visits (idUser, idVisited, date) VALUES (?)", [[req.query.id, parseInt(req.params.id), new Date()]], function(err, result2) {
                if (err) throw err
                pushNotification(req.params.id, req.query.id, 2, res)
                res.send(result[0]);
              })
            }
          })
        } else
          res.send(result[0]);
      } else
        res.send(false)
    })
  } else
    res.send(false)
});

router.get('/likerights', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idUser FROM pictures WHERE idUser=?", [req.query.userId], function(err, result) {
      if (err) throw err
      if (result.length)
        res.send(true)
      else
        res.send(false)
    })
  } else
    res.send(false)
});
router.get('/searchrights', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idUser FROM pictures WHERE idUser=?", [req.query.userId], function(err, result) {
      if (err) throw err
      if (result && result.length) {
        res.locals.connection.query("SELECT age, gender, position FROM users WHERE id=?", [req.query.userId], function(err, result) {
          if (result[0].age && result[0].gender && result[0].position) {
            res.locals.connection.query("SELECT content FROM bio WHERE idUser=?", [req.query.userId], function(err, result) {
              if (result[0].content && result[0].content.length) {
                res.locals.connection.query("SELECT idUser FROM taglink WHERE idUser=?", [req.query.userId], function(err, result) {
                  if (result && result.length)
                    res.send(true)
                  else
                    res.send(false)
                })
              } else
                res.send(false)
            })
          } else
            res.send(false)
        })
      } else
        res.send(false)
    })
  } else
    res.send(false)
});

router.post('/bio', function(req, res, next) {
  if (check_key(req.body.id, req.body.token)) {
    res.locals.connection.query("UPDATE bio SET content=? WHERE idUser=?", [req.sanitize(req.body.bio), req.body.id], function(err, result) {
      if (err) throw err
      res.send(true);
    })
  } else
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
  } else
    res.send(false)
});

router.post('/addtag', function(req, res, next) {
  if (check_key(req.body.id, req.body.token)) {
    res.locals.connection.query("INSERT IGNORE INTO tags (name) VALUES (?)", [req.sanitize(req.body.tag).toLowerCase().replace(/,/g, " ")], function(err, result) {
      res.locals.connection.query("SELECT id FROM tags WHERE name=?", [req.sanitize(req.body.tag).toLowerCase().replace(/,/g, " ")], function(err, result) {
        let id = result[0].id
        res.locals.connection.query("SELECT idUser FROM taglink WHERE idUser=? AND idTag=?", [req.body.id, id], function(err, result) {
          if (!(result && result.length > 0)) {
            res.locals.connection.query("INSERT INTO taglink (idUser, idTag) VALUES (?,?)", [req.body.id, id], function(err, result) {
              res.send(true);
            })
          } else {
            res.send(true)
          }
        })
      })
    })
  } else
    res.send(false)
});
router.post('/removetag', function(req, res, next) {
  if (check_key(req.body.id, req.body.token)) {
    res.locals.connection.query("SELECT id FROM tags WHERE name=?", [req.sanitize(req.body.tag)], function(err, result) {
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
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT name FROM tags WHERE id IN (SELECT idTag FROM taglink WHERE idUser=?)", [parseInt(req.query.id)], function(err, result) {
      res.send(result);
    })
  } else
    res.send(false)
});

router.post('/addpicture', function(req, res, next) {
  if (check_key(req.body.id, req.body.token) && req.body.picture && req.body.picture.substring(req.body.picture.indexOf(':') + 1, req.body.picture.indexOf('/')) == "image" ) {
    res.locals.connection.query("SELECT id FROM pictures WHERE idUser=?", [req.body.id], function(err, result) {
      if (result.length < 5) {
        const baseUrl = "@/assets/images/"
        const url = req.body.id + "-" + new Date().getTime()
        const wid = req.body.picture.substring(req.body.picture.indexOf(',') + 1)
        const format = req.body.picture.substring(req.body.picture.indexOf('/') + 1, req.body.picture.indexOf(';'))
        fs.appendFile("public/images/" +  url + '.' + format, wid, 'base64', function (err) {
          if (err) throw err;
          res.locals.connection.query("INSERT INTO pictures (idUser, picture, date) VALUES (?)", [[req.body.id, url + '.' + format, new Date()]], function(err, result) {
            if (err) throw err
            addPopularity(req.body.id, res, 1)
            res.send(true)
          })
        })
      } else
        res.send(false)
    })
  } else
    res.send(false)
});
router.post('/favpicture', function(req, res, next) {
  if (check_key(req.body.user.id, req.body.user.token)) {
    res.locals.connection.query("UPDATE pictures SET date=? WHERE id=?", [new Date(), parseInt(req.body.imgId)], function(err, result) {
      if (err) throw err
      res.send(true)
    })

  } else
    res.send(false)
});
router.post('/deletepicture', function(req, res, next) {
  if (check_key(req.body.user.id, req.body.user.token)) {
    res.locals.connection.query("DELETE FROM pictures WHERE id=?", [parseInt(req.body.imgId)], function(err, result) {
      if (err) throw err
      removePopularity(req.body.user.id, res, 1)
      res.send(true)
    })
  } else
    res.send(false)
});
router.get('/pictures', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT id, picture, date FROM pictures WHERE idUser=? ORDER BY date DESC", [parseInt(req.query.id)], function(err, result) {
      res.send(result);
    })
  } else
    res.send(false)
});

router.get('/interacts', function(req, res, next) {
  let ret = {liked: false, liking: false, blocked: false}
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idUser FROM matches WHERE idLiked=? AND idUser=?", [req.query.userId, parseInt(req.query.id)], function(err, result) {
      if (result && result.length)
        ret.liked = true
      res.locals.connection.query("SELECT idUser FROM matches WHERE idLiked=? AND idUser=?", [parseInt(req.query.id), req.query.userId], function(err, result) {
        if (result.length)
          ret.liking = true
        res.locals.connection.query("SELECT idBlocked FROM blocks WHERE idUser=? AND idBlocked=?", [req.query.userId, parseInt(req.query.id)], function(err, result) {
          if (err) throw err
          if (result.length)
            ret.blocked = true
          res.send(ret);
        })
      })
    })
  } else
    res.send(false)
})

router.get('/likedby', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idUser FROM matches WHERE idLiked=? ORDER BY date DESC", [req.query.userId], function(err, result1) {
      if (result1 && result1.length) {
        res.locals.connection.query("SELECT id, idUser, idNotifier, readed FROM notifications WHERE idUser=? AND idNotifier IN (?) AND type=1", [req.query.userId, result1.map(elem => (elem.idUser))], function(err, result2) {
          res.locals.connection.query("SELECT id, nickname FROM users WHERE id IN (?)", [result1.map(elem => (elem.idUser))], function(err, result3) {
            let ret = result1.map((elem, index) => {
              let newElem = JSON.parse(JSON.stringify(elem))
              newElem.nickname = result3[result3.findIndex(ref => (ref.id == elem.idUser))].nickname
              newElem.idNotification = result2.length && result2.findIndex(ref => (ref.idNotifier == elem.idUser)) != -1 ? result2[result2.findIndex(ref => (ref.idNotifier == elem.idUser))].id : 0
              newElem.readed = result2.length && result2.findIndex(ref => (ref.idNotifier == elem.idUser)) != -1 ? result2[result2.findIndex(ref => (ref.idNotifier == elem.idUser))].readed : 1
              return (newElem)
            })
            res.send(ret);
          })
        })
      } else
        res.send([])
    })
  } else
    res.send(false)
});
router.get('/liking', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idLiked FROM matches WHERE idUser=? ORDER BY date DESC", [req.query.userId], function(err, result) {
      res.send(result);
    })
  } else
    res.send(false)
});
router.get('/matches', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idLiked FROM matches WHERE idUser=? AND idLiked IN (SELECT idUser FROM matches WHERE idLiked=?) ORDER BY date DESC", [req.query.userId, req.query.userId], function(err, result1) {
      if (err) throw err
      if (result1 && result1.length) {
        res.locals.connection.query("SELECT id, idUser, idNotifier, readed FROM notifications WHERE idUser=? AND idNotifier IN (?) AND type=4", [req.query.userId, result1.map(elem => (elem.idLiked))], function(err, result2) {
          if (err) throw err
          res.locals.connection.query("SELECT id, nickname FROM users WHERE id IN (?)", [result1.map(elem => (elem.idLiked))], function(err, result3) {
            if (err) throw err
            let ret = result1.map((elem, index) => {
              let newElem = JSON.parse(JSON.stringify(elem))
              newElem.nickname = result3[result3.findIndex(ref => (ref.id == elem.idLiked))].nickname
              newElem.idNotification = result2.length && result2.findIndex(ref => (ref.idNotifier == elem.idLiked)) != -1 ? result2[result2.findIndex(ref => (ref.idNotifier == elem.idLiked))].id : 0
              newElem.readed = result2.length && result2.findIndex(ref => (ref.idNotifier == elem.idLiked)) != -1 ? result2[result2.findIndex(ref => (ref.idNotifier == elem.idLiked))].readed : 1
              return (newElem)
            })
            res.send(ret);
          })
        })
      } else
        res.send([])
    })
  } else
    res.send(false)
});
router.post('/match', function(req, res, next) {
  if (check_key(req.body.userId, req.body.userToken)) {
    res.locals.connection.query("SELECT idUser FROM pictures WHERE idUser=?", [req.body.userId], function(err, picture) {
      if (picture && picture.length) {
        if (req.body.userId != req.body.id) {
          res.locals.connection.query("SELECT idUser FROM matches WHERE idUser=? AND idLiked=?", [req.body.userId, parseInt(req.body.id)], function(err, likeIt) {
            if (err) throw err
            res.locals.connection.query("SELECT idUser FROM matches WHERE idUser=? AND idLiked=?", [parseInt(req.body.id), req.body.userId], function(err, likeMe) {
              if (err) throw err
              if (likeIt.length) {
                res.locals.connection.query("DELETE FROM matches WHERE idUser=? AND idLiked=?", [req.body.userId, parseInt(req.body.id)], function(err, result) {
                  if (likeMe.length)
                    pushNotification(req.body.id, req.body.userId, 5, res)
                  removePopularity(req.body.id, res, 10)
                  res.send(true)
                })
              } else {
                res.locals.connection.query("INSERT INTO matches (idUser, idLiked, date) VALUES (?)", [[req.body.userId, parseInt(req.body.id), new Date()]], function(err, result) {
                  if (likeMe.length)
                    pushNotification(req.body.id, req.body.userId, 4, res)
                  else
                    pushNotification(req.body.id, req.body.userId, 1, res)
                  addPopularity(req.body.id, res, 10)
                  res.send(true)
                })
              }
            })
          })
        } else
          res.send(false)
      } else
        res.send(false)
    })
  } else
    res.send(false)
});

router.get('/visitedby', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idUser FROM visits WHERE idVisited=? ORDER BY date DESC", [req.query.userId], function(err, result1) {
      if (result1 && result1.length) {
        res.locals.connection.query("SELECT id, idUser, idNotifier, readed FROM notifications WHERE idUser=? AND idNotifier IN (?) AND type=2", [req.query.userId, result1.map(elem => (elem.idUser))], function(err, result2) {
          res.locals.connection.query("SELECT id, nickname FROM users WHERE id IN (?)", [result1.map(elem => (elem.idUser))], function(err, result3) {
            let ret = result1.map((elem, index) => {
              let newElem = JSON.parse(JSON.stringify(elem))
              newElem.nickname = result3[result3.findIndex(ref => (ref.id == elem.idUser))].nickname
              newElem.idNotification = result2.length && result2.findIndex(ref => (ref.idNotifier == elem.idUser)) != -1 ? result2[result2.findIndex(ref => (ref.idNotifier == elem.idUser))].id : 0
              newElem.readed = result2.length && result2.findIndex(ref => (ref.idNotifier == elem.idUser)) != -1 ? result2[result2.findIndex(ref => (ref.idNotifier == elem.idUser))].readed : 1
              return (newElem)
            })
            res.send(ret);
          })
        })
      } else
        res.send([])
    })
  } else
    res.send(false)
});
router.get('/visiting', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idVisited FROM visits WHERE idLiked=? ORDER BY date DESC", [req.query.userId], function(err, result) {
      res.send(result);
    })
  } else
    res.send(false)
});

router.get('/blocked', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idBlocked FROM blocks WHERE idUser=?", [req.query.userId], function(err, result) {
      res.send(result);
    })
  } else
    res.send(false)
});
router.post('/block', function(req, res, next) {
  if (check_key(req.body.userId, req.body.userToken)) {
    if (req.body.userId != req.body.id) {
      res.locals.connection.query("SELECT idUser FROM blocks WHERE idUser=? AND idBlocked=?", [req.body.userId, parseInt(req.body.id)], function(err, blocked) {
        if (blocked && blocked.length) {
          res.locals.connection.query("DELETE FROM blocks WHERE idUser=? AND idBlocked=?", [req.body.userId, parseInt(req.body.id)], function(err, blocked) {
            if (err) throw err
            res.send(true)
          })
        } else {
          res.locals.connection.query("INSERT INTO blocks (idUser, idBlocked) VALUES (?, ?)", [req.body.userId, parseInt(req.body.id)], function(err, blocked) {
            if (err) throw err
            res.send(true)
          })
        }
      })
    } else
      res.send(false)
  } else
    res.send(false)
});

router.post('/report', function(req, res, next) {
  if (check_key(req.body.userId, req.body.userToken)) {
    res.locals.connection.query("UPDATE users SET report=report+1 WHERE id=?", [parseInt(req.body.id)], function(err, blocked) {
      if (err) throw err
      res.send(true)
    })
  } else
    res.send(false)
});

router.get('/notifications', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken, res)) {
    res.locals.connection.query("SELECT id, idUser, idNotifier, type, readed FROM notifications WHERE idUser=? ORDER BY date DESC", [req.query.userId], function(err, result) {
      if (err) throw err
      res.send(result);
    })
  } else
    res.send(false)
});

router.post('/readNotification', function(req, res, next) {
  if (check_key(req.body.userId, req.body.userToken)) {
    res.locals.connection.query("UPDATE notifications SET readed=1 WHERE idUser=? AND id=?", [req.body.userId, parseInt(req.body.id)], function(err, blocked) {
      if (err) throw err
      res.send(true)
    })
  } else
    res.send(false)
});

router.post('/deleteNotification', function(req, res, next) {
  if (check_key(req.body.userId, req.body.userToken)) {
    res.locals.connection.query("DELETE FROM notifications WHERE idUser=? AND id=?", [req.body.userId, parseInt(req.body.id)], function(err, blocked) {
      if (err) throw err
      res.send(true)
    })
  } else
    res.send(false)
});


router.get('/conversations', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idLiked, date FROM matches WHERE idUser=? AND idLiked IN (SELECT idUser FROM matches WHERE idLiked=?)", [req.query.userId, req.query.userId], function(err, matches) {
      if (matches && matches.length) {
        res.locals.connection.query("SELECT DISTINCT idMessaged, date FROM messages WHERE idUser=? UNION SELECT idUser as idMessaged, date FROM messages WHERE idMessaged=? ORDER BY date DESC;", [req.query.userId, req.query.userId], function(err, result1) {
          let ret2 = null
          if (result1 && result1.length)
            ret2 = result1.filter((elem, index) => (result1.findIndex(val => (elem.idMessaged == val.idMessaged)) == index))
          let ret = matches.map(elem => {
            if (ret2 && ret2.findIndex(val => (val.idMessaged == elem.idLiked)) != -1)
              elem.date = ret2[ret2.findIndex(val => (val.idMessaged == elem.idLiked))].date
            return elem
          })
          ret.sort((a, b) => (a.date - b.date))
          res.locals.connection.query("SELECT id, idUser, idNotifier, readed FROM notifications WHERE idUser=? AND idNotifier IN (?) AND type=3", [req.query.userId, ret.map(elem => (elem.idLiked))], function(err, result2) {
            res.locals.connection.query("SELECT id, nickname FROM users WHERE id IN (?)", [ret.map(elem => (elem.idLiked))], function(err, result3) {
              ret = ret.map((elem, index) => {
                let newElem = JSON.parse(JSON.stringify(elem))
                newElem.nickname = result3[result3.findIndex(ref => (ref.id == elem.idLiked))].nickname
                newElem.idNotification = result2.length && result2.findIndex(ref => (ref.idNotifier == elem.idLiked)) != -1 ? result2[result2.findIndex(ref => (ref.idNotifier == elem.idLiked))].id : 0
                newElem.readed = result2.length && result2.findIndex(ref => (ref.idNotifier == elem.idLiked)) != -1 ? result2[result2.findIndex(ref => (ref.idNotifier == elem.idLiked))].readed : 1
                return (newElem)
              })
              res.send(ret);
            })
          })
        })
      } else
        res.send([])
    })
  } else
    res.send(false)
});

router.get('/messages', function(req, res, next) {
  if (check_key(req.query.userId, req.query.userToken)) {
    res.locals.connection.query("SELECT idUser, idMessaged, message FROM messages WHERE (idUser=? AND idMessaged=?) OR (idUser=? AND idMessaged=?) ORDER BY date DESC", [req.query.userId, parseInt(req.query.id), parseInt(req.query.id), req.query.userId], function(err, result) {
      res.send(result);
    })
  } else
    res.send(false)
});

router.post('/message', function(req, res, next) {
  if (check_key(req.body.userId, req.body.userToken)) {
    res.locals.connection.query("INSERT INTO messages (idUser, idMessaged, message, date) VALUES (?)", [[req.body.userId, parseInt(req.body.id), req.sanitize(req.body.message), new Date()]], function(err, blocked) {
      if (err) throw err
      pushNotification(req.body.id, req.body.userId, 3, res)
      res.send(true)
    })
  } else
    res.send(false)
});

/* TYPE:
  1: liked
  2: Visited
  3: Messaged
  4: Liked Back (matche)
  5: Unliked Back (unmatche)
*/
const pushNotification = (idUser, idNotifier, type, res) => {
  res.locals.connection.query("SELECT idUser FROM blocks WHERE idBlocked=? AND idUser=?", [idNotifier, idUser], function(err, result) {
    if (err) throw err;
    if (!result.length) {
      res.locals.connection.query("DELETE IGNORE FROM notifications WHERE idUser=? AND idNotifier=? AND type=?", [parseInt(idUser), parseInt(idNotifier), type], function(err, result) {
        if (err) throw err;
        res.locals.connection.query("INSERT INTO notifications (idUser, idNotifier, type, date) VALUES (?)", [[parseInt(idUser), parseInt(idNotifier), type, new Date()]], function(err, result) {
          if (err) throw err;
        })
      })
    }
  })
}

const removePopularity = (id, res, amount) => {
  res.locals.connection.query("UPDATE users SET popularity=0 WHERE id=? AND popularity < ?", [parseInt(id), amount], function(err, result) {
    res.locals.connection.query("UPDATE users SET popularity=popularity - ? WHERE id=? AND popularity >= ?", [amount, parseInt(id), amount], function(err, result) {
      if (err) throw err;
    })
  })
}
const addPopularity = (id, res, amount) => {
  const limit = 500 - amount
  res.locals.connection.query("UPDATE users SET popularity=500 WHERE id=? AND popularity > ?", [parseInt(id), limit], function(err, result) {
    res.locals.connection.query("UPDATE users SET popularity=popularity + ? WHERE id=? AND popularity <= ?", [amount, parseInt(id), limit], function(err, result) {
      if (err) throw err;
    })
  })
}
module.exports = router;
