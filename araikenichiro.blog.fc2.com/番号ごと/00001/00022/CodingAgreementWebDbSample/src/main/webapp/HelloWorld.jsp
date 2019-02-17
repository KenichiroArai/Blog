<%@page contentType="text/html; charset=UTF-8" %>
<%@page import="java.time.LocalDate" %>

<html>
    <head>
        <title>
            HelloWorld!
        </title>
    </head>
    <body>
        HelloWorld!
        <br>
        <%= LocalDate.now() %>      <%-- 本来はJavaの処理を直接埋め込まず、タグを使用すること。 --%>
    </body>
</html>
