'use strict';

angular.module('chitchat')
	.service('Config', Config);

function Config() {
	// this.occupantsIDsForAdmin = [
	// 	{login: 'Katty1', user_id: 21422385},
	// 	{login: 'hottie_xoxo', user_id: 21475577},
	// 	{login: 'luluxxx', user_id: 22459727},
	// 	{login: 'hotbella', user_id: 22459396},
	// 	{login: 'sexxy1', user_id: 22459780},
	// 	{login: 'Jenna', user_id: 22459066},
	// 	{login: 'blair45', user_id: 22459437},
	// 	{login: 'janelle', user_id: 22459582},
	// 	{login: 'hottiexx', user_id: 22461718},
	// 	{login: 'dirtygurlx', user_id: 22461647},
	// 	{login: 'miababy', user_id: 22459296},
	// 	{login: 'Emmylove', user_id: 22461780},
	// 	{login: 'sharon66xo', user_id: 22459638},
	// 	{login: 'taytay33', user_id: 22460972},
	// 	{login: 'PicTrade', user_id: 22461189},
	// 	{login: 'picswap', user_id: 22461371},
	// 	{login: 'larascrayy', user_id: 22461528}
	// ],
	this.api = {
		url: "http://52.10.49.5/app/index.php",
	};
	this.occupantsIDsForAdmin = [
		21422385,
		21475577,
		22459727,
		22459396,
		22459780,
		22459066,
		22459437,
		22459582,
		22461718,
		22461647,
		22459296,
		22461780,
		22459638,
		22460972,
		22461189,
		22461371,
		22461528
	];
}
