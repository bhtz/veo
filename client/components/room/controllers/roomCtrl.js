'use strict';

var download = require('downloadjs');
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
            receiver.on('progress', function (bytesReceived) {
                console.log('receive progress', bytesReceived, 'out of', metadata.size);
            });
            receiver.on('receivedFile', function (file, metadata) {
                console.log('received file', metadata.name, metadata.size);
                download(file, metadata.name, null);
                receiver.channel.close();
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

    var self = this;
    $('#fileselector').change(function () {
        var file = this.files[0];
        self.peers[0].sendFile(file);
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