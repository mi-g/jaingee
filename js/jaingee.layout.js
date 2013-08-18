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
	
	angular.module('com.jocly.jaingee.layout', [])
	
	/**
	 * jngLayout service
	 */
	.service('jngLayout', [ '$rootScope', '$window', '$document', function($rootScope, $window, $document) {
		var self = this;

		/**
		 * Walk through DOM descendants to invoke callback on jngLayout-managed element
		 */
	    function WalkDescendants(element,callback) {
			if(element.attr("jng-layout"))
				callback(element);
			else
				angular.forEach(element.children(),function(child) {
					WalkDescendants(angular.element(child),callback);
				});
	    }
	    
	    /**
	     * Request relayout on descendants
	     */
	    function Layout() {
        	WalkDescendants(angular.element($document[0].body),function(element) {
				element.scope().jngRequestLayout();
        	});	    	
	    }
		
		var w = angular.element($window);

		$rootScope.jngLayout={
	        getWindowDimensions : function () {
	            return { 'h': $window.innerHeight, 'w': $window.innerWidth };
	        },
	        layout: Layout,
	        anim: 400,
		}
		
		this.watchWindowDimensions = function(callback) {
        	$rootScope.$watch($rootScope.jngLayout.getWindowDimensions, function(newDim, oldDim) {
        		callback(newDim,oldDim);
        	},true);
        }
		
        this.watchWindowDimensions(function () {
        	Layout();
        });
		
		$rootScope.$on("$viewContentLoaded",function() {
			Layout();
		});

        w.bind('resize', function () {
        	if(!$rootScope.$$phase)
        		$rootScope.$apply();
        });
		
	} ])

	/**
	 * jngLayout directive
	 * 
	 * an element using the jngLayout directive (having a jng-layout attribute), organised its children size and position vertically or horizontally
	 */
	.directive('jngLayout', 
			[ '$rootScope','$timeout','jngLayout', function factory($rootScope,$timeout,jngLayout) {
		return {
			scope: true,
	    	link: function(scope,element,attrs) {
				var jqElement=$(element[0]);
			    var requestedLayout=false;
			    var requestLayoutCount;
			    var requestLayoutDelay=10;
			    var elementDimension;

			    /**
			     * Evaluate children size description 
			     */
				function GetSizeDesc(jngSize) {
					var m=/^([0-9]+)$/.exec(jngSize);
					if(m)
						return {
							weight: parseInt(m[1]),
						}
					m=/^([0-9]+)px$/.exec(jngSize);
					if(m)
						return {
							pixels: parseInt(m[1]),
						}
					return scope.$eval(jngSize);
				}

				/**
				 * Go through DOM descendants to invoke callback on jngLayout-managed elements  
				 */
			    function WalkDescendants(element,callback) {
					angular.forEach(element.children(),function(child) {
						var childElem=angular.element(child);
						if(childElem.attr("jng-layout"))
							callback(childElem);
						else
							WalkDescendants(childElem,callback);
					});
			    }
			    
			    /**
			     * Request a new layout. The action is not performed immediately to perform only one relayout if several are requested within a short period of time. 
			     */
			    function RequestLayout(element) {
		    		function DecrementRequestCount() {
		    			requestLayoutCount--;
			    		$timeout(function() {
			    			if(requestLayoutCount==0) {
			    				requestedLayout=false;
			    				DoLayout(element);
			    			} else
			    				DecrementRequestCount();
			    		},0);			    			
		    		}
			    	requestLayoutCount=requestLayoutDelay;
			    	if(requestedLayout==false) {
			    		requestedLayout=true;
			    		DecrementRequestCount();
			    	}
			    }
			    
			    /**
			     * Perform a new layout calculation on the current element. 
			     */
			    function DoLayout(element) {

			    	//console.log("DoLayout",element.attr("id"));
			    	
			    	var children=[];

			    	/**
			    	 * Order jngLayout children indexes to get lower priority children first.
			    	 */
				    function ChildrenIndexesByPriority() {
				    	var children1=[];
			    		for(var i=0;i<children.length;i++)
			    			if(children[i].sizeDesc.keep)
			    				children1.push(i);
			    		children1.sort(function(i1,i2) {
			    			var child1=children[i1];
			    			var child2=children[i2];
			    			var fit1=(child1.sizeDesc.pixels!==undefined && child1.sizeDesc.pixels<=elementSize) ||
			    				(child1.sizeDesc.pixels===undefined && child1.sizeDesc.min<=elementSize);
			    			var fit2=(child2.sizeDesc.pixels!==undefined && child2.sizeDesc.pixels<=elementSize) ||
		    					(child2.sizeDesc.pixels===undefined && child2.sizeDesc.min<=elementSize);
			    			if(fit1 && !fit2)
			    				return -1;
			    			else if(fit2 && !fit1)
			    				return 1;
			    			else
			    				return child1.sizeDesc.priority-child2.sizeDesc.priority;
			    		});
			    		return children1;
				    }

				    // collect children to be resized/moved
					angular.forEach(element.children(), function(child) {
						var $child=angular.element(child);
						/*
			    		if($child.attr("ng-show")!==undefined && !scope.$eval($child.attr("ng-show"))) {
			    			return;
			    		}
			    		*/
						var size=$child.attr("jng-size");
						if(size) {
							children.push({
								element: $child,
								sizeExpr: size,
							});
						}
					});

					var dimension;
					if(scope.hasOwnProperty("jngSize"))
						dimension={
							width: scope.jngSize.width,
							height: scope.jngSize.height,
						}
					else {
						dimension={
								width: element[0].clientWidth,
								height: element[0].clientHeight,
							};
						var m=/^(.*)px$/.exec(element.css("width"));
						if(m)
							dimension.width=parseInt(m[1]);
						m=/^(.*)px$/.exec(element.css("height"));
						if(m)
							dimension.height=parseInt(m[1]);
					}
					
					var padding={
						top: parseInt(jqElement.css("padding-top")),
						bottom: parseInt(jqElement.css("padding-bottom")),
						left: parseInt(jqElement.css("padding-left")),
						right: parseInt(jqElement.css("padding-right")),							
					}
					
					dimension.width-=padding.left+padding.right;
					dimension.height-=padding.top+padding.bottom;
					
					switch(element.css("position")) {
					case "relative":
					case "absolute":
						break;
					default:
						element.css("position","relative");
					}

					// dealing with horizontal/vertical directions with the same algorithm, so css properties indirections are required
					var dirs={
						"vertical": {
							"pos": "top",
							"size": "height",
							"keep": "width",
							"anchor": "left",
						},
						"horizontal": {
							"pos": "left",
							"size": "width",
							"keep": "height",
							"anchor": "top",
						},
					}

					// interpret jng-layout attribute value: 'horizontal' and 'vertical' is expected as direct attribute value or evaluated expression
					var dir; // hold direction (horizontal or vertical) css properties
					var m=/^(horizontal|vertical)$/.exec(attrs.jngLayout);
					if(m)
						dir=dirs[m[1]];
					else
						dir=dirs[scope.$eval(attrs.jngLayout)];

					// collect children elements data
			    	var totalWeight=0, 	// total defined weight
			    		weightMin=0,	// minimum size requested by weight-based children
			    		fixedSize=0;   	// total requested fixed size
			    	angular.forEach(children,function(child) {
			    		var sd=angular.extend({
			    			priority: 0,
			    			min: 0,
			    			max: Infinity,
			    			keep: true,
			    		},GetSizeDesc(child.sizeExpr));
			    		child.sizeDesc=sd;
			    		if(child.element.hasClass("ng-leave")) {
			    			sd.keep=false;
			    			return;
			    		}
			    		if(child.element.attr("ng-show")!==undefined && !scope.$eval(child.element.attr("ng-show"))) {
			    			sd.keep=false;
			    			return;
			    		}
			    		if(sd.pixels!==undefined)
			    			fixedSize+=sd.pixels;
			    		else if(sd.weight!==undefined) {
			    			totalWeight+=sd.weight;
			    			weightMin+=sd.min;
			    		} else {
			    			console.warn("Element id",child.element.attr("id"),"has neither 'pixels' not 'weight' spec",sd);
			    			sd.keep=false;
			    		}
			    	});
			    	
			    	var elementSize=dimension[dir.size]; // container size in the current direction (horizontal/vertical)
			    	// hide children that won't fit in the container
			    	while(fixedSize+weightMin>elementSize) {
			    		var children1=ChildrenIndexesByPriority();
			    		if(children1.length==0) {
			    			//console.warn("Impossible to place any child");
			    			break;
			    		}
			    		var child1=children[children1[0]];
			    		var sd1=child1.sizeDesc;
			    		sd1.keep=false;
			    		if(sd1.pixels!==undefined)
			    			fixedSize-=sd1.pixels;
			    		else {
			    			totalWeight-=sd1.weight;
			    			weightMin-=sd1.min;
			    		}
			    		//console.log("removed element",child1.element.attr("id"),"from layout");
			    	}

			    	// hide weight-based children that cannot realize minimum size 
					angular.forEach(ChildrenIndexesByPriority(), function(childIndex) {
						var child=children[childIndex];
						var sd=child.sizeDesc;
						if(sd.keep && sd.pixels===undefined) {
							if((elementSize-fixedSize)*sd.weight/totalWeight<sd.min) {
								sd.keep=false;
								totalWeight-=sd.weight;
							}
						}
					});
			    	
					// handle weight-based children that have specified a maximum size
					angular.forEach(children, function(child) {
						var sd=child.sizeDesc;
						if(sd.keep && sd.pixels===undefined) {
							var value=(elementSize-fixedSize)*sd.weight/totalWeight;
							if(value>sd.max) {
								totalWeight-=sd.weight;
								delete sd.weight;
								sd.pixels=sd.max;
								fixedSize+=sd.pixels;
							}
						}
					});
			    	
			    	var spare=elementSize-fixedSize; // unrequested size to be distributed over weight-based children

			    	// update children size
					var current=0; // current position
					angular.forEach(children, function(child) {
						var sd=child.sizeDesc;
						var css={
							position: "absolute",
							boxSizing: "box-border",
						};
						var css0={
							position: "absolute",
							boxSizing: "box-border",
						}
						css0[dir.pos]=child.element.css(dir.pos)+padding[dir.pos];
						css0[dir.size]=child.element.css(dir.size);
						css0[dir.keep]=child.element.css(dir.keep);
						css0[dir.anchor]=child.element.css(dir.anchor)+padding[dir.anchor];
						css0.visibility="visible";
						css0.display="block";
						css[dir.pos]=(current+padding[dir.pos])+"px";
						css[dir.keep]=dimension[dir.keep]+"px";
						css[dir.anchor]=padding[dir.anchor];
						css.visibility="hidden";
						var value=0;
						if(!sd.keep) {
							value=0;
							css0.display="none";
						} else if(sd.pixels!==undefined)
							value=sd.pixels;
						else {
							value=Math.round(Math.max(Math.min(spare*sd.weight/totalWeight,sd.max),sd.min));
							spare-=value;
							totalWeight-=sd.weight;
						}

						var jngSize=child.element.scope().jngSize;
						jngSize[dir.size]=value;
						jngSize[dir.keep]=dimension[dir.keep];
						jngSize.visible=sd.keep;
						
						css[dir.size]=value+"px";

						//console.log("to",child.element.attr("id"),css);

						$(child.element[0]).css(css0);
						$(child.element[0]).stop().animate(css,$rootScope.jngLayout.anim);								

						current+=value;
					});

					// perform relayout on children
			    	WalkDescendants(element,function(elementBelow) {
			    		//console.log("propagate to",elementBelow.attr("id"));
			    		if(elementBelow.attr("ng-show")===undefined || scope.$eval(elementBelow.attr("ng-show")))
			    			elementBelow.scope().jngDoLayout();
			    	});
			    }
				
				// define delayed layout request as a scope function
				scope.jngRequestLayout=function() {
					RequestLayout(element);
				}

				// define immediate layout as a scope function
				scope.jngDoLayout=function() {
					DoLayout(element);
				}
			},
		};
	}])

	/**
	 * Directive to specify that the element has scrollable content.
	 */
	.directive('jngScrollable', 
			[ function factory() {
		return {
			link: function(scope,element,attrs) {
				element.addClass("jng-scrollable");
			},
		};
	}])

	/**
	 * Directive jngSize (attribute 'jng-size') to create a scope so that the element size is immediately accessible. 
	 */
	.directive('jngSize', 
			[ function factory() {
		return {
			scope: true,
			link: function(scope,element,attrs) {
				scope.jngSize={
					width: -1,
					height: -1,
					visible: false,
				};
				if(!/^[0-9]+(?:px)?$/.exec(attrs.jngSize))
					scope.$watch(attrs.jngSize,function() {
						scope.$parent.jngRequestLayout();
					},true);
				if(element.attr("ng-show")!==undefined)
					scope.$watch(element.attr("ng-show"),function() {
						scope.$parent.jngRequestLayout();
					});
			},
		};
	}])
		
})(jQuery);
