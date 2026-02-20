const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

if (IS_IOS) {
  document.documentElement.classList.add("ios");
}

jQuery(window).load(function () {
  var x = 0;
  window.isMobile = window.matchMedia(
    "only screen and (max-width: 760px)"
  ).matches;
  $(window).on("scroll", function () {
    if (x == 1) return;
    else x = 1;
    setTimeout(function () {
      x = 0;
    }, 200);
  });

  // add sticky class on menu
  $(document).ready(function() {
    var header = $(".bar-main-menu");
    var scroll = $(window).scrollTop();

    if (scroll >= 10) {
      header.addClass("sticky");
    }

    $(window).scroll(function() {
      scroll = $(window).scrollTop();
      if (scroll >= 10) {
        header.addClass("sticky");
      } else {
        header.removeClass("sticky");
      }
    });
  });

  //js adjusts for old blog posts
  // if ($("article.post").length) {
  //   $("article").on("click", ".chat-btn", function () {
  //     Intercom("show");
  //   });
  // }

  if ($(".elementor-widget-eael-data-table").length) {
    var cx, cy, tip, waiting;
    var old_hide = bootstrap.Tooltip.prototype.hide;

    var isOutside = function () {
      return (
        cx < tip.left ||
        cx > tip.left + tip.width ||
        cy < tip.top ||
        cy > tip.top + tip.height
      );
    };

    document.addEventListener("mousemove", function (e) {
      cx = e.clientX;
      cy = e.clientY;
      if (waiting && isOutside()) {
        waiting.f.call(waiting.context);
        waiting = null;
      }
    });

    bootstrap.Tooltip.prototype.hide = function () {
      tip = this.getTipElement().getBoundingClientRect();
      if (isOutside()) {
        old_hide.call(this);
      } else waiting = { f: old_hide, context: this };
    };

    // $('[data-toggle="tooltip"]').each(function () {
    //   el = $(this);
    //   var txt = el.attr("title");
    //   var link_content = txt.split("[").pop().split("]")[0];
    //   var link = link_content.split("link='").pop().split("'")[0];
    //   var text = link_content.split("text='").pop().split("'")[0];
    //   var new_link =
    //     text == "Chat Now"
    //       ? '<br/><a class="btn" onClick="Intercom(\'show\')">' + text + "</a>"
    //       : '<br/><a class="btn" href="' + link + '">' + text + "</a>";
    //   txt = txt.replace(" > ", "");
    //   el.attr("title", txt.replace("[" + link_content + "]", new_link));
    // });

    $('[data-toggle="tooltip"]').tooltip({
      html: true,
      placement: "right",
      customClass: "eael-data-table",
      delay: { show: 0, hide: 500 },
    });
  }

  window.win_stop = Math.round($(window).scrollTop());

  if ($(".princing-table-page").length) {
    //remove footer
    document.getElementsByClassName("footer")[0].style.visibility = "hidden";
  }

  // Gets the video src from the data-src on each button
  if ($(".video-btn").length) {
    $("body").append(
      ' \
      <div id="myModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">\
      <div class="modal-dialog" role="document">\
      <div class="modal-content">\
      <div class="modal-body"><button class="close" type="button" data-dismiss="modal" aria-label="Close">\
      <span aria-hidden="true">×</span>\
      </button>\
      <div class="embed-responsive embed-responsive-16by9"><iframe id="video" class="embed-responsive-item" src=""></iframe></div>\
      </div>\
      </div>\
      </div>\
      </div>\
    '
    );

    var $videoSrc;
    $(".video-btn").click(function () {
      $videoSrc = $(this).data("src");
    });

    // when the modal is opened autoplay it
    $("#myModal").on("shown.bs.modal", function (e) {
      // set the video src to autoplay and not to show related video. Youtube related video is like a box of chocolates... you never know what you're gonna get
      $("#video").attr(
        "src",
        $videoSrc + "?autoplay=1&modestbranding=1&showinfo=0"
      );
    });

    // stop playing the youtube video when I close the modal
    $("#myModal").on("hide.bs.modal", function (e) {
      // a poor man's stop video
      $("#video").attr("src", $videoSrc);
    });
  }

  //check menu pricing
  //menuTopPricingControl();

  if (!window.isMobile) {
    /*-----------------------------------
   ----------- adjuste hover menu to show effect when cross hover the mouse outsite the h3 element -----------
   ------------------------------------*/
    $(".bar-main-menu .dropdown-menu .dropdown-item").hover(
      function () {
        $(this).find("h3").addClass("h3-hover");
      },
      function () {
        $(this).find("h3").removeClass("h3-hover");
      }
    );

    /*-----------------------------------
    ----------- Nav menu - open when hover the mouse -----------
    ------------------------------------*/
    $(".nav-link.dropdown-toggle").hover(
      function () {
        // Open up the dropdown
        $(this).removeAttr("data-toggle"); // remove the data-toggle attribute so we can click and follow link
        $(this).parent().addClass("show"); // add the class show to the li parent
        $(this).next().addClass("show"); // add the class show to the dropdown div sibling
      },
      function () {
        // on mouseout check to see if hovering over the dropdown or the link still
        var isDropdownHovered = $(this).next().filter(":hover").length; // check the dropdown for hover - returns true of false
        var isThisHovered = $(this).filter(":hover").length; // check the top level item for hover
        if (isDropdownHovered || isThisHovered) {
          // still hovering over the link or the dropdown
        } else {
          // no longer hovering over either - lets remove the 'show' classes
          $(this).attr("data-toggle", "dropdown"); // put back the data-toggle attr
          $(this).parent().removeClass("show");
          $(this).next().removeClass("show");
        }
      }
    );
    // Check the dropdown on hover
    $(".dropdown-menu").hover(
      function () {},
      function () {
        var isDropdownHovered = $(this).prev().filter(":hover").length; // check the dropdown for hover - returns true of false
        var isThisHovered = $(this).filter(":hover").length; // check the top level item for hover
        if (isDropdownHovered || isThisHovered) {
          // do nothing - hovering over the dropdown of the top level link
        } else {
          // get rid of the classes showing it
          $(this).parent().removeClass("show");
          $(this).removeClass("show");
        }
      }
    );
  }

  /*-----------------------------------
  ----------- Consulte user IP Geolocation -----------
  ------------------------------------*/
  function getUserLocation() {
    var service = {
      requestPrimary: function () {
        var self = this;
        // Consulte the free API
        $.get("http://ip-api.com/json", {}, function (data) {
          self.ProcessRequest({ country: data.country });
        }).fail(function () {
          console.log("error on request [http://ip2-api.com/json]");
          self.requestSlave();
        });
      },
      requestSlave: function () {
        var self = this;
        //Consulte other API
        $.get(
          "https://api.ipgeolocation.io/ipgeo?apiKey=caba735ca1874af195459b5481693599",
          {},
          function (data) {
            self.ProcessRequest({ country: data.country_name });
          }
        ).fail(function () {
          console.log("error on request [https://api.ipgeolocation.io]");
          self.ProcessRequest({});
        });
      },
      ProcessRequest: function (data) {
        /* sanitize */
        if (!data || data.length === 0) {
          data.country = "";
        }
        //US
        if (
          data.country.toLowerCase() === "usa" ||
          data.country.toLowerCase() === "united states"
        ) {
          $(".contact-phone").text("+1 646 980 3941");
        }
        //UK
        else if (data.country.toLowerCase() === "united kingdom") {
          $(".contact-phone").text("+44 20 3773 2674");
        }
        // Ireland and other countries
        else {
          $(".contact-phone").text("+353 15 540 200");
        }
      },
    };
    service.requestPrimary();
  }

  /*--------- LoadScript -------------*/
  function loadScript(url, callback) {
    // console.log('loadScript -->', OptanonWrapper());

    var script = document.createElement("script");
    // script.type = "text/javascript";
    // script.class="optanon-category-C0004"

    if (script.readyState) {
      //IE
      script.onreadystatechange = function () {
        if (script.readyState == "loaded" || script.readyState == "complete") {
          script.onreadystatechange = null;
          callback();
        }
      };
    } else {
      //Others
      script.onload = function () {
        callback();
      };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
  }
  // Check user location and adapte the content
  // getUserLocation();

  /*-----------------------------------
  ----------- Scroll To Top -----------
  ------------------------------------*/
  $(window).scroll(function () {
    if ($(this).scrollTop() > 1000) {
      $("#back-top").fadeIn();
    } else {
      $("#back-top").fadeOut();
    }
  });
  // scroll body to 0px on click
  $("#back-top").on("click", function () {
    $("#back-top").tooltip("hide");
    $("body,html").animate(
      {
        scrollTop: 0,
      },
      1500
    );
    return false;
  });

  //price-table
  if ($(".elementor-widget-price-table").length) {
    $(".fa-angle-right").parent().hide();
    $(".row-customise-your-plan").parent().parent().addClass("customize-plan");
    $("ul li .text-muted").each(function () {
      $(this).parent().parent().addClass("text-muted");
    });
  }

  if ($(".landline_mobile_label").length) {
    var _checked_landline_mobile_row = true;
    var _checked_landline_only_row = true;

    $(".landline_mobile_label").click(function () {
      _checked_landline_mobile_row = !_checked_landline_mobile_row;
      if (_checked_landline_mobile_row) $(".landline_mobile_row").show();
      else $(".landline_mobile_row").hide();
    });

    $(".landline_only_label").click(function () {
      _checked_landline_only_row = !_checked_landline_only_row;
      if (_checked_landline_only_row) $(".landline_only_row").show();
      else $(".landline_only_row").hide();
    });
  }

  if ($(".hsform").length) {
    // console.log(window.testFN);
    loadScript("//js.hsforms.net/forms/shell.js", function () {
      var forms_id = [];
      $(".hsform").each(function (i) {
        var formId = $(this).attr("form-id");
        var newModalId = "hubspotFormModal" + formId;
        $(this).addClass(newModalId);
        if (forms_id.indexOf(formId) == -1) {
          $("body").append(
            '<div id="hubspotFormModal' +
              formId +
              '" class="modal hs-form-modal fade" tabindex="-1">\
              <div class="modal-dialog">\
                  <div class="modal-content">\
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true" style="font-size: 18px"><i class="fa fa-times" aria-hidden="true"></i></span></button>\
                      <div class="modal-body">\
                      <div class="_form_' +
              formId +
              '"></div>\
                      </div>\
                  </div>\
              </div>\
            </div>'
          );

          $("body").on("click", "." + newModalId, function () {
            var formId = $(this).attr("form-id");
            $("#hubspotFormModal" + formId).modal("show");
            if (!$("._form_" + formId + " iframe").length) {
              hbspt.forms.create({
                portalId: "3313565",
                formId: formId,
                target: "._form_" + formId,
              });
            }
          });
          forms_id.push(formId);
        }
      });
    });
  }

  if ($("#signup-steps").length) {
    loadScript(
      "/wp-content/themes/nuacom-new-template/js/jquery.validate.min.js",
      function () {}
    );
    loadScript(
      "/wp-content/themes/nuacom-new-template/libs/intl-tel-input-16.0.0/js/intlTelInput.min.js",
      function () {
        loadScript(
          "/wp-content/themes/nuacom-new-template/libs/intl-tel-input-16.0.0/js/utils.js",
          function () {
            loadScript(
              "/wp-content/themes/nuacom-new-template/systems/sign-up/view/signup.js",
              function () {}
            );
            $("#full_name").parent().hide();
            $("#company").parent().hide();
            $("#number_users").parent().hide();
            $(".phone-input").hide();
            $(".submit-create-account").hide();
            $(".form-terms-and-privacity").hide();

            $("#signup-steps .btn-next").click(function () {
              if (!window.email_valid) {
                return;
              }

              $("#full_name").parent().show();
              $("#company").parent().show();
              $("#number_users").parent().show();
              $(".phone-input").show();
              $(".submit-create-account").show();
              $(".form-terms-and-privacity").show();

              $("#signup-steps .cta_new").hide();
              $("#email").parent().hide();
              $("#password").parent().hide();
            });
          }
        );
      }
    );
  }

  /* ------ jQuery for Easing min -- */

  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').on("click", function () {
    if (
      location.pathname.replace(/^\//, "") ==
        this.pathname.replace(/^\//, "") &&
      location.hostname == this.hostname
    ) {
      var target = $(this.hash);
      target = target.length ? target : $("[name=" + this.hash.slice(1) + "]");
      if (target.length) {
        $("html, body").animate(
          {
            scrollTop: target.offset().top - 54,
          },
          1000,
          "easeInOutExpo"
        );
        return false;
      }
    }
  });

  /*-----------------------------------
  ----------- Animation type writing -----------
  ------------------------------------*/
  var TxtType = function (el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = "";
    this.tick();
    this.isDeleting = false;
  };

  TxtType.prototype.tick = function () {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    if (this.isDeleting) {
      this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
      this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.el.innerHTML = '<span class="wrap">' + this.txt + "</span>";

    var that = this;
    var delta = 200 - Math.random() * 100;

    if (this.isDeleting) {
      delta /= 2;
    }

    if (!this.isDeleting && this.txt === fullTxt) {
      delta = this.period;
      this.isDeleting = true;
    } else if (this.isDeleting && this.txt === "") {
      this.isDeleting = false;
      this.loopNum++;
      delta = 500;
    }

    setTimeout(function () {
      that.tick();
    }, delta);
  };

  window.onload = function () {
    var elements = document.getElementsByClassName("typewrite");
    for (var i = 0; i < elements.length; i++) {
      var toRotate = elements[i].getAttribute("data-type");
      var period = elements[i].getAttribute("data-period");
      if (toRotate) {
        new TxtType(elements[i], JSON.parse(toRotate), period);
      }
    }

    // INJECT CSS
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".typewrite > .wrap { border-right: 0.08em solid #fff}";
    document.body.appendChild(css);

    if ($("#video").length) $("#video").get(0).play();
  };

  function parse_query_string(query) {
    var vars = query.split("&");
    var query_string = {};
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      var key = decodeURIComponent(pair[0]);
      var value = decodeURIComponent(pair[1]);
      // If first entry with this name
      if (typeof query_string[key] === "undefined") {
        query_string[key] = decodeURIComponent(value);
        // If second entry with this name
      } else if (typeof query_string[key] === "string") {
        var arr = [query_string[key], decodeURIComponent(value)];
        query_string[key] = arr;
        // If third or later entry with this name
      } else {
        query_string[key].push(decodeURIComponent(value));
      }
    }
    return query_string;
  }

  function reloadPricingTable() {
    $(".elementor-price-table__price").each(function (i, obj) {
      window.reduced_price = $(this)
        .find(".elementor-price-table__original-price.elementor-typo-excluded")
        .text();
      window.original_price = $(this)
        .find(".elementor-price-table__integer-part")
        .text();

      if (toggle_status === 0) {
        $(this)
          .find(
            ".elementor-price-table__original-price.elementor-typo-excluded"
          )
          .hide();
        window.currency = original_price.split(" ")[0];
        original_price = original_price.split(" ")[1];
        reduced_price = reduced_price.split(currency)[1];
      } else {
        $(this)
          .find(
            ".elementor-price-table__original-price.elementor-typo-excluded"
          )
          .show();
        currency = original_price.split(" ")[0];
        original_price = original_price.split(" ")[1];
        reduced_price = reduced_price.split(currency)[1];
      }

      $(this)
        .find(".elementor-price-table__original-price.elementor-typo-excluded")
        .html(
          currency +
            "" +
            original_price.split(".")[0] +
            '<span class="cents">.' +
            original_price.split(".")[1] +
            "</span>"
        );
      $(this)
        .find(".elementor-price-table__integer-part")
        .html(
          currency +
            " " +
            reduced_price.split(".")[0] +
            '<span class="cents">.' +
            reduced_price.split(".")[1] +
            "</span>"
        );
      // $(this).find('.elementor-price-table__after-price .elementor-price-table__period.elementor-typo-excluded').html((toggle_status === 0 ? '/user/month' : '/user/year'));
    });
  }
  window.toggle_status = 0;

  function processUserAccess() {
    var origem = document.referrer || 'Direct';
    var firstURL = document.URL;
    var firstAccessData = new Date().toJSON().slice(0, 19).replace("T", " ");
    var IP = null;
    var location = null;

    var parsed_url = parse_query_string(firstURL);
    var utm_campaign = parsed_url.utm_campaign || "";
    var utm_term = parsed_url.utm_term || "";

    $.get("https://ipinfo.io/?callback=", {}, function (data) {
      var json = JSON.parse(data);
      if (json) {
        IP = json.ip;
        location = json.city + "/" + json.country;
        createCookie("COUNTRY_CODE", json.country, "1"); // Create Cookie
        saveUserAccess(
          origem,
          firstURL,
          firstAccessData,
          IP,
          location,
          utm_campaign,
          utm_term
        );
      }
    }).fail(function () {
      console.log("error on request [https://ipinfo.io/?callback=]");
      saveUserAccess(
        origem,
        firstURL,
        firstAccessData,
        IP,
        location,
        utm_campaign,
        utm_term
      );
    });

    createCookie("COUNTRY_CODE", country_code_display, "1");
  }

  function saveUserAccess(
    origem,
    firstURL,
    firstAccessData,
    IP,
    location,
    utm_campaign,
    utm_term
  ) {
    var nuacom_origem = localStorage.getItem('nuacom_origem');
    if(!nuacom_origem){
      localStorage.setItem('nuacom_origem', origem);
    }
    var nuacom_firstURL = localStorage.getItem('nuacom_firstURL');
    if(!nuacom_firstURL){
      localStorage.setItem('nuacom_firstURL', firstURL);
    }

    var nuacom_firstAccessData = localStorage.getItem('nuacom_firstAccessData');
    if(!nuacom_firstAccessData){
      localStorage.setItem('nuacom_firstAccessData', firstAccessData);
    }

    var nuacom_IP = localStorage.getItem('nuacom_IP');
    if(!nuacom_IP){
      localStorage.setItem('nuacom_IP', IP);
    }

    var nuacom_location = localStorage.getItem('nuacom_location');
    if(!nuacom_location){
      localStorage.setItem('nuacom_location', location);
    }

    var nuacom_utm_campaign = localStorage.getItem('nuacom_utm_campaign');
    if(!nuacom_utm_campaign){
      localStorage.setItem('nuacom_utm_campaign', utm_campaign);
    }

    var nuacom_utm_term = localStorage.getItem('nuacom_utm_term');
    if(!nuacom_utm_term){
      localStorage.setItem('nuacom_utm_term', utm_term);
    }


  }

  function createCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = escape(name) + "=" + escape(value) + expires + "; path=/";
  } 

  processUserAccess();
});