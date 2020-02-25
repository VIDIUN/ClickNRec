function uploadChunk(ks, token, fileData, finalChunk)
{
  console.log('uploadChunk function started');
  var url = 'https://www.kaltura.com/api_v3/service/uploadtoken/action/upload?ks=' + ks + '&uploadTokenId=' + token + '&fileData=' + fileData + 'finalChunk=' + finalChunk + '&resume=1&resumeAt=-1';
  fetch(url, {
    method: 'post',
  }).then(function(response) {
    console.log('uploadChunk function ended', response);
    return response.json()});
}

function attachEntryAndToken(ks)
{
  console.log('addEntry started');
  var url = 'https://www.kaltura.com/api_v3/service/baseentry/action/add?format=1&type=1&entry%3AobjectType=KalturaBaseEntry&entry%3A&ks=' + ks;
  fetch(url, {
    method: 'post',
  }).then(function(response) {
    return response.json();
  })
  .then(function(json) {
    console.log(json);
    var entryId = json['id'];
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
        var token = json['id'];
        addContent(ks, entryId, token)
      });
}
