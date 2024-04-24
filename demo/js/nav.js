$(function() {
    // --- Initialize container
    $(".container-bottom").height((document.documentElement.clientHeight - 60) + "px");
    $(".container-index-bottom").height((document.documentElement.clientHeight - 140) + "px");

    // --- Initialize tags
    $("#search-tag").autocomplete({
        source: function (request, response) {
            // Using a custom source callback to match only the beginning of terms
            var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term), "i");
            $.ajax({
                url: "data/ajax-data-tags.json",
                success: function(data) {
                    response($.grep(data, function (item) {
                        return matcher.test(item.label);
                    }));
                }
            });
        },
        select: function(event, ui) {
            window.open(ui.item.href, ui.item.target ? ui.item.target : "content");
        }
    });

    $("#search-tag").keydown(function(e) {
        var that = $(this);
        if (e && e.which === $.ui.keyCode.ENTER && that.val().length > 0) {
            var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(that.val()), "i");
            $.ajax({
                url: "data/ajax-data-tags.json",
                success: function(data) {
                    var ll = $.grep(data, function (item) {
                        return matcher.test(item.label);
                    });
                    if (ll.length > 0) {
                        that.val(ll[0].value);
                        that.autocomplete("close");
                        window.open(ll[0].href, ll[0].target ? ll[0].target : "content");
                    } else {
                        window.open("error-404.html", "content");
                    }
                }
            });
        } else if (e && e.which === $.ui.keyCode.ESCAPE){
            that.val("");
        }
    });
                                                                                    
    // --- Initialize tabs
    $("#tabs").tabs({
        heightStyle: "fill"
    });

    // --- Initialize tree
    $("#tree-nav").fancytree({
        treeId: "nav",
        autoActivate: false, // we use scheduleAction()
        autoCollapse: false,
        // autoFocus: true,
        autoScroll: true,
        clickFolderMode: 3, // expand with single click
        minExpandLevel: 1,
        tabindex: "-1", // we don't want the focus frame
        // toggleEffect: { effect: "blind", options: {direction: "vertical", scale: "box"}, duration: 2000 },
        // scrollParent: null, // use $container
        source: {
            url: "data/ajax-data-nav.json"
        },
        tooltip: function(event, data) {
            return data.node.title;
        },
        focus: function(event, data) {
            var node = data.node;
            // Auto-activate focused node after 1 second
            if(node.data.href){
                node.scheduleAction("activate", 1000);
            }
        },
        blur: function(event, data) {
            data.node.scheduleAction("cancel");
        },
        beforeActivate: function(event, data) {
            var node = data.node;

            if( node.data.href && node.data.target === "_blank") {
                window.open(node.data.href, "_blank");
                return false; // don't activate
            }
        },
        activate: function(event, data) {
            var node = data.node,
                orgEvent = data.originalEvent || {};

            // Open href (force new window if Ctrl is pressed)
            if(node.data.href){
                window.open(node.data.href, (orgEvent.ctrlKey || orgEvent.metaKey) ? "_blank" : node.data.target);
            }
            // When an external link was clicked, we don't want the node to become
            // active. Also the URL fragment should not be changed
            if( node.data.target === "_blank") {
                return false;
            }
            // Append #HREF to URL without actually loading content
            // (We check for this value on page load re-activate the node.)
            if( window.parent &&  parent.history && parent.history.pushState ) {
                parent.history.pushState({title: node.title}, "", "#" + (node.data.href || ""));
            }
        },
        click: function(event, data) {
            // We implement this in the `click` event, because `activate` is not
            // triggered if the node already was active.
            // We want to allow re-loads by clicking again.
            var node = data.node,
                orgEvent = data.originalEvent;

            // Open href (force new window if Ctrl is pressed)
            if(node.isActive() && node.data.href){
                window.open(node.data.href, (orgEvent.ctrlKey || orgEvent.metaKey) ? "_blank" : node.data.target);
            }
        }
    });

    // --- Initialize tree-index
    $("#tree-index").fancytree({
        extensions: ["table", "filter"],
        checkbox: false,
        quicksearch: true,
        table: {
            nodeColumnIdx: 0     // render the node title into the 1st column
        },
        filter: {
            autoApply: true,   // Re-apply last filter if lazy data is loaded
            autoExpand: false, // Expand all branches that contain matches while filtered
            counter: true,     // Show a badge with number of matching child nodes near parent icons
            fuzzy: true,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
            hideExpandedCounter: true,  // Hide counter badge if parent is expanded
            hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
            highlight: true,   // Highlight matches by wrapping inside <mark> tags
            leavesOnly: false, // Match end nodes only
            nodata: true,      // Display a 'no data' status node if result is empty
            mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
        },
        source: {
            url: "data/ajax-data-index.json"
        },
        tooltip: function(event, data) {
            return data.node.title;
        },
        click: function(event, data) {
            // We implement this in the `click` event, because `activate` is not
            // triggered if the node already was active.
            // We want to allow re-loads by clicking again.
            var node = data.node,
                orgEvent = data.originalEvent;

            // Open href (force new window if Ctrl is pressed)
            if(node.data.href){
                window.open(node.data.href, (orgEvent.ctrlKey || orgEvent.metaKey) ? "_blank" : node.data.target);
            }
        }
    });

    // --- Initialize search-index
    $("#search-index").keyup(function(e) {
        var tree = $.ui.fancytree.getTree("#tree-index"),
            args = "autoApply autoExpand fuzzy hideExpanders highlight leavesOnly nodata".split(" "),
            opts = {},
            filterFunc = tree.filterNodes,
            match = $(this).val();

        if(e && e.which === $.ui.keyCode.ESCAPE || $.trim(match) === ""){
            $("button#btnResetSearch").trigger("click");
            return;
        }
        
        filterFunc.call(tree, match, opts);
        $("button#btnResetSearch").attr("disabled", false);
    });

    $("button#btnResetSearch").click(function(e) {
        $("#search-index").val("");
        $.ui.fancytree.getTree("#tree-index").clearFilter();
        $(this).attr("disabled", true);
    }).attr("disabled", true);

    // --- Initialize tree-tags
    $("#tree-tags").fancytree({
        extensions: ["table"],
        checkbox: false,
        table: {
            nodeColumnIdx: 0     // render the node title into the 1st column
        },
        source: {
            url: "data/ajax-data-tags.json"
        },
        tooltip: function(event, data) {
            return data.node.title;
        },
        click: function(event, data) {
            // We implement this in the `click` event, because `activate` is not
            // triggered if the node already was active.
            // We want to allow re-loads by clicking again.
            var node = data.node,
                orgEvent = data.originalEvent;

            // Open href (force new window if Ctrl is pressed)
            if(node.data.href){
                window.open(node.data.href, (orgEvent.ctrlKey || orgEvent.metaKey) ? "_blank" : node.data.target);
            }
        }
    });

    // On page load, activate node if node.data.href matches the url#href
    var tree = $.ui.fancytree.getTree("#tree-nav"),
        frameHash = window.parent && window.parent.location.hash;


    if (frameHash) {
        frameHash = frameHash.replace("#", "");
        var intervalId = setInterval(function() {
            if (!tree.isLoading()) {
                tree.visit(function(n) {
                    if (n.data.href && n.data.href === frameHash) {
                        n.setActive();
                        return false; // done: break traversal
                    }
                });
                clearInterval(intervalId);
            }
        }, 100);
    }

    // On window resize
    window.addEventListener('resize', function() {
        location.reload();
    });
});