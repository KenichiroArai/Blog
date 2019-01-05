package kmg.gori.dao.impl;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

import kmg.gori.dao.XmlSampleDao;

/**
 * XMLサンプルDAO
 *
 * @author KenichiroArai
 */
public class XmlSampleDaoImpl implements XmlSampleDao {

    /**
     * エントリポイント
     *
     * @param args
     *            オプション
     */
    public static void main(final String[] args) {

        final Path inputPath = Paths.get("pom.xml");
        final Path outputPath = Paths.get("");

        final long startTime = System.nanoTime();
        try {
            // メイン処理
            final XmlSampleDao sample = new XmlSampleDaoImpl();
            sample.read(inputPath);
            sample.write(outputPath);
        } finally {
            final long endTime = System.nanoTime();
            final String[] time = XmlSampleDaoImpl.getTime(startTime, endTime);
            System.out.println(String.format("%s%s", time[0], time[1]));
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void read(final Path inputPath) {

        /* SAX */
        System.out.println("----- SAX：開始 ----");
        final SAXParserFactory saxParserFactory = SAXParserFactory.newInstance();
        try {
            final SAXParser saxParser = saxParserFactory.newSAXParser();
            final SaxSampleHandler saxSampleHandler = new SaxSampleHandler();
            saxParser.parse(inputPath.toFile(), saxSampleHandler);
        } catch (final SAXException e) {
            e.printStackTrace();
        } catch (final IOException e) {
            e.printStackTrace();
        } catch (final ParserConfigurationException e) {
            e.printStackTrace();
        }
        System.out.println("----- SAX：終了 ----");

        /* DOM */
        System.out.println("----- DAO：開始 ----");
        final DocumentBuilderFactory documentBuilderFactory = DocumentBuilderFactory.newInstance();
        try {
            final DocumentBuilder documentBuilder = documentBuilderFactory.newDocumentBuilder();
            final Document document = documentBuilder.parse(inputPath.toFile());

            final Node receiptNode = document.getDocumentElement();
            XmlSampleDaoImpl.printNode(receiptNode);
            XmlSampleDaoImpl.printAttribute(receiptNode);
            Node elementNodes = receiptNode.getFirstChild();
            while (elementNodes != null) {
                XmlSampleDaoImpl.printNode(elementNodes);
                XmlSampleDaoImpl.printAttribute(elementNodes);
                Node itemNodes = elementNodes.getFirstChild();
                while (itemNodes != null) {
                    XmlSampleDaoImpl.printNode(itemNodes);
                    itemNodes = itemNodes.getNextSibling();
                }
                elementNodes = elementNodes.getNextSibling();
            }
        } catch (final ParserConfigurationException e) {
            e.printStackTrace();
        } catch (final SAXException e) {
            e.printStackTrace();
        } catch (final IOException e) {
            e.printStackTrace();
        }
        System.out.println("----- DAO：終了 ----");

    }

    /**
     * ノード出力
     *
     * @param node
     *            ノード
     */
    private static void printNode(final Node node) {

        final Node textNode = node.getFirstChild();
        if (!XmlSampleDaoImpl.checkTextNode(textNode)) {
            return;
        }
        System.out.println("ノード = " + node.getNodeName());

        if (textNode.getNodeValue().trim().equals("")) {
            return;
        }
        System.out.println("テキスト = " + textNode.getNodeValue());

    }

    /**
     * 属性出力
     *
     * @param node
     *            ノード
     */
    private static void printAttribute(final Node node) {

        final NamedNodeMap attributes = node.getAttributes();
        if (attributes == null) {
            return;
        }

        for (int i = 0; i < attributes.getLength(); i++) {
            final Node attribute = attributes.item(i);
            System.out.println(String.format("属性 = %s,%s", attribute.getNodeName(), attribute.getNodeValue()));
        }
    }

    /**
     * チェックテキストノード
     *
     * @param node
     *            ノード
     * @return true:テキストノード、false：テキストノード以外
     */
    private static boolean checkTextNode(final Node node) {

        boolean result = false;

        if (node == null) {
            return result;
        }
        if (node.getNodeType() != Node.TEXT_NODE) {
            return result;
        }

        result = true;
        return result;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void write(final Path outputPath) {

        // 処理なし
    }

    /**
     * 開始時間と終了時間の差を返す。 <br>
     * 単位は時間に応じて設定する。
     *
     * @param startTime
     *            開始時刻
     * @param endTime
     *            終了時刻
     * @return 差の時刻と単位
     */
    private static String[] getTime(final long startTime, final long endTime) {

        final String[] result = new String[2];

        double diffTime = endTime - startTime;
        result[0] = String.valueOf(diffTime);
        result[1] = "ナノ秒";

        if (diffTime >= 1000.0) {
            diffTime /= 1000.0;
            result[1] = "マイクロ秒";
        }
        if (diffTime >= 1000.0) {
            diffTime /= 1000.0;
            result[1] = "ミリ秒";
        }
        if (diffTime >= 1000.0) {
            diffTime /= 1000.0;
            result[1] = "秒";
        }
        result[0] = String.valueOf(diffTime);

        return result;
    }

    /**
     * SAXサンプルハンドラ
     *
     * @author KenichiroArai
     */
    private class SaxSampleHandler extends DefaultHandler {

        /**
         * デフォルトコンストラクタ
         */
        public SaxSampleHandler() {

            // 処理なし
        }

        /**
         * {@inheritDoc}
         */
        @Override
        public void startDocument() throws SAXException {

            // 処理なし
        }

        /**
         * {@inheritDoc}
         */
        @Override
        public void endDocument() throws SAXException {

            // 処理なし
        }

        /**
         * {@inheritDoc}
         */
        @Override
        public void startElement(final String uri, final String localName, final String qName,
                final Attributes attributes) throws SAXException {

            System.out.print(String.format("<%s>", qName));
        }

        /**
         * {@inheritDoc}
         */
        @Override
        public void endElement(final String uri, final String localName, final String qName) throws SAXException {

            System.out.println(String.format("</%s>", qName));
        }

        /**
         * {@inheritDoc}
         */
        @Override
        public void characters(final char[] ch, final int start, final int length) throws SAXException {

            final String target = new String(ch, start, length);

            System.out.print(target);
        }

    }
}
