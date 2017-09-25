/*
 * 添加全局变量tStat，使用腾讯统计
 * 自动统计预设时间点的用户留存率
 * loadComplete:统计用户加载时间
 *
 *
**/
(function(w){
    w.tStat = w.tStat || {};

    function stat(action, param){
        if(typeof MtaH5 != "undefined"){
            if(typeof param != "undefined"){
                MtaH5.clickStat(action, param);
            }else{
                MtaH5.clickStat(action);
            }
        }
    }

    var timePoint = [0,1,2,3,4,5,6,7,8,9,10,15,20,30,60];
    var count = 0;

    var eventName = {
        stayTime: "stayTime",
        loadComplete: "loadComplete"
    }

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

    w.tStat = {
        loadComplete: function(ms){
            var t = Math.round(ms/1000);
            stat(eventName.loadComplete, {time: t});
        }
    }

})(this)
