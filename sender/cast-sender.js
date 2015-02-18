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
 * Mousetrap is a simple keyboard shortcut library for Javascript with
 * no external dependencies
 *
 * @version 0.0.1
 * @url ryanhefner.com/projects/googlecast-wrappers
 */

/**
 * CastSender
 *
 * @file A simplified interface for setting up a Google Cast Sender
 *       application (Chrome) and communicating with a media or
 *       custom Receiver application.
 *
 * @author Ryan Hefner <hi@ryanhefner.com>
 */

;(function(window) {

    'use strict';

    function CastSender(options) {
        var self = this;

        self.options = Object.assign(self.options, options || {});

        self._init();
    }

    // Constants _____________________________________________________________

    CastSender.prototype.options = {
        appId: null,
        autoJoinPolicy: null,
        storeSessionId: false,
        mediaTimerDelay: 250,
        onCastApiInitialized: null,
        onCastSessionStopped: null,
        onReceiverAvailable: null,
        onReceiverUnavailable: null,
        onSessionConnected: null,
        onMediaUpdate: null
    };

    /**
     * @todo: Build these out as deemed necessary from the final implementation.
     */
    CastSender.Events = {
        STATE_CHANGE: 'state_change'
    };

    // CastSender.States = {
    //  BUFFERING: chrome.cast.media.PlayerState.BUFFERING,
    //  IDLE: chrome.cast.media.PlayerState.IDLE,
    //  PAUSED: chrome.cast.media.PlayerState.PAUSED,
    //  PLAYING: chrome.cast.media.PlayerState.PLAYING
    // };

    // Public Methods ________________________________________________________

    CastSender.prototype.setAppId = function(appId) {
        var self = this;

        self.options.appId = appId;

        if (!self.sessionRequest) {
            self._initializeCastApi();
        }
    };

    CastSender.prototype.getAppId = function() {
        return this.options.appId;
    };

    CastSender.prototype.getPlayerState = function() {
        var self = this;

        if (!self.session) {
            throw new Error('Session not available.');
        }

        if (!self.currentMedia) {
            throw new Error('Media not available.');
        }

        return self.currentMedia.playerState;
    };

    CastSender.prototype.requestSession = function(success, error) {
        var self = this;

        self.callbacks.requestSession = {
            success: success,
            error: error
        };

        chrome.cast.requestSession(
            self._requestSessionSuccessHandler.bind(self),
            self._requestSessionErrorHandler.bind(self)
        );
    };

    CastSender.prototype.joinSessionBySessionId = function(sessionId) {
        chrome.cast.requestSessionById(sessionId);
    };

    CastSender.prototype.sendMessage = function(message, success, error) {
        var self = this;

        if (!self.session) {
            throw new Error('No session available.');
        }

        self.callbacks.sendMessage = {
            success: success,
            error: error
        };

        self.session.sendMessage(
            self.options.customNamespace,
            message,
            self._messageSendSuccessHandler.bind(self),
            self._messageSendErrorHandler.bind(self)
        );
    };

    /**
     * Loads the specified media object and accepts success and error callbacks.
     *
     * @example media Object { url: '', type: 'video/mp4', images: [], currentTime: 0 }
     *
     * @param {Object} media
     * @param {Function} success
     * @param {Function} error
     */
    CastSender.prototype.loadMedia = function(media, success, error) {
        var self = this;

        if (!self.session) {
            throw new Error('No session available.');
        }

        self.callbacks.loadMedia = {
            success: success,
            error: error
        };

        var mediaInfo = new chrome.cast.media.MediaInfo(media.contentId || self.currentMedia.contentId);
        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
        mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;

        mediaInfo.contentType = 'video/mp4';

        if (media.title) {
            mediaInfo.metadata.title = media.title;
        }

        if (media.images) {
            mediaInfo.metadata.images = media.images;
        }

        if (media.customData) {
            mediaInfo.customData = media.customData;
        }

        var loadRequest = new chrome.cast.media.LoadRequest(mediaInfo);
        loadRequest.autoplay = media.autoplay !== null ? media.autoplay : true;
        loadRequest.currentTime = media.currentTime || 0;

        if (media.customData) {
            loadRequest.customData = media.customData;
        }

        self.session.loadMedia(
            loadRequest,
            self._loadMediaSuccessHandler.bind(self, 'loadMedia'),
            self._loadMediaErrorHandler.bind(self)
        );
    };

    CastSender.prototype.play = function(success, error) {
        var self = this;

        if (!self.session) {
            throw new Error('No session available.');
        }

        if (self.session.media) {
            console.log('SessionMedia', self.session.media);
        }

        if (!self.currentMedia) {
            throw new Error('No media available.');
        }

        self.callbacks.play = {
            success: success,
            error: error
        };

        self.currentMedia.play(
            null,
            self._mediaPlaySuccessHandler.bind(self),
            self._mediaPlayErrorHandler.bind(self)
        );
    };

    CastSender.prototype.pause = function(success, error) {
        var self = this;

        if (!self.currentMedia) {
            throw new Error('No media available.');
        }

        self.callbacks.pause = {
            success: success,
            error: error
        };

        self.currentMedia.pause(
            null,
            self._mediaPauseSuccessHandler.bind(self),
            self._mediaPauseErrorHandler.bind(self)
        );
    };

    CastSender.prototype.resume = function(success, error) {
        var self = this;

        if (!self.currentMedia) {
            throw new Error('No media available.');
        }

        self.callbacks.resume = {
            success: success,
            error: error
        };

        self.currentMedia.resume(
            null,
            self._mediaResumeSuccessHandler.bind(self),
            self._mediaResumeErrorHandler.bind(self)
        );
    };

    /**
     * Seek to the specified media position.
     *
     * @param {Number} position - Time to seek to
     * @param {Function} success
     * @param {Function} error
     */
    CastSender.prototype.seek = function(time, success, error) {
        var self = this;

        if (!self.currentMedia) {
            throw new Error('No media available.');
        }

        self.callbacks.seek = {
            success: success,
            error: error
        };

        var request = new chrome.cast.media.SeekRequest();
        request.curentTime = time;

        self.currentMedia.seek(
            request,
            self._mediaSeekSuccessHandler.bind(self),
            self._mediaSeekErrorHandler.bind(self)
        );
    };

    CastSender.prototype.stop = function(success, error) {
        var self = this;

        if (!self.currentMedia) {
            throw new Error('No media available.');
        }

        self.callbacks.stop = {
            success: success,
            error: error
        };

        self.currentMedia.stop(
            null,
            self._mediaStopSuccessHandler.bind(self),
            self._mediaStopErrorHandler.bind(self)
        );
    };

    /**
     * Set the volume level of the media.
     *
     * @param {Number} level - A number for volume level
     * @param {boolean} mute - A true/false to mute/unmute
     */
    CastSender.prototype.setMediaVolume = function(level, mute) {
        var self = this;

        if (!self.currentMedia) {
            throw new Error('No media available.');
        }

        var volume = new chrome.cast.Volume(),
            request = new chrome.cast.media.VolumeRequest();

        volume.level = level;
        volume.muted = mute;

        request.volume = volume;

        self.currentMedia.setVolume(
            request,
            self._mediaSetVolumeSuccessHandler.bind(self),
            self._mediaSetVolumeErrorHandler.bind(self)
        );
    };

    /**
     * Set the volume of the media receiver.
     *
     * @param {Number} level - Volume level
     * @param {boolean} mute - Mute or unmute
     */
    CastSender.prototype.setReceiverVolume = function(level, mute) {
        var self = this;

        if (!self.session) {
            throw new Error('No media available.');
        }

        if (!mute) {
            self.session.setReceiverVolumeLevel(
                level,
                self._setReceiverVolumeLevelSuccessHandler.bind(self),
                self._setReceiverVolumeLevelErrorHandler.bind(self)
            );
        }
        else {
            self.session.setReceiverMuted(
                mute,
                self._setReceiverMutedSuccessHandler.bind(self),
                self._setReceiverMutedErrorHandler.bind(self)
            );
        }
    };

    CastSender.prototype.stopApp = function(success, error) {
        var self = this;

        self.callbacks.stopApp = {
            success: success,
            error: error
        };

        self.session.stop(
            self._sessionStopSuccessHandler.bind(self),
            self._sessionStopErrorHandler.bind(self)
        );
    };

    // Private Methods _______________________________________________________

    CastSender.prototype._init = function() {
        var self = this;

        self.callbacks = {};
        self.timer = null;

        if (!chrome.cast || !chrome.cast.isAvailable) {
            setTimeout(function() {
                self._initializeCastApi();
            }, 1000);
            return;
        }

        self._initializeCastApi();
    };

    CastSender.prototype._initializeCastApi = function() {
        var self = this,
            apiConfig;

        if (self.options.onCastApiInitialized) {
            self.options.onCastApiInitialized.call(self);
        }

        if (!self.options.appId) {
            return;
        }

        if (!self.options.autoJoinPolicy) {
            self.options.autoJoinPolicy = chrome.cast.AutoJoinPolicy.TAB_ORIGIN_SCOPED;
        }

        self.sessionRequest = new chrome.cast.SessionRequest(
            self.options.appId
        );

        apiConfig = new chrome.cast.ApiConfig(
            self.sessionRequest,
            self._sessionListenerHandler.bind(self),
            self._receiverListenerHandler.bind(self)
        );

        chrome.cast.initialize(
            apiConfig,
            self._initializeSuccessHandler.bind(self),
            self._initializeErrorHandler.bind(self),
            self.options.autoJoinPolicy
        );
    };

    /**
     * Centralizes the setting of the session, since it seems like
     * this can happen on either the _sessionListenerHandler or
     * the _requestSessionSuccessHandler.
     *
     * @param {Object} session
     */
    CastSender.prototype._setSession = function(session) {
        var self = this;

        self.session = session;

        self.session.addUpdateListener(
            self._sessionUpdateHandler.bind(self)
        );

        if (self.session.media.length !== 0) {
            self._loadMediaSuccessHandler('_requestSessionSuccessHandler', self.session.media[0]);
        }
        else {
            /**
             * @todo Think about this more. Might make sense to just always listen for this.
             */
            self.session.addMediaListener(
                self._loadMediaSuccessHandler.bind(self, 'addMediaListener')
            );
        }

        if (self.options.customNamespace) {
            self.session.addMessageListener(
                self.options.customNamespace,
                self._messageHandler.bind(self)
            );
        }

        if (self.callbacks.requestSession && self.callbacks.requestSession.success) {
            self.callbacks.requestSession.success.call(this, session);
        }

        if (self.options.onSessionConnected) {
            self.options.onSessionConnected.call(this, session);
        }
    };

    // Event Handlers ________________________________________________________

    /**
     * Called when the session has been initialized.
     *
     * @param {Object} session
     */
    CastSender.prototype._sessionListenerHandler = function(session) {
        var self = this;

        console.log('Session listener', session);

        self._setSession(session);
    };

    CastSender.prototype._receiverListenerHandler = function(ev) {
        var self = this;

        if (ev === chrome.cast.ReceiverAvailability.AVAILABLE) {

            console.log('Receiver found', ev);

            if (self.options.onReceiverAvailable) {
                self.options.onReceiverAvailable.call(self, ev);
            }
        }
        else {
            console.log('Receiver list empty', ev);

            if (self.options.onReceiverUnavailable) {
                self.options.onReceiverUnavailable.call(self, ev);
            }
        }
    };

    /**
     * Initialization success callback.
     */
    CastSender.prototype._initializeSuccessHandler = function(ev) {
        var self = this;

        console.log('Initialization success', ev);

    };

    /**
     * Initialization error callback.
     *
     * @param {chrome.cast.Error} error
     */
    CastSender.prototype._initializeErrorHandler = function(error) {

        console.log('Initialization error', error);

    };

    /**
     * requestSession success callback
     *
     * @param {Object} session
     */
    CastSender.prototype._requestSessionSuccessHandler = function(session) {
        var self = this;

        console.log('Request session success', session);

        self._setSession(session);
    };

    CastSender.prototype._requestSessionErrorHandler = function(ev) {
        var self = this;

        console.log('Error requesting session', ev);

        if (self.callbacks.requestSession.error) {
            self.callbacks.requestSession.error.call(self, ev);
        }
    };

    CastSender.prototype._messageSendSuccessHandler = function(ev) {

        console.log('Success sending message', ev);

        var self = this;

        if (self.callbacks.sendMessage.success) {
            self.callbacks.sendMessage.success(ev);
        }
    };

    CastSender.prototype._messageSendErrorHandler = function(ev) {

        console.log('Error sending message', ev);

        var self = this;

        if (self.callbacks.sendMessage.error) {
            self.callbacks.sendMessage.error(ev);
        }
    };

    /**
     * Called on successful request to loadMedia.
     *
     * @param {String} how
     * @param {chrome.cast.media.Media} media
     */
    CastSender.prototype._loadMediaSuccessHandler = function(how, media) {
        var self = this;

        console.log('Success loading media', how, media);

        self.currentMedia = media;
        self.currentMedia.addUpdateListener(self._mediaStatusUpdateHandler.bind(self));

        if (self.mediaTimer) {
            clearInterval(self.mediaTimer);
        }

        self.mediaTimer = setInterval(self._mediaTimerUpdateHandler.bind(self), self.options.mediaTimerDelay);
    };

    /**
     * Called when error encountered during loadMedia request.
     *
     * @param {Object} ev A non-null media object
     */
    CastSender.prototype._loadMediaErrorHandler = function(ev) {

        console.log('Error loading media', ev);

    };

    /**
     * Callback from media status event.
     *
     * @param {boolean} isAlive
     */
    CastSender.prototype._mediaStatusUpdateHandler = function(isAlive) {
        var self = this;

        console.log('Media::StatusUpdateHandler', isAlive);

        if (!isAlive) {

        }
        else {
            console.log('Media status update', self.currentMedia);
        }
    };

    CastSender.prototype._sessionStopSuccessHandler = function(ev) {

        console.log('Session stop success handler');

    };

    CastSender.prototype._sessionStopErrorHandler = function(ev) {

        console.log('Session stop error handler');

    };

    /**
     * Session update listener.
     *
     * @param {boolean} isAlive
     */
    CastSender.prototype._sessionUpdateHandler = function(isAlive) {

        console.log('Session update', isAlive);

        if (!isAlive) {
            var self = this;

            self.session = null;

            // if (self.timer) {
            //  clearInterval(self.timer);
            // }
            // else {
            //  self.timer = setInterval(self._timerUpdateHandler.bind(self), );
            // }

            // if (navigator.onLine) {

            // }

            /**
             * @todo: Add a callback here so that the app can be informed
             *        that the receiver session is no longer active.
             */
            if (self.options.onCastSessionStopped) {
                self.options.onCastSessionStopped.call(this);
            }
        }
    };

    CastSender.prototype._messageHandler = function(namespace, message) {

        console.log('MessageHandler', namespace, message);

    };

    // CastSender.prototype._timerUpdateHandler = function(ev) {

    // };

    CastSender.prototype._mediaPlaySuccessHandler = function(ev) {

        console.log('Play success handler');

    };

    CastSender.prototype._mediaPlayErrorHandler = function(ev) {

        console.log('Play error handler');

    };

    CastSender.prototype._mediaPauseSuccessHandler = function(ev) {

        console.log('Pause success handler');

    };

    CastSender.prototype._mediaPauseErrorHandler = function(ev) {

        console.log('Pause error handler');

    };

    CastSender.prototype._mediaResumeSuccessHandler = function(ev) {

        console.log('Resume success handler');

    };

    CastSender.prototype._mediaResumeErrorHandler = function(ev) {

        console.log('Resume error handler');

    };

    CastSender.prototype._mediaSeekSuccessHandler = function(ev) {

        console.log('Seek success handler');

    };

    CastSender.prototype._mediaSeekErrorHandler = function(ev) {

        console.log('Seek error handler');

    };

    CastSender.prototype._mediaStopSuccessHandler = function(ev) {

        console.log('Stop success handler');

    };

    CastSender.prototype._mediaStopErrorHandler = function(ev) {

        console.log('Stop error handler');

    };

    CastSender.prototype._mediaSetVolumeSuccessHandler = function(ev) {

        console.log('Set volume success handler');

    };

    CastSender.prototype._mediaSetVolumeErrorHandler = function(ev) {

        console.log('Set volume error handler');

    };

    CastSender.prototype._setReceiverVolumeLevelSuccessHandler = function(ev) {

        console.log('Set receiver volume success handler');

    };

    CastSender.prototype._setReceiverVolumeLevelErrorHandler = function(ev) {

        console.log('Set receiver volume error handler');

    };

    CastSender.prototype._setReceiverMutedSuccessHandler = function(ev) {

        console.log('Set receiver muted success handler');

    };

    CastSender.prototype._setReceiverMutedErrorHandler = function(ev) {

        console.log('Set receiver muted error handler');

    };

    CastSender.prototype._mediaTimerUpdateHandler = function(ev) {
        var self = this,
            data = {
                playerState: self.currentMedia.playerState,
                time: self.currentMedia.getEstimatedTime(),
                duration: self.currentMedia.media.duration
            };

        // console.log('MediaTimer::UPDATE', data);

        if (self.options.onMediaUpdate) {
            self.options.onMediaUpdate(data);
        }
    };

    // Global ________________________________________________________________

    window.CastSender = CastSender;

    // Expose CastSender as an AMD module
    if (typeof define === 'function' && define.amd) {
        define(CastSender);
    }

})(window);
