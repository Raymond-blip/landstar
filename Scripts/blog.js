document.addEventListener(
  "DOMContentLoaded",
  function () {
    $(".disabled").click(function (e) {
      e.preventDefault();
    });

    $("#emailSignUp").on("submit", function () {
        $("#emailSignUpBtn").attr("disabled", "disabled");
      $.post({
          url: "/Umbraco/Api/BlogSub/Submit",
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
  },
  false
);
