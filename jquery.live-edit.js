;~function($, window, document, undefined) {
    // Need comments here!
    $.liveEdit = function liveEdit(_prefix, _window) {
        // Configuration
        var config = {
            "prefix": _prefix,
            "window": _window
        };
        // Utilities
        var util = {
            // Set the styleheet content of a set of jQuery elements
            // @_elements: (jQuery) object which represents a list of styles or links
            // @_value: (String) which represents the text to be dynamically written to a style tag - is also used to determine getter/setter functionality
            // Returns either the jQuery set or 
            "stylesheet": function(_elements, _value) {
                // Setter functionality
                if(_value !== undefined) {
                    // Return jQuery set
                    return _elements.each(function() {
                        // Test for Trident
                        if(this.styleSheet)
                            this.styleSheet.cssText = _value;
                        // Use either innerText (Webkit) or innerHTML (Gecko)
                        else
                            this.innerHTML = this.innerText = _value;
                    });
                }
                // Getter functionality
                else {
                    // Potential idea
                    return $.data(_elements[0], "contents");
                    
                    // Only need one element
                    var style = _elements[0];
                    // Test for Trident
                    if(style.styleSheet)
                        return style.styleSheet.cssText;
                    // Use either innerText (Webkit) or innerHTML (Gecko)
                    else
                        return style.innerHTML || style.innerText;
                }
            },
            // Come up with code to traverse DOM
            "getHTMLTree": function(node, obj) {
                //if(obj === {})
            },
            "uuid": function() {
                return "s_"+Math.floor(Math.random()*+new Date());
            }
        };
        // Events
        var evt = {
            // Handle preinit start
            "preinit": function() {
                $("body").append('<div id="livedit-wrapper"><div id="livedit-resize"></div><div id="livedit-navigation"><a id="livedit-inspect" href="#">Inspect</a><ul id="livedit-tabs"><li class="active"><a href="#">DOM</a></li><li><a href="#">Document Level</a></li><li><a href="#">External Stylesheets</a></li><li><a href="#">Script Console</a></li></ul></div><div id="livedit-content"><div id="livedit-inline" class="tab-content active">Not implemented yet...</div><div id="livedit-document" class="tab-content"><select id="livedit-document-styles" class="styles-dropdown"></select><textarea id="livedit-document-editable" class="styles-editable"></textarea></div><div id="livedit-external" class="tab-content"><select id="livedit-external-styles" class="styles-dropdown"></select><textarea id="livedit-external-editable" class="styles-editable"></textarea></div><div id="livedit-console" class="tab-content"><textarea id="livedit-console-editable" class="scripts-editable"></textarea><input type="button" value="Run Script" class="livedit-console-button" /><input type="button" value="Clear" class="livedit-console-button" /></div></div></div>');
                // Hover tabs
                var $tabs = jQuery("li", "#livedit-tabs").hover(function() {
                    var $this = $(this);
                    if($this.is(":not(.active)"))
                        $this.addClass("hover");
                }, function() {
                    $(this).removeClass("hover");
                })
                    // Click tabs
                    .click(function(event) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        var $this = $(this);
                        $("li.active", "#livedit-tabs").removeClass("active");
                        $this.addClass("active")
                            .removeClass("hover");
                        
                       // Display tab content
                       $("div", "#livedit-content").removeClass("active").eq($this.index()).addClass("active");
                       return false;
                    });
                    
                // Mousedown for resizing
                $("#livedit-resize").bind("mousedown", function(event) {
                    var $wrapper = $("#livedit-wrapper");
                    $wrapper.data("drag", true);
                    $wrapper.data("position", {
                        "x": evt.clientX,
                        "y": evt.clientY
                    });
                    
                    event.preventDefault();
                });
                
                $(document).bind("mouseup", function() {
                    $("#livedit-wrapper").removeData("drag");
                });
                
                $(document).bind("mousemove", function(event) {
                    var $wrapper = $("#livedit-wrapper");
                    if($wrapper.data("drag") === true) {
                        var width = $wrapper.width(),
                            height = $wrapper.height(),
                            lastY = $wrapper.data("position").y,
                            currentY = event.clientY;
                            
                        // Move down
                        if(currentY > lastY) {
                            height = height - (currentY - lastY);
                            $wrapper.data("position").y = currentY;
                        }
                        // Move up
                        else {
                            height = height + (lastY - currentY);
                            $wrapper.data("position").y = currentY;
                        }
                        
                        $wrapper.css("height", height+"px");
                        
                        $("#livedit-content div.tab-content textarea.styles-editable").css("height", (height-95)+"px");
                    }
                    
                    // TODO: Make the controls slightly transparent as you mouse away
                });  
            },
            // Handle the initial start
            "init": function() {
                // Override window object - yeah i'm that ballsy
                window = config.window;
                
                // Before init really happens, execute preinit events
                evt.preinit();
                // Load styles if they exist
                if($("style").length)
                    core.load("styles");
                else
                    $("#livedit-wrapper #livedit-tabs li:contains('Document Level')").unbind("click").bind("click", evt.stop);
                // Load links if they exist
                if($("link").length)
                    core.load("links");
                else
                    $("#livedit-wrapper #livedit-tabs li:contains('External Stylesheets')").unbind("click").bind("click", evt.stop);
                
                $("#livedit-external-editable, #livedit-document-editable")
                    // First clear the timeout
                    .bind("keyup keydown focus blur", evt.clearStyleTimeout)
                    // Only update style on keyup
                    .bind("keyup", evt.updateStyle);
                    
                
                $("head").append("<link rel='stylesheet' type='text/css' href='" + config.prefix + "edit.css' />");
            },
            
            // Update style section
            "updateStyleTimeout": undefined,
            "clearStyleTimeout": function() {
                window.clearTimeout(evt.updateStyleTimeout);
            },
            // Update the styles
            "updateStyle": function() {
                var that = this;
                evt.updateStyleTimeout = window.setTimeout(function() {
                    var $this = jQuery(that),
                        $selectable = $($this.data("selectable")),
                        $styleTag = $($selectable.find(":selected").data("uuid"))
                            .data("contents", $this.val());
                     
                    util.stylesheet($styleTag, $this.val());
                    return false;
                }, 500);
            },
            // Handle link url changes
            "listChange": function() {
                var $this = $(this),
                    $style = $($this.val());

                // Need to update the UUID associated with the styles
                $($this.data("editable")).val(util.stylesheet($style))
                    .data("uuid", this.value);
            },
            // Handle success
            "linkLoad": function(data) {
                // Save a reference to href
                var href = this.url,
                    // Pull reference of link from ajax object
                    $link = this.link,
                    // Generate a unique id for the id
                    uuid = util.uuid();
                    // Create the textarea shit
                    $editable = $("#livedit-external-editable").val(data)
                        .addClass("editable")
                        .data("selectable", "#livedit-external-styles"),
                        // Reference to dropdown
                        $stylesheets = $("#livedit-external-styles");

                $("<option value='#" + uuid + "'>" + unescape(href) + "</option>").appendTo($stylesheets)
                    .data("uuid", "#"+uuid);

                try {
                    $stylesheets.children("option").removeAttr("selected").last().attr("selected", "true");
                    //$stylesheets.children("option").removeAttr("selected");
                }
                catch(ex) {
                    //window.alert(ex.name);
                }

                var $styleTag = $("<style type='text/css'/>").attr("id", uuid)
                    .data({
                        "contents": data,
                        "original": $link[0]
                    });

                
                util.stylesheet($styleTag, data);
                $link.replaceWith($styleTag);
                
                // Currently setting this on every stylesheet, change
                // so that there is a load complete event and trigger
                // this code in there...
                $("#livedit-external-styles")
                    .data("editable", "#livedit-external-editable")
                    .bind("change", evt.listChange);
            },
            // Utility event to stop propgation, defaults, etc...
            "stop": function(event) {
                event.stopPropgation();
                event.preventDefault();
                
                return false;
            }
        };
        // Core functionality
        var core = {
            // Handles the loading in of style tags and link tags
            "load": function(type) {
                switch(type) {
                    case "styles":
                         $("style").each(function() {
                            var parent = this.parentNode.nodeName,
                                $this = $(this),
                                $stylesheets = $("#livedit-document-styles"),
                                // Generate a unique id for the id
                                uuid = util.uuid(),
                                    // Create the textarea shit
                                    $editable = $("#livedit-document-editable").val(this.innerHTML)
                                        .addClass("editable")
                                        .data("selectable", "#livedit-document-styles");
                                    
                            $("<option value='#" + uuid + "'>" + unescape(location.href) + ": " + parent + " > STYLE" + "</option>").appendTo($stylesheets)
                                .data("uuid", "#"+uuid);

                            try {
                                $stylesheets.children("option").removeAttr("selected").last().attr("selected", "true");
                            }
                            catch(ex) {
                                //window.alert(ex.name);
                            }

                            $this.attr("id", uuid);

                            $("#livedit-document-styles")
                                .data("editable", "#livedit-document-editable")
                                .bind("change", evt.listChange);
                        });
                    break;
                    case "links":
                        $("link[rel=stylesheet]").each(function() {
                            var $link = $(this),
                                href = this.href;
                                
                            $.ajax({
                                "link": $link,
                                "url": href,
                                "success": evt.linkLoad
                            });
                        });
                    break;
                    default:
                    break;
                }
            }
        };
        
        // Public sector
        var exposed = {
            "init": evt.init
        };
        
        // Make exposed public
        return exposed;
    }
    
    
    //$.fn.style = function(val) {
            //    if(val !== undefined) {
            //        return this.each(function() {
            //            if(this.styleSheet)
            //                this.styleSheet.cssText = val;
            //            else
            //                this.innerHTML = this.innerText = val;
            //        });
            //    }
            //    else {
            //        var style = this[0];
            //        if(style.styleSheet)
            //            return style.styleSheet.cssText;
            //        else
            //            return style.innerHTML || style.innerText;
            //    }
            //}
    
    
}(jQuery, window, document);

$(function() {
    //jQuery.liveEdit("http://www.tabdeveloper.com/jquery/LiveEdit/").init();
    jQuery.liveEdit("http://localhost/", window).init();
});