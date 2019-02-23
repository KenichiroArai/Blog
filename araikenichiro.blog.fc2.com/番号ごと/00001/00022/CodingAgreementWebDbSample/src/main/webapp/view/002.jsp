<%@page contentType="text/html; charset=UTF-8" %>
<%@page import="java.time.LocalDateTime" %>

<html>
    <head>
        <title>
            002_1タグ1行
        </title>
    </head>
    <body>
        002_1タグ1行
        <br>
        <%= LocalDateTime.now() %>      <%-- 本来はJavaの処理を直接埋め込まず、タグを使用すること。 --%>
        <table border="1">
            <tr>
                <th>
                                            名前
                </th>
                <th>
                                            住所
                </th>
            </tr>
            <tr>
                <td>
                    <input type="text" name="name" size="40" maxlength="20">
                </td>
                <td>
                    <input type="text" name="address" size="40" maxlength="20">
                </td>
            </tr>
        </table>
    </body>
</html>
