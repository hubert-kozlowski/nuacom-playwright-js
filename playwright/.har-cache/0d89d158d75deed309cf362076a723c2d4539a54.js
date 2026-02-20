jQuery(window).load(function () {

  // Book a Demo Main
  if ($(".btn-book-demo-1").length) {
    loadScript("//js.hsforms.net/forms/shell.js", function () {
      $("body").append(
        '<div id="BookaDemoFormModal1" class="modal fade" tabindex="-1">\
          <div class="modal-dialog modal-lg" style=" -webkit-transform: translate(0,-50%);-o-transform: translate(0,-50%);transform: translate(0,-50%);top: 50%; margin: 0 auto;">\
              <div class="modal-content" style="background:none!important;border: 0!important;>\
                  <div class="modal-body">\
                    <div class="meetings-iframe-container" data-src="https://meetings.hubspot.com/mendes1/20-min?embed=true"></div> \
                    <script type="text/javascript" src="https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js"></script> \
                  </div>\
              </div>\
          </div>\
        </div>'
      );
      $(".btn-book-demo-1").click(function () {
        $("#BookaDemoFormModal1").modal("show");
      });
    });
  }

});