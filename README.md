#jaingee

A library for angular.js-based user interface.

### What is jaingee

Jaingee is a collection of HTML5 application utilities, implemented as angular.js directives or services: it provides basic 
UI needs (layout, navigation) so focus is on specific application logic saving time on global UI.

Specifically, it provides a layout engine module for easily defining screen occupation zones.

It also has a *sidebar" module to simplify the management of temporary, full height panels sliding from the left or the right.

It is perfectly possible to integrate existing javascript code, not based on angular.js, into Jaingee. In fact, it only requires
a very basic understanding of angular.js (routes and views) to make the implementation.

However, if the application project permits, using the full potential of angular.js is an exceptional time/energy saver. Angular.js 
documentation can be found on [the official site](http://angularjs.org/).

### Demo

The [demonstration application](http://mi-g.github.com/jaingee/demo/index.html) is implemented using jaingee.

On Firefox, you can use the responsive design view (menu Tools/Web Developer) to see the effects of resizing the frame. On other 
browsers, just resize the navigator window. 

### Using jaingee

To start writing an application, the easy way is to copy the demo application and start modifying it.

It is important to understand that the demo application is built using an angular.js view: the HTML code in *index.html* is present on all 
pages, the HTML code inside the element with the ng-view is loaded dynamically according to the URL routes defined in *app.js*.

Jaingee relies on angular.js 1.2.0 and jQuery 1.10.2. The demo app also uses bootstrap 3.0.

### Layout 

A common issue when writing a responsive HTML5 application is the management of vertical space. Horizontal layout is rarely a problem, but dealing with 
zones heights is painful, particularly when complex layouts are to be used.

Jaingee addresses this issue by providing a layout mechanism based on specifying sizing information as HTML element attributes.  

The jngLayout directive defines a container that arranges its immediate children horizontally or vertically. By combining those elements, it is possible
to setup complex layouts. Whether the container is defined as horizontal or vertical, the dimension management is exactly the same to occupy the entire 
container space.

Children elements specify their size as either fixed (<number>px) or fluid (<number>). If not all children can fit into the container, some of them are
automatically hidden based on their defined priotities.

For instance:

    <div jng-layout="vertical">
    	<div jng-size="40px">Header</div>
    	<div jng-size="1">Content</div>
    	<div jng-size="40px">Footer</div>
    </div>

specifies fixed-height header and footer, plus a fluid (no "px" suffix) filling content section, the 3 elements occupying 100% of the vertical container space, 
each of them  on 100% of the container width.

Layout directives can be used throughout the DOM. 

    <div jng-layout="vertical">
    	<div jng-size="40px">Header</div>
    	<div jng-size="1" jng-layout="horizontal">
    	    <div jng-size="1">Left</div>
    	    <div jng-size="2">Main</div>
    	    <div jng-size="1">Right</div>
    	</div>
    	<div jng-size="40px">Footer</div>
    </div>

In this example, the content section has been cut in 3 columns occupying respectively 25%, 50% and 25% of the width. 

Children size definition can be more accurate than just a number of pixels or a fluid weight. The jng-size attribute can specify an expression to be 
evaluated as an object with the following properties:

* *fixed*: the number of pixels. If not set, the element has a fluid layout and the *weight* property is used.
* *weight*: the relative influence of the element when sharing the spare space in the sibling.
* *min*: if *weight* is used, this specifies the minimum size for displaying. If the element cannot fit, it is not displayed at all in this layout.
* *max*: if *weight* is used, this specifies the maximum size. The remaining space is distributed amongst fluid siblings.
* *priority*: if all children can not fit into the container, the ones with a lower priority disappear first.

Since the size definition is dynamically watched, changing some properties results in the layout being automatically relaunched where necessary.

### Sidebars

The *sidebar* module handles temporarily displayed sidebars on the left or the right. The main content is pushed accordingly to the sidebar width.

Jaingee sidebars have a common width and can be used efficiently as navigation or as contextual interfaces. Only one sidebar can be opened at a time.

The *sidebar* module provides a simple API to open and close sidebars. 

Sidebars are DIV elements with attribute *jng-sidebar* set. The attribute can be under the form *name:(left|right)*, like for instance, *app-nav:left*,
meaning we create a sidebar name *app-nav* that will open on the left. The attribute value can also be an expression that evaluates to an object with the
properties:

* *name*: (mandatory) the name of the sidebar
* *position*: (optional) *left* or *right*
* *width*: (optional) the width of the sidebar
* *anim*: (optional) the time in milliseconds it takes for the menu to slide open or closed.

The object *jngSidebar* is defined into the root scope. It holds the properties:

* *defaults*: an object to hold default values for *position*, *width*, and *anim*. 
* *closeOnViewChange*: defines whether an open sidebar is to be closed when a new view is loaded.
* *current*: the name of the currently opened sidebar, or *null* if none.
* *state*: values are *closed*|*left*|*right* to indicate if and where a sidebar is active.

Two methods are available from the root scope *jngSidebar" object:

* *open(name)*: opens the sidebar with the given name. If another sidebar is already opened, it is automatically closed.
* *close()*: close any opened sidebar.

When a menu slides open, the actual page content is either shifted on the other side, or resized. The element holding the actual content must have attribute 
*jng-sidebar-main* set. 

Example:

    <div jng-sidebar-main>
        <p>My main content</p>
        <button ng-show="jngSidebar.state=='closed'" ng-click="jngSidebar.open('my-sb')">Open</button>
        <button ng-show="jngSidebar.state!='closed'" ng-click="jngSidebar.close()">Close</button>
      </div>
    <div jng-sidebar="my-sb:left">
        My sidebar
    </div>

Note that a sidebar can be defined inside a view. In this case, when the view is unloaded, the sidebar is automatically closed.






 