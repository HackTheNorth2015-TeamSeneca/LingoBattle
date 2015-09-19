var express = require('express');
var needle = require('needle');
var path = require('path');
var fs = require('fs');
var ip = require('ip');
var app = express();

app.use(express.static(path.join(__dirname, 'public')));

function filterWords(array) {
  var ret = [];
  for(var l = 0; l < array.length; l++) {
    if(/^[a-zA-Z]+$/.test(array[l])) ret.push(array[l]);
  }
  return ret;
}

function requestIteration(s, arr, i, resp, start, key) {
  var query = 'https://api.quizlet.com/2.0/sets/' + s[i].id + '/terms?client_id=fNtrBSQ5PK&whitespace=1';
  needle.get(query, function(e, r) {
    var set = r.body;
    for(var j = 0; j < set.length; j++) {
      arr.push(set[j].term);
    }
    if(i < s.length - 1) {
      requestIteration(s, arr, i + 1, resp, start, key);
    } else {
      console.log(((new Date).getTime() - start) / 1000);

      // Translation:

      var from = "en";
      var to = "ru";
      var completed = 0;

      arr = filterWords(arr);
      arr = arr.slice(0, 50);

      var trArr = [];
      for(var k = 0; k < arr.length; k++) {
        needle.get("https://translate.yandex.net/api/v1.5/tr.json/translate?key=" + key + "&lang=" + from + "-" + to + "&text=" + arr[k], function(er, rr) {
          var path = rr.req.path;
          var reqWord = path.substr(path.indexOf("text=") + 5);

          for(var x = 0; x < arr.length; x++) {
            if(arr[x] == reqWord) trArr[x] = rr.body.text[0];
          }

          completed++;
          if(completed == arr.length) {
            console.log(((new Date).getTime() - start) / 1000);
            var pairs = [];

            //----------

            var resArr = [];
            var resTrArr = [];
            for(var p = 0; p < arr.length; p++) {
              if(!(arr[p] != arr[p].toLowerCase() && arr[p][0] == arr[p][0].toLowerCase()) && !(trArr[p] != trArr[p].toLowerCase() && trArr[p][0] == trArr[p][0].toLowerCase())) {
                resArr.push(arr[p].toLowerCase());
                resTrArr.push(trArr[p].toLowerCase());
              }
            }

            //----------

            for(var p = 0; p < arr.length; p++) {
              pairs[p] = { "first": resArr[p], "second": resTrArr[p] };
            }
            resp.send({ "pairs": pairs });
          }
        });
      }
    }
  });
}

//----------

var handlebars = require('express3-handlebars').create({ defaultLayout: 'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res) {
  res.render('home', { "data": "abc" });
});
app.get('/results', function(req, res) {

  //----------

  fs.readFile('config.json', 'utf8', function(err, obj) {
    console.log(JSON.parse(obj));
    needle.get('https://api.quizlet.com/2.0/search/sets?client_id=' + JSON.parse(obj).quizlet_client_id + '&whitespace=1&q=' + req.query.key, function(err, resp) {
      var array = [];
      requestIteration(resp.body.sets, array, 0, res, (new Date).getTime(), JSON.parse(obj).yandex_api_key);
    });
  });
});

app.use(function(req, res) {
  res.type('text/plain');
  res.status(404);
  res.send('404!');
});
app.use(function(err, req, res, next) {
  res.type('text/plain');
  res.status(500);
  res.send('500!');
});

app.listen(app.get('port'), function() {
  console.log('Started');
});

