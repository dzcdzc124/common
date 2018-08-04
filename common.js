function statSave (action,type){
    if(typeof _hmt != "undefined"){
        _hmt.push(['_trackEvent', action, ""]);
    }
    if(typeof _czc != "undefined"){
        _czc.push(["_trackEvent", action, ""]);
    }
    if(typeof MtaH5 != "undefined"){
        MtaH5.clickStat(action);
    }
}

/*
 * 预加载类，支持图片和音频预加载
 * file_list  需预加载的文件列表
 * process    加载过程函数，参数为进度
 * callback   加载完成后的回调函数
 * extra      非必须，表示需预加载的接口数
 *
*/

function Preload( option ){
    this.startTime =  0;        //开始时间
    this.endTime =  0;          //结束时间
    this.progress =  0;
    this.load_timer =  null;
    this.loadedNum =  0;
    this.list = option.file_list;
    this.process = option.process?option.process:null;
    this.callback = option.callback;
    this.extra = option.extra ? option.extra: 0;
    if(this.list.length == 0){
        this.loadComplete();
    }else{
        this.init();
    }
}
Preload.prototype = {
    init:function(){
        //页面图片的加载
        this.startTime = Date.now();

        for(var i = 0 ;i < this.list.length; i++){
            var suffix = this.list[i].substr( this.list[i].lastIndexOf('.')+1 );
                if( $.inArray( suffix, ['mp3','wav','ogg'] ) > -1){
                this.loadAudio(this.list[i]);
            }else{
                this.loadImg(this.list[i]);
            }
        }

        clearInterval(this.load_timer);
        this.load_timer = setInterval((function(_this){
            if(_this.process){
                return function(){
                    _this.loadingCount();
                    _this.process(_this.progress);
                }
            }else{
                return function(){
                    _this.loadingCount();
                }
            }
        }(this)),40);
    },
    loadAudio: function(src){
        var audio = document.getElementById('audio') || document.createElement('audio');
        var self = this;
        audio.addEventListener("error", function(){
            self.loadedNum ++;
            console.log("Load Error: " + this.src);
        })
        //浏览器判断 当媒介能够以当前速率无需因缓冲而停止即可播放至结尾时触发 (chrome中会根据下载速度和播放速率之差进行计算，如果下载速度大于播放速率，会立刻触发该事件 )
        audio.addEventListener("canplaythrough", function(){
            self.loadedNum ++;
        })
        audio.src = basePath + src;
    },
    loadImg: function(src){
        var img = new Image();
        var self = this;
        img.onload = (function (_this) {
            return function(){
                _this.loadedNum ++;
            }
        }(this))
        img.onerror = (function (_this) {
            return function(){
                _this.loadedNum ++;
                console.log("Load Error: " + this.src);
            }
        }(this))
        img.src = src;
    },
    loadingCount:function(){
        var np = Math.round( (this.loadedNum / (this.list.length + this.extra))*100 );
        if(np >= 100){
            this.progress += 20;
        }else if(this.progress < np || this.progress < 38){
            this.progress += 2;
        }

        if(this.progress >= 100){
            this.progress = 100;
            clearInterval(this.load_timer);
            this.loadComplete();
        }
    },
    loadComplete:function(){
        console.log('Loaded End: '+ this.list.length +' files');
        this.endTime = Date.now();
        var diffTime = this.endTime - this.startTime;
        console.log('Load Time: '+ diffTime +' ms');
        this.callback(diffTime);
    }
}

/*
 *  自动检测获取自定义form中的数据，收集input,select,textarea元素的数据
 *  为元素添加以下属性可以自定义字段属性
 *  necessary 必须字段，检测非空
 *  errmsg 必须字段为空时提示信息
 *  ignore 忽略字段，不收集
 *  format 特殊格式字段，目前有mobile、qq、age，检测格式
 *  formatErrMsg 特殊格式字段检测不通过时提示信息
 *  return
 *  {errcode: 0, errmsg: "", data: {}}
 *  检测不通过时 errcode 不为0 ,errmsg为错误信息
 *  data内非ignore字段的值
*/
$.fn.checkForm = function(){
    if(this.length == 0){
        return null;
    }

    var result = {errcode: 0, errmsg: "", data: {}, warn: []};
    var obj = this.eq(0);

    var el = obj.find("input, select, textarea");
    el.each(function(){
        if( this.getAttribute("ignore") !== null ) return;  //忽略

        switch(this.type){
            case "checkbox":
                result.data[this.name] = this.checked;
                break;
            default:
                result.data[this.name] = this.value;
                break;
        }
        if(this.getAttribute("necessary") !== null){
            if( $.trim(this.value) === "" ){
                result.warn.push(this.name);
                result.errcode = -1;
                var errmsg = this.getAttribute("errmsg");
                result.errmsg = result.errmsg || errmsg || "请填写完整信息再提交~";
            }
        }

        if(this.getAttribute("forbidEmoji") !== null){
            var reg = /\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g;
            if(reg.test(this.value)){
                result.warn.push(this.name);
                result.errcode = -1;
                var errmsg = this.getAttribute("emojimsg");
                result.errmsg = result.errmsg || errmsg || "禁止输入emoji表情~";
            }
        }


        var format = this.getAttribute("format");
        if( format !== null && $.trim(this.value) !== "" ){
            var flag = true;
            switch(format.toLowerCase()){
                case "mobile":
                    if( !result.data[this.name].match(/^1(3|4|5|7|8)[0-9]{9}$/)){
                        result.warn.push(this.name);
                        result.errcode = -2;
                        var formatErrMsg = this.getAttribute("formatErrMsg");
                        result.errmsg = result.errmsg || formatErrMsg || "手机号码格式有误~";
                    }
                    break;
                case "qq":
                    if( isNaN( result.data[this.name] ) ){
                        result.warn.push(this.name);
                        result.errcode = -2;
                        var formatErrMsg = this.getAttribute("formatErrMsg");
                        result.errmsg = result.errmsg || formatErrMsg || "QQ号码格式有误~";
                    }
                    break;
                case "age":
                    if( (isNaN( result.data[this.name] ) || Number(result.data[this.name]) < 1) ){
                        result.warn.push(this.name);
                        result.errcode = -2;
                        var formatErrMsg = this.getAttribute("formatErrMsg");
                        result.errmsg = result.errmsg || formatErrMsg || "请填写正确的年龄~";
                    }
                    break;
                case "idcard":
                    var idreg = /(^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$)|(^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}$)/;
                    if( !idreg.test(result.data[this.name]) ){
                        result.warn.push(this.name);
                        result.errcode = -2;
                        var formatErrMsg = this.getAttribute("formatErrMsg");
                        result.errmsg = result.errmsg || formatErrMsg || "请填写正确的身份证号码~";
                    }
                    break;
                default:
                    break;
            }
        }
    })

    if(result.errcode != 0){
        console.log(result);
    }
    return result;
}

/*
*   地区选择类
*   传入地区select控件，地区配置，可自动完成省份，城市的转变
*/
function cityControl(param){
    this.provinceSelect = param.provinceSelect;
    this.citySelect = param.citySelect;
    this.cityConfig = isExit(param.cityConfig) ? param.cityConfig : null;
    this.autoComplete = isExit(param.autoComplete) && this.cityConfig ? param.autoComplete : false;
    this.onProvinceChangeEnd = isExit(param.onProvinceChangeEnd) ? (param.onProvinceChangeEnd) : function(){};
    this.onCityChangeEnd = isExit(param.onCityChangeEnd) ? (param.onCityChangeEnd) : function(){};

    if( isExit(this.cityConfig) ){
        this.init();
    }
}
cityControl.prototype = {
    init: function(){
        var self = this;

        self.provinceSelect.on("change",function(){
            var province = $(this).val();
            var city = self.citySelect.val();

            if( self.autoComplete ){
                var cHtml = "";
                if( typeof self.cityConfig[province] != 'undefined'){
                    var provinceData = self.cityConfig[province];
                    for (var i = 0; i < provinceData.length; i++){
                        var city = provinceData[i];
                        cHtml += "<option value='"+city+"' city='"+city+"'>"+city+"</option>";
                    }
                }

                self.citySelect.find("option").not("[disabled]").remove();
                self.citySelect.append(cHtml);

                self.onProvinceChangeEnd({province: province, city: city});
            }
        })

        self.citySelect.on("change", function(){
            var province = self.provinceSelect.val();
            var city = $(this).val();

            self.onCityChangeEnd({province: province, city: city});
        })

        if( self.autoComplete ){
            var pHtml = "";
            for(var province in self.cityConfig){
                pHtml += "<option value='"+province+"' province='"+province+"'>"+province+"</option>";
            }
            self.provinceSelect.find("option").not("[disabled]").remove();
            self.provinceSelect.append(pHtml);
        }
    }
}

var musicControl = {
    supportAudio: false,
    myVideo: null,
    userState: true,    //用户选择的状态，视频暂停后的回滚状态
    init: function(musicLink){
        musicControl.supportAudio = (document.createElement('audio').canPlayType);
            if(!musicControl.supportAudio){
            console.log("该浏览器上暂不支持播放");
            return;
        }else{
            musicControl.myVideo = document.querySelectorAll('audio').length>0?document.querySelectorAll('audio')[0]:null;
            if(musicControl.myVideo == null ) {return;}
        }

        //开启、关闭声音
        $(".audio-icon").on(eventName.start,function(e){
            if (musicControl.myVideo.paused){
                musicControl.play()
                musicControl.userState = true;
            }
            else{
                musicControl.pause()
                musicControl.userState = false;
            }
            e.stopPropagation();
        })

        //个别苹果设备交互触发
        $(window).one(eventName.start,function(){
            if ( musicControl.myVideo.paused && musicControl.userState){
                musicControl.play();
            }
        })

        //视频与音频不兼容播放
        var videos = document.querySelectorAll("video");
        for(var i = 0; i < videos.length; i++){
            videos[i].addEventListener("play", function(){
                musicControl.pause();
            })

            videos[i].addEventListener("pause", function(){
                if(musicControl.userState){
                    musicControl.play();
                }
            })
        }


        musicControl.myVideo.addEventListener("play", function(){
            $('.audio-icon').addClass('on');
        }, false)
        musicControl.myVideo.addEventListener("pause", function(){
            $('.audio-icon').removeClass('on');
        }, false)

        musicControl.myVideo.addEventListener("canplay", function(){
            $('.audio-icon').removeClass("none");
            if (musicControl.myVideo.paused){
                $('.audio-icon').removeClass('on');
            }
            else{
                $('.audio-icon').addClass('on');
            }
        }, false)

        musicControl.myVideo.src = musicLink;
        musicControl.myVideo.autoplay = true;
    },
    play: function(){
        musicControl.myVideo.play();
    },
    pause: function(){
        musicControl.myVideo.pause();
    }
}

function getPageApi(url,postData,callback,param){
    var sending = false;
    if(typeof sendingUrls == "undefined"){
        window.sendingUrls = [];
    }
    if( $.inArray(url, sendingUrls) >= 0 ){
        sending = true;
    }else{
        sendingUrls.push(url);
    }
    if(!sending){
        $.ajax({
            url: url,
            type: param && param.type == "get" ? "get" : "post",
            dataType: param && typeof param.dataType != "undefined" ? param.dataType : 'json',
            data: postData,
            beforeSend: function() {

            },
            error: function() {
                var index = $.inArray(url, sendingUrls);
                if( index >= 0 ){
                    sendingUrls.splice(index, 1);
                }
                callback({errcode: -404, errmsg: "服务器忙...请稍候再试~"});
            },
            success: function(data) {
                var index = $.inArray(url, sendingUrls);
                if( index >= 0 ){
                    sendingUrls.splice(index, 1);
                }
                callback(data);
            }
        });
    }else{
        console.log("正在通信中..."+url);
    }
}


var Tools = {
    //判断终端类型是否PC端
    isPC: function(){
        var userAgentInfo = navigator.userAgent;
        var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod", "Nokia");
        var flag = true;
        for (var i = 0; i < Agents.length; i++) {
            if (userAgentInfo.indexOf(Agents[i]) >= 0) {
                flag = false;
                break;
            }
        }
        return flag;
    },
    isIOS: function(){
        var userAgentInfo = navigator.userAgent;
        var Agents = new Array("iPhone", "iPad", "iPod");
        var flag = false;
        for (var i = 0; i < Agents.length; i++) {
            if (userAgentInfo.indexOf(Agents[i]) >= 0) {
                flag = true;
                break;
            }
        }
        return flag;
    },
    isVivoSpace: function(){
        var userAgentInfo = navigator.userAgent.toLowerCase();
        return userAgentInfo.indexOf("vivospace") >= 0;
    },
    isVivoBrowser: function(){
        var userAgentInfo = navigator.userAgent.toLowerCase();
        return userAgentInfo.indexOf("vivobrowser") >= 0;
    },
    //是否能进行长按保存操作
    canLongtap: function(){
        var userAgentInfo = navigator.userAgent.toLowerCase();
        var device = ["vivospace", "vivobrowser", "weibo"];
        for( var i in device ){
            if( userAgentInfo.indexOf(device[i]) >= 0 ){
                return false;
            }
        }
        return true;
    },
    getRandom: function(a , b , toFixNum){
        if(a>b){
            a= [b, b=a][0];
        }
        if(!toFixNum){
            var rand = Math.floor(Math.random()*(b-a+1)) + a;
            return rand;
        }else{
            var n = Math.random()*(b-a)+a;
            return Number(n.toFixed(toFixNum));
        }
    },
    getWinSize: function(){
        var winWidth = 0 , winHeight = 0;

        if (window.innerWidth && window.innerHeight){
            winWidth = window.innerWidth;
            winHeight = window.innerHeight;
        }
        else if ((document.body) && (document.body.clientWidth) && (document.body.clientHeight)){
            winWidth = document.body.clientWidth;
            winHeight = document.body.clientHeight;
        }

        // 通过深入 Document 内部对 body 进行检测，获取窗口大小
        if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth){
            winHeight = document.documentElement.clientHeight;
            winWidth = document.documentElement.clientWidth;
        }
        return {
            width: winWidth,
            height: winHeight
        }
    },
    getQueryString: function(name){
        var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
        //解析中文
        var link = decodeURI(window.location.search);
        var r = link.substr(1).match(reg);
        if( r!=null )
            return  unescape(r[2]);
        return null;
    },
    isExit: function( param ){
        if( typeof param != 'undefined' )
            return true;
        return false;
    },
    randomChild: function (array){
        if( array instanceof Array && array.length > 0 ){
            return array[Tools.getRandom(0, array.length-1)];
        }
        return null;
    },
    //汉字字符串长度判断
    charHandlers: function(){
        hasZh: function(str){
            for(var i = 0;i < str.length; i++)
            {
                if(str.charCodeAt(i) > 255) //如果是汉字，则字符串长度加2
                    return true;
                return false;
            }
        },
        getlen: function(str){
            var strlen = 0;
            for(var i = 0;i < str.length; i++)
            {
                if(str.charCodeAt(i) > 255) //如果是汉字，则字符串长度加2
                    strlen += 2;
                else
                    strlen++;
            }
            return strlen;
        },
        //限制长度，中文2，英文1
        limitlen: function(str, len){
            var result = "";
            var strlen = 0;
            for(var i = 0;i < str.length; i++)
            {
                if(str.charCodeAt(i) > 255) //如果是汉字，则字符串长度加2
                    strlen += 2;
                else
                    strlen++;

                result += str.substr(i,1);

                if(strlen >= len){
                    break;
                }
            }
            return result;
        }
    }
}

var support = (window.Modernizr && Modernizr.touch === true) || (function () {
    return !!( ('ontouchstart' in window)  || window.DocumentTouch && document instanceof DocumentTouch);
})();
var eventName = {
    start: support ? 'touchstart' : 'mousedown',
    move: support ? 'touchmove' : 'mousemove',
    end: support ? 'touchend' : 'mouseup',
    tap: support ? 'tap' : 'click'
};


var viewControl = (function(){
    var maskCount = 0;

    return {
        alert:function(msg,type){
            var msgObj = $(".alert-layer");
            msgObj.find(".msg").html(msg);

            viewControl.layerShow(msgObj,"fade");
        },
        layerShow: function(obj, type, isFullMask){
            if(typeof isFullMask == "undefined" || isFullMask == true){
                $(".fullmask").removeClass("none").animate({"opacity":"1"}, 400);
                maskCount ++ ;
            }
            var inType,outType;
            switch(type){
                case "bounce":
                    inType = "bounceIn";
                    outType = "bounceOut";
                    break;
                case "zoom":
                    inType = "zoomIn";
                    outType = "zoomOut";
                    break;
                default:
                    inType = "fadeInDown";
                    outType = "fadeOutUp";
                    break;
            }

            obj.removeClass("none");
            obj.addClass(inType+" animated");
            obj.find(".close,.comfirm").off().on(eventName.tap,function(){
                viewControl.layerHide($(this).parents(".bounceBox"), inType, outType);
            })
        },
        layerHide: function(obj, inType, outType){
            maskCount = maskCount > 0 ? maskCount - 1 : 0;
            obj.removeClass(inType).addClass(outType);
            setTimeout(
                (function(_obj){
                    return function(){
                        _obj.addClass("none");
                        _obj.removeClass(outType + " animated");
                        if(maskCount <= 0){
                            $(".fullmask").animate({"opacity":"0"}, 100, function(){
                                $(this).addClass("none");
                            })
                        }
                    }
                }(obj))
            ,500);
        },
        connectLoading: function(act){
            if(act == "show"){
                $('.connenting').removeClass("none");
            }else{
                $(".connenting").addClass("none");
            }
        },
        showMsg: function(msg,duration){
            duration = typeof duration == 'number'? duration:2000;
            var rid = "showMsg"+getRandom(1,10000000);
            var showMsg = $("<div class='showMsg' id='"+rid+"'></div>");
            showMsg.append("<div class='content'>"+msg+"</div>")
            $("body").append(showMsg.animate({"opacity": 1},100));

            setTimeout((function(_showMsg){
                return function(){
                    _showMsg.animate({"opacity": 0},400,function(){
                        $(this).remove();
                    })
                }
            }(showMsg)),duration)
        }
    }
}())

var utils = {
    addEvent: function(el, type, fn, capture){
        el.addEventListener(type, fn, !!capture);
    },
    removeEvent: function(el, type, fn, capture){
        el.removeEventListener(type, fn, !!capture);
    }
};
//自定义简易滑动类
function Swipe(selector, option){
    this.el = typeof selector == "string" ? document.querySelector(selector) : selector[0];

    this.direction = option.direction=="vertical" ? "vertical" : 'horizontal';
    this.threshold = option.threshold ? option.threshold : 80;
    this.data = {};
    this.onSwipeNext = option.onSwipeNext ? option.onSwipeNext : null;
    this.onSwipePrev = option.onSwipePrev ? option.onSwipePrev : null;
    this.onSwipeMove = option.onSwipeMove ? option.onSwipeMove : null;
    this.addSwipeEnent();
}
Swipe.prototype = {
    addSwipeEnent:function(){
        utils.addEvent(this.el, eventName.start, this);
    },
    handleEvent: function(e){
        switch(e.type){
            case 'touchstart':
            case 'mousedown':
                this._start(e);
                break;
            case 'touchmove':
            case 'mousemove':
                this._move(e);
                break;
            case 'touchend':
            case 'mouseup':
                this._end(e);
                break;
        }
    },
    _start:function(e){
        var touches = support ? e.touches[0] : e;

        this.data = {
            startX: touches.pageX,
            startY: touches.pageY,
            distX: 0, // 移动距离
            distY: 0,
            time: +new Date
        }

        //绑定this后默认调用this.handleEvent
        utils.addEvent(this.el, eventName.move, this);
        utils.addEvent(this.el, eventName.end, this);
    },
    _move: function(e){
        var touches = support ? e.touches[0] : e;

        this.data.distX = touches.pageX - this.data.startX;
        this.data.distY = touches.pageY - this.data.startY;
        if(this.onSwipeMove){
            this.onSwipeMove({x:this.data.distX,y:this.data.distY});
        }
        e.preventDefault();
    },
    _end: function(e){
        this._triggerEvent();
            utils.removeEvent(this.el, eventName.move, this);
            utils.removeEvent(this.el, eventName.end, this);
        },
    _triggerEvent: function(){
        var _this = this;
        duration = +new Date - this.data.time
        //触发事件
        if(this.data.distX < -this.threshold){
            _this.swipeLeft();
        }else if(this.data.distX > this.threshold){
            _this.swipeRight();
        }
        if(this.data.distY < -this.threshold){
            _this.swipeUp();
        }else if(this.data.distY > this.threshold){
            _this.swipeDown();
        }
    },
    //dir:0为横向1为竖向
    rollback: function(dir){
    },
    swipeUp:function(){
        this.onSwipeNext && this.direction == "vertical" ? this.onSwipeNext() : null;
    },
    swipeDown:function(){
        this.onSwipePrev && this.direction == "vertical" ? this.onSwipePrev() : null;
    },
    swipeLeft:function(){
        this.onSwipeNext && this.direction == "horizontal" ? this.onSwipeNext() : null;
    },
    swipeRight:function(){
        this.onSwipePrev && this.direction == "horizontal" ? this.onSwipePrev() : null;
    }
}

function addShareJs( apiArr ){
    var nBody = document.body || document.getElementsByTagName('body')[0];

    var apilist = [
        "onMenuShareTimeline",
        "onMenuShareQQ",
        "onMenuShareAppMessage",
        "onMenuShareWeibo"
    ];

    (typeof apiArr != "undefined") && (apilist = apilist.concat(apiArr));
    var list = "?list=" + apilist.join(",");

    var shareJS = [ location.protocol + "//res.wx.qq.com/open/js/jweixin-1.0.0.js" ];
    if( typeof userData != "undefined" && typeof userData.tar_open != 'undefined' && userData.tar_open){
        shareJS.push( location.protocol + "//js.tarsocial.com/h5stat-2.1.1.js");
        shareJS.push( basePath + "js/tarinit.js");
        shareJS.push( location.protocol + "//wx.vivo.com.cn/api/js/weixin.js" + list);
        shareJS.push( basePath + "js/weixin.js");
    }else{
        shareJS.push( location.protocol + "//wx.vivo.com.cn/api/js/weixin.js" + list);
        shareJS.push( basePath + "js/weixin.js");
    }

    for( var i in shareJS){
        if(typeof shareJS[i] != "function"){
            var node = document.createElement('script');

            node.charset = 'utf-8';
            node.async = false;
            node.src = shareJS[i];

            nBody.appendChild(node);
        }
    }
}
