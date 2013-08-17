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
	.service('jngAdjust', [ '$rootScope', '$document', 'jngLayout', 'jngUnit', function($rootScope, $document, jngLayout, jngUnit) {

		//console.log("installed jngAdjust")

		$rootScope.jngAdjust={
			specs: [{
				min: 768,
				bodyClass: "jng-adjust-big",
				unit: 60,
			},{
				min: 360,
				bodyClass: "jng-adjust-medium",
				unit: 40,				
			},{
				bodyClass: "jng-adjust-small",
				unit: 30,				
			}],
			currentClass: "jng-adjust-medium",
		};
		
		var body=angular.element($document[0].body);
		body.addClass($rootScope.jngAdjust.currentClass);

		jngLayout.watchWindowDimensions(function (winSize) {
			var newSpec=null;
			var size=Math.min(winSize.w,winSize.h);
			for(var i=0;i<$rootScope.jngAdjust.specs.length;i++) {
				var spec=$rootScope.jngAdjust.specs[i];
				if((spec.min===undefined || size>=spec.min) &&
					(spec.max===undefined || size<=spec.max)) {
					newSpec=spec;
					break;
				}
			}
			if(newSpec && newSpec.bodyClass!=$rootScope.jngAdjust.currentClass) {
				body.removeClass($rootScope.jngAdjust.currentClass);
				body.addClass(spec.bodyClass);
				$rootScope.jngUnit.unit.pixels=spec.unit;
				$rootScope.jngAdjust.currentClass=spec.bodyClass;
			}
        });

	}]);


	
})(jQuery);
