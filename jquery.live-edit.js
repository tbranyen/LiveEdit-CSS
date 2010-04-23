(function($, window, document, undefined) {
    // Need comments here!
    $.liveEdit = function liveEdit(_prefix) {
        // Constants
        var config = {
            "prefix": _prefix
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
                        if(this.styleSheet) {
                            this.styleSheet.cssText = _value;
                        }
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
            }
        };
        // Events
        var evt = {
            // Handle preinit start
            "preinit": function() {
                $("body").append('<div id="livedit-wrapper"><div id="livedit-resize"></div><div id="livedit-navigation"><a id="livedit-inspect" href="#">Inspect</a><ul id="livedit-tabs"><li class="active"><a href="#">DOM</a></li><li><a href="#">Document Level</a></li><li><a href="#">External Stylesheets</a></li></ul></div><div id="livedit-content"><div id="livedit-inline" class="tab-content active">Not implemented yet...</div><div id="livedit-document" class="tab-content"><select id="livedit-document-styles" class="styles-dropdown"></select><textarea id="livedit-document-editable" class="styles-editable"></textarea></div><div id="livedit-external" class="tab-content"><select id="livedit-external-styles" class="styles-dropdown"></select><textarea id="livedit-external-editable" class="styles-editable"></textarea></div></div></div>');
                
                // Hover tabs
                var $tabs = jQuery("li", "#livedit-tabs").hover(function() {
                    var $this = $(this);
                    if($this.is(":not(.active)"))
                        $this.addClass("hover");
                }, function() {
                    $(this).removeClass("hover");
                })
                    // Click tabs
                    .click(function(evt) {
                        evt.preventDefault();
                        var $this = $(this);
                        jQuery("li.active", "#livedit-tabs").removeClass("active");
                        $this.addClass("active")
                            .removeClass("hover");
                        
                       // Display tab content
                       $("div", "#livedit-content").removeClass("active").eq($this.index()).addClass("active");
                    });
                    
                // Mousedown for resizing
                $("#livedit-resize").bind("mousedown", function(evt) {
                    var $wrapper = $("#livedit-wrapper");
                    $wrapper.data("drag", true);
                    $wrapper.data("position", {
                        "x": evt.clientX,
                        "y": evt.clientY
                    });
                    
                    evt.preventDefault();
                });
                
                $(document).bind("mouseup", function(evt) {
                    $("#livedit-wrapper").removeData("drag");
                });
                
                $(document).bind("mousemove", function(evt) {
                    var $wrapper = $("#livedit-wrapper");
                    if($wrapper.data("drag") === true) {
                        var width = $wrapper.width(),
                            height = $wrapper.height(),
                            lastY = $wrapper.data("position").y,
                            currentY = evt.clientY;
                            
                        // Move down
                        if(currentY > lastY) {
                            height = height - (currentY - lastY);
                            //console.log("Down ", height);
                            $wrapper.data("position").y = currentY;
                        }
                        // Move up
                        else {
                            height = height + (lastY - currentY);
                            //console.log("Up ", height);
                            $wrapper.data("position").y = currentY;
                        }
                        
                        $wrapper.css("height", height+"px");
                        
                        $("#livedit-content div.tab-content textarea.styles-editable").css("height", (height-95)+"px");
                    }
                });  
            },
            // Handle the initial start
            "init": function() {
                // Before init really happens, execute preinit events
                evt.preinit();
                // Load styles if they exist
                if($("style").length)
                    core.load("styles");
                // Load links if they exist
                if($("link").length)
                    core.load("links");
                    
                $("head").append("<link rel='stylesheet' type='text/css' href='" + config.prefix + "edit.css' />");
            },
            // Update the styles
            "updateStyle": function(evt) {
                var $this = jQuery(this),
                    $selectable = $($this.data("selectable")),
                    $styleTag = $($selectable.find(":selected").data("uuid"))
                        .data("contents", $this.val());
                        
                util.stylesheet($styleTag, $this.val());
                evt.preventDefault();
                evt.stopPropagation();
                return false;
            },
            // Handle link url changes
            "listChange": function(evt) {
                var $this = $(this),
                    $style = $($this.val());

                $($this.data("editable")).val(util.stylesheet($style));
            },
            // Handle success
            "linkLoad": function(data) {
                // Save a reference to href
                var href = this.url,
                    // Pull reference of link from ajax object
                    $link = this.link,
                    // Generate a unique id for the id
                    uuid = "s_"+Math.floor(Math.random()*+new Date()),
                    // Create the textarea shit
                    $editable = $("#livedit-external-editable").val(data)
                        .addClass("editable")
                        .data("selectable", "#livedit-external-styles")
                        .bind("keyup", evt.updateStyle);

                // Set the dropdown values
                var $stylesheets = $("#livedit-external-styles");
                $("<option value='#" + uuid + "'>" + unescape(href) + "</option>").appendTo($stylesheets)
                    .data("uuid", "#"+uuid);
                
                $stylesheets.children("option").removeAttr("selected").last().attr("selected", "true");
                   
                var $styleTag = $("<style type='text/css'/>").attr("id", uuid)
                    .data("contents", data);
                
                util.stylesheet($styleTag, data);
                $link.replaceWith($styleTag);

                $("#livedit-external-styles")
                    .data("editable", "#livedit-external-editable")
                    .bind("change", evt.listChange);
            }
        };
        // Core functionality
        var core = {
            "load": function(type) {
                switch(type) {
                    case "styles":
                         $("style").each(function() {
                            var parent = this.parentNode.nodeName,
                                $this = $(this),
                                $stylesheets = $("#livedit-document-styles");

                            $stylesheets.append("<option value='#" + uuid + "'>" + unescape(location.href) + ": " + parent + " > STYLE" + "</option>");

                            // Generate a unique id for the id
                            var uuid = "s_"+Math.floor(Math.random()*+new Date()),
                                // Create the textarea shit
                                $editable = $("#livedit-document-editable").val(this.innerHTML)
                                    .addClass("editable")
                                    .data("uuid", "#"+uuid)
                                    .bind("keyup", evt.updateStyle);

                            var styles = util.stylesheet($this);
                            $this.attr("id", uuid);
                            util.stylesheet($this, styles);

                            $("#livedit-document-styles").data("editable", "#livedit-document-editable").bind("change", evt.listChange);
                        });
                    break;
                    case "links":
                        jQuery("link[rel=stylesheet]").each(function() {
                            var $link = jQuery(this),
                                href = this.href;
                                
                            jQuery.ajax({
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
    
    
})(jQuery, window, document);

jQuery.liveEdit("http://www.tabdeveloper.com/jquery/LiveEdit/").init();