const units = {
    "": { name: "一", description: "1" },
    "万": { name: "万", description: "10^4" },
    "億": { name: "億", description: "10^8" },
    "兆": { name: "兆", description: "10^12" },
    "京": { name: "京", description: "10^16" },
    "垓": { name: "垓", description: "10^20" },
    "𥝱": { name: "𥝱", description: "10^24" },
    "穣": { name: "穣", description: "10^28" },
    "溝": { name: "溝", description: "10^32" },
    "澗": { name: "澗", description: "10^36" },
    "正": { name: "正", description: "10^40" },
    "載": { name: "載", description: "10^44" },
    "極": { name: "極", description: "10^48" },
    "恒河沙": { name: "恒河沙", description: "10^52" },
    "阿僧祇": { name: "阿僧祇", description: "10^56" },
    "那由他": { name: "那由他", description: "10^60" },
    "不可思議": { name: "不可思議", description: "10^64" },
    "無量大数": { name: "無量大数", description: "10^68" }
};

const UNIT_SEPARATOR = '-';
let selectedUnitsIdx = 0;

function formatJapaneseNumber(numberStr) {
    let result = '';
    selectedUnitsIdx = Math.ceil(numberStr.length / 4) - 1;

    // 先頭の0を削除
    const numberWk = numberStr.replace(/^0+/, '');

    // 後ろの桁から見ていき、4桁ごとに単位を追加する
    for (let i = numberWk.length - 1; i >= 0; i--) {
        const position = numberWk.length - 1 - i;
        if (position > 0 && position % 4 === 0) {
            const unitIndex = position / 4;
            const unitKey = Object.keys(units)[unitIndex];
            if (unitKey) {
                result = units[unitKey].name + result;
            }
        }
        result = numberWk[i] + result;
    }

    return result;
}

function parseJapaneseNumber(numberStr) {
    let result = '';
    let currentNumber = '';
    let i = 0;

    while (i < numberStr.length) {
        const char = numberStr[i];
        if (char >= '0' && char <= '9') {
            currentNumber += char;
            i++;
            continue;
        }

        // 複数文字の単位をチェック
        let foundUnit = false;
        for (const [unitKey, unitInfo] of Object.entries(units)) {
            if (unitKey && numberStr.substring(i, i + unitInfo.name.length) === unitInfo.name) {
                if (currentNumber) {
                    const unitIndex = Object.keys(units).indexOf(unitKey);
                    const zeros = '0'.repeat(unitIndex * 4);
                    result = addStrings(result, currentNumber + zeros);
                    currentNumber = '';
                }
                i += unitInfo.name.length;
                foundUnit = true;
                break;
            }
        }

        if (!foundUnit) {
            i++;
        }
    }

    // 残りの数値を追加
    if (currentNumber) {
        result = addStrings(result, currentNumber);
    }

    return result || '0';
}

// 文字列としての数値の加算を行う補助関数
function addStrings(str1, str2) {
    let result = '';
    let carry = 0;
    let i = str1.length - 1;
    let j = str2.length - 1;

    while (i >= 0 || j >= 0 || carry > 0) {
        const digit1 = i >= 0 ? parseInt(str1[i]) : 0;
        const digit2 = j >= 0 ? parseInt(str2[j]) : 0;
        const sum = digit1 + digit2 + carry;
        carry = Math.floor(sum / 10);
        result = (sum % 10) + result;
        i--;
        j--;
    }

    return result;
}

function convert() {
    const conversionType = document.querySelector('input[name="conversionType"]:checked').value;
    const resultElement = document.getElementById('result');
    const copyButton = document.getElementById('copyButton');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressLabels = document.getElementById('progressLabels');

    // 進捗バーをクリア
    progressFill.style.width = '0%';
    progressLabels.innerHTML = '';

    if (conversionType === 'numberToUnit') {
        const input = document.getElementById('numberInput').value;
        const result = formatJapaneseNumber(input);
        resultElement.textContent = `変換結果：${result}`;

        // 進捗バーを表示
        progressContainer.style.display = 'block';

        // 進捗バーのラベルを設定
        const progressStep = 100 / (Object.keys(units).length - 1);
        const progressPercentage = progressStep * selectedUnitsIdx;
        progressFill.style.width = `${progressPercentage}%`;

        // ラベルを追加
        const labelContainer = document.createElement('div');
        labelContainer.style.position = 'relative';
        labelContainer.style.width = '100%';
        labelContainer.style.height = '40px';
        labelContainer.style.marginTop = '15px';

        Object.entries(units).forEach(([unitKey, unitInfo]) => {
            const label = document.createElement('span');
            const unitView = unitInfo.name || '0';
            label.textContent = unitView;
            label.className = 'progress-label';
            const position = (Object.keys(units).indexOf(unitKey) / (Object.keys(units).length - 1)) * 100;
            label.style.left = `${position}%`;
            // 左端のラベルを調整
            if (unitKey === "") {
                label.style.transform = 'translateX(0)';
            } else {
                label.style.transform = 'translateX(-50%)';
            }
            labelContainer.appendChild(label);
        });

        progressLabels.appendChild(labelContainer);
    } else {
        const input = document.getElementById('unitInput').value;
        const result = parseJapaneseNumber(input);
        resultElement.textContent = `変換結果：${result}`;

        // 進捗バーを非表示
        progressContainer.style.display = 'none';
    }

    copyButton.style.display = 'inline-block';
}

function copyResult() {
    const resultText = document.getElementById('result').textContent.replace('変換結果：', '');
    navigator.clipboard.writeText(resultText).then(() => {
        const copySuccess = document.getElementById('copySuccess');
        copySuccess.style.display = 'inline';
        setTimeout(() => {
            copySuccess.style.display = 'none';
        }, 2000);
    });
}

// ラジオボタンの切り替え処理
document.querySelectorAll('input[name="conversionType"]').forEach(radio => {
    radio.addEventListener('change', function () {
        const numberInputGroup = document.getElementById('numberInputGroup');
        const unitInputGroup = document.getElementById('unitInputGroup');

        if (this.value === 'numberToUnit') {
            numberInputGroup.style.display = 'block';
            unitInputGroup.style.display = 'none';
        } else {
            numberInputGroup.style.display = 'none';
            unitInputGroup.style.display = 'block';
        }
    });
});

// エンターキーで変換を実行
document.getElementById('numberInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        convert();
    }
});

document.getElementById('unitInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        convert();
    }
});

// 単位一覧テーブルの初期化
function initializeUnitsTable() {
    const tableBody = document.getElementById('unitsTableBody');
    for (const [key, unit] of Object.entries(units)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${unit.name}</td>
            <td>${unit.description}</td>
        `;
        tableBody.appendChild(row);
    }
}

// ページ読み込み時に単位一覧を初期化
document.addEventListener('DOMContentLoaded', initializeUnitsTable);
