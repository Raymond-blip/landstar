window.Werner = window.Werner || {};

(function (form, app, $, undefined) {

    "use strict";

    var _internal = {
        init: function ($form) {

            $form.find('form').on('submit', _onSubmit);

            function _onSubmit() {
                var result = validate();
                if (!result) {
                    moveToFirstRequired();
                }
                return result
            }

            function validate() {
                var result = true;
                $.each($form.find("[data-required='true']"), function () {
                    var $input = $(this);
                    $input.removeClass("invalid");

                    var validateIf = false;
                    var requiredDependency = $input.attr('data-required-if');

                    if (requiredDependency) {
                        validateIf = $form.find("#" + requiredDependency + ":checked").length > 0;
                    }

                    if (requiredDependency) {
                        if ($input.val() === "" && validateIf) {
                            $input.addClass("invalid");
                            result = false;
                        }
                    } else {
                        if ($input.val() === "") {
                            $input.addClass("invalid");
                            result = false;
                        }
                    }
                });

                return result;
            }

            function moveToFirstRequired() {
                var requiredFields = $form.find("[data-required='true'].invalid");
                if (requiredFields.length > 0) {
                    var first = requiredFields[0];
                    first.focus();
                }
            }
        }
    }

    $(function () {
        var $form = $(".form");
        if ($form.length > 0) {
            _internal.init($form);
        }
    });

}(Werner.Form = Werner.Form || {}, Werner.App, jQuery));