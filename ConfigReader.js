class ConfigReader{
$.getJSON('config.json', function (json) {
var array = [];
for (var key in json) {
    if (json.hasOwnProperty(key)) {
        var item = json[key];
        array.push({
            item
        });            
    }
}
console.log(array);
});
}
