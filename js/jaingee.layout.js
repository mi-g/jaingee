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
	.service('jngLayout', [ '$rootScope', '$window', '$document', '$timeout', function($rootScope, $window, $document, $timeout) {
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
        		if(element.scope().hasOwnProperty("jngRequestLayout"))
        			element.scope().jngRequestLayout();
        		else
        			console.log(element.attr("id"),"has no jngRequestLayout",element.scope())
        	});	    	
	    }

	    this.rootElement=null;
	    
		$rootScope.jngLayout={
	        getWindowDimensions : function () {
	        	if(self.rootElement)
	        		return { 'h': self.rootElement.clientHeight, 'w': self.rootElement.clientWidth };
	        	else
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
        
        this.layout=Layout;
		
		$rootScope.$on("$viewContentLoaded",function() {
			$timeout(Layout,0);
		});

		angular.element($window).bind('resize', function () {
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
			priority: 10,
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
					var m=/^fit$/.exec(jngSize)
					if(m)
						return {
							fit:true,
						}
					m=/^ignore$/.exec(jngSize);
					if(m)
						return {
							ignore:true,
						}
					m=/^([0-9]+)$/.exec(jngSize);
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
						if(callback(childElem))
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
			    				return 1;
			    			else if(fit2 && !fit1)
			    				return -1;
			    			else
			    				return child1.sizeDesc.priority-child2.sizeDesc.priority;
			    		});
			    		return children1;
				    }

					var dimension;
					if(scope.hasOwnProperty("jngSize") && scope.jngSize.width>=0) {
						dimension={
							width: scope.jngSize.width,
							height: scope.jngSize.height,
						}
					} else {
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
					
					//console.log("container size",dimension);
					
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

					// collect to-be-resized/moved children elements data
			    	var totalWeight=0, 	// total defined weight
			    		weightMin=0,	// minimum size requested by weight-based children
			    		fixedSize=0;   	// total requested fixed size

			    	var childIndex=1;
			    	
			    	angular.forEach(element.children(), function(child) {
						var $child=angular.element(child);
						if(!$child.hasClass("ng-scope"))
							return;
						var childScope=$child.scope();
						if(childScope && childScope.hasOwnProperty("jngSize")) {
							var sd=angular.extend({
				    			priority: 0,
				    			min: 0,
				    			max: Infinity,
				    			keep: true,
				    			index: childIndex++,
				    		},GetSizeDesc(childScope.jngSizeExpr));
							if(sd.ignore)
								return;
							children.push({
								element: $child,
								sizeExpr: childScope.jngSizeExpr,
								sizeDesc: sd,
								size: childScope.jngSize,
							});
				    		if($child.hasClass("ng-leave")) {
				    			sd.keep=false;
				    			return;
				    		}
				    		if($child.attr("ng-show")!==undefined && !childScope.$eval($child.attr("ng-show"))) {
				    			sd.keep=false;
				    			return;
				    		}
							if(sd.fit) {
								var css={
								};
								css[dir.keep]=dimension[dir.keep]+"px";
								css[dir.size]='';
								$($child[0]).css(css);
								sd.pixels=$($child[0])[dir.size]();
							}
							if(sd.pixels!==undefined)
				    			fixedSize+=sd.pixels;
				    		else if(sd.weight!==undefined) {
				    			totalWeight+=sd.weight;
				    			weightMin+=sd.min;
				    		} else {
				    			console.warn("Element id",$child.attr("id"),"has neither 'pixels' not 'weight' spec",sd);
				    			sd.keep=false;
				    		}
						}
					});
			    	
			    	children.sort(function(c1,c2) {
			    		return c1.sizeDesc.index-c2.sizeDesc.index;
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
						var sv=child.size;
						sv[dir.pos]=(current+padding[dir.pos]);
						sv[dir.keep]=dimension[dir.keep];
						sv[dir.anchor]=padding[dir.anchor];
						
						var value=0;
						if(!sd.keep) {
							value=0;
						} else if(sd.pixels!==undefined)
							value=sd.pixels;
						else {
							value=Math.round(Math.max(Math.min(spare*sd.weight/totalWeight,sd.max),sd.min));
							spare-=value;
							totalWeight-=sd.weight;
						}
						sv[dir.size]=value;
						
						//console.log("placed",child.element.attr("id"),sv);
						
						child.element.scope().setSize(sv);

						current+=value;
					});

					// perform relayout on children
					scope._jngDoLayout=scope.jngDoLayout;
					scope.jngDoLayout=function() {}
			    	WalkDescendants(element,function(elementBelow) {
			    		if(elementBelow.attr("ng-show")===undefined || scope.$eval(elementBelow.attr("ng-show"))) {
			    			var belowScope=elementBelow.scope();
			    			if(belowScope && typeof belowScope.jngDoLayout=="function") {
				    			belowScope.jngDoLayout();
				    			return false;
			    			}
			    		}
			    		return true;
			    	});
					scope.jngDoLayout=scope._jngDoLayout;
			    }
				
				// define delayed layout request as a scope function
				scope.jngRequestLayout=function() {
					RequestLayout(element);
				}

				// define immediate layout as a scope function
				scope.jngDoLayout=function() {
						DoLayout(element);
				}
				
				RequestLayout(element);
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
			[ '$rootScope', function factory($rootScope) {
		return {
			scope: true,
			priority: 20,
			link: function(scope,element,attrs) {
				scope.jngSize={
					width: 0,
					height: 0,
					top: 0,
					left: 0,
				};
				scope.jngSize0=angular.extend({},scope.jngSize);
				scope.jngSizeExpr=attrs.jngSize;
				scope.$watch('jngSize',function(newSize) {
					scope.setCSS(newSize)
				});
				scope.setCSS=function(size) {
					if(scope.jngSizeExpr=='ignore')
						return;
					angular.extend(scope.jngSize0,size);
					var css={
						position: "absolute",
						top: size.top+"px", 
						left: size.left+"px", 
						width: size.width+"px", 
						height: size.height+"px", 
					};
					if(size.width==0 || size.height==0)
						css.opacity=0;
					else
						css.opacity=1;
					function ResizeHandler() {
			    		var resizedHandler=attrs.jngResized;
			    		if(resizedHandler)
			    			scope.$eval(resizedHandler);						
					}
					if(attrs.jngResizeNoAnim===undefined)
						$(element[0]).stop().animate(css,$rootScope.jngLayout.anim,ResizeHandler);
					else {
						$(element[0]).stop().css(css);
						ResizeHandler();
					}
				}
				scope.setSize=function(newSize) {
					var size0=scope.jngSize0;
					if(newSize.left!=size0.left || newSize.top!=size0.top || newSize.width!=size0.width || newSize.height!=size0.height) {
						angular.extend(scope.jngSize,newSize);
						scope.setCSS(scope.jngSize);
					}
				};
				element.css("position","absolute");
				if(!/^[0-9]+(?:px)?$/.exec(attrs.jngSize))
					scope.$watch(attrs.jngSize,function() {
						if(scope.$parent && scope.$parent.jngRequestLayout)
							scope.$parent.jngRequestLayout();
					},true);
				if(element.attr("ng-show")!==undefined)
					scope.$watch(element.attr("ng-show"),function() {
						if(scope.$parent && scope.$parent.jngRequestLayout)
							scope.$parent.jngRequestLayout();
					});
			},
		};
	}])

	/**
	 * Directive to specify the element containing the whole jaingee context
	 */
	.directive('jngRoot', 
			[ 'jngLayout', function factory(jngLayout) {
		return {
			link: function(scope,element,attrs) {
				jngLayout.rootElement=element[0];
			},
		};
	}])


	
})(jQuery);
