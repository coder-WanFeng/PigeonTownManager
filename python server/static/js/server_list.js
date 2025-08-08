$(function(){
    $.getJSON("/server-list", function(data){
        let $container = $("#server_cards");
        $container.empty();
        data.forEach(function(server){
            let statusClass = server.statue === "在线" ? "available" : "unavailable";
            let statusText = server.statue;
            let ipBtn = "";
            if (server.link && server.link.length > 0) {
                ipBtn = `<button class="server_ip_btn" onclick="showServerIp(${JSON.stringify(server.link).replace(/"/g, '&quot;')})">查看IP</button>`;
            } else {
                ipBtn = `<span class="server_ip_none">暂无IP</span>`;
            }
            let html = `
                <div class="server_card">
                    <div class="server_name">${server.name}</div>
                    <div class="server_desc">${server.desc}</div>
                    <div class="server_ip">${ipBtn}</div>
                    <div class="server_status ${statusClass}">${statusText}</div>
                </div>
            `;
            $container.append(html);
        });
    });
});

// 弹窗显示IP
window.showServerIp = function(links){
    let msg = links.map(ip => `${ip.name}: ${ip.link}`).join('<br>');
    showCustomDialog(msg);
};

// 自定义弹窗
function showCustomDialog(msg) {
    let $dialog = $("#custom_dialog");
    if ($dialog.length === 0) {
        $dialog = $(`
            <div id="custom_dialog" style="display:none;">
                <div class="custom_dialog_content">
                    <div id="custom_dialog_title">服务器IP列表</div>
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
