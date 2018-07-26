    /* 2018.5.11
       Written by Wenzhe Wang 
       TODO(wwz): To be simplified and optimized */

    var resultJson = {};
    var detailedResult = [];

    function getBboxHtml(bbox, width, height) {
        var newWidth = bbox["xmax"] - bbox["xmin"];
        var newHeight = bbox["ymax"] - bbox["ymin"];
        var newXmin = bbox["xmin"];
        var newYmin = bbox["ymin"];
        if (width < 476 && height < 476) {
            newXmin = (476 - width) / 2 + newXmin;
            newYmin = (476 - height) / 2 + newYmin;
        } else if (width >= height) {
            newWidth = newWidth * 476 / width;
            newHeight = newHeight * 476 / width;
            newXmin = newXmin * 476 / width;
            newYmin = newYmin * 476 / width;
        } else {
            newWidth = newWidth * 476 / height;
            newHeight = newHeight * 476 / height;
            newXmin = (476 - width * 476.0 / height) /2 + newXmin * 476 / height;
            newYmin = newYmin * 476 / height;
        }
        var bboxHtml = '<div style="position: absolute; outline: rgb(74, 171, 232) solid 2px; z-index: 1; transform: rotateZ(0deg); width: ' + newWidth + 
                       'px; height: ' + newHeight + 'px; left: ' + newXmin + 'px; top: ' + newYmin + 'px;"></div>';
        return bboxHtml;
    }
    
    function getBboxShowHtml(bbox, width, height, objectNo) {
        var newWidth = 100 / (bbox["xmax"] - bbox["xmin"])  * width;
        //var newHeight = 100 / (bbox["xmax"] - bbox["xmin"])  * height;
        var newXmin = 100 / (bbox["xmax"] - bbox["xmin"]) * bbox["xmin"];
        var newYmin = 100 / (bbox["xmax"] - bbox["xmin"]) * bbox["ymin"];
        var bboxShowHtml = '<div class="swiper-slide"><div class="img-box"><img id="object' + objectNo + '" src="' + $("#imageContainerResult").attr("src") + 
                           '" class="" style="width: ' + newWidth + 'px; left: -' + newXmin + 'px; top: -' + newYmin + 'px; position: absolute;">)}</div></div>';
        return bboxShowHtml;
    }
    
    function getOverallResultHtml(objectNum, costtime) {
        var displayInformation = 's have'
        if (objectNum <= 1) {
            displayInformation = ' has'
        }
        var overallResultHtml = '<p class="app-demo-TrafficSignDetect-result__info-guiding-1iuPL"><span><span id="trafficsignnum">' + objectNum + 
                                '</span> traffic sign' + displayInformation +' been detected, click the traffic sign image to check detect results.</span><span> It costs <span id="costtime">' + costtime + 
                                '</span>s. Click on the Response JSON tab for more detailed results.</span></p>';
        return overallResultHtml;
    }
    
    function getDetailedResultHtml(indexDetailedResult) {
        function getRawResultHtml(title, content) {
            var    rawResultHtml = '<div class="trafficsignpp-Row app-demo-TrafficSignDetect-result__item-J6anr" style="margin-left: -4px; margin-right: -4px;">' + 
                                '<div class="trafficsignpp-Col-5 trafficsignpp-Col-offset-0 app-demo-TrafficSignDetect-result__title-1s2U7" style="padding-left: 4px; padding-right: 4px;"><span>' + title + '</span></div>' + 
                                '<div class="trafficsignpp-Col-19 trafficsignpp-Col-offset-0 app-demo-TrafficSignDetect-result__text-2UiA7" style="padding-left: 4px; padding-right: 4px;"><span>' + content + '</span></div></div>';
            return rawResultHtml;
        }
        var detailedResultTextHtml = '';
        $.each(indexDetailedResult, function(name, value){    
            if (name === "Confidence Value") {
                detailedResultTextHtml += '<div class="trafficsignpp-Row app-demo-TrafficSignDetect-result__item-J6anr"style="margin-left: -4px; margin-right: -4px;">' + 
                              '<div class="trafficsignpp-Col-19 trafficsignpp-Col-offset-5 app-demo-TrafficSignDetect-result__text-2UiA7"style="padding-left: 4px; padding-right: 4px;">' + 
                              '<div class="app-demo-TrafficSignDetect-result__progress-container-IEA7e"><div class="app-components-Progress-index__ant-progress-YSsYO app-components-Progress-index__ant-progress-line-Aiszd undefined">' + 
                              '<div><div class="app-components-Progress-index__ant-progress-outer-2ItD3"><div class="app-components-Progress-index__ant-progress-inner-8iRwl">' + 
                              '<div class="app-components-Progress-index__ant-progress-bg-3-7aT"style="width: 0.029%; height: 10px;"></div></div></div></div></div></div>' + 
                              '<span class="app-demo-TrafficSignDetect-result__threshold-line-pxNFD"style="left: ' + 320 * value + 'px;"></span></div></div>';
            } else {
                detailedResultTextHtml += getRawResultHtml(name, value);
            }
        });
        var detailedResultHtml = $('<div class="app-demo-TrafficSignDetect-result__trafficsign-info-8Kyo6"></div>').html(detailedResultTextHtml);
        return detailedResultHtml;
    }
    
    function processForUploadFile(response) {
        var responseJson = JSON.parse(response);
        if (responseJson["state"] === "error") {
            $.alertable.alert("Wrong uploaded file, please modify and try again!")
            return;
        }
        resultJson = responseJson;
        $("#imageContainerResult").attr("src", responseJson["url"]);
        $(".trafficsignpp-Swiper-dark div.img-box:first").children("img").attr("src", responseJson["url"]);
        $("textarea").text(response);
        $(".trafficsignpp-ImageContainer").children("div").remove();
        $("#object0").parents(".swiper-slide").siblings().remove();
        if (responseJson["url"].indexOf("static/images/demo") === -1 ) {
            $("div.trafficsignpp-Swiper-light div.img-box").attr("class", "img-box");
            $("div.trafficsignpp-Swiper-light div.img-box").children("img").attr({
                "style": "opacity: 0.5;",
                "class": ""
            });
        }
        var rightFirstSwiper = $("div.trafficsignpp-Swiper-dark div.swiper-slide:first");
        rightFirstSwiper.children(".img-box").attr("class", "img-box selected");
        rightFirstSwiper.children(".img-box").children("img").attr("class", "selected");
        
        var objectNum = 0;
        responseJson["result"].forEach(function(result) {  
            result["objects"].forEach(function(objects) { 
                objectNum += 1;
                $(".trafficsignpp-ImageContainer").append(getBboxHtml(objects["bbox"], responseJson["width"], responseJson["height"]));
                $(".trafficsignpp-Swiper-dark .image-box-wrapper").append(getBboxShowHtml(objects["bbox"], responseJson["width"], responseJson["height"], objectNum));
            });
        });
        objectNum = 0;
        resultJson["result"].forEach(function(result) {
            result["objects"].forEach(function(objects) {
                detailedResult[objectNum] = {
                    "Category": result["category"],
                    "Width": (objects["bbox"]["xmax"] - objects["bbox"]["xmin"]).toString() + "px",
                    "Height": (objects["bbox"]["ymax"] - objects["bbox"]["ymin"]).toString() + "px",
                    "X_min": objects["bbox"]["xmin"].toString() + "px",
                    "Y_min": objects["bbox"]["ymin"].toString() + "px",
                    "Confidence": "value: " + objects["score"] + "; threshold: 0.8",
                    "Confidence Value": objects["score"],
                    "Image Width": resultJson["width"].toString() + "px",
                    "Image Height": resultJson["height"].toString() + "px"
                };
                objectNum += 1;
            });
        });
        if ($(".app-demo-TrafficSignDetect-result__trafficsign-info-8Kyo6").length != 0) {
            $(".app-demo-TrafficSignDetect-result__trafficsign-info-8Kyo6").remove();
        }
        if ($(".tabPanel-container .tabPanel p").length != 0) {
            $(".tabPanel-container .tabPanel p").remove();
        }
        var imageBox = $("div.trafficsignpp-Swiper-dark div.image-box-wrapper");
        $(".tabPanel-container .tabPanel:first").append(getOverallResultHtml(imageBox.children(".swiper-slide").length - 1, resultJson["time"]));            
        $("button.trafficsignpp-Swiper-dark-button-prev").attr("disabled", true);
        if (objectNum >= 4) {
            $("button.trafficsignpp-Swiper-dark-button-next").attr("disabled", false);
        }
        else {
            $("button.trafficsignpp-Swiper-dark-button-next").attr("disabled", true);
        }
        rightSwipperEventBinding();
    }
    
    $(document).ready(function(){
        $("div.trafficsignpp-Swiper-light div.img-box:first").click();
    });

    $("#file-uploader-btn").click(function() {
        $("input.upload").click();
    });

    $("input.upload").change(function() {
        var formData = new FormData();
        formData.append("file", $("input.upload")[0].files[0]);
        $.ajax({
            type: "POST",
            url: "/",
            cache: false,
            data: formData,
            dataType: "json",
            processData: false,
            contentType: false,
            success: function(response) {
                $('input.upload').val('');
                processForUploadFile(response);
            }
        });
    });
    
    $("button.trafficsignpp-Button").click(function() {
        $.ajax({
            type: "POST",
            url: "/",
            cache: false,
            data: JSON.stringify({
                url: $("input.trafficsignpp-Input").val(),
                fake: 0
            }),
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            success: function(response) {
                processForUploadFile(response);
            }
        });
    });
    
    $("div.trafficsignpp-Swiper-light div.img-box").click(function() {
        $.ajax({
            type: "POST",
            url: "/",
            cache: false,
            data: JSON.stringify({
                url: $(this).children("img").attr("src"),
                fake: 1
            }),
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            success: function(response) {
                processForUploadFile(response);
            }
        });
        $("#imageContainerResult").attr("src", $(this).children("img").attr("src"));
        $("div.trafficsignpp-Swiper-dark div.img-box").children("img").attr("src", $(this).children("img").attr("src"));
        $("div.trafficsignpp-Swiper-light div.img-box").attr("class", "img-box");
        $("div.trafficsignpp-Swiper-light div.img-box").children("img").attr({
            "style": "opacity: 0.5;",
            "class": ""
        });
        $(this).attr("class", "img-box selected");
        $(this).children("img").attr({
            "style": "opacity: 1;",
            "class": "selected"
        });
        $("div.trafficsignpp-Swiper-dark div.img-box").attr("class", "img-box");
        $("div.trafficsignpp-Swiper-dark div.img-box").children("img").attr({
            "class": ""
        });
        $("div.trafficsignpp-Swiper-dark div.img-box:first").attr("class", "img-box selected");
        $("div.trafficsignpp-Swiper-dark div.img-box:first").children("img").attr({
            "class": "selected"
        });
    });
    
    function rightSwipperEventBinding() {        
        $("div.trafficsignpp-Swiper-dark div.swiper-slide:first").nextAll().click(function() {
            $("div.trafficsignpp-Swiper-dark div.img-box").attr("class", "img-box");
            $("div.trafficsignpp-Swiper-dark div.img-box").children("img").attr("class", "");
            $(this).children(".img-box").attr("class", "img-box selected");
            $(this).children(".img-box").children("img").attr("class", "selected");
            $("div.trafficsignpp-ImageContainer").children("div").each(function() {
                var blueBbox = $(this).attr("style").replace("rgb(255, 69, 0)", "rgb(74, 171, 232)");
                $(this).attr("style", blueBbox);
            });
            var objectId = $(this).find("img").attr("id");
            var index = parseInt(objectId.substring(6)) - 1;
            var bbox = $(".trafficsignpp-ImageContainer").children("div").eq(index);
            var redBbox = bbox.attr("style").replace("rgb(74, 171, 232)", "rgb(255, 69, 0)");
            bbox.attr("style", redBbox);
            if ($(".tabPanel-container .tabPanel p").length != 0) {
                $(".tabPanel-container .tabPanel p").remove();
            }
            if ($(".app-demo-TrafficSignDetect-result__trafficsign-info-8Kyo6").length != 0) {
                $(".app-demo-TrafficSignDetect-result__trafficsign-info-8Kyo6").remove();
            }
            $(".tabPanel-container .tabPanel:first").append(getDetailedResultHtml(detailedResult[index]));
        });
    }
    
    $("div.trafficsignpp-Swiper-dark div.swiper-slide:first").click(function() {
        $("div.trafficsignpp-Swiper-dark div.img-box").attr("class", "img-box");
        $("div.trafficsignpp-Swiper-dark div.img-box").children("img").attr("class", "");
        $(this).children(".img-box").attr("class", "img-box selected");
        $(this).children(".img-box").children("img").attr("class", "selected");
        $("div.trafficsignpp-ImageContainer").children("div").each(function() {
            var blueBbox = $(this).attr("style").replace("rgb(255, 69, 0)", "rgb(74, 171, 232)");
            $(this).attr("style", blueBbox);
        });
        if ($(".app-demo-TrafficSignDetect-result__trafficsign-info-8Kyo6").length != 0) {
            $(".app-demo-TrafficSignDetect-result__trafficsign-info-8Kyo6").remove();
        }
        if ($(".tabPanel-container .tabPanel p").length === 0) {
            var imageBox = $("div.trafficsignpp-Swiper-dark div.image-box-wrapper");
            $(".tabPanel-container .tabPanel:first").append(getOverallResultHtml(imageBox.children(".swiper-slide").length - 1, resultJson["time"]));            
        }
    });
    
    $("button.trafficsignpp-Swiper-light-button-prev").click(function(){
        $("button.trafficsignpp-Swiper-light-button-next").attr("disabled", false);    
        var imageBox = $("div.trafficsignpp-Swiper-light div.image-box-wrapper");
        imageBox.prepend(imageBox.children(":last"));
        if($("div.trafficsignpp-Swiper-light div.swiper-slide:first img").attr("id") === "demo1") {
            $("div.trafficsignpp-Swiper-light button.trafficsignpp-Swiper-light-button-prev").attr("disabled", true);
        }    
    });
    
    $("button.trafficsignpp-Swiper-light-button-next").click(function(){
        $("button.trafficsignpp-Swiper-light-button-prev").attr("disabled", false);
        var imageBox = $("div.trafficsignpp-Swiper-light div.image-box-wrapper");
        imageBox.append(imageBox.children(":first"));
        if($("div.trafficsignpp-Swiper-light div.swiper-slide:nth-child(4) img").attr("id") === "demo6") {
            $("div.trafficsignpp-Swiper-light button.trafficsignpp-Swiper-light-button-next").attr("disabled", true);
        }
    });
    
    $("button.trafficsignpp-Swiper-dark-button-prev").click(function(){
        //console.log("go prev!")
        $("button.trafficsignpp-Swiper-dark-button-next").attr("disabled", false);    
        var imageBox = $("div.trafficsignpp-Swiper-dark div.image-box-wrapper");
        imageBox.prepend(imageBox.children(":last"));
        if($("div.trafficsignpp-Swiper-dark div.swiper-slide:first img").attr("id") === "object0") {
            $("div.trafficsignpp-Swiper-dark button.trafficsignpp-Swiper-dark-button-prev").attr("disabled", true);
        }    
    });
    
    $("button.trafficsignpp-Swiper-dark-button-next").click(function(){
        //console.log("go next!")
        $("button.trafficsignpp-Swiper-dark-button-prev").attr("disabled", false);
        var imageBox = $("div.trafficsignpp-Swiper-dark div.image-box-wrapper");
        imageBox.append(imageBox.children(":first"));
        if($("div.trafficsignpp-Swiper-dark div.swiper-slide:nth-child(4) img").attr("id") === "object" + (imageBox.children(".swiper-slide").length - 1).toString()) {
            $("div.trafficsignpp-Swiper-dark button.trafficsignpp-Swiper-dark-button-next").attr("disabled", true);
        }
    });
    
    $("div.tab-container div.tab:first").click(function(){
        $("div.tab-container div.tab:last").attr("class", "tab");
        $(this).attr("class", "tab actived");
        $("div.tabPanel-container div.tabPanel:first").attr("class", "actived animated tabPanel");
        $("div.tabPanel-container div.tabPanel:last").attr("class", "hidden animated tabPanel");
    });
    
    $("div.tab-container div.tab:last").click(function(){
        $("div.tab-container div.tab:first").attr("class", "tab");
        $(this).attr("class", "tab actived");
        $("div.tabPanel-container div.tabPanel:first").attr("class", "hidden animated tabPanel");
        $("div.tabPanel-container div.tabPanel:last").attr("class", "actived animated tabPanel");
    });
