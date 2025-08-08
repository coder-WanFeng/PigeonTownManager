// 工具：cookie操作
function setCookie(name, value, days=365) {
    let d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + d.toUTCString() + ";path=/";
}
function getCookie(name) {
    let arr = document.cookie.split(';');
    for(let i=0;i<arr.length;i++){
        let kv = arr[i].trim().split('=');
        if(kv[0] === name) return decodeURIComponent(kv[1] || "");
    }
    return "";
}

// UI初始化
const inputPlayer = document.getElementById("input_playername");
const inputPwd = document.getElementById("input_password");
const inputArea = document.getElementById("inputarea");
const submitBtn = document.getElementById("submit");
const max_length = 200;
let delta_timestamp = 0;
let is_get = false;

// 自动填充cookie
inputPlayer.value = getCookie("cloudmsg_user") || "";
inputPwd.value = getCookie("cloudmsg_pwd") || "";

// 输入限制
inputArea.addEventListener("input", () => {
    if(inputArea.value.length > max_length){
        inputArea.value = inputArea.value.slice(0, max_length);
    }
});

// 发送消息
submitBtn.addEventListener("click", () => {
    post_cloud_messgae();
});

// 回车快捷发送
inputArea.addEventListener("keydown", function(e){
    if(e.ctrlKey && e.key === "Enter") {
        post_cloud_messgae();
    }
});

// 自动保存cookie
[inputPlayer, inputPwd].forEach(inp => {
    inp.addEventListener("change", function(){
        setCookie("cloudmsg_user", inputPlayer.value);
        setCookie("cloudmsg_pwd", inputPwd.value);
    });
});

// 启动
start_update_timestamp();
start_update_online_players();

function post_cloud_messgae(){
    if(is_get){
        setTimeout(function(){post_cloud_messgae()},50)
    }
    else{
        const player = inputPlayer.value.trim();
        const pwd = inputPwd.value.trim();
        const msg = inputArea.value.trim();
        if(!player || !pwd || !msg){
            showCustomDialog("用户名、密码、消息不能为空");
            return;
        }
        if(msg.length > max_length){
            inputArea.value = msg.slice(0, max_length);
            showCustomDialog("最多支持"+max_length+"个字!");
            return;
        }
        // 保存cookie
        setCookie("cloudmsg_user", player);
        setCookie("cloudmsg_pwd", pwd);

        const timestamp = Math.floor(Date.now() - delta_timestamp);
        const post_data = {
            "player_name": player,
            "password": pwd,
            "cloud_message": msg,
            "post_from": "website",
            "timestamp": timestamp
        }
        $.ajax({
            url: "/server-messages/",
            type: 'POST',
            contentType: 'application/json', 
            data: JSON.stringify(post_data),
            success: function(response) {
                if(response.msg=="云消息发送成功"){
                    inputArea.value = "";
                }else{
                    showCustomDialog(response.msg);
                }
            },
            error: function(xhr, status, error) {
                showCustomDialog("请求异常，响应结果:"+error);
            }
        });
    }
}

function get_cloud_messages_from_server(last_timestamp){
    is_get=true;
    let timestamp=last_timestamp+1000
    let $HistoryDiv=$("#HistoryDiv");
    $.ajax({
        url: "/server-messages/?post_from=server&timestamp="+last_timestamp,
        type: 'GET',
        contentType: 'application/json', 
        success: function(response) {
            timestamp=Math.floor(Date.now() - delta_timestamp);
            response.forEach(content => {
                // 网页端当前名字
                let player_name = inputPlayer.value;
                // 创建外框
                let $msgBox = $("<div>").addClass("message_box");
                if(content.player_name === player_name){
                    $msgBox.addClass("mine");
                }
                // 玩家名
                let $playerDiv = $("<div>")
                    .addClass(content.player_name === player_name ? "playername_I" : "playername_other")
                    .text(content.player_name + (content.post_from=="website"?"(网站)":"(服务器)"));
                // 消息内容
                let $msgDiv = $("<div>")
                    .addClass(content.player_name === player_name ? "message_I" : "message_other")
                    .text(content.cloud_message);
                $msgBox.append($playerDiv).append($msgDiv);
                $HistoryDiv.append($msgBox);
            });
            // 滚动到底部
            $HistoryDiv.scrollTop($HistoryDiv[0].scrollHeight);
            setTimeout(function(){
                get_cloud_messages_from_server(timestamp);
            },1000);
            is_get=false;
        },
        error: function(xhr, status, error) {
            setTimeout(function(){
                get_cloud_messages_from_server(timestamp);
            },3000);
            is_get=false;
        }
    });
}

function get_online_players(){
    let $online = $("#online_players");
    $.ajax({
        url: "/players-online/",
        type: 'GET',
        contentType: 'application/json', 
        success: function(response) {
            $online.empty();
            if(response.length==0){
                $online.append('<div class="online_player">当前无玩家在线</div>');
            } else {
                response.forEach(content => {
                    $online.append('<div class="online_player">'+content.player_name+'('+content.server+')</div>');
                });
            }
        }
    });
}

function start_update_online_players(){
    get_online_players();
    setInterval(function(){
        get_online_players();
    },5000)
}
function update_timestamp(){
    $.ajax({
        url: "/server-timestamp/",
        type: 'GET',
        contentType: 'application/json', 
        success: function(response) {
            if(response.res){
                delta_timestamp = Math.floor (Date.now() - response.timestamp );
            }
        }
    })
};
async function start_update_timestamp(){
    update_timestamp();
    get_cloud_messages_from_server(Math.floor(Date.now() - delta_timestamp));
    setInterval(function(){
        update_timestamp();
    },10000)
}

// 艺术风格弹窗
function showCustomDialog(msg) {
    let $dialog = $("#custom_dialog");
    if ($dialog.length === 0) {
        $dialog = $(`
            <div id="custom_dialog">
                <div class="custom_dialog_content">
                    <span class="custom_dialog_close">&times;</span>
                    <div class="custom_dialog_msg"></div>
                </div>
            </div>
        `);
        $("body").append($dialog);
        $dialog.find(".custom_dialog_close").on("click", function(){
            $dialog.fadeOut(200);
        });
    }
    $dialog.find(".custom_dialog_msg").html(msg);
    $dialog.fadeIn(200);
}