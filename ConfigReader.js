class ConfigReader
{
  var Server = require('mongodb').Server;
  var MongoDB = require('mongodb').Db;
  var CONFIG = require('./config.json');

  var obj = JSON.parse(CONFIG);

  console.log("from config json" + obj);
}
