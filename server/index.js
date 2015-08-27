var Hapi = require('hapi');
var path = require('path');
var conf = require('./../lib/conf');

var server = new Hapi.Server();
var apiUrl = 'https://api.instagram.com/v1/';
var cacheConfig = {
  cache: {
    expiresIn: conf.get('cache_timeout'),
    privacy: conf.get('cache_privacy')
  }
};

server.connection({
  host: conf.get('host'),
  port: conf.get('port')
});

server.views({
  engines: {
    jade: require('jade')
  },
  isCached: process.env.node === 'production',
  path: path.join(__dirname, '/templates'),
  compileOptions: {
    pretty: true
  }
});

// API Proxy
var mapper = function(request, callback) {
  var search = '';
  var sym = request.url.search ? '&' : '?';
  if (request.url.search) {
    search = request.url.search;
  }
  var request_url = apiUrl + request.params.p + search + sym + 'client_id=' + conf.get('client_id');
  callback(null, request_url);
};

server.route(
  [
    {
      method: 'GET',
      path: '/api/{p*}',
      config: {
        handler: { proxy: { mapUri: mapper }},
        cache: cacheConfig.cache
      }
    },
    {
      path: '/public/{p*}',
      method: 'GET',
      handler: {
        directory: {
          path: path.join(__dirname, '/../public')
        }
      },
      config: cacheConfig
    },
    {
      method: 'GET',
      path: '/{p*}',
      handler: function(request, reply) {
        reply.view('index', {
          layout_data: {
            host: conf.get('host'),
            port: conf.get('port')
          }
        });
      }
    },
    {
      method: 'GET',
      path: '/favicon.ico',
      handler: {
        file: path.join(__dirname, './../../public/images/favicon.ico')
      },
      config: {
        cache: {expiresIn: 86400000, privacy: 'public'}
      }
    }
  ]
);

console.log(path.join(__dirname, './../../public/images/favicon.ico'))

server.start(function(err) {
  if (err) {
    throw new Error(err.message);
  }
  console.log('Server running at:', server.info.uri);
});

exports.getServer = function() {
  return server;
};