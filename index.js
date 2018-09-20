var draftWrapper = $('#shaft-wrapper');
var dayTimeSelector = $('#day-time-selector');
var wrapperWidth = draftWrapper.width();

$('.room').on('click', function(){
    var t = $(this);

    var offset = t.offset();

    var menuPos = {
        left: offset.left,
        top: offset.top + offset.height
    }

    $('#menu').css(menuPos)
})

draftWrapper.on('clik', '.ordered', function(e){
    // title
}).on('click', '.day-shaft', function(e){
    // 24小时 * 6， 10分钟一刻度
    var t = $(e.target);
    if(t.is('.ordered'))
        return
    
    var ex = e.clientX
    var wrapperX = draftWrapper.offset().left
    var pointPercent = (ex - wrapperX)/wrapperWidth;

    var needBreak = false;
    var start, end;

    t.find('.ordered').each(function(i, ordered){
        if(needBreak)
            return;
            
        ordered = $(ordered);
        var percentStart  = ordered.data('percent-start');
        var percentEnd  = ordered.data('percent-end');
        
        if(pointPercent < percentStart){
            if(ordered.prev('.ordered').length){
                start = ordered.prev('.ordered').data('percent-end');
            }else{
                start = 0;
            }

            end = percentStart;
            needBreak = true;
            return;
        }

        if(i == t.find('.ordered').length - 1){
            start = percentEnd;
            end = 1;
        }
    })

    // console.log(start, end)
    var Y = t.offset().top;
    var X = wrapperX + start * wrapperWidth
    var W = (end - start) * wrapperWidth

    dayTimeSelector.css({
        left: X,
        top: Y,
        width: W,
        display: 'block',
    }).data('min', X).data('max', X + W)

    $('.starter i').text(posToTime(X));
    $('.ender i').text(posToTime(X + W));
})

$('#order-btn').on('click', function(){
    dayTimeSelector.hide();

    timeToStamp($('.starter i').text());
    timeToStamp($('.ender i').text());
})

DATA = [
    [1537413810448, 1537413810448+10*60*1000],
    [1537413810448+110*60*1000, 1537413810448+120*60*1000]
]

var MINUTEMILLISECOND = 60 * 1000;
var HOURMILLISECOND = 60 * MINUTEMILLISECOND;
var DAYMILLISECOND = 24 * HOURMILLISECOND;

DATA.forEach(function(order, index){
    var orderStartDate = new Date(order[0]);
    var orderEndDate = new Date(order[1]);

    var startHours = orderStartDate.getHours();
    var startMinutes = orderStartDate.getMinutes();

    var endHours = orderEndDate.getHours();
    var endMinutes = orderEndDate.getMinutes();

    var startMilliSecondOfDay = startHours * HOURMILLISECOND + startMinutes * MINUTEMILLISECOND;
    var endMilliSecondOfDay = endHours * HOURMILLISECOND + endMinutes * MINUTEMILLISECOND;

    var startPercnet = startMilliSecondOfDay/DAYMILLISECOND;
    var endPercnet = endMilliSecondOfDay/DAYMILLISECOND;

    $('.day-shaft').eq(0).find('.ordered').eq(index).css({
        left: startPercnet * 100 + '%',
        width: (endPercnet - startPercnet) * draftWrapper.width()
    }).data('percent-start', startPercnet)
    .data('percent-end', endPercnet);
});

(function (){
    var initialState = {};
    var dragging = false;
    var min,
        max;
    
    dayTimeSelector.on('mousedown touchstart', 'span', function(e){
        initialState = {
            left: parseInt(dayTimeSelector.css('left')),
            width: dayTimeSelector.width(),
            startPointX: e.clientX,
        }

        var target = $(e.target);
        if(target.is('.starter')){
            initialState.target = 1;
        }else if(target.is('.ender')){
            initialState.target = 2;
        }
        
        dragging = true;

        min = Number(dayTimeSelector.data('min')),
        max = Number(dayTimeSelector.data('max'));

    })
    
    $(window).on('mousemove touchmove', function(e){
        if(dragging){
            var gapX = e.clientX - initialState.startPointX;
            if(initialState.target == 1){
                var l = initialState.left + gapX;
                var w = initialState.width - gapX;

                if(l < min){
                    l = min;
                    w = initialState.width - (min - initialState.left)
                }

                if(l > max - 10){
                    l = max - 10;
                    w = 10
                }

                dayTimeSelector.css({
                    left: l,
                    width: w
                })

                $('.starter i').text(posToTime(l));
            }else if(initialState.target == 2){
                var w = initialState.width + gapX;
                if(w < 10){
                    w = 10
                }else if(w + initialState.left > max){
                    w = max - initialState.left 
                }
                
                dayTimeSelector.css({
                    width: w
                })

                $('.ender i').text(posToTime(initialState.left + w));
            }

            e.preventDefault();
        }

    })

    $(window).on('mouseup touchend', function(){
        if(dragging){
            dragging = false;

        }
    })
})()


function posToTime(x){
    var p = (x - draftWrapper.offset().left)/draftWrapper.width();
    var time = p * DAYMILLISECOND;
    
    var h = Math.floor(time / HOURMILLISECOND);
    var m = Math.floor(time % HOURMILLISECOND / MINUTEMILLISECOND);

    m -= m % 10;

    return fillZero(h) + ':' + fillZero(m);

    function fillZero (z){
        return z < 10 ? '0' + z: z
    }
}

function timeToStamp(time){
    var wee = + new Date(new Date().setHours(0, 0, 0, 0))

    time = time.split(':');
    time = wee + Number(time[0]) * HOURMILLISECOND + Number(time[1]) * MINUTEMILLISECOND;
    // console.log(wee, time)
    return time;
}