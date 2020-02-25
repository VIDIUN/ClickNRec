function startRec(ks) 
{
  console.log('startRec function started');
  var url = 'https://www.kaltura.com/api_v3/service/uploadtoken/action/add?ks=' + ks
  fetch(url, {
    method: 'post',
  }).then(function(response) {
    console.log('startRec at response', response);
    return response.json();
  }).then(function(data) {
    console.log('startRec function ended', data);
  });
}
