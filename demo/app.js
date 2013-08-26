/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @author mig <michel.gutierrez@gmail.com>
 * @version 0.1
 * @module jaingee  
 * @overview Javascript UI/Layout application framework. 
 */

angular.module('com.jocly.jaingee.demo', [ 'ngRoute', 'ngAnimate', 
                                           'com.jocly.jaingee.layout', 'com.jocly.jaingee.unit', 'com.jocly.jaingee.sidebar',
                                           'com.jocly.jaingee.adjust']).config(
		[ '$routeProvider', '$locationProvider',
				function($routeProvider, $locationProvider, ngRoute) {
					$routeProvider.when('/about', {
						templateUrl : 'about.html',
					}).when('/layout', {
						templateUrl : 'layout.html',
					}).when('/sidebar', {
						templateUrl : 'sidebar.html',
					}).when('/sidebar-list', {
						templateUrl : 'sidebar-list.html',
					}).when('/app', {
						templateUrl : 'app.html',
					}).when('/adjust', {
						templateUrl : 'adjust.html',
					}).when('/fit', {
						templateUrl : 'fit.html',
					}).otherwise({
						redirectTo : function(a, b, locationSearch) {
							return '/about';
						},
					});
					$locationProvider.html5Mode(false);
				} ]).run(
		[  '$rootScope', function($rootScope) {
			console.log("Running Angular version", angular.version.full);
		} ]);

angular.module('com.jocly.jaingee.demo').controller('jngDemo',
		[ '$rootScope', '$scope', 'jngLayout', 'jngUnit', 'jngSidebar', 'jngAdjust',

		function($rootScope,$scope,jngLayout,jngUnit,jngSidebar,jngAdjust) {
			// define ui object as a convenience at rootScope level
			$rootScope.ui={
				unit: $rootScope.jngUnit.unit,  // shortcut to unit service
				adjust: $rootScope.jngAdjust,  // shortcut to adjust service
				sidebar: $rootScope.jngSidebar,	// shortcut to sidebar service
				layout: $rootScope.jngLayout,	// shortcut to layout service
				
				// for layout demo
				horizontalBar: false,
				verticalBar: false,
				rightPanel: false,
				bottomPanel: false,
				header: true,
				footer: true,
				
				// so we can build navigation menus dynamically
				nav: [{l:'#/about',t:'About'},{l:'#/layout',t:'Layout'},{l:'#/sidebar',t:'Sidebar'},{l:'#/adjust',t:'Adjust'},{l:'#/app',t:'Your app'}],
			};
			
			// for item context demo
			$scope.items={
				all: ["Item 1","Item 2","Item 3","Item 4","Item 5"],
				index: -1,
				rename: function(index) {
					var oldName=$scope.items.all[$scope.items.index];
					var newName=prompt('New name',oldName);
					return newName || oldName;
				},
			};
			
			$scope.digitItemSize=function(value) {
				var modifier={};
				if(value%2==0)
					modifier.priority=100-value;
				else
					modifier.priority=-value;
				return angular.extend({},$scope.ui.unit,modifier);
			};
			$scope.letterItemSize=function(letter) {
				var vowels={'A':true,'E':true,'I':true,'O':true,'U':true,'Y':true};
				var modifier={
					priority: 100-letter.charCodeAt(0),
				};
				if(letter in vowels)
					modifier.priority+=100;
				return angular.extend({},$scope.ui.unit,modifier);
			};
		} ]);
