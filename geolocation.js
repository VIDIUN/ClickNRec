//var gPosition = "";

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    console.log("Geolocation is not supported by this browser");
  }
}

function showPosition(position) {
  gPosition = position
  console.log("Position: Latitude: " + position.coords.latitude +
  " , Longitude: " + position.coords.longitude);
}
