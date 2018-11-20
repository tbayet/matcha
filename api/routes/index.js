var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/tags', function(req, res, next) {
  if (req.query.input && req.query.input.trim().length) {
    res.locals.connection.query("SELECT name FROM tags WHERE INSTR(name, ?) > 0 ORDER BY name LIMIT 6", [req.query.input], function(err, result) {
      res.send(result)
    })
  }
  else {
    res.send(false);
  }
});

router.get('/id', function(req, res, next) {
  if (req.query.nickname) {
    res.locals.connection.query("SELECT id FROM users WHERE nickname=?", [req.query.nickname], function(err, result) {
      if (result && result.length)
        res.send(result[0])
      else
        res.send(false)
    })
  }
  else
    res.send(false)
});

module.exports = router;
