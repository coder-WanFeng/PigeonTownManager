package PT;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitRunnable;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static PT.Main.config.*;
import static org.bukkit.Bukkit.getServer;


public class chatWithCustomRole implements Listener {

    private final Plugin plugin;
    public chatWithCustomRole(Plugin plugin) {
        this.plugin = plugin;
    }
    List<String> history_AI = new ArrayList<>();
    List<String> history_person = new ArrayList<>();
    boolean CanChat = true;
    String CustomRoleName = CustomeRoleName();
    //监听玩家发言
    @EventHandler
    public void onPlayerChatWithGLM(AsyncPlayerChatEvent event) {
        String message = event.getMessage();
        //检测关键词" -chat "为开头的发言
        if (message.startsWith("-"+CustomRoleName+" ")) {
            Player player = event.getPlayer();
            if(CanChat){
                CanChat=false;
                String textContent = message.substring(4).trim();
                createJsonRequestBody(textContent);

                Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> sendChatMessage(player.getName(), textContent));
            }
            else{
                player.sendMessage("["+Main.config.server_name()+"]["+CustomRoleName+"]:请勿过于频繁的聊天哦，请等待上一条消息回复完成");
            }
        }
    }

    private void sendChatMessage(String playerName, String textContent) {
        try {
            //设置请求相关
            URL url = new URL("https://open.bigmodel.cn/api/paas/v4/chat/completions");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);connection.setRequestProperty("Authorization", "Bearer "+AI_token());
            connection.setRequestProperty("Content-Type", "application/json");
            //创建请求体
            String requestBody = createJsonRequestBody(textContent);
            //发送请求
            try (OutputStream outputStream = connection.getOutputStream()) {
                outputStream.write(requestBody.getBytes());
                outputStream.flush();
            }
            int responseCode = connection.getResponseCode();
            //判断响应状态
            if (responseCode == HttpURLConnection.HTTP_OK) {
                //构建响应体
                try (BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                    String inputLine;
                    StringBuilder response = new StringBuilder();

                    while ((inputLine = in.readLine()) != null) {
                        response.append(inputLine);
                    }
                    in.close();
                    connection.disconnect();
                    //获取响应结果
                    String response_str=response.toString();
                    //控制台输出
                    String responseMessage=get_res_content(response_str);
                    history_AI.add("{\"role\":\"assistant\",\"content\":\"" + escapeJsonString(responseMessage) + "\"}");
                    //向玩家输出
                    String[] Messages=("["+Main.config.server_name()+"]["+CustomRoleName+"](To:" + playerName + "):" +responseMessage).split("\n");
                    for (Player player : getServer().getOnlinePlayers()) {
                        for (String message:Messages){
                            player.sendMessage(message);
                        }
                    }
                    CanChat=true;
                    new BukkitRunnable() {
                        @Override
                        public void run() {
                            history_AI.remove(0);
                            history_person.remove(0);
                        }
                    }.runTaskLater(plugin, CustomRole_memory_time()*20L);
                }
            } else {
                //响应状态码异常
                String responseMessage = "["+Main.config.server_name()+"][\"+CustomRoleName+\"](To: " + playerName + "): Error sending message (HTTP code: " + responseCode + ")";
                for (Player player : getServer().getOnlinePlayers()) {
                    player.sendMessage(responseMessage);
                }
                InputStream errorStream = connection.getErrorStream();
                String errorMessage = new BufferedReader(new InputStreamReader(errorStream))
                        .lines().collect(Collectors.joining(System.lineSeparator()));
            }
        } catch (Exception e) {
            //抛出异常
            String responseMessage = "["+Main.config.server_name()+"][\"+CustomRoleName+\"]: Player:\"" + playerName + "\" Error sending message (Exception: " + e.getMessage() + ")";
            Objects.requireNonNull(getServer().getPlayer(playerName)).sendMessage(responseMessage);
            e.printStackTrace();
        }
    }

    //合成请求体
    private String createJsonRequestBody(String textContent) {
        String json_message="{\"role\":\"user\",\"content\":\"" + escapeJsonString(textContent) + "\"}";
        history_person.add(json_message);
        StringBuilder _history= new StringBuilder();
        for (int i = 0; i < history_AI.size(); i++){
            _history.append(",").append(history_person.get(i)).append(",").append(history_AI.get(i));
        }
        _history.append(","+json_message);

        String body= "{\"model\":\""+Main.config.AI_name()+"\","+"\"messages\":[{\"role\":\"system\",\"content\":\""+ CustomRole_prompt()+"\"}" +  _history + "]}";
        return body;
    }

    //转译至JSON格式的字符串
    private String escapeJsonString(String string) {
        return string.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    //获取相应内容content
    private String get_res_content(String response){
        String StartKeyWords = "\"content\":\"";
        String EndKeyWords="\",\"role\":\"assistant\"";
        int StartIndex=response.indexOf(StartKeyWords) + StartKeyWords.length();
        int EndIndex=response.indexOf(EndKeyWords);
        String content=response.substring(StartIndex,EndIndex);
        return content;
    }
}
