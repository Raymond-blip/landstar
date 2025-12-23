/**
 * jQuery Unveil
 * A very lightweight jQuery plugin to lazy load images
 * http://luis-almeida.github.com/unveil
 *
 * Licensed under the MIT license.
 * Copyright 2013 Luís Almeida
 * https://github.com/luis-almeida
 */

; (function ($) {

    $.fn.unveil = function (threshold, callback) {

        var $w = $(window),
            th = threshold || 0,
            retina = window.devicePixelRatio > 1,
            attrib = retina ? "data-src-retina" : "data-src",
            background = "data-background",
            images = this,
            loaded;

        this.one("unveil", function () {
            var source = this.getAttribute(attrib);
            var bgSource = this.getAttribute(background);
            source = source || this.getAttribute("data-src");
            bgSource = bgSource || this.getAttribute("data-background");
            if (source) {
                this.setAttribute("src", source);
                if (typeof callback === "function") callback.call(this);
            } else if (bgSource) {
                this.style.backgroundImage = 'url(' + bgSource + ')';
                if (typeof callback === "function") callback.call(this);
            }
        });

        function unveil() {
            var inview = images.filter(function () {
                var $e = $(this);
                if ($e.is(":hidden")) return;

                var wt = $w.scrollTop(),
                    wb = wt + $w.height(),
                    et = $e.offset().top,
                    eb = et + $e.height();

                return eb >= wt - th && et <= wb + th;
            });

            loaded = inview.trigger("unveil");
            images = images.not(loaded);
        }

        $w.on("scroll.unveil resize.unveil lookup.unveil", unveil);

        unveil();

        return this;

    };

})(window.jQuery || window.Zepto);