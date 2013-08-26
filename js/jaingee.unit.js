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
	
	angular.module('com.jocly.jaingee.unit', ['com.jocly.jaingee.layout'])
	
	/**
	 * jngUnit service: facilities on button/toolbar sizing
	 */
	.service('jngUnit', [ '$rootScope', 'jngLayout', function($rootScope, jngLayout) {

		//console.log("installed jngUnit")

		$rootScope.jngUnit={
			unit: {
				pixels: 40,
			},
		};
		
		this.unit=$rootScope.jngUnit.unit;

		$rootScope.$watch('jngUnit.unit', function () {
        	$rootScope.jngLayout.layout();
        }, true);

	}])

	/**
	 * jngUnit directive: adjust size for unit-based element
	 */
	.directive('jngUnit', 
			[ '$rootScope','jngLayout', function factory($rootScope,jngLayout) {
		return {
			link: function(scope,element,attrs) {

				$rootScope.$watch('jngUnit.unit',function() {
					if(attrs.jngUnit=="button")
						$(element[0]).css({
							padding: $rootScope.jngUnit.unit.pixels*.125+"px",
							height: $rootScope.jngUnit.unit.pixels*.75+"px",
							width: $rootScope.jngUnit.unit.pixels*.75+"px",
							"line-height": $rootScope.jngUnit.unit.pixels*.50+"px",
						});						
					else
						$(element[0]).css({
							padding: $rootScope.jngUnit.unit.pixels*.125+"px",
							height: $rootScope.jngUnit.unit.pixels+"px",
							"line-height": $rootScope.jngUnit.unit.pixels*.75+"px",
						});
				},true);
				
				element.addClass("jng-unit");
			},
		};
	}])

	
})(jQuery);
