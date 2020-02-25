class ConfigReader
{
  var CONFIG = require('./config.json');
  var obj = JSON.parse(CONFIG);

  console.log("from config json" + obj);
}
