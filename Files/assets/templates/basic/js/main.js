(function ($) {
  ("use strict");

  // ============== Header Hide Click On Body Js Start ========
  $(".header-button").on("click", function () {
    $(".body-overlay").toggleClass("show");
  });
  $(".body-overlay").on("click", function () {
    $(".header-button").trigger("click");
    $(this).removeClass("show");
  });
  // ================= Header Hide Click On Body Js End ================

  /*==================== custom dropdown select js ====================*/
  $(".custom--dropdown > .custom--dropdown__selected").on("click", function () {
    $(this).parent().toggleClass("open");
  });
  $(".custom--dropdown > .dropdown-list > .dropdown-list__item").on(
    "click",
    function () {
      $(
        ".custom--dropdown > .dropdown-list > .dropdown-list__item"
      ).removeClass("selected");
      $(this)
        .addClass("selected")
        .parent()
        .parent()
        .removeClass("open")
        .children(".custom--dropdown__selected")
        .html($(this).html());
    }
  );
  $(document).on("keyup", function (evt) {
    if ((evt.keyCode || evt.which) === 27) {
      $(".custom--dropdown").removeClass("open");
    }
  });
  $(document).on("click", function (evt) {
    if (
      $(evt.target).closest(".custom--dropdown > .custom--dropdown__selected")
        .length === 0
    ) {
      $(".custom--dropdown").removeClass("open");
    }
  });
  /*=============== custom dropdown select js end =================*/

  // ==========================================
  //      Start Document Ready function
  // ==========================================
  $(document).ready(function () {
    // ========================== Header Hide Scroll Bar Js Start =====================
    $(".navbar-toggler.header-button").on("click", function () {
      $("body").toggleClass("scroll-hide-sm");
    });
    $(".body-overlay").on("click", function () {
      $("body").removeClass("scroll-hide-sm");
    });
    // ========================== Header Hide Scroll Bar Js End =====================

    // ========================== Small Device Header Menu On Click Dropdown menu collapse Stop Js Start =====================
    $(".dropdown-item").on("click", function () {
      $(this).closest(".dropdown-menu").addClass("d-block");
    });
    // ========================== Small Device Header Menu On Click Dropdown menu collapse Stop Js End =====================

    // ========================== Add Attribute For Bg Image Js Start =====================
    $(".bg-img").css("background", function () {
      var bg = "url(" + $(this).data("background-image") + ")";
      return bg;
    });
    // ========================== Add Attribute For Bg Image Js End =====================

    // ========================== add active class to ul>li top Active current page Js Start =====================
    function dynamicActiveMenuClass(selector) {
      let fileName = window.location.pathname.split("/").reverse()[0];
      selector.find("li").each(function () {
        let anchor = $(this).find("a");
        if ($(anchor).attr("href") == fileName) {
          $(this).addClass("active");
        }
      });
      // if any li has active element add class
      selector.children("li").each(function () {
        if ($(this).find(".active").length) {
          $(this).addClass("active");
        }
      });
      // if no file name return
      if ("" == fileName) {
        selector.find("li").eq(0).addClass("active");
      }
    }
    if ($("ul.sidebar-menu-list").length) {
      dynamicActiveMenuClass($("ul.sidebar-menu-list"));
    }
    // ========================== add active class to ul>li top Active current page Js End =====================

    // ================== Password Show Hide Js Start ==========
    $(".toggle-password").on("click", function () {
      $(this).toggleClass("fa-eye-slash fa-eye");

      var input = $(this).closest(".position-relative").find("input");

      if (input.attr("type") === "password") {
        input.attr("type", "text");
      } else {
        input.attr("type", "password");
      }
    });
    // =============== Password Show Hide Js End =================

    // ========================= Slick Slider Js Start ==============
    $(".testimonial-slider").not(".slick-initialized").slick({
      slidesToShow: 2,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 2000,
      speed: 1500,
      dots: true,
      pauseOnHover: true,
      arrows: false,
      infinite: true,
      prevArrow:
        '<button type="button" class="slick-prev"><i class="fas fa-long-arrow-alt-left"></i></button>',
      nextArrow:
        '<button type="button" class="slick-next"><i class="fas fa-long-arrow-alt-right"></i></button>',
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
      ],
    });
    // ========================= Slick Slider Js End ===================
    // ========================= Category Slider Js Start ===============
    $(".category-slider").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 1000,
      pauseOnHover: true,
      speed: 2000,
      dots: false,
      arrows: false,
      responsive: [
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
      ],
    });
    // ========================= Category Slider Js End ===================

    /*============== clients slider js start here ==============*/
    $(".client-slider").slick({
      slidesToShow: 5,
      slidesToScroll: 1,
      speed: 2000,
      cssEase: "linear",
      autoplay: true,
      autoplaySpeed: 0,
      adaptiveHeight: false,
      pauseOnDotsHover: false,
      pauseOnHover: true,
      pauseOnFocus: true,
      dots: false,
      arrows: false,
      responsive: [
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 4,
            arrows: false,
          },
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
      ],
    });
    /*============ clients slider js end here ==============*/

    /*============= action btn js start here =============*/

    $(".action-btn__icon").on("click", function (e) {
      e.stopPropagation();
      $(".action-dropdown").removeClass("show");
      $(this).siblings(".action-dropdown").toggleClass("show");
    });
    
    $(document).on("click", function () {
      $(".action-dropdown").removeClass("show");
    });
    
    $(".action-dropdown").on("click", function (e) {
      if ($(this).hasClass("show")) {
        $(this).removeClass("show"); 
      } else {
        e.stopPropagation();
      }
    });

    /*============= action btn js end here =============*/

    $(".profile-action-btn__share").on("click", function () {
      $(".dropdown-menu").toggleClass("show");
    });
    /*============== clients slider js start here ==============*/
    $(".brand-slider").not(".slick-initialized").slick({
      slidesToShow: 3,
      slidesToScroll: 1,
      speed: 2000,
      cssEase: "linear",
      autoplay: true,
      autoplaySpeed: 0,
      adaptiveHeight: false,
      pauseOnDotsHover: false,
      pauseOnHover: true,
      pauseOnFocus: true,
      dots: false,
      arrows: false,
      responsive: [
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 4,
            arrows: false,
          },
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 3,
            arrows: false,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 2,
            arrows: false,
          },
        },
      ],
    });
    /*============ clients slider js end here ==============*/

    // category sidebar js
    $(document).ready(function () {
      $(".filter-block__list").each(function () {
        var $block = $(this);
        var $checkboxes = $block.find(".filter-block__item");
        var $loadMoreButton = $block.find(".load-more-button");
        var itemsToShow = 5;

        function toggleCheckboxesVisibility() {
          $checkboxes.hide().slice(0, itemsToShow).show();
        }

        $loadMoreButton.on("click", function () {
          itemsToShow = itemsToShow === 5 ? $checkboxes.length : 5;
          $loadMoreButton.text(itemsToShow === 5 ? "Show More" : "Show Less");
          toggleCheckboxesVisibility();
        });

        toggleCheckboxesVisibility();
        $loadMoreButton.toggle($checkboxes.length > itemsToShow);
      });
    });
    // category sidebar js

    /*============== freelancer slider js start here ==============*/
    $(".best-freelancer").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      speed: 2000,
      adaptiveHeight: false,
      pauseOnDotsHover: false,
      pauseOnHover: true,
      pauseOnFocus: true,
      dots: false,
      arrows: true,
      prevArrow:
        '<button type="button" class="slick-prev"> <i class="las la-angle-left"></i> </button>',
      nextArrow:
        '<button type="button" class="slick-next"> <i class="las la-angle-right"></i> </button>',
      responsive: [
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 991,
          settings: {
            slidesToShow: 2,
          },
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 2,
            arrows: false,
            dots: true,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 1,
            arrows: false,
            dots: true,
          },
        },
      ],
    });
    /*============ freelancer slider js end here ==============*/

    // faq item add and less js
    $(document).ready(function () {
      $(".accordion-filter").each(function () {
        var $block = $(this);
        var $checkboxes = $block.find(".accordion-item");
        var $loadMoreButton = $block.find(".load-more-button");
        var itemsToShow = 4;

        function toggleCheckboxesVisibility() {
          $checkboxes.hide().slice(0, itemsToShow).show();
        }

        $loadMoreButton.on("click", function () {
          itemsToShow = itemsToShow === 4 ? $checkboxes.length : 4;
          $loadMoreButton.text(itemsToShow === 4 ? "Load More" : "Show Less");
          toggleCheckboxesVisibility();
        });

        toggleCheckboxesVisibility();
        $loadMoreButton.toggle($checkboxes.length > itemsToShow);
      });
    });
    // faq item add and less js

    // ================== Sidebar Menu Js Start ===============
    // Sidebar Dropdown Menu Start
    $(".has-dropdown > a").on('click',function () {
      $(".sidebar-submenu").slideUp(200);
      if ($(this).parent().hasClass("active")) {
        $(".has-dropdown").removeClass("active");
        $(this).parent().removeClass("active");
      } else {
        $(".has-dropdown").removeClass("active");
        $(this).next(".sidebar-submenu").slideDown(200);
        $(this).parent().addClass("active");
      }
    });
    // Sidebar Dropdown Menu End
    //dashboard Sidebar Icon & Overlay js
    $(".dashboard-body__bar").on("click", function () {
      $(".sidebar-menu").addClass("show-sidebar");
      $(".sidebar-overlay").addClass("show");
    });
    $(".sidebar-menu__close, .sidebar-overlay").on("click", function () {
      $(".sidebar-menu").removeClass("show-sidebar");
      $(".sidebar-overlay").removeClass("show");
    });
    //dashboard Sidebar Icon & Overlay js

    //job category Sidebar Icon & Overlay js
    $(".job-category-body__bar-icon").on("click", function () {
      $(".category-sidebar").addClass("show-sidebar");
      $(".sidebar-overlay").addClass("show");
    });
    $(".sidebar-filter__close, .sidebar-overlay").on("click", function () {
      $(".category-sidebar").removeClass("show-sidebar");
      $(".sidebar-overlay").removeClass("show");
    });
    //job category Sidebar Icon & Overlay js
    // ===================== Sidebar Menu Js End =================

    // ==================== Dashboard User Profile Dropdown Start ==================
    $(document).ready(function () {
      $(".user-info__button").on("click", function (e) {
        e.stopPropagation();
        $(".user-info-dropdown").toggleClass("show");
      });

      $(".user-info__button").attr("tabindex", -1).focus();

      $(document).on("click", function (e) {
        if (
          !$(e.target).closest(".user-info-dropdown").length &&
          !$(e.target).closest(".user-info__button").length
        ) {
          $(".user-info-dropdown").removeClass("show");
        }
      });

      $(".user-info-dropdown").on("click", function (e) {
        e.stopPropagation();
      });
    });
    // ==================== Dashboard User Profile Dropdown End ==================

    // ========================= Odometer Counter Up Js End ==========
    $(".counterup-item").each(function () {
      $(this).isInViewport(function (status) {
        if (status === "entered") {
          for (
            var i = 0;
            i < document.querySelectorAll(".odometer").length;
            i++
          ) {
            var el = document.querySelectorAll(".odometer")[i];
            el.innerHTML = el.getAttribute("data-odometer-final");
          }
        }
      });
    });
    // ========================= Odometer Up Counter Js End =====================
  });
  // ==========================================
  //      End Document Ready function
  // ==========================================

  // ========================= Preloader Js Start =====================
  $(window).on("load", function () {
    $(".preloader").fadeOut();
  });
  // ========================= Preloader Js End=====================

  // // ========================= Header Sticky Js Start ==============
  $(window).on("scroll", function () {
    if ($(window).scrollTop() >= 100) {
      $(".header").addClass("fixed-header");
    } else {
      $(".header").removeClass("fixed-header");
    }
  });
  // // ========================= Header Sticky Js End===================

  function proPicURL(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var preview = $(input)
          .closest(".image-upload-wrapper")
          .find(".image-upload-preview");
        $(preview).css("background-image", "url(" + e.target.result + ")");
        $(preview).addClass("has-image");
        $(preview).hide();
        $(preview).fadeIn(650);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }
  $(".image-upload-input").on("change", function () {
    proPicURL(this);
  });
  $(".remove-image").on("click", function () {
    $(this).parents(".image-upload-preview").css("background-image", "none");
    $(this).parents(".image-upload-preview").removeClass("has-image");
    $(this).parents(".image-upload-wrapper").find("input[type=file]").val("");
  });
  $("form").on("change", ".file-upload-field", function () {
    $(this)
      .parent(".file-upload-wrapper")
      .attr(
        "data-text",
        $(this)
          .val()
          .replace(/.*(\/|\\)/, "")
      );
  });

  (function ($) {
    $.each($(".select2"), function () {
      $(this)
        .wrap(`<div class="position-relative"></div>`)
        .select2({
          dropdownParent: $(this).parent(),
        });
    });

    $.each($(".select2-auto-tokenize"), function () {
      $(this)
        .wrap(`<div class="position-relative"></div>`)
        .select2({
          tags: true,
          tokenSeparators: [","],
          dropdownParent: $(this).parent(),
        });
    });

    let disableSubmission = false;
    $(".disableSubmission").on("submit", function (e) {
      if (disableSubmission) {
        e.preventDefault();
      } else {
        disableSubmission = true;
      }
    });

    $(".table-responsive").on(
      "click",
      '[data-bs-toggle="dropdown"]',
      function (e) {
        const { top, left } = $(this)
          .next(".dropdown-menu")[0]
          .getBoundingClientRect();
        $(this)
          .next(".dropdown-menu")
          .css({
            position: "fixed",
            inset: "unset",
            transform: "unset",
            top: top + "px",
            left: left + "px",
          });
      }
    );

    if ($(".table-responsive").length) {
      $(window).on("scroll", function (e) {
        $(".table-responsive .dropdown-menu").removeClass("show");
        $('.table-responsive [data-bs-toggle="dropdown"]').removeClass("show");
      });
    }
  })(jQuery);

  $("#target-area").on("change", function () {
    var redirectUrlR = $(this).find(":selected").data("redirect");
    $("#dynamic-route").attr("action", redirectUrlR);
  });

  // //============================ Scroll To Top Icon Js Start =========
  var btn = $(".scroll-top");

  $(window).scroll(function () {
    if ($(window).scrollTop() > 300) {
      btn.addClass("show");
    } else {
      btn.removeClass("show");
    }
  });

  btn.on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, "300");
  });

  $(".showFilterBtn").on("click", function () {
    $(".responsive-filter-card").slideToggle();
  });

  //required
  $.each($("input, select, textarea"), function (i, element) {
    if (element.hasAttribute("required")) {
      $(element)
        .closest(".form-group")
        .find("label")
        .first()
        .addClass("required");
    }
  });
  //data-label of table-dynamic//
  Array.from(document.querySelectorAll("table")).forEach((table) => {
    let heading = table.querySelectorAll("thead tr th");
    Array.from(table.querySelectorAll("tbody tr")).forEach((row) => {
      Array.from(row.querySelectorAll("td")).forEach((column, i) => {
        column.colSpan == 100 ||
          column.setAttribute("data-label", heading[i].innerText);
      });
    });
  });

  $(".form-label").addClass("form--label");
  $("#confirmationModal").addClass("custom--modal");
  $("#confirmationModal .modal-dialog").addClass("modal-dialog-centered");
  $("#confirmationModal .btn--primary")
    .addClass("btn--success")
    .removeClass("btn-sm btn--primary");
  $("#confirmationModal .btn--dark")
    .addClass("btn--danger")
    .removeClass("btn-sm btn--dark");

  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]:not(.disabled)')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
})(jQuery);
