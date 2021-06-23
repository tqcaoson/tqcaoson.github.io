(function ($) {
  "use strict";
  Pace.on("start", function () {
    $("#preloader").show();
  });
  Pace.on("done", function () {
    $('#status').fadeOut(); // will first fade out the loading animation
    $('#preloader').delay(1000).fadeOut('slow'); // will fade out the white DIV that covers the website.
    setTimeout(checkForm, 1000);




    var winWidth = $(window).outerWidth();
    var winHeight = $(window).outerHeight();
// set initial div height / width
    $('.wrapper').css({
      width: winWidth,
      height: winHeight
    });
// make sure div stays full width/height on resize
    $(window).resize(function () {
      var winWidth = $(window).outerWidth();
      var winHeight = $(window).outerHeight();

      $('.wrapper').animate({
        'width': winWidth,
        'height': winHeight
      }, 0);
    });



if($('#countdown_dashboard').length>0){
    $('#countdown_dashboard').countDown({
      targetDate: {
        'day': 13,
        'month': 7,
        'year': 2021,
        'hour': 0,
        'min': 0,
        'sec': 0
      }
    });
    }


 $('#clouds').pan({fps: 12, speed: 2, dir: 'left'});
   
    
        $(window).resize(function () {
        updatePage();
      });
      



    function updatePage() {
      var winWidth = $(window).outerWidth();
      var winHeight = $(window).outerHeight();


      var newWnH = Math.min(winWidth, winHeight);
//      $('#lights1,#lights2,#lights3').css({'width': newWnH + 'px'}).css({'height': newWnH + 'px'});
    $('.page-holder').css({'width': newWnH - 50 + 'px'});



    }





    function getImgSize(el, imgSrc) {
      var newImg = new Image();
      newImg.onload = function () {
        var height = newImg.height;
        var width = newImg.width;

        el.css('height', height);

      };
      newImg.src = imgSrc;
    }

    if ($('.bg-image[data-bg-image]').length > 0) {
      $('.bg-image[data-bg-image]').each(function () {
        var el = $(this);
        var sz = getImgSize(el, el.attr("data-bg-image"));
        el.css('background-position', 'center').css('background-image', "url('" + el.attr("data-bg-image") + "')").css('background-size', 'cover').css('background-repeat', 'no-repeat');
      });
    }



    $('[data-placeholder]').focus(function () {
      var input = $(this);
      if (input.val() === input.attr('data-placeholder')) {
        input.val('');

      }
    }).blur(function () {
      var input = $(this);
      if (input.val() === '' || input.val() === input.attr('data-placeholder')) {
        input.addClass('placeholder');
        input.val(input.attr('data-placeholder'));
      }
    }).blur();

    $('[data-placeholder]').parents('form').submit(function () {
      $(this).find('[data-placeholder]').each(function () {
        var input = $(this);
        if (input.val() === input.attr('data-placeholder')) {
          input.val('');
        }
      });
    });



    function checkForm() {
      if ($(".form-holder").length > 0) {

        var formStatus = $(".form-holder form").validate();

        //   ===================================================== 
        //sending contact form
        $(".form-holder form").submit(function (e) {
          e.preventDefault();

          //  triggers contact form validation

          if (formStatus.errorList.length === 0)
          {
            $(".form-holder form").fadeOut(function () {
              $('#loading').css('visibility', 'visible');
              $.post('submit.php', $(".form-holder form").serialize(),
                      function (data) {

                        $('.message-box').html(data);


                        $('#loading').css('visibility', 'hidden');

                      }

              );
            });


          }

        });
      }
    }



  });






})(jQuery);

