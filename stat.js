/*
 * 添加全局变量tStat，使用腾讯统计
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
 *
 * 二次分享
**/
(function(w){
    w.tStat = w.tStat || {};

    var eventName = {
        stayTime: "STAYTIME",
        loadComplete: "LOADCOMPLETE",
        firstInteraction: "FIRSTINTERACTION",
    }

    var startTime = new Date().getTime();

    function stat(action, param){
        if(typeof MtaH5 != "undefined"){
            param ? MtaH5.clickStat(action, param) : MtaH5.clickStat(action);
        }
    }

    //统计预设时间点的用户留存率
    (function(){
        var timePoint = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50, 60];
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

    w.tStat.load = {
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

    w.tStat.firstInteraction = function(){
        if(eventName.firstInteraction){
            stat(eventName.firstInteraction);
            delete eventName.firstInteraction;
        }
    }

})(this)
