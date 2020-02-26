var entryId='';
var token;
var resumeAt=0;

var address = '';

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
	
  } else {
    console.log("Geolocation is not supported by this browser");
  }
}
 function displayLocation(latitude,longitude){
        var request = new XMLHttpRequest();

        var method = 'GET';
		var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+latitude+','+longitude+'&sensor=true&key=AIzaSyDXea4aF63P3bIAruuIMi_V--f6X9_Wv2A';
        var async = true;

        request.open(method, url, async);
        request.onreadystatechange = function(){
          if(request.readyState == 4 && request.status == 200){
            var data = JSON.parse(request.responseText);
            address = data.results[0];
			jQuery('#address').val(address.formatted_address);
          }
        };
        request.send();
      };		
//callback		
function showPosition(position) {
	var latlon = position.coords.latitude + "," + position.coords.longitude;
	jQuery('#pos_lat').val(position.coords.latitude);
	jQuery('#pos_lon').val(position.coords.longitude);
	//var img_url = "https://maps.googleapis.com/maps/api/staticmap?center="+latlon+"&zoom=14&size=400x300&sensor=false&key=AIzaSyDXea4aF63P3bIAruuIMi_V--f6X9_Wv2A";
	var img_url = "https://maps.googleapis.com/maps/api/staticmap?markers="+latlon+"&zoom=14&size=400x300&sensor=false&key=AIzaSyDXea4aF63P3bIAruuIMi_V--f6X9_Wv2A";
	console.log("Position: Latitude: " + position.coords.latitude +	" , Longitude: " + position.coords.longitude);
	document.getElementById("mapholder").innerHTML = "<img src='"+img_url+"'>";
  
	displayLocation(position.coords.latitude, position.coords.longitude);
}


function uploadChunk(ks ,fileData, finalChunk=0)
{
  const formData = new FormData();
  formData.append('fileData', fileData);
  var url = 'https://www.kaltura.com/api_v3/service/uploadtoken/action/upload?ks=' + ks + '&uploadTokenId=' + token;
  if(resumeAt>0)
  {
    url+= '&resume=1';
  }
  url+='&finalChunk='+finalChunk;
  
  url+= '&resumeAt=' + resumeAt;

  console.log('uploadChunk function started');
  fetch(url, {
    method: 'post',
    body: formData
  }).then(function(response) {
    console.log('uploadChunk function ended', response);
    resumeAt += fileData.size;    
    return response.json()});
}

function attachEntryAndToken(ks)
{
  resumeAt=0;
  console.log('addEntry started');
  var url = 'https://www.kaltura.com/api_v3/service/baseentry/action/add?format=1&type=1&entry%3AobjectType=KalturaMediaEntry&entry%3AmediaType=1&entry%3Adescription=bla&entry%3Atags=accident&entry%3Aname=car_accident_at_' + address + '&ks=' + ks;
  fetch(url, {
    method: 'post',
  }).then(function(response) {
    return response.json();
  })
  .then(function(json) {
    console.log(json);
    entryId = json['id'];
    createToken(ks, entryId);

  });
}

function addContent(ks, entryId, token)
{
  console.log('addContent started');
  var url = 'https://www.kaltura.com/api_v3/service/baseentry/action/addContent?resource%3AobjectType=KalturaUploadedFileTokenResource&resource%3Atoken=' + token + '&entryId=' + entryId + '&ks=' + ks
  fetch(url, {
    method: 'post',
  }).then(function(response) {
    return response.json();
  }).then(function(json) {
    console.log(json);
    console.log('addContent finished');
  });
}

function createToken(ks, entryId)
{
  console.log('createToken started');
  var url = 'https://www.kaltura.com/api_v3/service/uploadtoken/action/add?format=1&ks=' + ks;
  fetch(url, {
    method: 'post',
  }).then(function(response) {
    return response.json();
  })
      .then(function(json) {
        console.log(json);
        token = json['id'];
        addContent(ks, entryId, token)
        console.log("Added entry ID "+entryId +"token ID " + token);
      });
}
