function ConfigReader(configFile)
{
  const config = require(configFile);
  const obj = JSON.parse(config);
  console.log("from config json" + obj);
  return obj;
}
