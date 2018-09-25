var MINUTEMILLISECOND = 60 * 1000;
var HOURMILLISECOND = 60 * MINUTEMILLISECOND;
var DAYMILLISECOND = 24 * HOURMILLISECOND;// 早9点到晚9点
var WORKMILLISECOND = DAYMILLISECOND / 2;
var ORDERSTARTHOUR = 9;
var ORDERENDHOUR = 21;

var shaftWrapper = $('#shaft-wrapper');
var dayTimeSelector = $('#day-time-selector');
var rooms = $('#rooms');
var roomPanel = $('#room-panel');

var wrapperWidth = $(window).width() * 0.6;// shaftWrapper.width() || 800;
var curShaftDayOffset = 0;
var roomId = 0;

rooms.on('click', '.room', function(e){
    var t = $(this);
    if($(e.target).is('input'))
        return;

    roomId = t.data('room-id');
    refreshShaft();

    $(this).addClass('active').siblings().removeClass('active');
}).on('click', '.room-delete-btn', function(){
    var roomId = $(this).parents('.room').data('room-id');
    console.log(roomId)
    if(window.confirm('确认删除？')){
        zAjax('/room/delete', {
            id: roomId,
        }, function(data){
            makeRooms();
            roomPanel.hide().get(0).reset();
            if(data){
                alert('删除成功')
            }else{
                alert('删除失败')
            }
        })
    }
    arguments[0].preventDefault();
}).on('click', '.room-edit-btn', function(){
    var roomId = $(this).parents('.room').data('room-id');
    roomPanel.show().off('submit').on('submit', function(){
        var roomName = $.trim(roomPanel.find('.room-name').val());

        if(!roomName)
            return alert('请输入办公室名')

        zAjax('/room/edit', {
            id: roomId,
            name: roomName
        }, function(data){
            makeRooms();
            roomPanel.hide().get(0).reset();
            if(data){
                alert('更新成功')
            }else{
                alert('更新失败')
            }
        })
        arguments[0].preventDefault();
    });
});

$('#room-add-btn').on('click', function(){
    roomPanel.show().off('submit').on('submit', function(){
        var roomName = $.trim(roomPanel.find('.room-name').val());

        if(!roomName)
            return alert('请输入办公室名')

        zAjax('/room/add', {
            name: roomName
        }, function(data){
            makeRooms();
            roomPanel.hide().get(0).reset();
            if(data){
                alert('新增成功')
            }else{
                alert('新增失败')
            }
        })
        arguments[0].preventDefault();
    });
})

shaftWrapper.on('click', '.ordered', function(e){
    // 取消预定
    var t = $(this);
    var orderId = t.data('order-id');
    orderId && checkIfOwnOrder(orderId, function(data){
        if(data){
            $('.ordered .btn').remove();
            t.append('<input type="button" class="btn" value="取消"/>');
            t.find('.btn').on('click', function(e){
                if(window.confirm('确定取消')){
                    cancelOrder(orderId);
                }
                e.preventDefault()
            })
        }
    })

    dayTimeSelector.hide();
}).on('click', '.day-shaft', function(e){
    // 24小时 * 6， 10分钟一刻度
    var t = $(e.target);
    if(t.is('.day-shaft')){
        var ex = e.clientX
        var wrapperX = shaftWrapper.offset().left
        var pointPercent = (ex - wrapperX)/wrapperWidth;
    
        var needBreak = false;
        var start = 0, end = 1;

        $('.ordered .btn').remove();
    
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
        var X = wrapperX + start * wrapperWidth;
        var W = (end - start) * wrapperWidth;
    
        dayTimeSelector.css({
            left: X,
            top: Y,
            width: W,
            display: 'block',
        }).data('min', X).data('max', X + W)
    
        $('.starter i').text(posToTime(X));
        $('.ender i').text(posToTime(X + W));
    
        // 设置日期偏移量
        var n = Number(t.attr('id').split('-')[1]);
        curShaftDayOffset = n;

        // 重置起始点最大移动范围
        dayTimeSelector.removeAttr('data-max-starter');
    }
})

$('#order-btn').on('click', function(){
    dayTimeSelector.hide();
    var startTime = timeToStamp($('.starter i').text()) + curShaftDayOffset * DAYMILLISECOND;
    if(startTime > + new Date()){
        if(!roomId){
            return alert('请选择办公室')
        }
        
        zAjax('/order', {
            roomId: roomId,
            startTime: startTime,
            endTime: timeToStamp($('.ender i').text()) + curShaftDayOffset * DAYMILLISECOND,
        }, function(){
            refreshShaft();
        })
    }else{
        alert('开始时间不能早于现在');
    }
})

function cancelOrder(orderId){
    zAjax('/cancelOrder', {
        orderId: orderId,
    }, function(){
        refreshShaft();
    })
}

// ======注册/登录
$('#to-login').on('click', function(){
    $('#login-panel').show();
    $('#entry').hide();
})

$('#to-regist').on('click', function(){
    $('#regist-panel').show();
    $('#entry').hide();
})

$('#regist-panel').on('submit', function(){
    arguments[0].preventDefault()

    var name = $.trim($(this).find('[name=name]').val());
    zAjax('/regist', {
        name: name,
    }, function(){
        alert('注册成功')
        $('#login-panel').show();
    })
})

$('#login-panel').on('submit', function(){

    arguments[0].preventDefault();

    var form = $(this);
    var name = $.trim(form.find('[name=name]').val());

    zAjax('/login', {
        name: name
    }, function(logined){
        if(logined){
            makeRooms();
            form.remove();
        }else
            alert('没有该用户,请检查用户名')
    })

})
// ======

$(window).on('resize', function(){
    dayTimeSelector.hide()
})

checkLogin();

function refreshShaft(){
    if(!roomId){
        return alert('请选择办公室')
    }

    zAjax('/orders', {
        roomId: roomId
    }, function(data){
        // [{"id":1,"startTime":1537413810448,"endTime":1537414410448,"userId":1}]
        var DATA = data;
        $('.ordered').remove();
        dayTimeSelector.hide()
        shaftWrapper.show();
        var curShaft;
        
        DATA.forEach(function(order, index){

            var orderPosPercent = stampToPos(order);
            var startPercnet = orderPosPercent.start;
            var endPercnet = orderPosPercent.end;

            // 判断几天后
            var nDay = Math.floor((order.startTime - weeStamp()) / DAYMILLISECOND);
            var shaftId = 'shaft-' + nDay; 
            // 修改shaft
            // if(!$('#' + shaftId).length){
            //     shaftWrapper.append('<div id="' + shaftId + '" class="day-shaft" class="clearfix"></div>')
            // }

            curShaft = $('#' + shaftId);
            var orderTime = fillZero(orderPosPercent.startHours) + ':' + fillZero(orderPosPercent.startMinutes) + '-'
                + fillZero(orderPosPercent.endHours) + ':' + fillZero(orderPosPercent.endMinutes);
            var orderUsername = order.name;

            $('<div />', {class: 'ordered'}).appendTo(curShaft).css({
                left: startPercnet * 100 + '%',
                width: (endPercnet - startPercnet) * wrapperWidth
            }).data('percent-start', startPercnet)
                .data('percent-end', endPercnet).append(orderTime + '<br/>' + orderUsername)
                .data('order-id', order.id)
                .attr('title', orderTime)
        });
    });
}

function checkLogin(){
    zAjax('/checkLogin', null, function(data){
        if(window.confirm('是否以<<' + data + '>>的身份登录?')){
            $('#entry').remove();
            makeRooms();
        }
    })
}

function checkIfOwnOrder(orderId, sfn){
    zAjax('/checkIfOwnOrder', {orderId: orderId}, function(data){
        sfn && sfn(data)
    })
}

function makeRooms(){
    zAjax('/rooms', null, function(data){
        var frag = '';
        data.forEach(function(room){
            frag += '<div class="room" data-room-id="'+room.id+'">'
                    + room.name
                    + '<div class="btns">'
                        + '<input type="button" value="删除" class="room-delete-btn"/>'
                        + '<input type="button" value="编辑" class="room-edit-btn"/>'
                    + '</div>'
                + '</div>'
        })
        rooms.empty().html(frag).show();
        rooms.find('.room').eq(0).trigger('click')
        $('#room-add-wrapper').show();
    })
}

(function (){
    var initialState = {};
    var dragging = false;
    var min,
        max;
    
    dayTimeSelector.on('mousedown touchstart', 'span', function(e){
        initialState = {
            left: parseInt(dayTimeSelector.css('left')),
            width: dayTimeSelector.width(),
            startPointX: e.touches? e.touches[0].clientX: e.clientX,
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

        e.preventDefault();
    })
    
    $(window).on('mousemove touchmove', function(e){
        if(dragging){
            var gapX = (e.touches? e.touches[0].clientX: e.clientX) - initialState.startPointX;
            if(initialState.target == 1){
                var l = initialState.left + gapX;
                var w = initialState.width - gapX;

                if(l < min){
                    l = min;
                    w = initialState.width - (min - initialState.left)
                }

                // 左边的最大值 小于 右边界
                var maxer = dayTimeSelector.data('max-starter')
                    ?Math.min(max, dayTimeSelector.data('max-starter'))
                    :max;
                if(l > maxer - 10){
                    l = maxer - 10;
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
                dayTimeSelector.data('max-starter', initialState.left + w)
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

function stampToPos(order){
    var orderStartDate = new Date(order.startTime);
    var orderEndDate = new Date(order.endTime);

    var startHours = orderStartDate.getHours();
    var startMinutes = orderStartDate.getMinutes();

    var endHours = orderEndDate.getHours();
    var endMinutes = orderEndDate.getMinutes();

    var startMilliSecondOfDay = startHours * HOURMILLISECOND + startMinutes * MINUTEMILLISECOND;
    var endMilliSecondOfDay = endHours * HOURMILLISECOND + endMinutes * MINUTEMILLISECOND;

    return {
        start: (startMilliSecondOfDay - ORDERSTARTHOUR * HOURMILLISECOND) / WORKMILLISECOND ,
        end: (endMilliSecondOfDay - ORDERSTARTHOUR * HOURMILLISECOND) / WORKMILLISECOND,
        startHours: startHours,
        startMinutes: startMinutes,
        endHours: endHours,
        endMinutes: endMinutes,
    }
}

function posToTime(x){
    var p = (x - shaftWrapper.offset().left) / wrapperWidth;
    var time = p * WORKMILLISECOND + ORDERSTARTHOUR * HOURMILLISECOND;
    
    var h = Math.floor(time / HOURMILLISECOND);
    var m = Math.floor(time % HOURMILLISECOND / MINUTEMILLISECOND);

    m -= m % 10;

    return fillZero(h) + ':' + fillZero(m);
}

function fillZero (z){
    return z < 10 ? '0' + z: z
}

function weeStamp(){
    return +new Date(new Date().setHours(0, 0, 0, 0))
}

function timeToStamp(time){
    var wee = weeStamp();

    time = time.split(':');
    time = wee + Number(time[0]) * HOURMILLISECOND + Number(time[1]) * MINUTEMILLISECOND;

    return time;
}

function zAjax(url, params, sfn){
    $.ajax({
        type: 'GET',
        url: url,
        data: params || null,
        dataType: 'json',
        // timeout: 1300,
        context: $('body'),
        success: function(data){
            sfn && sfn(data);
        },
        error: function(xhr, type){
          console.error(arguments)
          alert('请求出错：' + type)
        }
    })
}