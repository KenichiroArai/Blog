<%@page contentType="text/html; charset=UTF-8" %>
<%@page import="java.time.LocalDateTime" %>

<html>
    <head>
        <title>
            003_Javaの禁止
        </title>
    </head>
    <body>
        003_Javaの禁止
        <br>
        <%= LocalDateTime.now() %>      <%--悪い例：Javaの処理を直接埋め込み。良い例：タグを使用すること。 --%>
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
