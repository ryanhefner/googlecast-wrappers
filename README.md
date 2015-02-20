# Google Cast - Wrappers

Simple wrappers for Google Cast (Chrome) Sender apps and custom Receiver apps.

It is licensed under the Apache 2.0 license.

## Getting Started (Requirements)
Depending on which one you are planning on building, either a Chrome Sender or a custom Receiver app, here are the basic things that you need to do to get up and running.

### Chrome Sender
In order to create a Chrome Sender app, you'll need to include the following script files in your sender page:

```
<script type="text/javascript" src="//www.gstatic.com/cv/js/sender/v1/cast_sender.js"></script>
<script type="text/javascript" src="libs/polyfills/object-assign-polyfill.js"></script>
<script type="text/javascript" src="sender/cast-sender.js"></script>
```

__NOTE__: `Object.assign()` is used to merge options passed to the `new CastSender({...})` with the default `options` in the sender. Use the supplied polyfill `libs/polyfills/object-assign-polyfill.js` to provide support across all browsers.

### Custom Receiver
For Custom Receiver apps, include the following script files in your receiver app page:

```
<script type="text/javascript" src="//www.gstatic.com/cast/sdk/libs/receiver/2.0.0/cast_receiver.js"></script>
<script type="text/javascript" src="//www.gstatic.com/cast/sdk/libs/mediaplayer/1.0.0/media_player.js"></script>
<script type="text/javascript" src="libs/polyfills/object-assign-polyfill.js"></script>
<script type="text/javascript" src="receiver/cast-receiver.js"></script>
```

__NOTE__:
* The `media_player.js` file is only required if you plan to support media playback in your receiver app via the standard media controls.
* `Object.assign()` support is required for the `CastReceiver` object (same as above).

## Simple Example
Here are some super simple examples of the basic requirements for creating a Chrome Sender and Custom Receiver app. For more details examples, review the examples supplied in the `examples` directory.

### Chrome Sender
```
<button type="button" id="cast-button">Cast</button>
<button type="button" id="load-button">Load Media</button>

<script>
	var castButton = document.getElementById('cast-button'),	// Hidden by default
		loadButton = document.getElementById('load-button'),
		sender = new CastSender({
			appId: [YOUR APP ID or chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID],
			customNamespace: 'urn:x-cast:com.your.app', 	// Only required if you plan to send custom messages to your receiver app
			onReceiverAvailable: receiverAvailableHandler,
			onSessionConnected: sessionSuccessHandler
		});

	castButton.addEventListener('click', function(ev) {
		sender.requestSession(sessionSuccessHandler);
	});

	loadButton.addEventListener('click', function(ev) {
		sender.loadMedia({
			contentId: [VIDEO URL]
		});
	});

	function receiverAvailableHandler() {
		// Show the castButton since there is a receiver available
		castButton.style.display = 'inline-block';
	}

	function sessionSuccessHandler() {
		// Change the state of the cast button when a session has been successfully initiated
		castButton.classList.add('active');
	}
</script>
```

### Custom Receiver
```
<video id="video-tag">

<script>
	var video = document.getElementById('video-tag'),
		receiver = new CastReceiver({
			appId: [YOUR APP ID],
			mediaElement: video
		});
</script>
```


