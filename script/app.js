'use strict';

let myLocationBtn,
	navigateBtn,
	closeBtn = '';
const provider = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const copyright = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

let map, modal, layergroup, card, cardTitle, cardAddress, cardType, cardContact, cardAvailable, cardComment, cardImage, membership, pay, charg;
let icons,
	images = [];
var searchControl, results, marker, popup;
//--------------------LISTEN TO LOCATION CLICK--------------------
const listenToLocationClick = () => {
	myLocationBtn.addEventListener('click', function () {
		results.clearLayers();
		layergroup.clearLayers();
		getLocation();
	});
};
//--------------------LISTEN TO POPUP CLICK--------------------
const listenToPopUpClick = (chargingStation) => {
	console.log('okooo');
	console.log(popup);
	console.log(this.popup);
	L.DomEvent.on(popup._contentNode, 'click', function () {
		console.log('In click ');
		modal.style.display = 'flex';
		showCard(chargingStation);
	});
};
//--------------------LISTEN TO NAVIGATION CLICK--------------------
const listenToControlsClick = (latitude, longitude) => {
	navigateBtn.addEventListener('click', function () {
		var url = 'http://www.google.com/maps/place/' + latitude + ',' + longitude;
		window.open(url);
	});
	closeBtn.addEventListener('click', function () {
		modal.style.display = 'none';
	});
	window.onclick = function (event) {
		if (event.target == modal) {
			modal.style.display = 'none';
		}
	};
};
//--------------------GET DATA FROM API--------------------
const getAPI = async (lat, long) => {
	const key = '93eb5062-5ed9-4a66-83a6-b5189eb8e74f';
	const chargingStations = await fetch(`https://api.openchargemap.io/v3/poi/?key=${key}&latitude=${lat}&longitude=${long}&distance=20&distanceunit=KM`)
		.then((r) => r.json())
		.catch((err) => console.error('An error occured ', err));
	console.log(chargingStations);
	showResult(chargingStations);
};
//--------------------GET USER LOCATION--------------------
const getLocation = () => {
	console.log('GETLOCATION');
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition, showError, { timeout: 10000 });
	} else {
		console.log('Geolocation is not supported by this browser.');
	}
};
//--------------------GET USER WANTED LOCATION--------------------
const searchOnMap = () => {
	results = L.layerGroup().addTo(map);
	searchControl.on('results', function (data) {
		results.clearLayers();
		layergroup.clearLayers();
		for (var i = data.results.length - 1; i >= 0; i--) {
			results.addLayer(L.marker(data.results[i].latlng));
			getAPI(data.results[i].latlng.lat, data.results[i].latlng.lng);
		}
	});
};
//--------------------SHOW DATA FROM SELECTED STATION--------------------
const showCard = (chargingStation) => {
	try {
		cardTitle.innerHTML = chargingStation.AddressInfo.Title;
		cardAddress.innerHTML = `${chargingStation.AddressInfo.AddressLine1} , ${chargingStation.AddressInfo.Postcode} ${chargingStation.AddressInfo.Town} ${chargingStation.AddressInfo.Country.ISOCode}`;
		if (chargingStation.AddressInfo.ContactTelephone1 != null) {
			cardContact.innerHTML = chargingStation.AddressInfo.ContactTelephone1;
		} else {
			cardContact.innerHTML = 'Number unknown';
		}

		let NumOfChargers = 0;
		chargingStation.Connections.forEach((connection) => {
			console.log(connection);
			if (connection.Quantity != null) {
				NumOfChargers += connection.Quantity;
			} else {
				NumOfChargers += 1;
			}
		});
		cardType.innerHTML = chargingStation.Connections[0].Level.Title;
		cardAvailable.innerHTML = `${NumOfChargers} <span class="c-app__slogan__coloured">chargers</span> available`;
		cardComment.innerHTML = chargingStation.GeneralComments;
		let props = [chargingStation.UsageType.IsMembershipRequired, chargingStation.UsageType.IsPayAtLocation, chargingStation.Connections[0].Level.IsFastChargeCapable];
		for (let i = 0; i < props.length; i++) {
			if (props[i] == true) {
				icons[i].style.opacity = '1';
			} else {
				icons[i].style.opacity = '0.2';
			}
		}
		let imgNum = chargingStation.Connections[0].LevelID;
		if (imgNum == null) {
			imgNum = 1;
		}
		cardImage.data = images[imgNum - 1];
		listenToControlsClick(chargingStation.AddressInfo.Latitude, chargingStation.AddressInfo.Longitude);
	} catch (error) {
		console.log('Data not provided');
	}
};
//--------------------SHOW DATA FROM API--------------------
const showResult = (chargingStations) => {
	chargingStations.forEach((chargingStation) => {
		chargerMarker(chargingStation);
	});
};
//--------------------SHOW MARKER DATA ON MAP--------------------
const chargerMarker = (chargingStation) => {
	var chargerLocationIcon = L.icon({
		iconUrl: './img/EvLocationIcon.png',
		iconSize: [24, 32], // size of the icon
		iconAnchor: [24, 32], // point of the icon which will correspond to marker's location
		popupAnchor: [-12, -20], // point from which the popup should open relative to the iconAnchor
	});
	let chargingCoords = [];
	chargingCoords.push(chargingStation.AddressInfo.Latitude);
	chargingCoords.push(chargingStation.AddressInfo.Longitude);

	marker = L.marker(chargingCoords, { icon: chargerLocationIcon }).addTo(layergroup);
	marker.addEventListener('click', function () {
		popup = L.popup().setLatLng([chargingStation.AddressInfo.Latitude, chargingStation.AddressInfo.Longitude]).setContent(chargingStation.AddressInfo.Title).openOn(map);
		listenToPopUpClick(chargingStation);
	});

	// popup = marker.bindPopup(`${chargingStation.AddressInfo.Title}`);
};

//--------------------SHOW USER LOCATION ON MAP--------------------
const showPosition = (position) => {
	var MyLocationIcon = L.icon({
		iconUrl: './img/MyLocationIcon.png',
		iconSize: [24, 24], // size of the icon
		iconAnchor: [24, 24], // point of the icon which will correspond to marker's location
		popupAnchor: [-12, -12], // point from which the popup should open relative to the iconAnchor
	});

	console.log(position);
	map.setView([position.coords.latitude, position.coords.longitude], 10);
	L.tileLayer(provider, { attribution: copyright }).addTo(map);
	searchOnMap();
	layergroup = L.layerGroup().addTo(map);

	let arr_coords = [];
	arr_coords.push(position.coords.latitude);
	arr_coords.push(position.coords.longitude);
	layergroup.clearLayers();
	let marker = L.marker(arr_coords, { icon: MyLocationIcon }).addTo(layergroup);
	marker.bindPopup(`YOU ARE HERE`);
	//api ophalen
	getAPI(position.coords.latitude, position.coords.longitude);
};
//--------------------LOG ERROR WHEN GETTING LOCATION--------------------
const showError = (error) => {
	map.setView([51.041028, 3.398512], 10);
	searchOnMap();
	layergroup = L.layerGroup().addTo(map);
	switch (error.code) {
		case error.PERMISSION_DENIED:
			console.log('User denied the request for Geolocation.');
			break;
		case error.POSITION_UNAVAILABLE:
			console.log('Location information is unavailable.');
			break;
		case error.TIMEOUT:
			console.log('The request to get user location timed out.');
			break;
		case error.UNKNOWN_ERROR:
			console.log('An unknown error occurred.');
			break;
	}
};
//--------------------INITIALIZE MAP--------------------
const initMap = () => {
	map = L.map('mapid').setView([51.041028, 3.398512], 10);
	searchControl = L.esri.Geocoding.geosearch().addTo(map);
};
//--------------------DOMCONTENTLOADED--------------------
document.addEventListener('DOMContentLoaded', function () {
	console.log('init initiated!');
	myLocationBtn = document.querySelector('.js-getMyLocation');
	navigateBtn = document.querySelector('.js-navigateTo');
	closeBtn = document.querySelector('.js-closeModal');
	card = document.querySelector('.js-card');
	modal = document.querySelector('.js-modal');
	cardTitle = document.querySelector('.js-card_title');
	cardAddress = document.querySelector('.js-card_info_addressTitle');
	cardType = document.querySelector('.js-card_info_typeTitle');
	cardContact = document.querySelector('.js-card_info_contact');
	cardAvailable = document.querySelector('.js-card_properties_available');
	cardComment = document.querySelector('.js-card_comment');
	cardImage = document.querySelector('.js-card_img');
	membership = document.querySelector('.js-card_properties_icons_membership');
	pay = document.querySelector('.js-card_properties_icons_pay');
	charg = document.querySelector('.js-card_properties_icons_charg');
	icons = [membership, pay, charg];
	images = ['/img/cardImg/charger station-03.svg', '/img/cardImg/Solar Energy Car Charger.svg', '/img/cardImg/Renewable Green Energy.svg'];
	initMap();
	listenToLocationClick();
	getLocation();
});
