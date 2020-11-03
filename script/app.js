'use strict';

const provider = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const copyright = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

let map, layergroup;
//--------------------GETTING DATA FROM API--------------------
const getAPI = async (lat, long) => {
	const key = '93eb5062-5ed9-4a66-83a6-b5189eb8e74f';
	const chargingStations = await fetch(`https://api.openchargemap.io/v3/poi/?key=${key}&latitude=${lat}&longitude=${long}&distance=20&distanceunit=KM`)
		.then((r) => r.json())
		.catch((err) => console.error('An error occured ', err));
	console.log(chargingStations);
	showResult(chargingStations);
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
		popupAnchor: [-10, -80], // point from which the popup should open relative to the iconAnchor
	});
	let chargingCoords = [];
	chargingCoords.push(chargingStation.AddressInfo.Latitude);
	chargingCoords.push(chargingStation.AddressInfo.Longitude);

	let marker = L.marker(chargingCoords, { icon: chargerLocationIcon }).addTo(layergroup);
	marker.bindPopup(`${chargingStation.AddressInfo.Title}`);
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
const searchOnMap = () => {
	var searchControl = L.esri.Geocoding.geosearch().addTo(map);
	var results = L.layerGroup().addTo(map);
	searchControl.on('results', function (data) {
		results.clearLayers();
		layergroup.clearLayers();
		for (var i = data.results.length - 1; i >= 0; i--) {
			results.addLayer(L.marker(data.results[i].latlng));
			getAPI(data.results[i].latlng.lat, data.results[i].latlng.lng);
		}
	});
};
//--------------------SHOW USER LOCATION ON MAP--------------------
const showPosition = (position) => {
	var MyLocationIcon = L.icon({
		iconUrl: './img/MyLocationIcon.png',
		iconSize: [24, 24], // size of the icon
		iconAnchor: [24, 24], // point of the icon which will correspond to marker's location
		popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
	});

	console.log(position);
	map = L.map('mapid').setView([position.coords.latitude, position.coords.longitude], 10);
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
	map = L.map('mapid').setView([51.041028, 3.398512], 10);
	L.tileLayer(provider, { attribution: copyright }).addTo(map);
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
document.addEventListener('DOMContentLoaded', function () {
	console.log('init initiated!');
	getLocation();
});
