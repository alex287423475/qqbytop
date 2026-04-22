$('.head-nav ul li').each(function () {
  $(this).hover(function () {
    $(this).children('.nav-child').slideDown(300)
  }, function () {
    $(this).children('.nav-child').stop(true, false).slideUp(300)
  })
});
var banner = new Swiper('.banner', {
  slidesPerView: 1,
  loop: true,
  autoplay: {
    delay: 5000,
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  on: {
    slideChangeTransitionStart: function () {
      $('.b' + (this.activeIndex + 1)).addClass('active').siblings().removeClass('active')
    },
  }
});
var lis = $('.banner-nav').find('li');
lis.each(function (i, el) {
  $('.banner-nav li').addClass(function (i) {
    return 'b' + (i + 1)
  });
  $('.banner-nav li:first-child').addClass('active');
  $('.b' + (i + 1)).mouseover(function () {
    banner.slideTo(i, 1000);
    $(el).addClass('active').siblings().removeClass('active')
  })
});
$('.item-trans').hover(function () {
  $(this).addClass('active').siblings().removeClass('active')
});
var solution = new Swiper('.solution .swiper-container', {
  slidesPerView: 4,
  loop: true,
  autoplay: {
    delay: 5000,
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
});
var baojia = new Swiper('.baojia-content', {
  slidesPerView: 1,
  effect: 'fade',
  fadeEffect: {
    crossFade: true,
  },
  slidesPerView: 1,
  on: {
    slideChangeTransitionStart: function () {
      $('.j' + (this.activeIndex + 1)).addClass('active').siblings().removeClass('active')
    },
  }
});
var lis = $('.baojia-nav').find('li');
lis.each(function (i, el) {
  $('.baojia-nav li').addClass(function (i) {
    return 'j' + (i + 1)
  });
  $('.baojia-nav li:first-child').addClass('active');
  $('.j' + (i + 1)).mouseover(function () {
    baojia.slideTo(i, 1000);
    $(el).addClass('active').siblings().removeClass('active')
  })
});
var zhegnjian = new Swiper('.zhegnjian', {
  slidesPerView: 1,
  loop: true,
  autoplay: {
    delay: 5000,
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});
var serve = new Swiper(".serve", {
  slidesPerView: 1,
  loop: true,
  autoplay: {
    delay: 4000,
  },
});
$('.item-ask li:first-child').addClass('active');
$('.item-ask li').hover(function () {
  $(this).addClass('active').siblings('.item-ask li').removeClass('active')
});
$(function () {
  $("img.lazy").lazyload({
    placeholder: "/public/img/loading.jpg",
    effect: "fadeIn",
  })
});
$(function () {
  $(".online ").each(function () {
    $(this).find(".weixin").mouseenter(function () {
      $(this).find(".pic").fadeIn("fast")
    });
    $(this).find(".weixin").mouseleave(function () {
      $(this).find(".pic").fadeOut("fast")
    });
    $(this).find(".hotline").mouseenter(function () {
      $(this).find(".phone").fadeIn("fast")
    });
    $(this).find(".hotline").mouseleave(function () {
      $(this).find(".phone").fadeOut("fast")
    });
    $(this).find(".top").click(function () {
      $("html, body").animate({
        "scroll-top": 0
      }, "fast")
    })
  });
  var lastRmenuStatus = false;
  $(window).scroll(function () {
    var _top = $(window).scrollTop();
    if (_top > 200) {
      $(".online ").data("expanded", true)
    } else {
      $(".online ").data("expanded", false)
    }
    if ($(".online ").data("expanded") != lastRmenuStatus) {
      lastRmenuStatus = $(".online ").data("expanded");
      if (lastRmenuStatus) {
        $(".online  .top").slideDown()
      } else {
        $(".online  .top").slideUp()
      }
    }
  })
});