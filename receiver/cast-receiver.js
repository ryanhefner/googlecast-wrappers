/*global define: false */

/**
 * Copyright 2015 Ryan Hefner
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * A simplified Google Cast Receiver application interface.
 *
 * @version 0.0.1
 * @url ryanhefner.com/projects/googlecast-wrappers
 */

/**
 * CastReceiver
 *
 * @file A simplied interface for declaring a custom Google Cast Receiver
 *       application and handling media and custom messages from
 *       Sender applications.
 *
 * @author Ryan Hefner <hi@ryanhefner.com>
 */

;(function(window) {

    'use strict';

    function CastReceiver(options) {
        var self = this;

        self.options = Object.assign(self.options, options);

        this._init();
    }

    CastReceiver.prototype.options = {
        appId: null,
        statusText: 'Ready to play',
        maxInactivity: 6000,
        loggerLevel: cast.receiver.LoggerLevel.DEBUG,
        customNamespace: null,
        mediaElement: null,
        onMessage: null,
        onMediaMessage: null
    };

    // Constants _____________________________________________________________

    /**
     * Events dispatched from the CastReceiver.
     *
     * @param {string}
     */
    CastReceiver.Events = {
        VISIBILITY_CHANGED: ''
    };

    /**
     * States the CastReceiver can be in.
     *
     * @param {string}
     */
    CastReceiver.States = {
        LAUNCHING: 'launching',
        LOADING: 'loading',
        BUFFERING: 'buffering',
        PLAYING: 'playing',
        PAUSED: 'paused',
        STALLED: 'stalled',
        DONE: 'done',
        IDLE: 'idle'
    };

    CastReceiver.StreamTypes = {
        HLS: 'hls',
        DASH: 'dash',
        SMOOTH_STREAMING: 'smooth_streaming'
    };

    CastReceiver.MediaExtensions = {
        'm3u8': CastReceiver.StreamTypes.HLS,
        'mpd': CastReceiver.StreamTypes.DASH,
        'ism': CastReceiver.StreamTypes.SMOOTH_STREAMING
    };

    CastReceiver.MediaTypes = {
        'application/x-mpegurl': CastReceiver.StreamTypes.HLS,
        'application/vnd.apple.mpegurl': CastReceiver.StreamTypes.HLS,
        'application/dash+xml': CastReceiver.StreamTypes.DASH,
        'application/vnd.ms-sstr+xml': CastReceiver.StreamTypes.SMOOTH_STREAMING
    };

    // Public Methods ________________________________________________________

    CastReceiver.prototype.sendMessage = function(message) {

    };

    CastReceiver.prototype.broadcastMessage = function(message) {

    };

    // Private Methods _______________________________________________________

    CastReceiver.prototype._init = function() {
        var self = this;

        cast.receiver.logger.setLevelValue(self.options.loggerLevel);

        self.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

        if (self.options.customNamespace) {
            self.messageBus = self.castReceiverManager.getCastMessageBus(self.options.customNamespace);
        }

        // self.mediaMessageBus = self.castReceiverManager.getCastMessageBus('urn:x-cast:com.google.cast.media');

        if (self.options.mediaElement) {
            self.mediaManager = new cast.receiver.MediaManager(self.options.mediaElement);
            self.mediaPlayer = self.options.mediaElement;
        }

        self._addEvents();

        /**
         * @todo Figure out if we should set this.
         */
        // self.castReceiverManager.setApplicationState();

        var apiConfig = new cast.receiver.CastReceiverManager.Config();
        apiConfig.statusText = self.options.statusText;
        apiConfig.maxInactivity = self.options.maxInactivity;

        self.castReceiverManager.start(apiConfig);
        console.log("Init done");
    };

    CastReceiver.prototype._addEvents = function() {
        var self = this;

        self.castReceiverManager.onReady = self._readyHandler.bind(self);
        self.castReceiverManager.onSenderConnected = self._senderConnectedHandler.bind(self);
        self.castReceiverManager.onSenderDisconnected = self._senderDisconnectedHandler.bind(self);
        self.castReceiverManager.onShutDown = self._shutDownHandler.bind(self);
        self.castReceiverManager.onStandbyChanged = self._standbyChangedHandler.bind(self);
        self.castReceiverManager.onSystemVolumeChanged = self._systemVolumeChangedHandler.bind(self);
        self.castReceiverManager.onVisibilityChanged = self._visibilityChangedHandler.bind(self);

        if (self.messageBus) {
            self.messageBus.onMessage = self._messageHandler.bind(self);
        }

        if (self.mediaMessageBus) {
            self.mediaMessageBus.onMessage = self._mediaMessageHandler.bind(self);
        }

        if (self.mediaManager) {
            self.mediaManager.customizedStatusCallback = self._mediaCustomizedStatusHandler.bind(self);

            self.mediaManager.onLoadOrig = self.mediaManager.onLoad;
            self.mediaManager.onLoad = self._mediaLoadHandler.bind(self);

            self.mediaManager.onEditTracksInfoOrig = self.mediaManager.onEditTracksInfo;
            self.mediaManager.onEditTracksInfo = self._mediaEditTracksInfoHandler.bind(self);

            self.mediaManager.onEndedOrig = self.mediaManager.onEnded;
            self.mediaManager.onEnded = self._mediaEndedHandler.bind(self);

            self.mediaManager.onErrorOrig = self.mediaManager.onError;
            self.mediaManager.onError = self._mediaErrorHandler.bind(self);

            self.mediaManager.onGetStatusOrig = self.mediaManager.onGetStatus;
            self.mediaManager.onGetStatus = self._mediaGetStatusHandler.bind(self);

            self.mediaManager.onMetadataLoadedOrig = self.mediaManager.onMetadataLoaded;
            self.mediaManager.onMetadataLoaded = self._mediaMetadataLoadedHandler.bind(self);

            self.mediaManager.onLoadMetadataErrorOrig = self.mediaManager.onLoadMetadataError;
            self.mediaManager.onLoadMetadataError = self._mediaLoadMetadataErrorHandler.bind(self);

            self.mediaManager.onPauseOrig = self.mediaManager.onPause;
            self.mediaManager.onPause = self._mediaPauseHandler.bind(self);

            self.mediaManager.onPlayOrig = self.mediaManager.onPlay;
            self.mediaManager.onPlay = self._mediaPlayHandler.bind(self);

            self.mediaManager.onSeekOrig = self.mediaManager.onSeek;
            self.mediaManager.onSeek = self._mediaSeekHandler.bind(self);

            self.mediaManager.onSetVolumeOrig = self.mediaManager.onSetVolume;
            self.mediaManager.onSetVolume = self._mediaSetVolumeHandler.bind(self);

            self.mediaManager.onStopOrig = self.mediaManager.onStop;
            self.mediaManager.onStop = self._mediaStopHandler.bind(self);
        }
    };

    CastReceiver.prototype._removeEvents = function() {

    };

    CastReceiver.prototype._load = function(data) {

    };

    CastReceiver.prototype._loadMedia = function(data) {

    };

    CastReceiver.prototype._loadVideo = function(data) {

    };

    CastReceiver.prototype._getStreamTypeFromUrl = function(url) {
        var parts = url.split('.'),
            streamType = CastReceiver.MediaExtensions[parts.pop().toLowerCase()];

        if (!streamType) {
            if (url.indexOf('.ism') > -1) {
                streamType = CastReceiver.StreamTypes.SMOOTH_STREAMING;
            }
        }

        return streamType;
    };

    CastReceiver.prototype._getStreamTypeFromType = function(type) {
        var streamType = CastReceiver.MediaTypes[type];

        return streamType;
    };

    // Event Handlers ________________________________________________________

    CastReceiver.prototype._readyHandler = function(ev) {

        console.log('CastReceiverManager::READY', ev);

        if (this.options.onReady) {
            this.options.onReady.call(this, ev);
        }
    };

    CastReceiver.prototype._senderConnectedHandler = function(ev) {

        console.log('CastReceiverManager::SENDER_CONNECTED', ev);

        if (this.options.onMessage) {
            this.options.onMessage.call(this, ev);
        }
    };

    CastReceiver.prototype._senderDisconnectedHandler = function(ev) {

        console.log('CastReceiverManager::SENDER_DISCONNECTED', ev);

        var self = this,
            senders = self.castReceiverManager.getSenders();

        if (senders.length === 0 && ev.reason === cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
          window.close();
        }

        if (self.options.onMessage) {
            self.options.onMessage.call(self, ev);
        }
    };

    CastReceiver.prototype._shutDownHandler = function(ev) {

        console.log('CastReceiverManager::SHUT_DOWN', ev);

        if (this.options.onMessage) {
            this.options.onMessage.call(this, ev);
        }
    };

    CastReceiver.prototype._standbyChangedHandler = function(ev) {

        console.log('CastReceiverManager::STANDBY_CHANGED', ev);

        if (this.options.onMessage) {
            this.options.onMessage.call(this, ev);
        }
    };

    CastReceiver.prototype._systemVolumeChangedHandler = function(ev) {

        console.log('CastReceiverManager::SYSTEM_VOLUME_CHANGED', ev);

        if (this.options.onMessage) {
            this.options.onMessage.call(this, ev);
        }
    };

    CastReceiver.prototype._visibilityChangedHandler = function(ev) {

        console.log('CastReceiverManager::VISIBILITY_CHANGED', ev);

        if (this.options.onMessage) {
            this.options.onMessage.call(this, ev);
        }
    };

    CastReceiver.prototype._messageHandler = function(ev) {

        console.log('MessageBus::MESSSAGE', ev);

        var self = this;

        self.messageBus.send(ev.senderId, ev.data);

        if (self.options.onMessage) {
            self.options.onMessage.call(self, ev);
        }
    };

    CastReceiver.prototype._mediaMessageHandler = function(ev) {

        console.log('MediaMessageBus::MESSAGE', ev);

        if (this.options.onMediaMessage) {
            this.options.onMediaMessage.call(this, ev);
        }

    };

    CastReceiver.prototype._mediaLoadHandler = function(ev) {

        console.log('MediaManager::LOAD', ev, this.mediaPlayer);

        var self = this;

        /**
         * @todo See if this handler is ever called without a media object.
         */
        // if (!ev.data.media || !ev.data.media.contentId) {
        //  throw new Error('No media object provided to load.');
        // }

        if (self.mediaPlayer) {
            self.mediaPlayer.unload();
        }

        if (ev.data.media && ev.data.media.contentId) {
            var media = ev.data.media,
                url = media.customData || media.contentId,
                streamType = self._getStreamTypeFromUrl(url) || self._getStreamTypeFromType(media.type);
            var autoplay = ev.data.autoplay ? ev.data.autoplay : false;
            
            // Change the contentId to customData
            ev.data.media.contentId = url;

            console.log('MediaManager::LOAD', media, url, streamType);

            /*self.mediaHost = new cast.player.api.Host({
                'mediaElement': self.options.mediaElement,
                'url': url
            });

            self.mediaHost.onErrorOrig = self.mediaHost.onError;
            self.mediaHost.onError = self._mediaHostErrorHandler.bind(self);

            switch (streamType) {
                case CastReceiver.StreamTypes.HLS:
                    self.streamProtocol = cast.player.api.CreateHlsStreamingProtocol(self.mediaHost);
                    break;

                case CastReceiver.StreamTypes.DASH:
                    self.streamProtocol = cast.player.api.CreateDashStreamingProtocol(self.mediaHost);
                    break;

                case CastReceiver.StreamTypes.SMOOTH_STREAMING:
                    self.streamProtocol = cast.player.api.CreateSmoothStreamProtocol(self.mediaHost);
                    break;
            }

            self.mediaPlayer = new cast.player.api.Player(self.mediaHost);

            if (self.streamProtocol) {
                self.mediaPlayer.load(self.streamProtocol);
            }*/

            /**
             * @todo Setup everything that is required to handle the loadTracksInfo for the MediaManager.
             */

            self.mediaPlayer.load(media.contentId, true);

            console.log('MediaElement::PROTOTYPE', Object.getPrototypeOf(self.options.mediaElement));
        }

        /**
         * @todo Figure out how this differs from the original event passed.
         */
        //self.mediaManager.onLoadOrig(ev);
        // self.mediaManager.onLoadOrig(new cast.receiver.MediaManager.Event(
        //  cast.receiver.MediaManager.EventType.LOAD,
        //  ev.data,
        //  ev.senderId
        // ));

        // Do this to force to complete load to be accepted by the Sender.
        /**
         * @todo Make sure this is actually needed here, or elsewhere.
         *       Totally not sure what the hell this really does.
         */
        self.mediaManager.sendLoadComplete();

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaCustomizedStatusHandler = function(ev) {

        console.log('MediaManager::CUSTOMIZED_STATUS_CALLBACK', ev);

        return ev;
    };

    CastReceiver.prototype._mediaEditTracksInfoHandler = function(ev) {

        console.log('MediaManager::EDIT_TRACKS_INFO', ev);

    };

    CastReceiver.prototype._mediaEndedHandler = function(ev) {

        console.log('MediaManager::ENDED', ev);

        var self = this;

        self.mediaManager.onEndedOrig(ev);

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaErrorHandler = function(ev) {

        console.log('MediaManager::ERROR', ev);

        var self = this;

        self.mediaManager.onErrorOrig(ev);

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaGetStatusHandler = function(ev) {

        console.log('MediaManager::GET_STATUS', ev);

        var self = this;

        self.mediaManager.onGetStatusOrig(ev);

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaMetadataLoadedHandler = function(ev) {

        console.log('MediaManager::METADATA_LOADED', ev);

        var self = this;

        self.mediaManager.onMetadataLoadedOrig(ev);

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaLoadMetadataErrorHandler = function(ev) {

        console.log('MediaManager::LOAD_METADATA_ERROR', ev);

        var self = this;

        self.mediaManager.onLoadMetadataErrorOrig(ev);

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaPauseHandler = function(ev) {

        console.log('MediaManager::PAUSE', ev);

        var self = this;

        self.mediaManager.onPauseOrig(ev);

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaPlayHandler = function(ev) {

        console.log('MediaManager::PLAY', ev);

        var self = this;

        self.mediaManager.onPlayOrig(ev);

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaSeekHandler = function(ev) {

        console.log('MediaManager::SEEK', ev);

        var self = this;

        self.mediaManager.onSeekOrig(ev);

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaSetVolumeHandler = function(ev) {

        console.log('MediaManager::SET_VOLUME', ev);

        var self = this;

        self.mediaManager.onSetVolumeOrig(ev);

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaStopHandler = function(ev) {

        console.log('MediaManager::STOP', ev);

        var self = this;

        self.mediaManager.onStopOrig(ev);

        if (self.options.onMediaMessage) {
            self.options.onMediaMessage(ev);
        }
    };

    CastReceiver.prototype._mediaHostErrorHandler = function(ev) {

        console.log('MediaHost::ERROR', ev);

        var self = this;

        if (self.mediaPlayer) {
            self.mediaPlayer.unload();
        }

        self.mediaHost.onErrorOrig(ev);
    };

    // Global ________________________________________________________________

    window.CastReceiver = CastReceiver;

    // Expose CastReceiver as an AMD module
    if (typeof define === 'function' && define.amd) {
        define(CastReceiver);
    }

})(window);
