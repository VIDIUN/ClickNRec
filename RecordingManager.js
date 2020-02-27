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
const chunkRecordDuration = 3000;
var eventEnded=false;
var videoResolution=[640,480];
var h2OnVideo = document.createElement('h2');
var debugBox = document.createElement('p');
var config='';
var ks='';
var button;
var facingMode;
h2OnVideo.setAttribute('style', 'position: absolute;color:orange;font-size:24px;opacity:0.5;font-family: "Lato", "Helvetica Neue", Helvetica, Arial, sans-serif;text-shadow: 1px 1px black;padding:0;margin:0;text-align: center; margin-top: 10%; display: block; border: 0;line-height:1.5;z-index:1; wordWrap: break-word');
debugBox.setAttribute('style','position:fixed;color:black;font-size:18px; vertical-align: bottom; horizontal-align: right');

function printDebug(msg)
{
  debugBox.innerText=msg;
}

function setKs(_ks)
{
    ks=_ks;
}
function setConfig(_config)
{
    config = _config;
}

function StartMedia(_eventId, videoElementID, _width, facingMode)
{
    if(eventEnded)
    {
        return;
    }
    if(video!=null)
    {
        return;
    }

    button = document.getElementById("start-stop-button");

    h2OnVideo.innerText = config[questionId]['text'];
    h2OnVideo.style.color = config[questionId]['color'];


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

function StartRecordingQuestion(_eventId, _QuestionID, cameraId)
{
    if(eventEnded)
    {
        return;
    }
    if(!cameraId)
    {
        return;
    }
    console.log("Starting to record event:"+_eventId + " QuestionId:"+_QuestionID);
    attachEntryAndToken(ks);
    if(_eventId!=eventId)
    {
        //Do something
        return;
    }

    facingMode = cameraId;
    startMedia();


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
    h2OnVideo.innerText = config[questionId]['text'];
    h2OnVideo.style.color = config[questionId]['color'];
    document.getElementById("start-stop-button").style.backgroundColor = 'grey';
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

        var finalChunk=0;
        if(uploadQueue.length==1 && tryCloseRecording==true)
        {
            isDisabled = true;
            finalChunk=1;
            document.getElementById("start-stop-button").style.backgroundColor = '#4CAF50';
            tryCloseRecording=false;
        }

        uploadToKaltura(element[0], element[1], finalChunk,function (progress) {
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
}

// This function is called only when queue is emptry and upload to server is completed
// fileName - a path to the dir where the recording was kept
//TODO - mark final chunk
function endUploadToKaltura() {
    const blob = new Blob([],{});
    uploadChunk(ks,blob,1);
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
            var audioRecorder = RecordRTC(video.stream, options);
            options.type = type;
            var videoRecorder = RecordRTC(video.stream, options);

            // to sync audio/video playbacks in browser!
            /*videoRecorder.initRecorder(function() {
                audioRecorder.initRecorder(function() {
                    audioRecorder.startRecording();
                    videoRecorder.startRecording();
                });
            });*/
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
        var videoObject = { width: { exact : res[0]} , height :{exact : res[1]}, facingMode: facingMode};

        var constraints = {
            video: {
              //  facingMode: 'user',
                deviceId : facingMode
            }
        }

        captureUserMedia(constraints, function(audioVideoStream) {
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

        $(function () {
            if(!video)
            {
                video = document.getElementById('video-element');
                video.style.width = document.width + 'px';
                video.style.height = document.height + 'px';
                video.setAttribute('autoplay', '');
                video.setAttribute('muted', '');
                video.setAttribute('playsinline', '');
            }

            var constraints = {
                audio: false,
                video: {
                    deviceId: facingMode
                }
            }

            navigator.mediaDevices.getUserMedia(constraints).then(function success(stream) {
                video.srcObject = stream;
                successCallback(stream);
                videoFeedBack(stream, true)
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
            });;
        });
/*


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
        });*/
    }

// This function is called to upload file to remote PHP server
// fileName - the file we are going to save on server
// recordRTC - the content of the file

//TODO - call uploadToken::upload
function uploadToKaltura(fileName, recordRTC, finalChunk=0 ,callback) {
    var blob = recordRTC instanceof Blob ? recordRTC : recordRTC.getBlob();

    console.log(blob);

    uploadChunk(ks,blob,finalChunk);

    return callback('success');
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
    //recordingPlayer.innerHTML = 'gsdfgsdfg';

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
    
    mediaBox.appendChild(h2OnVideo)
    mediaBox.appendChild(debugBox)

    mediaBox.appendChild(document.getElementById("start-stop-button"));

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
