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

function requestIteration(s, arr, i, resp, start, key, from, to) {
  var query = 'https://api.quizlet.com/2.0/sets/' + s[i].id + '/terms?client_id=fNtrBSQ5PK&whitespace=1';
  needle.get(query, function(e, r) {
    var set = r.body;
    for(var j = 0; j < set.length; j++) {
      arr.push(set[j].term);
    }
    if(i < s.length - 1) {
      requestIteration(s, arr, i + 1, resp, start, key, from, to);
    } else {
      console.log(((new Date).getTime() - start) / 1000);

      // Translation:

      //var from = "en";
      //var to = "ru";
      var completedFrom = 0;
      var completedTo = 0;

      arr = filterWords(arr);
      arr = arr.slice(0, 50);

      var trArrFrom = [];
      var trArrTo = [];
      var resTrArrFrom = [];
      var resTrArrTo = [];
      var finished = false;
      for(var k = 0; k < arr.length; k++) {
        needle.get("https://translate.yandex.net/api/v1.5/tr.json/translate?key=" + key + "&lang=" + "eng" + "-" + from + "&text=" + arr[k], function(er, rr) {
          var path = rr.req.path;
          var reqWord = path.substr(path.indexOf("text=") + 5);

          for(var x = 0; x < arr.length; x++) {
            if(arr[x] == reqWord) trArrFrom[x] = rr.body.text[0];
          }

          completedFrom++;
          if(completedFrom == arr.length) {
              console.log(((new Date).getTime() - start) / 1000);
              var pairs = [];

              //----------

              var resArr = [];
              //var resTrArrFrom = [];
              for(var p = 0; p < arr.length; p++) {
                if(!(arr[p] != arr[p].toLowerCase() && arr[p][0] == arr[p][0].toLowerCase()) && !(trArrFrom[p] != trArrFrom[p].toLowerCase() && trArrFrom[p][0] == trArrFrom[p][0].toLowerCase())) {
                  resArr.push(arr[p].toLowerCase());
                  resTrArrFrom.push(trArrFrom[p].toLowerCase());
                }
              }

              //----------

              if(!finished) {
                finished = true;
              } else {
                for(var p = 0; p < arr.length; p++) {
                  pairs[p] = { "first": resTrArrFrom[p], "second": resTrArrTo[p] };
                }
                resp.send({ "pairs": pairs });
                console.log(pairs);
              }

              /*for(var p = 0; p < arr.length; p++) {
                pairs[p] = { "first": resArr[p], "second": resTrArr[p] };
              }
              resp.send({ "pairs": pairs });*/
            }
        });
      }
      for(var k = 0; k < arr.length; k++) {
        needle.get("https://translate.yandex.net/api/v1.5/tr.json/translate?key=" + key + "&lang=" + "eng" + "-" + to + "&text=" + arr[k], function(er, rr) {
          var path = rr.req.path;
          var reqWord = path.substr(path.indexOf("text=") + 5);

          for(var x = 0; x < arr.length; x++) {
            if(arr[x] == reqWord) trArrTo[x] = rr.body.text[0];
          }

          completedTo++;
          if(completedTo == arr.length) {
            console.log(((new Date).getTime() - start) / 1000);
            var pairs = [];

            //----------

            var resArr = [];
            //var resTrArrTo = [];
            for(var p = 0; p < arr.length; p++) {
              if(!(arr[p] != arr[p].toLowerCase() && arr[p][0] == arr[p][0].toLowerCase()) && !(trArrTo[p] != trArrTo[p].toLowerCase() && trArrTo[p][0] == trArrTo[p][0].toLowerCase())) {
                resArr.push(arr[p].toLowerCase());
                resTrArrTo.push(trArrTo[p].toLowerCase());
              }
            }

            //----------

            if(!finished) {
              finished = true;
            } else {
              for(var p = 0; p < arr.length; p++) {
                pairs[p] = { "first": resTrArrFrom[p], "second": resTrArrTo[p] };
              }
              resp.send({ "pairs": pairs });
            }
            console.log(pairs);

            /*for(var p = 0; p < arr.length; p++) {
              pairs[p] = { "first": resArr[p], "second": resTrArr[p] };
            }
            resp.send({ "pairs": pairs });*/
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
    console.log(req.query.from);
    console.log(req.query.to);
    needle.get('https://api.quizlet.com/2.0/search/sets?client_id=' + JSON.parse(obj).quizlet_client_id + '&whitespace=1&q=' + req.query.key, function(err, resp) {
      var array = [];
      requestIteration(resp.body.sets, array, 0, res, (new Date).getTime(), JSON.parse(obj).yandex_api_key, req.query.from, req.query.to);
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
