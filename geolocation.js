
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
            var address = data.results[0];
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
	var img_url = "https://maps.googleapis.com/maps/api/staticmap?center="+latlon+"&zoom=14&size=400x300&sensor=false&key=AIzaSyDXea4aF63P3bIAruuIMi_V--f6X9_Wv2A";
	console.log("Position: Latitude: " + position.coords.latitude +	" , Longitude: " + position.coords.longitude);
	document.getElementById("mapholder").innerHTML = "<img src='"+img_url+"'>";
  
	displayLocation(position.coords.latitude, position.coords.longitude);
}
