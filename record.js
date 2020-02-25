function startRec(ks)
{
  console.log('startRec function started');
  var url = 'https://www.kaltura.com/api_v3/service/uploadtoken/action/add?ks=' + ks
  fetch(url, {
    method: 'post',
  }).then(function(data) {
    console.log('startRec at response', data.json);
    return data.json()});
}


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

function addEntry(ks)
{
  console.log('addEntry function started');
  var url = 'https://www.kaltura.com/api_v3/service/baseentry/action/add?format=1&type=1&entry%3AobjectType=KalturaBaseEntry&entry%3A&ks=' + ks
  fetch(url, {
    method: 'post',
  }).then(function(data) {
    console.log('addEntry at response', data.json);
    return data.json()});
}

function addContent(ks, entryId, token)
{
  console.log('addContent function started');
  var url = 'https://www.kaltura.com/api_v3/service/baseentry/action/addContent?resource%3AobjectType=KalturaUploadedFileTokenResource&resource%3Atoken=' + token + '&entryId=' + entryId + '&ks=' + ks
  fetch(url, {
    method: 'post',
  }).then(function(data) {
    console.log('addcContent at response', data.json);
    return data.json()});
}
