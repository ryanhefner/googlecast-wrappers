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
 * A custom Player interface that interacts with the Vimeo API.
 *
 * @version 0.0.1
 * @url ryanhefner.com/projects/googlecast-wrappers
 */

/**
 * VimeoPlayerInterface
 *
 * @file An interface to wrap a Froogaloop instance in order
 *       for it to be used in a Chromecast Receiver.
 *
 * @author Ryan Hefner <hi@ryanhefner.com>
 */

;(function(window) {

    'use strict';

    function VimeoPlayerInterface(element, options) {
        if (element === null) {
            throw new Error('element must be specified for VimeoPlayerInterface');
        }

        var self = this;

        self.element = element;

        self.options = Object.assign(self.options, options);

        self.currentState = VimeoPlayerInterface.States.IDLE;

        self._setupElements();
        self._addEvents();
    }

    // Constants _____________________________________________________________

    VimeoPlayerInterface.States = {
        BUFFERING: 'BUFFERING',
        IDLE: 'IDLE',
        PAUSED: 'PAUSED',
        PLAYING: 'PLAYING'
    };

    // Properties ____________________________________________________________

    VimeoPlayerInterface.prototype.options = {
        onReady: null
    };

    // Public Methods ________________________________________________________

    VimeoPlayerInterface.prototype.editTracksInfo = function(data) {

        console.log('VimeoPlayerInterface::EDIT_TRACKS_INFO', data);

    };

    VimeoPlayerInterface.prototype.getCurrentTimeSec = function() {

        console.log('VimeoPlayerInterface::GET_CURRENT_TIME_SEC');

        return this.player.api('getCurrentTime');
    };

    VimeoPlayerInterface.prototype.getDurationSec = function() {

        console.log('VimeoPlayerInterface::GET_DURATION_SEC');

        return this.player.api('getDuration');
    };

    VimeoPlayerInterface.prototype.getState = function() {

        console.log('VimeoPlayerInterface::GET_STATE', this.currentState);

        return this.currentState;
    };

    VimeoPlayerInterface.prototype.getVolume = function() {

        console.log('VimeoPlayerInterface::GET_VOLUME');

        return this.player.api('getVolume');
    };

    VimeoPlayerInterface.prototype.setVolume = function(volume) {

        console.log('VimeoPlayerInterface::SET_VOLUME', volume);

        this.player.api('setVolume', volume);
    };

    /**
     * Loads the content to be played.
     *
     * @param {String|Number} contentId
     * @param {boolean} autoplay
     * @param {Number} opt_time
     * @param {} opt_tracksInfo
     * @param {boolean} opt_onlyLoadTracks
     */
    VimeoPlayerInterface.prototype.load = function(contentId, autoplay, opt_time, opt_tracksInfo, opt_onlyLoadTracks) {

        var self = this,
            videoId = parseInt(contentId.replace('/videos/', ''), 10);

        self.player.api('loadVideo', videoId);

        console.log('VimeoPlayerInterface::load', contentId, autoplay, opt_time, opt_tracksInfo, opt_onlyLoadTracks);

        if (autoplay) {
            setTimeout(function() {
                self.play();
            }, 1000);
        }

        if (self.loadCallback) {
            self.loadCallback(self);
        }
    };

    /**
     * @todo Check to see if this is in the Chromecast documentation.
     */
    VimeoPlayerInterface.prototype.unload = function() {

    };

    VimeoPlayerInterface.prototype.pause = function() {

        console.log('VimeoPlayerInterface::PAUSE');

        this.player.api('pause');
    };

    VimeoPlayerInterface.prototype.play = function() {

        console.log('VimeoPlayerInterface::PLAY');

        this.player.api('play');
    };

    VimeoPlayerInterface.prototype.reset = function() {

        console.log('VimeoPlayerInterface::RESET');

        this.player.api('unload');
    };

    VimeoPlayerInterface.prototype.seek = function(time, opt_resumeState) {

        console.log('VimeoPlayerInterface::SEEK');

        this.player.api('seekTo', time);
    };

    VimeoPlayerInterface.prototype.registerErrorCallback = function(callback) {

        console.log('VimeoPlayerInterface::REGISTER_ERROR_CALLBACK');

        this.errorCallback = callback;
    };

    VimeoPlayerInterface.prototype.unregisterErrorCallback = function() {

        console.log('VimeoPlayerInterface::UNREGISTER_ERROR_CALLBACK');

        if (this.errorCallback) {
            this.errorCallback = null;
        }
    };

    VimeoPlayerInterface.prototype.registerEndedCallback = function(callback) {

        console.log('VimeoPlayerInterface::REGISTER_ENDED_CALLBACK');

        this.endedCallback = callback;
    };

    VimeoPlayerInterface.prototype.unregisterEndedCallback = function() {

        console.log('VimeoPlayerInterface::UNREGISTER_ENDED_CALLBACK');

        if (this.endedCallback) {
            this.endedCallback = null;
        }
    };

    VimeoPlayerInterface.prototype.registerLoadCallback = function(callback) {

        console.log('VimeoPlayerInterface::REGISTER_LOAD_CALLBACK');

        this.loadCallback = callback;
    };

    VimeoPlayerInterface.prototype.unregisterLoadCallback = function() {

        console.log('VimeoPlayerInterface::UNREGISTER_LOAD_CALLBACK');

        if (this.loadCallback) {
            this.loadCallback = null;
        }
    };

    // Private Methods _______________________________________________________

    VimeoPlayerInterface.prototype._setupElements = function() {
        var self = this;

        self.player = $f(self.element);
    };

    VimeoPlayerInterface.prototype._addEvents = function() {
        var self = this;

        self.player.addEvent('ready', self._readyHandler.bind(self));
    };

    VimeoPlayerInterface.prototype._setupPlayer = function() {
        var self = this;

        self.player.addEvent('play', self._playHandler.bind(self));
        self.player.addEvent('pause', self._pauseHandler.bind(self));
        self.player.addEvent('playProgress', self._playProgressHandler.bind(self));
        self.player.addEvent('loadProgress', self._loadProgressHandelr.bind(self));
        self.player.addEvent('finish', self._finishHandler.bind(self));
        // self.player.addEvent('error', self._errorHandler.bind(self));
    };

    // Event Handlers ________________________________________________________

    VimeoPlayerInterface.prototype._readyHandler = function(ev) {

        console.log('Player::READY', ev);

        var self = this;

        self.currentState = VimeoPlayerInterface.States.IDLE;

        self._setupPlayer();

        if (self.options.onReady) {
            self.options.onReady(this, ev);
        }
    };

    VimeoPlayerInterface.prototype._playHandler = function(ev) {

        console.log('Player::PLAY', ev);

        this.currentState = VimeoPlayerInterface.States.PLAYING;

    };

    VimeoPlayerInterface.prototype._pauseHandler = function(ev) {

        console.log('Player::PAUSE', ev);

        this.currentState = VimeoPlayerInterface.States.PAUSED;

    };

    VimeoPlayerInterface.prototype._playProgressHandler = function(ev) {

        // console.log('Player::PLAY_PROGRESS', ev);

    };

    VimeoPlayerInterface.prototype._loadProgressHandelr = function(ev) {

        // console.log('Player::LOAD_PROGRESS', ev);

    };

    VimeoPlayerInterface.prototype._finishHandler = function(ev) {

        console.log('Player::FINISH', ev);

        if (this.endedCallback) {
            this.endedCallback(this);
        }

    };

    VimeoPlayerInterface.prototype._errorHandler = function(ev) {

        console.log('Player::ERROR', ev);

        if (this.errorCallback) {
            this.errorCallback(this);
        }

    };

    // Global ________________________________________________________________

    window.VimeoPlayerInterface = VimeoPlayerInterface;

    // Expose CastSender as an AMD module
    if (typeof define === 'function' && define.amd) {
        define(VimeoPlayerInterface);
    }

})(window);
