#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_PATH = path.resolve(__dirname, 'data', 'usage-events.csv');

function printHelp() {
	console.log([
		'使用方法:',
		'  node calc-api-cost.js [オプション] [開始日付] [終了日付]',
		'',
		'日付形式:',
		'  YYYY/MM/DD （例: 2025/11/01）',
		'  開始日のみ指定時は、終了日 = 実行日',
		'  指定なしの場合は、ヘルプを表示し、全期間集計実行可否を確認',
		'',
		'オプション:',
		'  -h, --help     このヘルプを表示',
		'  -a, --all      引数なし時に確認なしで全期間の合計を算出',
		'  -d, --daily    日別合計を出力（期間指定時に有効）',
		'',
		'例:',
		'  node calc-api-cost.js 2025/11/01 2025/11/30',
		'  node calc-api-cost.js 2025/11/01               # 終了日は実行日',
		'  node calc-api-cost.js --daily 2025/11/01 2025/11/30',
		'  node calc-api-cost.js --all                    # 全期間を即時集計',
	].join('\n'));
}

function isNumeric(value) {
	return typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value)));
}

// CSVは途中列にカンマを含むことがあるため、先頭列(Date)と末尾列(Cost)のみを安全に取得する
function parseFirstAndLastColumns(line) {
	// 先頭列（最初のカンマまで）
	let firstComma = -1;
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			// 連続する "" はエスケープ（スキップ）として扱う
			if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
				i++; // skip escaped quote
			} else {
				inQuotes = !inQuotes;
			}
		} else if (ch === ',' && !inQuotes) {
			firstComma = i;
			break;
		}
	}
	const firstCol = firstComma >= 0 ? line.slice(0, firstComma) : line;

	// 末尾列（最後のカンマ以降）
	let lastComma = -1;
	inQuotes = false;
	for (let i = line.length - 1; i >= 0; i--) {
		const ch = line[i];
		if (ch === '"') {
			// 後方走査での "" エスケープ対応：直前も " のときは1つ戻る
			if (inQuotes && i - 1 >= 0 && line[i - 1] === '"') {
				i--; // skip escaped quote
			} else {
				inQuotes = !inQuotes;
			}
		} else if (ch === ',' && !inQuotes) {
			lastComma = i;
			break;
		}
	}
	const lastCol = lastComma >= 0 ? line.slice(lastComma + 1) : line;

	return [stripCsvQuotes(firstCol), stripCsvQuotes(lastCol)];
}

function stripCsvQuotes(field) {
	let s = field.trim();
	if (s.startsWith('"') && s.endsWith('"')) {
		s = s.slice(1, -1);
		// エスケープされた二重引用符を1つに戻す
		s = s.replace(/""/g, '"');
	}
	return s;
}

function parseInputDate(dateStr) {
	// 許容: YYYY/MM/DD または YYYY-MM-DD
	const m = dateStr.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
	if (!m) return null;
	const y = Number(m[1]);
	const mo = Number(m[2]);
	const d = Number(m[3]);
	if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
	// UTCの一日の始端/終端で扱う
	const startUtcMs = Date.UTC(y, mo - 1, d, 0, 0, 0, 0);
	const endUtcMs = Date.UTC(y, mo - 1, d, 23, 59, 59, 999);
	return { y, mo, d, startUtcMs, endUtcMs };
}

function formatYmdSlashFromUtcMs(utcMs) {
	const d = new Date(utcMs);
	// UTCで日付を取り出す
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return `${y}/${m}/${day}`;
}

function endOfTodayUtcMs() {
	const now = new Date();
	return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999);
}

function readCsvLines(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');
	const lines = content.split(/\r?\n/);
	// 先頭はヘッダ
	return lines.filter((_, idx) => idx !== 0 && _ !== '');
}

function computeTotals(lines, startUtcMs, endUtcMs, wantDaily) {
	let total = 0;
	const perDay = new Map(); // key: 'YYYY/MM/DD', value: sum

	for (const line of lines) {
		const [dateStr, costStr] = parseFirstAndLastColumns(line);
		if (!dateStr) continue;
		const rowDateMs = Date.parse(dateStr); // ISO (Z) を想定
		if (isNaN(rowDateMs)) continue;
		if (startUtcMs != null && rowDateMs < startUtcMs) continue;
		if (endUtcMs != null && rowDateMs > endUtcMs) continue;

		const cost = isNumeric(costStr) ? Number(costStr) : 0;
		if (Number.isFinite(cost)) {
			total += cost;
			if (wantDaily) {
				// UTC日付基準
				const dayKey = formatYmdSlashFromUtcMs(Date.UTC(
					new Date(rowDateMs).getUTCFullYear(),
					new Date(rowDateMs).getUTCMonth(),
					new Date(rowDateMs).getUTCDate(), 0, 0, 0, 0
				));
				perDay.set(dayKey, (perDay.get(dayKey) || 0) + cost);
			}
		}
	}
	return { total, perDay };
}

function parseArgs(argv) {
	const args = argv.slice(2);
	const opts = { help: false, all: false, daily: false, dates: [] };
	for (const a of args) {
		if (a === '-h' || a === '--help') opts.help = true;
		else if (a === '-a' || a === '--all') opts.all = true;
		else if (a === '-d' || a === '--daily') opts.daily = true;
		else opts.dates.push(a);
	}
	return opts;
}

async function promptYesNo(question) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const answer = await new Promise(resolve => rl.question(question, ans => resolve(ans)));
	rl.close();
	const a = String(answer).trim().toLowerCase();
	return a === 'y' || a === 'yes';
}

async function main() {
	try {
		const opts = parseArgs(process.argv);
		if (opts.help) {
			printHelp();
			return;
		}
		if (!fs.existsSync(CSV_PATH)) {
			console.error('CSVファイルが見つかりません:', CSV_PATH);
			process.exitCode = 1;
			return;
		}

		const lines = readCsvLines(CSV_PATH);

		// 日付解釈
		let startUtcMs = null;
		let endUtcMs = null;

		if (opts.dates.length === 0) {
			// 引数なし
			printHelp();
			if (opts.all) {
				const { total } = computeTotals(lines, null, null, false);
				console.log('');
				console.log('全期間の合計: ', total.toFixed(2));
				return;
			}
			const ok = await promptYesNo('\n全期間の合計を算出しますか？ (y/N): ');
			if (!ok) {
				console.log('キャンセルしました。');
				return;
			}
			const { total } = computeTotals(lines, null, null, false);
			console.log('全期間の合計: ', total.toFixed(2));
			return;
		} else if (opts.dates.length === 1) {
			const start = parseInputDate(opts.dates[0]);
			if (!start) {
				console.error('開始日付の形式が不正です: ', opts.dates[0]);
				process.exitCode = 1;
				return;
			}
			startUtcMs = start.startUtcMs;
			endUtcMs = endOfTodayUtcMs();
		} else if (opts.dates.length >= 2) {
			const start = parseInputDate(opts.dates[0]);
			const end = parseInputDate(opts.dates[1]);
			if (!start) {
				console.error('開始日付の形式が不正です: ', opts.dates[0]);
				process.exitCode = 1;
				return;
			}
			if (!end) {
				console.error('終了日付の形式が不正です: ', opts.dates[1]);
				process.exitCode = 1;
				return;
			}
			startUtcMs = start.startUtcMs;
			endUtcMs = end.endUtcMs;
			if (endUtcMs < startUtcMs) {
				console.error('終了日付は開始日付以降を指定してください。');
				process.exitCode = 1;
				return;
			}
		}

		const { total, perDay } = computeTotals(lines, startUtcMs, endUtcMs, opts.daily);

		// 出力
		if (startUtcMs != null || endUtcMs != null) {
			const rangeStr = [
				startUtcMs != null ? formatYmdSlashFromUtcMs(startUtcMs) : '（指定なし）',
				endUtcMs != null ? formatYmdSlashFromUtcMs(endUtcMs) : '（指定なし）',
			].join(' 〜 ');
			console.log('集計期間: ', rangeStr);
		}

		if (opts.daily) {
			console.log('\n日別合計:');
			// 期間内の全日を表示（合計0も表示）
			let cursor = (startUtcMs != null) ? Date.UTC(new Date(startUtcMs).getUTCFullYear(), new Date(startUtcMs).getUTCMonth(), new Date(startUtcMs).getUTCDate(), 0, 0, 0, 0) : null;
			const last = (endUtcMs != null) ? Date.UTC(new Date(endUtcMs).getUTCFullYear(), new Date(endUtcMs).getUTCMonth(), new Date(endUtcMs).getUTCDate(), 0, 0, 0, 0) : null;
			if (cursor != null && last != null) {
				while (cursor <= last) {
					const key = formatYmdSlashFromUtcMs(cursor);
					const v = perDay.get(key) || 0;
					console.log(`  ${key}: ${v.toFixed(2)}`);
					// 翌日へ（UTCで1日進める）
					cursor = cursor + 24 * 60 * 60 * 1000;
				}
			} else {
				// 日付未指定の場合は、存在するキーのみ表示
				const sorted = Array.from(perDay.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
				for (const [k, v] of sorted) {
					console.log(`  ${k}: ${v.toFixed(2)}`);
				}
			}
		}

		console.log('\n合計: ', total.toFixed(2));
	} catch (err) {
		console.error('エラーが発生しました:', err && err.message ? err.message : err);
		process.exitCode = 1;
	}
}

main();

