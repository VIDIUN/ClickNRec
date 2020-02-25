/**
 * Created by moshe.maor on 02/24/2020.
 */
var video=null;
var width;
var mimeType = 'video/webm\;codecs=h264';
var record_index=1;
var uploadQIndex=0;
var upload_size=0;
var uploadQueue = [];
var tryCloseRecording = false;
var recorderSize = 0;
var uploadedSoFar = 0;
var eventId;
var questionId;
var isDisabled=true;
var recordingPlayer;
const type = 'video';
const chunkRecordDuration = 10000;
var eventEnded=false;
var videoResolution=[640,480];
function StartMedia(_eventId, videoElementID, _width)
{
    if(eventEnded)
    {
        return;
    }
    if(video!=null)
    {
        return;
    }
    video = document.getElementById(videoElementID);
    eventId = _eventId;
    width = _width;
    video.controls = true;

    /*
     This section is video feedback that user sees on the screen
     */
    var div = document.createElement('section');
    var mediaElement = getHTMLMediaElement(video, {});
    document.getElementById('recording-player').appendChild(mediaElement);
    mediaElement.media.parentNode.appendChild(div);
    mediaElement.media.muted = false;
    div.appendChild(mediaElement.media);
    recordingPlayer = mediaElement.media;
    startMedia();
    isDisabled = false;
}

function StartRecordingQuestion(_eventId, _QuestionID)
{
    if(eventEnded)
    {
        return;
    }
    console.log("Starting to record event:"+_eventId + " QuestionId:"+_QuestionID);
    if(_eventId!=eventId)
    {
        //Do something
        return;
    }

    //TODO -
    // 1. Add entry
    // 2. UploadToken
    // 3. Content

    isDisabled=false;
    questionId = _QuestionID;
    setInterval(uploadFromQueue,1000);
    video.recordRTC.startRecording();
}

function StopRecordingQuestion(_eventId, _QuestionID)
{
    if(eventEnded)
    {
        return;
    }
    isDisabled=true;
    video.recordRTC.stopRecording();
    uploadFromQueue();
    tryCloseRecording = true;
}

function EndRecording(InterviewID)
{
    if(eventEnded)
    {
        return;
    }
    eventEnded=true;
    video.recordRTC.initRecorder();
    recordingPlayer.pause();
}

//setup queue clean up timer that will always uplaod thepending content
function uploadFromQueue(){
    if(document.querySelector('#queue_size'))
    {
        document.querySelector('#queue_size').innerHTML = "Queue size: " + uploadQueue.length;
    }
    //check which packets needs to be deleted already
    if(uploadQueue.length != 0)
    {
        if(!uploadQueue[0])
        {
            return;
        }
        var element = uploadQueue[0];

        uploadToKaltura(element[0], element[1], function (progress) {
            var thisElement = uploadQueue[0];
            if (progress === 'success') {
                uploadQueue.shift();
                    uploadedSoFar += element[1].size;
                    console.log('Uploaded: ' + thisElement[0] + ' ' + thisElement[1].size + ' '  + uploadedSoFar + "Queue Size :" + uploadQueue.length);

                console.log(progress);
            }
            else
            {
                console.log('Upload state - ' + progress);
            }
        });
    }
    else if(tryCloseRecording)
    {
        endUploadToKaltura(getFileName());
        tryCloseRecording = false;
    }
}

// This function is called only when queue is emptry and upload to server is completed
// fileName - a path to the dir where the recording was kept
//TODO - mark final chunk
function endUploadToKaltura(fileName) {
    //Upload to server
    var formData = new FormData();
//        formData.append('video-filename', fileName+"/");

    formData.append('video-eventId', eventId);
    formData.append('video-filename', fileName);
    formData.append('video-questionId',  questionId );

    var upload_url = 'phpUpload/close.php';
    makeXMLHttpRequest(upload_url, formData,function(callback){});
    prepareNextRecording();
}


function addStreamStopListener(stream, callback) {
    stream.addEventListener('ended', function() {
        callback();
        callback = function() {};
    }, false);
    stream.addEventListener('inactive', function() {
        callback();
        callback = function() {};
    }, false);
    stream.getTracks().forEach(function(track) {
        track.addEventListener('ended', function() {
            callback();
            callback = function() {};
        }, false);
        track.addEventListener('inactive', function() {
            callback();
            callback = function() {};
        }, false);
    });
}


var getFileName = function()
{
    return eventId + '/' + questionId + '/';
}

var startMedia = function() {
    //From here on is the flow of recording video and audio
    var commonConfig = {
        onMediaCaptured: function(stream) {
            video.stream = stream;
            if(video.mediaCapturedCallback) {
                video.mediaCapturedCallback();
            }
        },
        onMediaStopped: function() {
        },
        onMediaCapturingFailed: function(error) {
            console.error('onMediaCapturingFailed:', error);
            if(error.toString().indexOf('no audio or video tracks available') !== -1) {
                alert('RecordRTC failed to start because there are no audio or video tracks available.');
            }
            if(error.name === 'PermissionDeniedError' && DetectRTC.browser.name === 'Firefox') {
                alert('Firefox requires version >= 52. Firefox also requires HTTPs.');
            }
            commonConfig.onMediaStopped();
        }
    };

    captureAudioPlusVideo(commonConfig);

    video.mediaCapturedCallback = function() {
        if(typeof MediaRecorder === 'undefined') { // opera or chrome etc.
            video.recordRTC = [];

            var options = {
                type: 'audio', // hard-code to set "audio"
                video: recordingPlayer
            };
            var audioRecorder = RecordRTC(button.stream, options);
            options.type = type;
            var videoRecorder = RecordRTC(button.stream, options);

            // to sync audio/video playbacks in browser!
            videoRecorder.initRecorder(function() {
                audioRecorder.initRecorder(function() {
                    audioRecorder.startRecording();
                    videoRecorder.startRecording();
                });
            });
            video.recordRTC.push(audioRecorder, videoRecorder);
            return;
        }

        var options = {
            type: 'video',
            mimeType: mimeType,
            getNativeBlob: false, // enable it for longer recordings
            video: recordingPlayer
        };

        options.timeSlice = chunkRecordDuration;
              options.ondataavailable = function(blob) {
                //here we send the recording to the server every GOP_DURATION seconds
                //make a clone of the data
                if(isDisabled)
                {
                    return;
                }
                const clonedBlob = new Blob([blob], {type: blob.type});
                uploadQIndex++;
                uploadQueue.push([uploadQIndex,clonedBlob]);
                if(recorderSize) {
                    upload_size += clonedBlob.size;
                    var html = 'Recorded size: ' + upload_size;
                    recorderSize.innerHTML = html;
                }
            };
        video.recordRTC = RecordRTC(video.stream, options);

    };
};

    function captureAudioPlusVideo(config) {
        var res= getVideoResolutions();
        var videoObject = { width: { exact : res[0]} , height :{exact : res[1]}};
        captureUserMedia({video: videoObject , audio: true}, function(audioVideoStream) {
            config.onMediaCaptured(audioVideoStream);

            if(audioVideoStream instanceof Array) {
                audioVideoStream.forEach(function(stream) {
                    addStreamStopListener(stream, function() {
                        config.onMediaStopped();
                    });
                });
                return;
            }

            addStreamStopListener(audioVideoStream, function() {
                config.onMediaStopped();
            });
        }, function(error) {
            config.onMediaCapturingFailed(error);
        });
    }

    function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
        if(mediaConstraints.video == true) {
            mediaConstraints.video = {};
        }

        navigator.mediaDevices.getUserMedia(mediaConstraints).then(function(stream) {
            successCallback(stream);
            videoFeedBack(stream, true);
        }).catch(function(error) {
            if(error && (error.name === 'ConstraintNotSatisfiedError' || error.name === 'OverconstrainedError')) {
                alert('Your camera or browser does NOT supports selected resolutions or frame-rates. \n\nPlease select "default" resolutions.');
            }
            else if(error && error.message) {
                alert(error.message);
            }
            else {
                alert('Unable to make getUserMedia request. Please check browser console logs.');
            }

            errorCallback(error);
        });
    }

// This function is called to upload file to remote PHP server
// fileName - the file we are going to save on server
// recordRTC - the content of the file

//TODO - call uploadToken::upload
function uploadToKaltura(fileName, recordRTC, callback) {
    var blob = recordRTC instanceof Blob ? recordRTC : recordRTC.getBlob();

    console.log(blob);
    return callback('success');

    blob = new File([blob], fileName, {
        type: mimeType
    });

    var reader = new FileReader();
    reader.readAsDataURL(blob);

    console.log(blob);
    return callback('success');

    reader.onloadend = function() {
        var data = reader.result;
        var prefix = 'base64,';
        var prefixLength = data.search(prefix);
        data = data.substr(prefixLength+prefix.length);
        // create FormData§
        var formData = new FormData();

        formData.append('video-eventId', eventId);
        formData.append('video-filename', fileName);
        formData.append('video-questionId',  questionId );
        formData.append('video-data', data);
        var upload_url = 'phpUpload/save.php';
        makeXMLHttpRequest(upload_url, formData, function(progress) {
            callback(progress);
        });
    }
  }

//This function is called only after the last record has full completed
function prepareNextRecording ()
{
    //prepare fot nex
    uploadQIndex = 0;
    record_index++;
    uploadedSoFar = 0;
    upload_size = 0
}

//Here we post the recorded content to the server
function makeXMLHttpRequest(url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback('success');
        }
    }
    request.open('POST', url);
    request.send(data);
}

function getURL(arg) {
    var url = arg;

    if(arg instanceof Blob || arg instanceof File) {
        url = URL.createObjectURL(arg);
    }

    if(arg instanceof RecordRTC || arg.getBlob) {
        url = URL.createObjectURL(arg.getBlob());
    }

    if(arg instanceof MediaStream || arg.getTracks) {
        // url = URL.createObjectURL(arg);
    }

    return url;
}

function videoFeedBack(arg, forceNonImage) {
    var url = getURL(arg);

    var parentNode = recordingPlayer.parentNode;
    parentNode.removeChild(recordingPlayer);
    parentNode.innerHTML = '';

    var elem = 'video';
    recordingPlayer = document.createElement(elem);

    if(arg instanceof MediaStream) {
        recordingPlayer.muted = true;
    }

    recordingPlayer.addEventListener('loadedmetadata', function() {
        if(navigator.userAgent.toLowerCase().indexOf('android') == -1) return;

        // android
        setTimeout(function() {
              recordingPlayer.play();
        }, 1000);
    }, false);

    recordingPlayer.poster = '';

    if(arg instanceof MediaStream) {
        recordingPlayer.srcObject = arg;
    }
    else {
        recordingPlayer.src = url;
    }

    if(typeof recordingPlayer.play === 'function') {
        recordingPlayer.play();
    }

    recordingPlayer.addEventListener('ended', function() {
        url = getURL(arg);

        if(arg instanceof MediaStream) {
            recordingPlayer.srcObject = arg;
        }
    });
    parentNode.appendChild(recordingPlayer);
}

function getHTMLMediaElement(mediaElement, config) {
    config = config || {};

    if (!mediaElement.nodeName || (mediaElement.nodeName.toLowerCase() != 'audio' && mediaElement.nodeName.toLowerCase() != 'video')) {
        if (!mediaElement.getVideoTracks().length) {
            return getAudioElement(mediaElement, config);
        }

        var mediaStream = mediaElement;
        mediaElement = document.createElement(mediaStream.getVideoTracks().length ? 'video' : 'audio');

        if ('srcObject' in mediaElement) {
            mediaElement.srcObject = mediaStream;
        } else {
            mediaElement[!!navigator.mozGetUserMedia ? 'mozSrcObject' : 'src'] = !!navigator.mozGetUserMedia ? mediaStream : window.webkitURL.createObjectURL(mediaStream);
        }
    }

    if (mediaElement.nodeName && mediaElement.nodeName.toLowerCase() == 'audio') {
        return getAudioElement(mediaElement, config);
    }

    mediaElement.controls = false;
    config.toggle = config.toggle || [];
    config.toggle.has = function(element) {
        return config.toggle.indexOf(element) !== -1;
    };

    var mediaElementContainer = document.createElement('div');
    mediaElementContainer.className = 'media-container';

    var mediaControls = document.createElement('div');
    mediaControls.className = 'media-controls';
    mediaElementContainer.appendChild(mediaControls);

    var mediaBox = document.createElement('div');
    mediaBox.className = 'media-box';
    mediaElementContainer.appendChild(mediaBox);

    mediaBox.appendChild(mediaElement);
    mediaBox.setAttribute('style',' width: '+width+'px');

    mediaElementContainer.toggle = function(clasName) {
        if (typeof clasName != 'string') {
            for (var i = 0; i < clasName.length; i++) {
                mediaElementContainer.toggle(clasName[i]);
            }
            return;
        }

        if (clasName == 'mute-audio' && muteAudio) muteAudio.onclick();
        if (clasName == 'mute-video' && muteVideo) muteVideo.onclick();

        if (clasName == 'record-audio' && recordAudio) recordAudio.onclick();
        if (clasName == 'record-video' && recordVideo) recordVideo.onclick();

        if (clasName == 'stop' && stop) stop.onclick();

        return this;
    };

    mediaElementContainer.media = mediaElement;
    return mediaElementContainer;
}

function getVideoResolutions() {

    return videoResolution;
}
function setVideoResolution(w,h)
{
    videoResolution=[w,h];
}