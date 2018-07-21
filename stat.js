/*
 * 添加全局变量mtaStat，使用腾讯统计
 * 自动统计预设时间点的用户留存率
 *
 * loadComplete: 统计用户加载时间
 *  {
 *      start: 标记loading开始时间，默认脚本加载时间
 *      end: 标记loading结束时间，计算loading时长
 *      duration：提交计算出的统计时间，可以跳过start和end直接传参调用
 *  }
 *
 * firstInteraction: 首次互动时调用，可以多个地方调用，但只会上报一次，结合vv可以计算跳出率
 *
 * getShareLink: 生成微信分享链接，带渠道和分享标识
 * 二次分享
**/
(function(w){
    w.mtaStat = w.mtaStat || {};

    var eventName = {
        stayTime: "STAYTIME",
        loadComplete: "LOADCOMPLETE",
        firstInteraction: "FIRSTINTERACTION",
        fromWXshare: "FROMWXSHARE",
    }

    var startTime = new Date().getTime();

    //统计预设时间点的用户留存率
    (function(){
        var timePoint = [5, 10, 15, 20, 30, 40, 50, 60];
        var count = 0;

        stat(eventName.stayTime, {time: 0})
        var timer = setInterval(function(){
            if(timePoint.length > 0){
                if(count >= timePoint[0]){
                    timePoint.shift();
                    stat(eventName.stayTime, {time: count});
                }
                count ++;
            }else{
                clearInterval(timer);
            }

        }, 1000)
    })()

    //统计由微信分享链接进入的用户
    (function(){
        var hash = location.hash;
        if(hash.toLowerCase().indexOf(eventName.fromWXshare.toLowerCase()) >= 0){
            stat(eventName.fromWXshare);
        }
    })()

    w.mtaStat.load = {
        start: function(){
            startTime = new Date().getTime();
        },
        end: function(){
            var now = new Date().getTime();
            this.duration(now - startTime);
        },
        duration: function(ms){
            var t = Math.ceil(ms/1000);
            stat(eventName.loadComplete, {time: t});
        }
    };

    w.mtaStat.firstInteraction = function(){
        if(eventName.firstInteraction){
            stat(eventName.firstInteraction);
            delete eventName.firstInteraction;
        }
    }


    w.mtaStat.getShareLink = function(baseLink){
        var ADTAG = getQueryString("ADTAG");

        var link = baseLink + (ADTAG ? "?ADTAG="+ADTAG : ""),

        link += "#"+eventName.fromWXshare;

        return link;
    }


    function stat(action, param){
        if(typeof MtaH5 != "undefined"){
            param ? MtaH5.clickStat(action, param) : MtaH5.clickStat(action);
        }
    }

    //获取url参数
    function getQueryString(name){
        var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
        //解析中文
        var link = decodeURI(window.location.search);
        var r = link.substr(1).match(reg);
        if( r!=null )
            return  unescape(r[2]);
        return null;
    }
})(this)

