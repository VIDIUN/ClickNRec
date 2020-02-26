var entryId='';
var token;
var resumeAt=0;

function uploadChunk(ks ,fileData, finalChunk=0)
{
  const formData = new FormData();
  formData.append('fileData', fileData);
  var url = 'https://www.kaltura.com/api_v3/service/uploadtoken/action/upload?ks=' + ks + '&uploadTokenId=' + token;
  if(fileData.size)
  {
    
    url+= '&resume=1';
  }
  if(finalChunk)
  {
    url+='&finalChunk=1';
  }
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
  var url = 'https://www.kaltura.com/api_v3/service/baseentry/action/add?format=1&type=1&entry%3AobjectType=KalturaBaseEntry&entry%3A&ks=' + ks;
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
