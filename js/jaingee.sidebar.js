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
	
	angular.module('com.jocly.jaingee.sidebar', ['com.jocly.jaingee.layout'])
	
	/**
	 * jngSidebar service
	 */
	.service('jngSidebar', [ '$rootScope', '$window', 'jngLayout', function($rootScope, $window, jngLayout) {

		$rootScope.jngSidebar={
			state: "closed",	// sidebar overall state: 'closed', 'left'/'right' (a sidebar is open on the left/right)
			current: null,		// currently opened sidebar name, null if none
			shift: 0,			// the current pixel shift for the main content
			anim: 0,			// the current sidebar slide duration
			mode: "auto",		// how the main content should react to a sidebar opening: shift, resize or auto
			modeAutoThreshold: 768, // when mode is auto, the threshold to use resize or shift
			position: null,		// the current sidebar position
			closeOnViewChange: "auto", // when ng-view content changed, setup whether any open sidebar should be closed
			defaults: {				// defaults for defined sidebars
				position: "left",	// left/right default position
				anim: 500,			// default slide duration
				mode: "resize",		// default slide mode (currently only shift and resize are reliable)
				width: 200,			// sidebar width
			},
			open: function(sbName) {	// request sidebar opening (if another sidebar is open it will be closed automatically)
				$rootScope.jngSidebar.current=sbName;
			},							// close any sidebar that may be opened
			close: function() {
				$rootScope.jngSidebar.state="closed";
				$rootScope.jngSidebar.current=null;
			},
			widthAboveThreshold: function() {
				var pixelRatio=1;
				if($window.devicePixelRatio)
					pixelRatio=$window.devicePixelRatio;
				var width=pixelRatio=$rootScope.jngLayout.getWindowDimensions().w;
				return width>=$rootScope.jngSidebar.modeAutoThreshold;
			},
		};

		$rootScope.$on("$viewContentLoaded",function() {
			var closeOnViewChange=$rootScope.jngSidebar.closeOnViewChange;
			if(closeOnViewChange=="auto")
				closeOnViewChange=!$rootScope.jngSidebar.widthAboveThreshold();
			else
				closeOnViewChange=(closeOnViewChange=="yes");
			if(closeOnViewChange)
				$rootScope.jngSidebar.close();
		});

	}])

	/**
	 * jngSidebar directive
	 */
	.directive('jngSidebar', 
			[ '$rootScope','jngLayout', 'jngSidebar', function factory($rootScope,jngLayout,jngSidebar) {
		return {
			//scope: true,
			link: function(scope,element,attrs) {
				
				var state="closed";
				
				/**
				 * Evaluate sidebar description: either <name>:<left|right> or evaluated expression (see jngSidebar.defaults for details)
				 */
				function GetSidebarDescr() {
					var descr;
					var m=/^(.*):(left|right)$/.exec(attrs.jngSidebar);
					if(m)
						descr={
							name: m[1],
							position: m[2],
						}
					else
						descr=scope.$eval(attrs.jngSidebar);
					return angular.extend({},$rootScope.jngSidebar.defaults,descr);
				}

				/**
				 * Open the sidebar.
				 */
				function Open() {
					var descr=GetSidebarDescr();
					$rootScope.jngSidebar.state=descr.position;
					$rootScope.jngSidebar.shift=descr.width*(descr.position=='right'?-1:1);
					$rootScope.jngSidebar.anim=descr.anim;
					$rootScope.jngSidebar.position=descr.position;
					state="opening";
					var css0={
						width: descr.width,
					};
					var css={};
					if(descr.position=="left") {
						if(descr.mode=="shift" || descr.mode=="resize") {
							css0.left=-descr.width;
							css.left=0;
						} else if(descr.mode=="over") {
							/* TODO: not perfect solution */
							css0.left=0;
							css0.width=0;
							css.width=descr.width;
						}
					} else if(descr.position=="right") {
						var width=$rootScope.jngLayout.getWindowDimensions().w;
						if(descr.mode=="shift" || descr.mode=="resize") {
							css0.left=width;
							css.left=width-descr.width;
						} else if(descr.mode=="over") {
							/* TODO: over mode on right */
							css0.left=width;
							css.left=width-descr.width;
						}						
					}
					$(element[0]).show().stop().css(css0).animate(css,descr.anim,function() {
						state="opened";
					});
				}
				
				/**
				 * Close the sidebar. If this sidebar is open an to be replaced by another one, param 'replaced' is true. 
				 */
				function Close(replaced) {
					switch(state) {
					case "opening":
						$(element[0]).stop();
					case "opened":
						var descr=GetSidebarDescr();
						if(!replaced) {
							$rootScope.jngSidebar.state=null;
							$rootScope.jngSidebar.shift=0;
							$rootScope.jngSidebar.anim=descr.anim;
						}
						state="closing";
						var css={};
						if(descr.position=="left") {
							css.left=-descr.width;
						} else if(descr.position=="right") {
							var width=$rootScope.jngLayout.getWindowDimensions().w;
							css.left=width;
						}
						$(element[0]).animate(css,descr.anim,function() {
							state="closed";
							$(element[0]).hide();
						});
					}
				}

				// React to page resizing
				jngLayout.watchWindowDimensions(function(dimension) {
					$(element[0]).css({
						height: dimension.h,
					});
					if(state=="opening" || state=="opened")
						Open();
		        });

				// Get notified on new active sidebar
				$rootScope.$watch('jngSidebar.current', function(dimension) {
					var name=GetSidebarDescr().name;
					if($rootScope.jngSidebar.current==name)
						Open();
					else
						Close($rootScope.jngSidebar.current!=null);
				});

				scope.$on("$destroy",function() {
					if(state=="opening" || state=="opened")
						$rootScope.jngSidebar.close();
				});

				element.addClass("jng-sidebar");
			},
		};
	}])

	/**
	 * jngSidebarMain directive to be used on the element that is to be shifted when sidebar opens/closes
	 */
	.directive('jngSidebarMain', 
			[ '$rootScope', 'jngLayout', 'jngSidebar', function factory($rootScope,jngLayout,jngSidebar) {
		return {
			link: function(scope,element,attrs) {

				function UpdateSize(animate) {
					var mode=$rootScope.jngSidebar.mode;
					if(mode=="auto") {
						if($rootScope.jngSidebar.widthAboveThreshold())
							mode="resize";
						else
							mode="shift";
					}
					var jqElement=$(element[0]);
					var css0={
							left: jqElement.css("left"),
							width: jqElement.css("width"),
					}
					var css={
						left: $rootScope.jngSidebar.shift,
						width: $rootScope.jngLayout.getWindowDimensions().w,
					}
					if(mode=="resize") {
						css.width=$rootScope.jngLayout.getWindowDimensions().w-Math.abs($rootScope.jngSidebar.shift);
						if($rootScope.jngSidebar.position=="right")
							css.left=0;
					}
					jqElement.css(css);
					if(animate) {
						if(typeof scope.jngDoLayout=="function")
							scope.jngDoLayout();
						jqElement.css(css0);
						jqElement.stop().animate(css,$rootScope.jngSidebar.anim,function() {
							jngLayout.layout();
						});
					}
				}
				
				element.addClass("jng-sidebar-main");
				
				$rootScope.$watch('jngSidebar.shift',function() {
					UpdateSize(true);
				});
				
				// React to page resizing
				jngLayout.watchWindowDimensions(function(dimension) {
					UpdateSize(false);
		        });
			},
		};
	}])
	
})(jQuery);
