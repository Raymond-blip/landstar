$(document).ready(function () {

    // variables for commonly used html elements
    var $window = $(window),
        $html = $('html'),
        $body = $('body'),
        $header = $('header'),
        $navContainer = $('.navContainer'),
        $nav = $('.nav'),
        $navList = $('.fullNav'),
        $mobileNavToggle = $('#mobileNavToggle'),
        $logo = $('#siteLogo'),
        $navItems = $('.nav > .fullNav > ul > li > a'),
        $navAllLinks = $('.nav a'),
        $hasChildren = $('.hasChildren'),
        $childMenus = $hasChildren.parent().find('> ul'),
        navItemWidthTotal = 0,
        // variables for mobile menu when overflowing past screen (a problem with fixed position navigation)
        headHeight = 80, //$header.outerHeight(),
        winHeight = $window.height(),
        scrollPosition = $window.scrollTop(),
        navSpaceVertical = winHeight - headHeight,
        // variables for dynamic switching to mobile menu
        headerWidth = $nav.innerWidth(), //"100%", //$header.innerWidth(),
        compactBreakpoint = null,
        fullsizeBreakpoint = null,
        mobileBreakpoint = null,
        mobileNav = false,
        compactState = 'compactState',
        logoAndNavWidth,
        resizeTimer,
        navCount = 1,
        tablet = false
        ;

    // determine width of nav and logo
    function navItemWidths() {
        // each top level <a> width
        $navItems.each(function () {
            var $this = $(this),
                thisWidth = $this.outerWidth(true)
                    + parseInt($this.parent().css("margin-left"), 10)
                    + parseInt($this.parent().css("margin-right"), 10)
                    + parseInt($this.parent().css("padding-left"), 10)
                    + parseInt($this.parent().css("padding-right"), 10);

            navItemWidthTotal = navItemWidthTotal + thisWidth;
        });

        // allow for flexible spacing on <nav> 
        var navSpacing = parseInt($nav.css("margin-left"), 10)
            + parseInt($nav.css("margin-right"), 10)
            + parseInt($nav.css("padding-right"), 10)
            + parseInt($nav.css("padding-left"), 10);

        // allow for flexible spacing on top level <ul> 
        var navListSpacing = parseInt($navList.css("margin-left"), 10)
            + parseInt($navList.css("margin-right"), 10)
            + parseInt($navList.css("padding-left"), 10)
            + parseInt($navList.css("padding-right"), 10);

        // total width for all margin, padding, and top level link
        var navWidth = navSpacing + navListSpacing + navItemWidthTotal;

        // logo width... duh
        var logoWidth = 0;

        // final total
        logoAndNavWidth = logoWidth + navWidth;
        // reset total for a remeasure 
        navItemWidthTotal = 0;
    }
    navItemWidths();

    // set breakpoint for fullsize nav
    fullsizeBreakpoint = logoAndNavWidth;

    // toggle aria expanded
    function ariaExpanded(x, y) {
        x.attr('aria-expanded', function (i, attr) {
            return attr == 'true' ? 'false' : 'true';
        });
        y.attr('aria-expanded', function (i, attr) {
            return attr == 'true' ? 'false' : 'true';
        });
    }

    // remove js applied styles from nav
    function removeNavCss() {
        $navList.css({
            height: '',
            overflowY: '',
            paddingBottom: '',
            display: ''
        });
    }

    // add aria for mobile
    function addAria() {
        $mobileNavToggle.attr({
            'aria-expanded': 'false',
            'aria-haspopup': 'true',
            'aria-controls': $navList.attr('id')
        });

        $navList.attr({
            'aria-expanded': 'false',
            'aria-hidden': 'true',
            'aria-labeledby': $mobileNavToggle.attr('id')
        });
    }

    // revome non mobile aria tags
    function removeAria() {
        $mobileNavToggle.removeAttr('aria-expanded aria-haspopup aria-controls');
        $navList.removeAttr('aria-expanded aria-hidden aria-labeledby');
    }

    // resets nav back fullsize nav
    function navReset() {
        mobileNav = false;
        //$header.removeClass('mobileNav compactNav').addClass('fullSizeNav');
        $body.removeClass('positionFixed');
        $mobileNavToggle.removeClass('open');
        removeNavCss();
        $childMenus.removeClass('open');
        $('nav .clicked').removeClass('clicked');
        removeAria();
    }

    // fire off compact nav
    function compactNav() {
        //$header.removeClass('fullSizeNav mobileNav').addClass('compactNav');
        mobileNav = compactState;
        removeAria();
    }

    // set breakpoint for compact nav
    function setCompactBreakPoint() {
        //$header.removeClass('fullSizeNav mobileNav').addClass('compactNav');
        navItemWidths();
        compactBreakpoint = logoAndNavWidth;
        //$header.removeClass('compactNav');
    }
    setCompactBreakPoint();

    // fire off mobile nav
    function goMobile() {
        mobileNav = true;
        //$header.removeClass('fullSizeNav compactNav').addClass('mobileNav');
        addAria();
    }

    // check if desktop nav will work
    function navCheck() {
        if ($html.hasClass('mobile')) {
            goMobile();
        }
        if ($html.hasClass('tablet')) {
            navReset();
            tablet = true;
        }
        if ($html.hasClass('desktop')) {
            navReset();
        }
    }

    // events fired on resize
    $window.on('resize', function () {
        // redeclare variables needed for above functions
        winHeight = $window.height();
        headHeight = $nav.outerHeight(true);
        headerWidth = $nav.innerWidth();
        // still unsure if we need to wait for resize to complete or not. Leaving commented out for now
        // clearTimeout(resizeTimer);
        // resizeTimer = setTimeout(function () {
        navCheck();
        //}, 100);
    });

    // size mobile menu to screen and add overflow if neccesary
    function navSize() {
        winHeight = $window.height();
        headHeight = $logo.outerHeight(true);
        navSpaceVertical = winHeight - headHeight;
        $navList.css({
            height: navSpaceVertical + 'px',
            overflowY: 'scroll',
            paddingBottom: 0
        });
    }

    // mobile menu open and close
    $mobileNavToggle.on('click', function () {
        if (!$mobileNavToggle.hasClass('open')) {
            $mobileNavToggle.addClass('open').parent().find('.fullNav').addClass('active').slideDown(250, function () {
                headHeight = $logo.outerHeight();
                winHeight = $window.height();
                scrollPosition = $window.scrollTop();
                navSpaceVertical = winHeight - headHeight;
                ariaExpanded($mobileNavToggle, $navList);
                $navList.attr('aria-hidden', 'false');
                if ($navList.outerHeight() > navSpaceVertical) {
                    navSize();
                    scrollPosition = $window.scrollTop();
                    $body.addClass('positionFixed');
                }
            });
        } else {
            addAria();
            $body.removeClass('positionFixed');
            $window.scrollTop(scrollPosition);
            $mobileNavToggle.removeClass('open').parent().find('.fullNav').removeClass('active').slideUp(250);
            $('.nav .clicked').removeClass('clicked');
            $('.nav > .fullNav > ul > li > ul').removeClass('open', function () {
                removeNavCss();
            });
            $navList.removeClass('active', function () {
                removeNavCss();
            });
        }
    });

    // child menu functionality
    $hasChildren.each(function () {
        var $this = $(this),
            $theChildren = $this.parent().find('> ul'),
            uniqueNavID = $.trim($this.text()).replace(/\s/g, '') + '-' + navCount,
            childrenID = 'ctrl-' + uniqueNavID,
            screenSpace,
            childrenOffsetX
            ;

        // fire off aria tags
        $this.attr({
            'aria-role': 'button',
            'aria-expanded': 'false',
            'id': uniqueNavID,
            'aria-haspopup': 'true',
            'aria-controls': childrenID
        });

        $theChildren.attr({
            'id': childrenID,
            'role': 'group',
            'aria-expanded': 'false',
            'aria-hidden': 'true',
            'aria-labeledby': uniqueNavID
        });

        // show child menus on hover
        function showChildren() {
            $hasChildren.attr('aria-expanded', 'false').removeClass('open').removeClass('clicked');
            $childMenus.attr({
                'aria-hidden': 'true',
                'aria-expanded': 'false'
            });
            $this.attr('aria-expanded', 'true').addClass('open').addClass('clicked');
            $theChildren.stop().attr({
                'aria-hidden': 'false',
                'aria-expanded': 'true'
            });
        }
        $this.on('click', function (e) {
            if (tablet == true) {
                if (!$this.hasClass('open')) {
                    e.preventDefault();
                    showChildren();
                } else {
                    // treat it like a normal click
                }
            }
        });
        $this.on('mouseover', function () {
            if (mobileNav == false && tablet == false) {
                showChildren();
            }
        });

        // hide child menus on hover
        function hideChildren() {
            $this.attr('aria-expanded', 'false').removeClass('open').removeClass('clicked');
            $theChildren.stop().attr({
                'aria-hidden': 'true',
                'aria-expanded': 'false'
            });
        }
        //$this.parent().on('mouseleave', function () {
        //    hideChildren();
        //    $theChildren.removeClass('open');
        //});
        $this.parent().siblings().find('a').on('mouseover', function () {
            hideChildren();
            $theChildren.removeClass('open');
        });

        // show or hide child menus on click/touch
        $this.on('click touch', function (e) {
            if (!$theChildren.hasClass('open') && mobileNav == true) {
                e.preventDefault();
                $this.addClass('clicked').addClass('open');
                ariaExpanded($this, $theChildren);
                $theChildren.addClass('open').attr('aria-hidden', 'false');
            }
        });
        navCount++;
    });

    // close nav when focus leaves
    function resetNavFocus() {
        $hasChildren.attr('aria-expanded', 'false');
        $childMenus.removeClass('open').stop().attr({
            'aria-hidden': 'true',
            'aria-expanded': 'false'
        });
    }
    //$header.next().on('focusin', function () {
    //    resetNavFocus();
    //});
    $nav.prev().on('focusin', function () {
        resetNavFocus();
    });

    navCheck();

    
    $nav.on('mouseenter focusin', function () {
        clearTimeout(resizeTimer);
        $nav.addClass('active');
        $navContainer.addClass('active');
    });
    $nav.on('mouseleave focusout', function () {
        resizeTimer = window.setTimeout(function () {
            $nav.removeClass('active');
            $navContainer.removeClass('active');
            $hasChildren.attr('aria-expanded', 'false').removeClass('open').removeClass('clicked');
            $childMenus.removeClass('open').attr({
                'aria-hidden': 'true',
                'aria-expanded': 'false'
            });
        }, 300);
    });
});
