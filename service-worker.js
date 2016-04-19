'use strict';

var link_open='/';
var fetch_url = 'https://www.pushchamp.com/chromedata/';
var user_app = location.search.split('=')[1];
var landing_url = '';

self.addEventListener('push', function(event) {
	if(event.data){
		console.log("With Payload Notification");
		var data = JSON.parse(event.data.text());
		var notif_title = "Missed notification";
		var notif_body = "This website has been updated.";
		var notif_icon = "https://www.pushchamp.com/static/images/notif_icon.png";
		var promises = [];
		promises.push(self.registration.showNotification(data.title || notif_title, {
			body: data.body || notif_body,
			icon: data.icon || notif_icon
		}));
		landing_url = data.landing_url || landing_url;
		return Promise.all(promises);
	}else{
		console.log("Without Payload Notification");
		event.waitUntil(
			self.registration.pushManager.getSubscription().then(function(subscription) {
				console.log("Magic starts here.....");
				var regID = null;
				if (subscription.subscriptionId) {
					regID = subscription.subscriptionId;
				} else {
					regID = subscription.endpoint.split('/send/')[1];
				}
				var formData = new FormData();
	            formData.append('app', user_app);
	            formData.append('token', regID);
				
				var notif_title = "Missed notification";
				var notif_body = "This website has been updated.";
				var notif_icon = "https://www.pushchamp.com/static/images/notif_icon.png";

				
				return fetch(fetch_url,{
					method: 'POST',
					body:formData})
				.then(function(response){return response.json();})
				.then(function(data) {
						data = data.data;
						var promises = [];
						if (data.error || !data.icon) {
							console.error('The API returned an error.', data.error);
							throw new Error();
						}
						promises.push(self.registration.showNotification(data.title || notif_title, {
							body: data.body || notif_body,
							icon: data.icon || notif_icon
						}));
						landing_url = data.landing_url || landing_url;
						return Promise.all(promises);
				})
				.catch(function(err) {
					console.error('error occurred in fetch please contact us to know the error for corresponding reg_id', err);
				});
			})
		);
	}
});

self.addEventListener('notificationclick', function(event) {
	event.notification.close();
	event.waitUntil(
		clients.matchAll({
			type: "window"
		}).then(function(clientList) {
			if (landing_url!=''){
				return clients.openWindow(landing_url);
			}
			for (var i = 0; i < clientList.length; i++) {
				var client = clientList[i];
				if (client.url == '/' && 'focus' in client)
					return client.focus();
			}
			if (clients.openWindow) {
				return clients.openWindow(link_open);
			}
		})
	);
});