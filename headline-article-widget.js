/* Last Updated 5/31/13 by MC */
/* orig by JS */

$(document).ready(function(){
    bobMod.control();
});


var bobMod = (function(opts, $){
    
// Blow Out Box. 
// Control: Should BOB even run?
// Setup: BOB should run, so set it up.

    bob = {
        feedCount        : 0,
        feeds            : [],
        hiding           : true,
        hdlnurl          : "/noscan/public/headlineapp/headlines",
        //hdlnurl          : "dynamic-and-static.json",
        closeClick       : false,
        opts             : opts
    };

    bob.control = function (){
        var wl              = window.location,
            news            = 'www',
            emed            = 'emedicine',
            refe            = 'reference',
            newsViewArt     = /viewarticle\/\d+/,
            newsViewColl    = /viewcollection\/\d+/;
            // // eg: http://www.medscape.com/viewcollection/32737
            // refDrug         = /\/drug\//;

        if (typeof bobRun === 'undefined'){
            bobRun = '';
        }

        if (bobRun === 'false' || $("#nwsltr_bar").length > 0 ) {
            return;
        }

        if (wl.host === 'localhost') {
            bob.whichVertical = 'news';
            bob.setup('news');
        }

        if ( wl.host.match(news) && (wl.href.match(newsViewArt) || wl.href.match(newsViewColl) && (bobRun === true || bobRun==='') ) ) {
            // host is news, path is view article or view collection, bobRun is true or null
            bob.whichVertical = 'news';
            bob.setup(bob.whichVertical);
        }

        //ref_contentId 
        if (typeof ref_contentId !== "undefined" && (bobRun === true || bobRun ==='') ){ 
            // ref_contentId exists (browser is on reference) and bobRun is true or null (something other than false)
            bob.whichVertical = 'refe';
            bob.setup(bob.whichVertical);
        }

    };

    // Append the elements, determine heights, make minor style changes.
    bob.setup = function (whichVertical){
        var bobEl;

        if ( $("#articleContent").length !== 0 ) {
            bob.hrcol = $("#articleContent").height();
            bob.rcoltpoffst = $("#articleContent").offset().top;
            bob.btmrcol = (bob.rcoltpoffst + bob.hrcol) * 0.43 ;
            bob.$targetDiv = $("#articleContent");
        }

        if ( $("#drugdbmain").length !== 0 ) {
            bob.hrcol = $("#drugdbmain").height();
            bob.rcoltpoffst = $("#drugdbmain").offset().top;
            bob.btmrcol = (bob.rcoltpoffst + bob.hrcol) * 0.55;
            bob.$targetDiv = $("#drugdbmain");
        }

        bob.testHeight();

        bobEl = [
            $('<div id="blowOutBox"/>'),
            $('<div id="bobClose" border="0" alt="Close Slideshow Headlines"/>'),
            $('<div id="bobIntro">Also on Medscape - Don\'t miss&hellip;</div>'),
            $('<div class="bobImg" />'),
            $('<a class="a-bobThmb" href=""><img border="0" alt="" class="bobThmb" src=""></a>'),
            $('<a href="" class="bobHeadline"></a>')
        ];

        $("#footercontents").append(bobEl[0]);
        $(bobEl[0]).append(bobEl[1]).append(bobEl[2]);
        $(bobEl[0]).append(bobEl[3]);
        $(bobEl[3]).append(bobEl[4]).append(bobEl[5]);

        bob.clicks();

        bob.jsonphdlnget(bob.hdlnurl);

        if (whichVertical === 'news') {
            $('#blowOutBox').addClass('news-border');
        }

        if (whichVertical === 'refe') {
            $('#blowOutBox').addClass('ref-border');
        }

        bob.scroll();
    };

    bob.jsonphdlnget = function (hdlnurl) {
        hdlnurl += "?timestamp=" + new Date().getTime().toString();
        var script = document.createElement("script");
        script.setAttribute("src", hdlnurl);
        script.setAttribute("type", "text/javascript");
        document.body.appendChild(script);
    };

    bob.headlineapplist = function (hdlndata) {
        var randomHeadline = Math.floor(Math.random() * hdlndata.length);
     
        $('#blowOutBox .bobThmb').attr('src', hdlndata[randomHeadline].thumb);
        $('#blowOutBox .a-bobThmb').attr('href', "http://" + hdlndata[randomHeadline].dom + hdlndata[randomHeadline].uri);
        $('#blowOutBox .bobHeadline').attr('href', "http://" + hdlndata[randomHeadline].dom + hdlndata[randomHeadline].uri)
                                    .html(hdlndata[randomHeadline].ti);

        $(document).trigger('headLineBoxWritten');

        if ($.browser.mozilla && $.browser.version == "19.0") {
            $("#blowOutBox").css("display", "none");
            $("#blowOutBox").css("right", "0px");
        }
    };

    bob.feed = function(obj){
        //count++;
        // the json_bucket and headlns should only be a one json key with the value of an array.
        // if that changes, this has to change.
        var keys = [];
        for (var key in obj){
            keys.push(key);
            break;
        }

        bob.feeds = $.merge(bob.feeds,obj[keys[0]]);

        ++bob.feedCount;

        if (bob.feedCount===2){
            bob.headlineapplist(bob.feeds);
        }

    };

    // event binding for scrolling.
    bob.scroll = function(){
        $(window).scroll(function(){
            bob.toggle();
        });
    };

    // various click events.
    bob.clicks = function(){
        $('#bobClose').click(function(e){
            bob.headlineClose();
        });

        $('.bobHeadline').click(function(e){
            wmdTrack('pv_sss');
        });

        $('.a-bobThmb').click(function(e){
            wmdTrack('pv_sss');
        });
    };

    // scroll() calls this. It is the test if BOB should show or not. 
    // If BOB should be toggled, do so.
    bob.toggle = function (){
        var docScrollTop = $(document).scrollTop(),
            winHeight = $(window).height();

        if ((docScrollTop > bob.btmrcol) && bob.hiding === true) {
            // document is scrolled to a point around half the height plus offset.top of the div El 
            
            if (bob.testPagination()){
                return 'pagination'; // true = there is pagination.
            } else {
                bob.show();
            }
        }

        if (docScrollTop < bob.btmrcol && bob.hiding === false) {
            bob.hide();
        }
    };

    bob.testHeight = function (){

        var percent = bob.whichVertical === 'news' ? 0.43 : 0.49;

        if (bob.hrcol !== bob.$targetDiv.height()){

            bob.hrcol = bob.$targetDiv.height();
            bob.rcoltpoffst = bob.$targetDiv.offset().top;
            bob.btmrcol = (bob.rcoltpoffst + bob.hrcol) * percent;
            bob.toggle();

        }
    };

    bob.testPagination = function(){

        var newsPagination,refePagination;

        newsPagination = function(){
            var $secNav= $('#sectionNav'),
                $prevSec= $('#previoussection'),
                $nextSec= $('#nextsectiondropdown');

            if ($secNav.length===0){
                return false; // there is not pagination
            }

            if ($nextSec.html() === '&nbsp;'){ // there is not another page
                return false; // there is pagination but there are no more pages
            } else {
                return true;
            }            
        };

        // refePagination = function(){
        //     // TODO
        // }; 

        if (bob.whichVertical === 'news') {
            return newsPagination();
        }

        // if (bob.whichVertical === 'refe') {
        //     return refePagination();
        // }

    };

    bob.show = function (){
        if (bob.closeClick === true ){
            return;
        }

        if ($.browser.mozilla && $.browser.version == "19.0") {
            $("#blowOutBox").show();
            wmdTrack("pv_ssa");
        } else {
            $("#blowOutBox").animate({
                right: "15px"
            }, 450).clearQueue();
            wmdTrack("pv_ssa");
        }
        bob.hiding = false;
    };

    bob.hide = function (){
        if ($.browser.mozilla && $.browser.version == "19.0") {
            $("#blowOutBox").hide();
        } else {
            $("#blowOutBox").animate({
                right: "-320px"
            }, 450).clearQueue();
        }
        bob.hiding = true;
    };

    bob.headlineClose = function () {
        bob.closeClick = true;
        bob.hide();
    };

    $(document).bind('headLineBoxWritten', function(){
       bob.toggle();
    });

    $(document).bind('contentElModified', function(){
        bob.testHeight();
    });

    return bob;
    
})(bobMod || 'no opts', jQuery);