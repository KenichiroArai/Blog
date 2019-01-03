package kmg.mukamuka.serivce.sample.poi.impl;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellUtil;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import kmg.mukamuka.serivce.sample.poi.PoiSampleService;

/**
 * POIサンプルサービス
 *
 * @author KenichiroArai
 */
public class PoiSampleServiceImpl implements PoiSampleService {

    /**
     * エントリポイント
     *
     * @param args
     *            オプション
     */
    public static void main(final String[] args) {

        final Path inputPath = Paths.get("sample\\読み込みファイル.xlsx");
        final Path outputPath = Paths.get("sample\\書き込みファイル.xlsx");

        final long startTime = System.nanoTime();
        try {
            // メイン処理
            final PoiSampleService sample = new PoiSampleServiceImpl();
            sample.mainProc(inputPath, outputPath);
        } finally {
            final long endTime = System.nanoTime();
            final String[] time = PoiSampleServiceImpl.getTime(startTime, endTime);
            System.out.println(String.format("%s%s", time[0], time[1]));
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void mainProc(final Path inputPath, final Path outputPath) {

        Map<String, Map<String, Integer>> map = null;

        /* ワークブック読み込み */
        try (final FileInputStream is = new FileInputStream(inputPath.toFile());
                final Workbook inputWorkbook = WorkbookFactory.create(is);) {

            /* １行ずつ読み込み */
            IntStream.range(0, inputWorkbook.getNumberOfSheets()).forEach(i -> {
                final Sheet sheet = inputWorkbook.getSheetAt(i);
                System.out.println("sheetName=" + sheet.getSheetName());

                IntStream.range(sheet.getFirstRowNum(), sheet.getLastRowNum()).forEach(rowNum -> {

                    final Row row = sheet.getRow(rowNum);
                    if (row == null) {
                        return;
                    }

                    IntStream.range(row.getFirstCellNum(), row.getLastCellNum()).forEach(cellNum -> {

                        final Cell cell = row.getCell(cellNum);
                        System.out.print(PoiSampleServiceImpl.getStringValue(cell));
                        System.out.print(",");
                    });
                    System.out.println();
                });
            });

            /* シートごとに、行数、列数の集計 */
            final Stream<Sheet> sheetStream = IntStream.range(0, inputWorkbook.getNumberOfSheets())
                    .mapToObj(value -> inputWorkbook.getSheetAt(value));
            map = sheetStream
                    .collect(Collectors.toConcurrentMap((final Sheet s) -> s.getSheetName(), (final Sheet s) -> {
                        final Map<String, Integer> valueMap = new HashMap<>();

                        valueMap.put("行数", s.getLastRowNum() - s.getFirstRowNum());

                        final Row row = s.getRow(s.getLastRowNum());
                        valueMap.put("列数", row.getLastCellNum() - row.getFirstCellNum());

                        return valueMap;
                    }));
            System.out.println(map);

        } catch (final EncryptedDocumentException e) {
            e.printStackTrace();
        } catch (final InvalidFormatException e) {
            e.printStackTrace();
        } catch (final FileNotFoundException e) {
            e.printStackTrace();
        } catch (final IOException e) {
            e.printStackTrace();
        }
        if ((map == null) || map.isEmpty()) {
            return;
        }

        /* ワークブック書き込み */
        if (!Files.exists(outputPath)) {

            /* 新規作成 */
            try (final Workbook outputWorkbook = new XSSFWorkbook();) {
                try (FileOutputStream fos = new FileOutputStream(outputPath.toFile())) {
                    final Sheet sheet = outputWorkbook.createSheet("集計");
                    final Row row = CellUtil.getRow(0, sheet);
                    final String[] columns = {
                            "シート名", "列数", "行数"
                    };
                    int cellIdx = 0;
                    for (final String column : columns) {
                        final Cell cell = CellUtil.getCell(row, cellIdx);
                        cellIdx++;
                        cell.setCellValue(column);
                    }
                    outputWorkbook.write(fos);
                }
            } catch (final FileNotFoundException e) {
                e.printStackTrace();
            } catch (final IOException e) {
                e.printStackTrace();
            }
        }
        try (FileInputStream is = new FileInputStream(outputPath.toFile());
                Workbook outputWorkbook = WorkbookFactory.create(is)) {
            final Sheet sheet = outputWorkbook.getSheet("集計");
            int rowNum = sheet.getLastRowNum();
            if (sheet.getRow(rowNum) != null) {
                rowNum++;
            }
            for (final String sheetName : map.keySet()) {
                final Row row = CellUtil.getRow(rowNum, sheet);
                final Cell cellSheetName = CellUtil.getCell(row, 0);
                cellSheetName.setCellValue(sheetName);
                final Cell cellCellNum = CellUtil.getCell(row, 1);
                final Map<String, Integer> mapValueMap = map.get(sheetName);
                cellCellNum.setCellValue(mapValueMap.get("列数"));
                final Cell cellRowNum = CellUtil.getCell(row, 2);
                cellRowNum.setCellValue(mapValueMap.get("行数"));
                rowNum++;
            }

            try (FileOutputStream fos = new FileOutputStream(outputPath.toFile())) {
                outputWorkbook.write(fos);
            }
        } catch (final FileNotFoundException e) {
            e.printStackTrace();
        } catch (final IOException e) {
            e.printStackTrace();
        } catch (final EncryptedDocumentException e) {
            e.printStackTrace();
        } catch (final InvalidFormatException e) {
            e.printStackTrace();
        }
    }

    /**
     * セルの値を返す
     *
     * @param cell
     *            セル
     * @return セルの値
     */
    private static String getStringValue(final Cell cell) {

        String result = null;

        if (cell == null) {
            return result;
        }
        switch (cell.getCellTypeEnum()) {
            case STRING:
                result = cell.getStringCellValue();
                break;
            case NUMERIC:
                result = Double.toString(cell.getNumericCellValue());
                break;
            case BOOLEAN:
                result = Boolean.toString(cell.getBooleanCellValue());
                break;
            case FORMULA:
                result = PoiSampleServiceImpl.getStringFormulaValue(cell);
                break;
            case BLANK:
                result = PoiSampleServiceImpl.getStringRangeValue(cell);
                break;
            case ERROR:
            case _NONE:
            default:
                break;
        }
        return result;
    }

    /**
     * セルの数式を計算し、値を返す（String型）。
     *
     * @param cell
     *            セル
     * @return セルの数式の計算結果（String型）
     */
    private static String getStringFormulaValue(final Cell cell) {

        String result = null;

        assert cell.getCellTypeEnum() == CellType.FORMULA;

        switch (cell.getCachedFormulaResultTypeEnum()) {
            case STRING:
                result = cell.getStringCellValue();
                break;
            case NUMERIC:
                result = Double.toString(cell.getNumericCellValue());
                break;
            case BOOLEAN:
                result = Boolean.toString(cell.getBooleanCellValue());
                break;
            case BLANK:
            case ERROR:
            case FORMULA:
            case _NONE:
            default:
                break;
        }
        return result;
    }

    /**
     * 結合セルの値を返す（String型）。
     *
     * @param cell
     *            セル
     * @return 結合セルの値（String型）
     */
    private static String getStringRangeValue(final Cell cell) {

        String result = null;

        final int rowIndex = cell.getRowIndex();
        final int columnIndex = cell.getColumnIndex();

        final Sheet sheet = cell.getSheet();
        final int size = sheet.getNumMergedRegions();
        for (int i = 0; i < size; i++) {
            final CellRangeAddress range = sheet.getMergedRegion(i);
            if (!range.isInRange(rowIndex, columnIndex)) {
                continue;
            }
            final Cell firstCell = PoiSampleServiceImpl.getCell(sheet, range.getFirstRow(), range.getFirstColumn()); // 左上のセルを取得
            result = PoiSampleServiceImpl.getStringValue(firstCell);
            break;
        }
        return result;
    }

    /**
     * セルを返す。
     *
     * @param sheet
     *            シート
     * @param rowIndex
     *            行番号
     * @param columnIndex
     *            カラム番号
     * @return セル
     */
    public static Cell getCell(final Sheet sheet, final int rowIndex, final int columnIndex) {

        Cell result = null;

        final Row row = sheet.getRow(rowIndex);
        if (row == null) {
            return result;
        }

        result = row.getCell(columnIndex);
        return result;
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
}
