const fs = require('fs');
const path = require('path');

/**
 * CSVファイルを読み込む
 * @param {string} filePath - CSVファイルのパス
 * @returns {Array} CSVデータの配列
 */
function readCSV(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] ? values[index].trim().replace(/^"|"$/g, '') : '';
                });
                data.push(row);
            }
        }

        return data;
    } catch (error) {
        console.error(`CSVファイルの読み込みエラー: ${filePath}`, error.message);
        return [];
    }
}

/**
 * CSV行を解析する（カンマ区切りで、ダブルクォート内のカンマは無視）
 * @param {string} line - CSV行
 * @returns {Array} 解析された値の配列
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current);
    return values;
}

/**
 * 新しいCSV形式のデータを古い形式に変換する
 * @param {Object} row - 新しい形式のデータ行
 * @returns {Object} 古い形式のデータ行
 */
function convertNewFormatToOld(row) {
    // 新しい形式: Date,User,Kind,Model,Input (w/ Cache Write),Input (w/o Cache Write),Cache Read,Output,Total Tokens,Cost ($)
    // 古い形式: Date,User,Kind,Max Mode,Model,Tokens,Cost ($)

    const totalTokens = parseInt(row['Total Tokens'] || row['Tokens'] || '0', 10);

    return {
        'Date': row['Date'] || '',
        'User': row['User'] || '',
        'Kind': row['Kind'] || 'Unknown',
        'Max Mode': 'No', // 新しい形式にはないのでデフォルト値
        'Model': row['Model'] || 'auto',
        'Tokens': totalTokens.toString(),
        'Cost ($)': row['Cost ($)'] || 'Included'
    };
}

/**
 * 古いCSV形式のデータを新しい形式に変換する
 * @param {Object} row - 古い形式のデータ行
 * @returns {Object} 新しい形式のデータ行
 */
function convertOldFormatToNew(row) {
    // 古い形式: Date,User,Kind,Max Mode,Model,Tokens,Cost ($)
    // 新しい形式: Date,User,Kind,Model,Input (w/ Cache Write),Input (w/o Cache Write),Cache Read,Output,Total Tokens,Cost ($)

    const tokens = parseInt(row['Tokens'] || '0', 10);

    return {
        'Date': row['Date'] || '',
        'User': row['User'] || '',
        'Kind': row['Kind'] || 'Unknown',
        'Model': row['Model'] || 'auto',
        'Input (w/ Cache Write)': '0',
        'Input (w/o Cache Write)': '0',
        'Cache Read': '0',
        'Output': '0',
        'Total Tokens': tokens.toString(),
        'Cost ($)': row['Cost ($)'] || 'Included'
    };
}

/**
 * データを日付順にソートする（最新順）
 * @param {Array} data - データ配列
 * @returns {Array} ソートされたデータ配列
 */
function sortByDate(data) {
    return data.sort((a, b) => {
        const dateA = new Date(a['Date'] || '');
        const dateB = new Date(b['Date'] || '');
        return dateB - dateA; // 最新順
    });
}

/**
 * 重複を排除する（Date, User, Model, Tokensが同じ場合は重複とみなす）
 * @param {Array} data - データ配列
 * @returns {Array} 重複排除されたデータ配列
 */
function removeDuplicates(data) {
    const seen = new Set();
    const unique = [];

    for (const row of data) {
        const key = `${row['Date']}-${row['User']}-${row['Model']}-${row['Tokens']}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(row);
        }
    }

    return unique;
}

/**
 * CSVデータをファイルに書き込む
 * @param {string} filePath - 出力ファイルパス
 * @param {Array} data - データ配列
 * @param {Array} headers - ヘッダー配列
 */
function writeCSV(filePath, data, headers) {
    try {
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header] || '';
                    return value.includes(',') ? `"${value}"` : value;
                }).join(',')
            )
        ].join('\n');

        fs.writeFileSync(filePath, csvContent, 'utf8');
        console.log(`CSVファイルを更新しました: ${filePath}`);
    } catch (error) {
        console.error(`CSVファイルの書き込みエラー: ${filePath}`, error.message);
    }
}

/**
 * Inputフォルダからusage-tokens-*.csvファイルを検索する
 * @param {string} inputDir - Inputフォルダのパス
 * @returns {Array} 見つかったCSVファイルのパス配列
 */
function findInputCSVFiles(inputDir) {
    try {
        const files = fs.readdirSync(inputDir);
        return files
            .filter(file => file.startsWith('usage-tokens-') && file.endsWith('.csv'))
            .map(file => path.join(inputDir, file))
            .sort((a, b) => {
                // ファイル名の日付部分でソート（最新順）
                const dateA = a.match(/usage-tokens-(\d{4}-\d{2}-\d{2})/);
                const dateB = b.match(/usage-tokens-(\d{4}-\d{2}-\d{2})/);
                if (dateA && dateB) {
                    return new Date(dateB[1]) - new Date(dateA[1]);
                }
                return 0;
            });
    } catch (error) {
        console.error(`Inputフォルダの読み込みエラー: ${inputDir}`, error.message);
        return [];
    }
}

/**
 * メイン処理
 */
function main() {
    const inputDir = path.join(__dirname, 'Input');
    const dataDir = path.join(__dirname, 'data');
    const outputFile = path.join(dataDir, 'usage-tokens.csv');

    console.log('CSVファイルの更新を開始します...');

    // 既存のデータを読み込む
    let existingData = [];
    if (fs.existsSync(outputFile)) {
        existingData = readCSV(outputFile);
        console.log(`既存のデータを読み込みました: ${existingData.length}件`);
    }

    // InputフォルダからCSVファイルを検索
    const inputFiles = findInputCSVFiles(inputDir);
    console.log(`Inputフォルダから${inputFiles.length}件のCSVファイルを発見しました`);

    let allData = [...existingData];

    // 各Inputファイルを処理
    for (const inputFile of inputFiles) {
        console.log(`処理中: ${path.basename(inputFile)}`);
        const inputData = readCSV(inputFile);

        if (inputData.length > 0) {
            // 新しい形式のデータを古い形式に変換
            const convertedData = inputData.map(row => {
                // 新しい形式かどうかを判定（Total Tokens列があるかどうか）
                if (row['Total Tokens'] !== undefined) {
                    return convertNewFormatToOld(row);
                } else {
                    return row; // 既に古い形式
                }
            });

            allData = allData.concat(convertedData);
            console.log(`  ${convertedData.length}件のデータを追加しました`);
        }
    }

    // 重複を排除
    const uniqueData = removeDuplicates(allData);
    console.log(`重複排除後: ${uniqueData.length}件`);

    // 日付順にソート（最新順）
    const sortedData = sortByDate(uniqueData);
    console.log(`日付順にソートしました（最新順）`);

    // ヘッダーを決定（既存のデータのヘッダーを使用）
    const headers = existingData.length > 0
        ? Object.keys(existingData[0])
        : ['Date', 'User', 'Kind', 'Max Mode', 'Model', 'Tokens', 'Cost ($)'];

    // CSVファイルに書き込み
    writeCSV(outputFile, sortedData, headers);

    console.log('CSVファイルの更新が完了しました！');
    console.log(`最終的なデータ件数: ${sortedData.length}件`);
}

// スクリプトが直接実行された場合のみmain()を実行
if (require.main === module) {
    main();
}

module.exports = {
    readCSV,
    parseCSVLine,
    convertNewFormatToOld,
    convertOldFormatToNew,
    sortByDate,
    removeDuplicates,
    writeCSV,
    findInputCSVFiles,
    main
};
