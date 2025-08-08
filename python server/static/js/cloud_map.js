function renderServerOptions(serverList) {
    const $options = $("#server_options");
    $options.empty();
    let firstUrl = null;
    serverList.forEach((server, idx) => {
        let statusClass = server.statue === "在线" ? "selected" : "disabled";
        let $opt = $("<div>")
            .addClass("server_option")
            .toggleClass("selected", idx === 0)
            .toggleClass("disabled", server.statue !== "在线" || !server.map_url)
            .attr("data-key", server.name)
            .attr("data-url", server.map_url || "")
            .text(server.name + (server.statue === "在线" ? server.map_url === null ? "（暂不支持）" : "" : "（"+server.statue+"）"))
            .on("click", function() {
                if (!server.map_url || server.statue !== "在线") return;
                $(".server_option").removeClass("selected");
                $(this).addClass("selected");
                $("#iframe").attr("src", server.map_url);
            });
        $options.append($opt);
        if (idx === 0 && server.map_url && server.statue === "在线") {
            firstUrl = server.map_url;
        }
    });
    // 默认显示第一个在线服务器地图
    if (firstUrl) {
        $("#iframe").attr("src", firstUrl);
    } else {
        $("#iframe").attr("src", "");
    }
}
$(function(){
    $.getJSON("/server-list", function(data){
        renderServerOptions(data);
    });
});