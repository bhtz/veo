'use strict';

var download = require('downloadjs');
var _ = require('lodash');
var webrtc, socket, _$scope, _toastr, _$sce;

// RoomCtrl class
function RoomCtrl($sce, $routeParams, $scope, toastr) {
    _$scope = $scope;
    _toastr = toastr;
    _$sce = $sce;

    this.roomId = $routeParams.id;
    this.username = window.veo.username;
    this.isMute = false;
    this.isPlaying = true;
    this.peers = [];
    this.chatMsgs = [];
    this.url = window.location.href;

    this.initializeWebRtc();
}

RoomCtrl.prototype.initializeWebRtc = function () {
    socket = io();

    webrtc = new SimpleWebRTC({
        localVideoEl: 'local',
        remoteVideosEl: '',
        autoRequestMedia: true,
        nick: this.username
    });

    webrtc.on('readyToCall', function () {
        var room = 'veo_' + this.roomId;
        webrtc.joinRoom('veo-' + room);
        socket.emit('create_channel', { room: room, username: this.username });
    }.bind(this));

    webrtc.on('createdPeer', function (peer) {
        console.log('createdPeer', peer);

        peer.on('fileTransfer', function (metadata, receiver) {
            console.log('incoming filetransfer', metadata);
            _toastr.info('incoming filetransfer');
            
            receiver.on('progress', function (bytesReceived) {
                console.log('receive progress', bytesReceived, 'out of', metadata.size);
            });
            
            receiver.on('receivedFile', function (file, metadata) {
                console.log('received file', metadata.name, metadata.size);
                download(file, metadata.name, null);
                receiver.channel.close();
                _toastr.success('File transfert success');
            });
        });

    }.bind(this));

    webrtc.on('videoAdded', function (video, peer) {
        console.log('video added', peer);
        peer.videoDOM = _$sce.trustAsHtml(peer.videoEl.outerHTML);
        this.peers.push(peer);
        _$scope.$apply();
    }.bind(this));

    webrtc.on('videoRemoved', function (video, peer) {
        _.remove(this.peers, function (item) {
            return item.id == peer.id;
        });
        _$scope.$apply();
    }.bind(this));

    webrtc.on('mute', function (data) {
        console.log('on mute', data);
    });

    socket.on('chat_msg', function (msg) {
        this.chatMsgs.unshift(msg);
        _$scope.$apply();
    }.bind(this));
};

RoomCtrl.prototype.transfertFile = function(element){
    var peerId = $(element).data('peer');
    var peer = _.find(this.peers, {id: peerId});
    var file = element.files[0];
    
    var sender = peer.sendFile(file);
    _toastr.info('sending file');
    sender.on('complete', function(){
        _toastr.success('File transfert success');
    });
};

RoomCtrl.prototype.toggleMute = function () {
    if (this.isMute) {
        webrtc.unmute();
    } else {
        webrtc.mute();
    }
    this.isMute = !this.isMute;
};

RoomCtrl.prototype.toggleVideo = function () {
    if (this.isPlaying) {
        webrtc.pauseVideo();
    } else {
        webrtc.resumeVideo();
    }
    this.isPlaying = !this.isPlaying;
};

RoomCtrl.prototype.onCopySuccess = function () {
    _toastr.success(this.url, 'Copied to clipboard');
};

RoomCtrl.prototype.sendMsg = function () {
    if (this.newChatMsg != '') {
        socket.emit('chat_msg', this.newChatMsg);
    }
    this.newChatMsg = '';
};

RoomCtrl.prototype.log = function (peer) {
    console.log(peer);
    _toastr.info('not implemented yet');
}

module.exports = RoomCtrl;