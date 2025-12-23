// global bp checks
var bp = window
    .getComputedStyle(document.querySelector("html"), ":after")
    .getPropertyValue("content"); //get what breakpoint we're in.
bp = bp.substring(1, bp.length - 1); //removing surrounding quotes

var formTooltip;

// have to fire doc on ready in more than one place
function onReady() {
    $(document).ready(function () {
        // global variables
        var $win = $(window),
            $body = $("body"),
            $modalTrigger = $("[data-modal_trigger]"),
            $modalWindow = $("[data-modal_content]"),
            scrollPos = $win.scrollTop(),
            modalOpen = false,
            modalCounter = 1;
        // just add data attributes to the modal and trigger with matching values
        // modal windows must be at the END of the body
        // 'open' class is toggled on the modal, use that for transition animation
        // the modal will need a [data-modal_trigger] element inside itself for closing
        $modalTrigger.each(function () {
            var $this = $(this),
                winHeight = $win.height(),
                targetData = $this.data("modal_trigger"),
                $target = $("[data-modal_content='" + targetData + "']"),
                $modalInner = $target.children("*").first(),
                $labeledByElement = $modalInner
                    .contents(":not(:empty)")
                    .first(),
                labeledByText =
                    $.trim($labeledByElement.text()).replace(/\s/g, "") +
                    modalCounter,
                insertString = "<div tabindex='0'></div>",
                $firstTabbable = $modalInner
                    .contents(":not([tabindex=-1])")
                    .first(),
                $lastTabbable = $modalInner
                    .contents(":not([tabindex=-1])")
                    .last();
            // prevent duplicate loops for closing buttons inside modal
            if (!$this.parents("[data-modal_content]").length) {
                // adding accesibility attributes
                $labeledByElement.attr({
                    id: labeledByText,
                    tabindex: "0",
                });
                $modalInner
                    .attr({
                        role: "dialog",
                        id: "modal" + modalCounter,
                        "aria-labelledby": labeledByText,
                        "aria-modal": "true",
                    })
                    .before("<div tabindex='0' class='focus_first'></div>")
                    .after("<div tabindex='0' class='focus_last'></div>");
            }

            // close modal, fired in a few places
            function closeModal() {
                if (modalOpen === true) {
                    $body.removeClass("positionFixed").css({
                        marginTop: "",
                    });
                    $win.scrollTop(scrollPos);
                    modalOpen = false;
                }
                //we 'stop' the iframe from playing by reloading the contents
                var frame = $target.find("iframe").first();
                var iframeSrc = frame.attr("src");
                if (iframeSrc) {
                    frame.attr("src", iframeSrc);
                }
                $modalWindow.removeClass("open");
                $modalInner.css({
                    maxHeight: "",
                    marginTop: "",
                });
                $(document)
                    .find($("[data-modal_trigger_clicked=true]"))
                    .trigger("focus")
                    .removeAttr("data-modal_trigger_clicked");
                $("[data-modal_trigger]").blur();
            }

            // maintain focus inside modal while it's open
            $target.parent().on("focus", ".focus_first", function () {
                $lastTabbable.trigger("focus");
            });
            $target.parent().on("focus", ".focus_last", function () {
                $firstTabbable.trigger("focus");
            });

            // open/close toggling on trigger
            $this.on("click", function () {
                if (!$target.hasClass("open")) {
                    modalOpen = true;
                    $this.attr("data-modal_trigger_clicked", "true");
                    // prevent page scrolling when modal open
                    scrollPos = $win.scrollTop();
                    $body.addClass("positionFixed").css({
                        marginTop: 0 - scrollPos,
                    });
                    $modalWindow.not($target).removeClass("open");
                    $target.addClass("open");
                    $labeledByElement.trigger("focus");
                    // sizes modal for larger screens
                    if ($win.width() > 604) {
                        $modalInner.css({
                            maxHeight: winHeight * 0.9,
                            marginTop: winHeight * 0.05,
                        });
                    } else {
                        // otherwise go full screen
                        $modalInner.css({
                            maxHeight: winHeight,
                            marginTop: 0,
                        });
                    }
                } else {
                    closeModal();
                }
                return false;
            });
            // touch modal overlay closes modal
            $target.each(function () {
                var $this = $(this),
                    $children = $this.children();
                $this.on("click", function () {
                    closeModal();
                });
                $children.on("click", function (e) {
                    e.stopPropagation();
                });
            });

            // increment modal counter to ensure unique ID's
            modalCounter++;

            // close modal with esc key
            $(document).on("keyup", function (evt) {
                if (evt.keyCode == 27) {
                    closeModal();
                }
            });
        });
        // fire off lazy load
        $("img, [data-background]").unveil(200);

        // responsive videos)
        $("iframe[src*='youtu'], iframe[src*='vimeo']").each(function () {
            $(this).wrap(
                "<div class='videoSizer'><div class='responsiveVideo'></div></div>"
            );
        });
        var $videoWrap = $(".responsiveVideo"),
            embedVideoAspect = 0;
        function responsiveVideos() {
            $videoWrap.each(function () {
                var $this = $(this),
                    $video = $this.find("iframe");
                embedVideoAspect = $video.attr("width") / $video.attr("height");
                $this.css({
                    height: $video.width() / embedVideoAspect,
                });
            });
        }
        responsiveVideos();
        $(window).on("resize", function () {
            responsiveVideos();
        });

        // define alert bar cookie
        var cookie = document.cookie
            .split(";")
            .map(function (x) {
                return x.trim().split("=");
            })
            .filter(function (x) {
                return x[0] === "alertBarCookie";
            })
            .pop();

        // create alert bar cookie
        function alertBarCookie() {
            hours = 48;
            myDate = new Date();
            myDate.setTime(myDate.getTime() + 48 * 60 * 60 * 1000);
            document.cookie =
                "alertBarCookie=Closed; expires=" + myDate.toGMTString();
        }

        // kill alert bar with close button
        $(".alert_bar button").on("click", function () {
            $(".alert_bar").remove();
            alertBarCookie();
            return false;
        });

        //forms functionality
        $(".umbraco-forms-field").on("click", function (event) {
            var self = $(this);
            $(self).find("input, textarea, select").focus();
            $(self).children(".umbraco-forms-tooltip").addClass("hiding");
            setTimeout(function () {
                $(self)
                    .children(".umbraco-forms-tooltip")
                    .removeClass("show hiding");
            }, 300);
        });

        $(".umbraco-forms-field")
            .find("input, textarea, select")
            .focusin(function () {
                var parent = $(this).closest(".umbraco-forms-field");
                if (
                    $(parent).hasClass("typing") ||
                    $(parent).hasClass("filled")
                ) {
                    //do nothing
                } else {
                    $(parent).addClass("typing");
                }
            });

        $(".umbraco-forms-field").focusout(function () {
            if ($(this).find("input, textarea, select").val() === "") {
                $(this).removeClass("typing");
            } else {
                $(this).removeClass("typing").addClass("filled");
            }
        });
        $(".umbraco-forms-field").each(function () {
            if ($(this).find("input, textarea, select").val().length > 0) {
                $(this).addClass("filled");
            }
        });
        $(".umbraco-forms-field")
            .on("mouseenter", function (event) {
                var self = $(this);
                formTooltip = setTimeout(function () {
                    $(self).children(".umbraco-forms-tooltip").addClass("show");
                }, 1500);
            })
            .on("mouseleave", function (event) {
                clearTimeout(formTooltip);
                var self = $(this);
                $(self).children(".umbraco-forms-tooltip").addClass("hiding");
                setTimeout(function () {
                    $(self)
                        .children(".umbraco-forms-tooltip")
                        .removeClass("show hiding");
                }, 300);
            });

        // toggle animated input labels
        //Contact page functionality
        $(".contact_field").on("click", function (event) {
            $(this).children("input, textarea, select").focus();
        });

        $(".contact_field")
            .children("input, textarea, select")
            .focusin(function () {
                var parent = $(this).closest(".contact_field");
                if (
                    $(parent).hasClass("typing") ||
                    $(parent).hasClass("filled")
                ) {
                    //do nothing
                } else {
                    $(parent).addClass("typing");
                }
            });

        $(".contact_field").focusout(function () {
            if ($(this).children("input, textarea, select").val() === "") {
                $(this).removeClass("typing");
            } else {
                $(this).removeClass("typing").addClass("filled");
            }
        });
        $(".contact_field").each(function () {
            if ($(this).children("input, textarea, select").val().length > 0) {
                $(this).addClass("filled");
            }
        });
        //$('.videoGallery_main').slick();
        if ($(".videoGallery_main").children().length > 1) {
            $(".videoGallery_main").slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                //mobileFirst: true,
                asNavFor: ".videoGallery_nav",
            });
            $(".videoGallery_nav").slick({
                slidesToShow: 3,
                slidesToScroll: 1,
                asNavFor: ".videoGallery_main",
                //dots: true,
                draggable: false,
                arrows: false,
                //variableWidth: true,
                //useTransform: false,
                //mobileFirst: true,
                centerMode: true,
                centerPadding: "25px",
                focusOnSelect: true,
            });
        }

        function ctaStackAdjust() {
            $(".stackedCta_desc").each(function () {
                var self = $(this);
                var halfWidth = $(self).width() / 2;
                var btnWidth = $(self).children(".btn").outerWidth();
                if (btnWidth < halfWidth) {
                    $(self).children("p").addClass("adjust");
                }
            });
        }
        ctaStackAdjust();
        $(window).on("resize", function () {
            ctaStackAdjust();
        });
        $(".mod_galleryMod .mod_inner").each(function () {
            // the containers for all your galleries
            $(this).magnificPopup({
                delegate: "a", // the selector for gallery item
                type: "image",
                gallery: {
                    enabled: true,
                },
                image: {
                    titleSrc: function (item) {
                        return item.el.attr("title");
                    },
                },
                mainClass: "mfp-fade",
            });
        });

        $(".mod_galleryMod .mod_inner").each(function () {
            var imgCount = $(
                ".mod_galleryMod .mod_inner .mod_galleryItem:not(._fake)"
            ).length;
            x = 8;
            $(".mod_galleryMod .mod_inner .mod_galleryItem:not(._fake)")
                .not(":lt(8)")
                .addClass("hidden")
                .hide();
            if (imgCount < 9) {
                $(this).find(".btn").remove();
            }
            $(this)
                .find(".btn")
                .click(function () {
                    x = x + 8 <= imgCount ? x + 8 : imgCount;
                    $(
                        ".mod_galleryMod .mod_inner .mod_galleryItem:not(._fake):lt(" +
                            x +
                            ")"
                    )
                        .removeClass("hidden")
                        .slideDown();
                    if (
                        !$(
                            ".mod_galleryMod .mod_inner .mod_galleryItem:not(._fake)"
                        ).hasClass("hidden")
                    ) {
                        $(this).fadeOut();
                    }
                });
        });

        $(".mod_sliderActual").slick({
            dots: true,
        });

        $(".mod_modItem .mod_rteMod").each(function () {
            var $thisMod = $(this);
            var thisClasses = $thisMod.parent().attr("class").replace(" ", "");
            if ($thisMod.parent().next().find(".mod_rteMod").length) {
                var nextClasses = $thisMod
                    .parent()
                    .next()
                    .attr("class")
                    .replace(" ", "");
                if (thisClasses === nextClasses) {
                    $thisMod.parent().addClass("_bottomless");
                }
            }
        });

        $("#emailSignUp").on("submit", function () {
            $("#emailSignUpBtn").attr("disabled", "disabled");
            $.post({
                url: "/Umbraco/Api/blogsubscription/submit",
                data: {
                    emailAddress: $("#blogEmailAddress").val(),
                },
            })
                .done(function (data) {
                    $("#emailSignUp").hide();
                    $("#emailSignUpThankYouMessage").show();
                })
                .fail(function (data) {
                    $("#emailSignUp").hide();
                    $("#emailSignUpFailMessage").show();
                });
            return false;
        });
    }); //end doc ready
}

onReady();

// seemless page transitions
$(function () {
    "use strict";
    var $page = $("#main"),
        options = {
            debug: false,
            prefetch: true,
            cacheLength: 2,
            forms: "form",
            blacklist: ".no_spt, form",
            onStart: {
                duration: 250, // Duration of our animation
                render: function ($container) {
                    // Add your CSS animation reversing class
                    $container.addClass("is_exiting");
                    // Restart your animation
                    smoothState.restartCSSAnimations();
                },
            },
            onReady: {
                duration: 0,
                render: function ($container, $newContent) {
                    // Remove your CSS animation reversing class
                    $container.removeClass("is_exiting");
                    // Inject the new content
                    $container.html($newContent);
                    if (window.location.hash) {
                        $([document.documentElement, document.body]).animate(
                            {
                                scrollTop: $(window.location.hash).offset().top,
                            },
                            1000
                        );
                    }
                },
            },
            onAfter: function (url, $container, $content) {
                $(function () {
                    onReady();
                });
            },
        },
        smoothState = $page.smoothState(options).data("smoothState");
});

// Accordion
$(".accordion-header").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);

    $(".accordion-icon").html("+");

    if (!$this.hasClass("accordion-active")) {
        $(".accordion-body").slideUp(400);
        $(".accordion-header").removeClass("accordion-active");
        $(".accordion-item").addClass("accordion-border");
        $(".accordion-icon").removeClass("accordion__rotate");
    }

    if ($this.hasClass("accordion-active")) {
        $(".accordion-icon", this).html("+");
    } else {
        $(".accordion-icon", this).html("-");
    }

    $this.toggleClass("accordion-active");
    $this.next().slideToggle();
    $this.closest(".accordion-item").toggleClass("accordion-border");
});

// Video Grid
$(".thumbnail").on("click", function () {
    var $mainVideo = $(this).closest(".video-grid").find(".main-video-grid");
    var defVidUrl = $mainVideo.attr("data-videoUrl");
    var defPosUrl = $mainVideo.attr("data-posterUrl");
    var defTitle = $mainVideo.attr("data-title");
    var defTitleHtml = $.parseHTML(defTitle);
    var defDes = $mainVideo.attr("data-description");
    var defCta = $mainVideo.attr("data-cta");
    var defThumb = $mainVideo.attr("data-thumb");

    var vidUrl = $(this).attr("data-videoUrl");
    var posUrl = $(this).attr("data-posterUrl");
    var title = $(this).attr("data-title");
    var titleHtml = $.parseHTML(title);
    var des = $(this).attr("data-description");
    var cta = $(this).attr("data-cta");
    var thumb = $(this).attr("data-thumb");

    $(this).closest(".video-grid").find(".video-grid-close").fadeOut();
    $(this).closest(".video-grid").find(".video-container").removeClass("playing");
    $(this).closest(".video-grid").find(".video-grid-poster").fadeIn();
    $(this).closest(".video-grid").find(".main-video-content").fadeIn();
    
    $mainVideo.attr("src", vidUrl);
    $mainVideo.attr("poster", posUrl);
    $(this).closest(".video-grid").find(".main-video-content .title").text("");
    $(this).closest(".video-grid").find(".main-video-content .title").append(titleHtml);
    $(this).closest(".video-grid").find(".main-video-content .description").text(des);
    $(this).closest(".video-grid").find(".videoGallery_vidLink .video-cta").text(cta);
    $mainVideo.attr("data-videoUrl", vidUrl);
    $mainVideo.attr("data-posterUrl", posUrl);
    $mainVideo.attr("data-title", title);
    $mainVideo.attr("data-description", des);
    $mainVideo.attr("data-cta", cta);
    $mainVideo.attr("data-thumb", thumb);
    $(this).closest(".video-grid").find(".video-grid-poster").css("background-image", "url(" + posUrl + ")");

    $(this).find("> img").attr("src", defThumb);
    $(this).find("p").text("");
    $(this).find("p").append(defTitleHtml);
    $(this).attr("data-videoUrl", defVidUrl);
    $(this).attr("data-posterUrl", defPosUrl);
    $(this).attr("data-title", defTitle);
    $(this).attr("data-description", defDes);
    $(this).attr("data-cta", defCta);
    $(this).attr("data-thumb", defThumb);

    $mainVideo[0].load();
    $(".main-video-content").fadeIn();
});

$(".video-grid .btn").on("click", function (e) {
    e.preventDefault();
    $(this).closest(".main-video").find(".main-video-grid").get(0).play();
});

$(".main-video .video-grid-close").on("click", function (e) {
    e.preventDefault();
    $(this).closest(".main-video").find(".main-video-grid").get(0).pause();
    $(this).fadeOut();
    $(this).closest(".main-video").find(".video-grid-poster").fadeIn();
    $(this).closest(".main-video").closest(".main-video").find(".main-video-content").fadeIn();
    $(this).closest(".main-video").find(".video-container").removeClass("playing");
    $(this).closest(".main-video").removeAttr("controls", "controls");
});

// Function to handle play and pause events for video grid
function handleVideoEvent(videoElement, isPlaying) {
    
    const videoPoster = $(videoElement).closest(".main-video").find(".video-grid-poster");
    const videoContent = $(videoElement).closest(".main-video").find(".main-video-content");
    const videoContainer = $(videoElement).closest(".video-container");
    const videoClose = $(videoElement).closest(".main-video").find(".video-grid-close");

    if (isPlaying) {
        videoPoster.fadeOut();
        videoContent.fadeOut();
        videoContainer.addClass("playing");
        $(videoElement).attr("controls", "controls");
        videoClose.fadeIn();
        
    }

    return videoElement; // Return the video element
}

// Add event listeners for play events using jQuery
$(".main-video-grid").on("play", function(event) {
    handleVideoEvent(this, true);
});

// Add event listeners for pause events using jQuery
$(".main-video-grid").on("pause", function(event) {
    handleVideoEvent(this, false);
});

$(".hero-video .btn").on("click", function (e) {
    e.preventDefault();
    $(this).closest(".main-video").find(".main-video-hero").get(0).play();
});

$(".main-video .hero-video-close").on("click", function (e) {
    e.preventDefault();
    $(this).closest(".main-video").find(".main-video-hero").get(0).pause();
    $(this).fadeOut();
    $(this).closest(".main-video").find(".video-poster").fadeIn();
    $(this).closest(".main-video").closest(".main-video").find(".main-video-content").fadeIn();
    $(this).closest(".main-video").find(".video-container").removeClass("playing");
    $(this).closest(".main-video").removeAttr("controls", "controls");
    $(this).closest(".main-video").find(".main-video-hero").css("z-index", "unset");
    $(this).closest(".main-video").find(".video-container").removeClass("op-80");
});

// Function to handle play and pause events for hero video
function handleHeroEvent(videoElement, isPlaying) {
    
    const heroPoster = $(videoElement).closest(".main-video").find(".video-poster");
    const heroContent = $(videoElement).closest(".main-video").find(".main-video-content");
    const heroContainer = $(videoElement).closest(".video-container");
    const heroVideo = $(videoElement).closest(".main-video").find(".main-video-hero");
    const heroClose = $(videoElement).closest(".main-video").find(".hero-video-close");

    if (isPlaying) {
        if ($(window).width() >= 1024) {
            heroPoster.fadeOut();
        }
        heroContent.fadeOut();
        heroContainer.addClass("playing");
        heroClose.fadeIn();
        $(videoElement).attr("controls", "controls");
        if ($(window).width() < 1024) {
            heroVideo.css("z-index", "3");
            heroContainer.addClass("op-80");
        }
    }

    return videoElement; // Return the video element
}

// Add event listeners for play events using jQuery
$(".main-video-hero").on("play", function(event) {
    handleHeroEvent(this, true);
});

// Add event listeners for pause events using jQuery
$(".main-video-hero").on("pause", function(event) {
    handleHeroEvent(this, false);
});

$(document).ready(function() {

    // Max height Function for resource grid
    function setMaxHeight(selector) {
        var maxHeight = 0;
        $(selector).height('unset');
        $(selector).each(function() {
            var elH = $(this).height();
            if (elH > maxHeight) {
                maxHeight = elH;
            }
        });
        return maxHeight;
    }

    // set height for resource grid in desktop
    function setResourceGridHeight() {

        if ($(window).width() > 1023) {
            var maxHeight = setMaxHeight('.resource-grid .grid-item');
            $('.resource-grid .grid-item').height(maxHeight);
        } else {
            $('.resource-grid .grid-item').height('unset');
        }
    }

    // set height for video grid
    function setVideoGridHeight() {
        var vidHeight = setMaxHeight('.main-video-grid');
        $('.main-video-grid').height(vidHeight);
    }

    // Initial height setting
    setResourceGridHeight();
    setVideoGridHeight();

    // On window resize
    $(window).resize(function() {
        setResourceGridHeight();
        setVideoGridHeight();
    });
});