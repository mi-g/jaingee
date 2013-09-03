/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @author mig <michel.gutierrez@gmail.com>
 * @version 0.1
 * @module jaingee  
 * @overview Javascript UI/Layout application framework. 
 */

(function($) {
	
	'use strict';
	
	angular.module('com.jocly.jaingee.adjust', ['com.jocly.jaingee.layout', 'com.jocly.jaingee.unit'])
	
	/**
	 * jngUnit service: facilities on button/toolbar sizing
	 */
	.service('jngAdjust', [ '$rootScope', '$window', '$document', 'jngLayout', 'jngUnit', function($rootScope, $window, $document, jngLayout, jngUnit) {

		//console.log("installed jngAdjust")
		
		var self=this;
		
		var pixelRatio=1;
		if($window.devicePixelRatio)
			pixelRatio=$window.devicePixelRatio;

		$rootScope.jngAdjust={
			specs: [{
				title: "Huge",
				min: 1280,
				bodyClass: "jng-adjust-huge",
				unit: 40,
			},{
				title: "Big",
				min: 768,
				bodyClass: "jng-adjust-big",
				unit: 40,
			},{
				title: "Medium",
				min: 360,
				bodyClass: "jng-adjust-medium",
				unit: 40,				
			},{
				title: "Small",
				bodyClass: "jng-adjust-small",
				unit: 30,				
			}],
			currentClass: "jng-adjust-medium",
			pixelRatio: pixelRatio,
			screenWidth: 0,
			screenHeight: 0,
			autoAdjust: true,
		};
		
		var body=angular.element($document[0].body);
		var html=angular.element($document[0].documentElement);
		
		function UpdateClass(spec) {
			body.addClass(spec.bodyClass);
			html.addClass(spec.bodyClass);
			$rootScope.jngUnit.unit.pixels=spec.unit;
		}
		
		self.updateSize = function() {
			var winSize={
				w: $rootScope.jngAdjust.screenWidth,
				h: $rootScope.jngAdjust.screenHeight,
			}
			var newSpec=null;
			var size=Math.min(winSize.w,winSize.h)*pixelRatio;
			for(var i=0;i<$rootScope.jngAdjust.specs.length;i++) {
				var spec=$rootScope.jngAdjust.specs[i];
				if((spec.min===undefined || size>=spec.min) &&
					(spec.max===undefined || size<=spec.max)) {
					newSpec=spec;
					break;
				}
			}
			if($rootScope.jngAdjust.autoAdjust && newSpec && newSpec.bodyClass!=$rootScope.jngAdjust.currentClass) {
				$rootScope.jngAdjust.currentClass=spec.bodyClass;
			}
		}

		jngLayout.watchWindowDimensions(function (winSize) {
			$rootScope.jngAdjust.screenWidth=winSize.w;
			$rootScope.jngAdjust.screenHeight=winSize.h;
			self.updateSize();
        });
		
		$rootScope.$watch('jngAdjust.currentClass',function(newValue,oldValue) {
			var newSpec=null;
			for(var i=0;i<$rootScope.jngAdjust.specs.length;i++) {
				var spec=$rootScope.jngAdjust.specs[i];
				if(spec.bodyClass==newValue) {
					newSpec=spec;
					break;
				}
			}
			if(newSpec) {
				html.removeClass(oldValue);
				body.removeClass(oldValue);
				UpdateClass(newSpec);
			}
		});

	}]);


	
})(jQuery);
