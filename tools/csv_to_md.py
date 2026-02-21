#!/usr/bin/env python3
"""
CSV to Markdown Converter (100行ごとに分割)
Usage: python csv_to_markdown.py input.csv [output_dir]

出力ファイル例:
  output_dir/input_part001.md  (1〜100行目)
  output_dir/input_part002.md  (101〜200行目)
  ...
"""

import csv
import sys
from pathlib import Path

ROWS_PER_FILE = 100


def build_markdown(headers: list, data_rows: list) -> str:
    """ヘッダーとデータ行からMarkdownテーブル文字列を生成する"""
    col_widths = [len(h) for h in headers]
    for row in data_rows:
        for i, cell in enumerate(row):
            if i < len(col_widths):
                col_widths[i] = max(col_widths[i], len(cell))

    def format_row(cells):
        padded = [
            cell.ljust(col_widths[i]) if i < len(col_widths) else cell
            for i, cell in enumerate(cells)
        ]
        return "| " + " | ".join(padded) + " |"

    def separator_row():
        return "| " + " | ".join("-" * w for w in col_widths) + " |"

    lines = [
        format_row(headers),
        separator_row(),
        *[format_row(row) for row in data_rows],
    ]
    return "\n".join(lines) + "\n"


def csv_to_markdown_split(
    csv_path: str, output_dir: str = None, rows_per_file: int = ROWS_PER_FILE
):
    """
    CSVファイルを rows_per_file 行ごとに分割してMarkdownファイルに変換する

    Args:
        csv_path: 入力CSVファイルのパス
        output_dir: 出力ディレクトリ（省略時はCSVと同じディレクトリ）
        rows_per_file: 1ファイルあたりの最大データ行数（デフォルト: 100）
    """
    csv_file = Path(csv_path)

    # 出力ディレクトリの決定・作成
    out_dir = Path(output_dir) if output_dir else csv_file.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    with open(csv_file, newline="", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        print("⚠️  CSVが空です。")
        return

    headers = rows[0]
    data_rows = rows[1:]
    total_rows = len(data_rows)

    if total_rows == 0:
        print("⚠️  データ行がありません（ヘッダーのみ）。")
        return

    # チャンク分割
    chunks = [
        data_rows[i : i + rows_per_file] for i in range(0, total_rows, rows_per_file)
    ]
    total_parts = len(chunks)
    stem = csv_file.stem

    print(f"📄 総データ行数 : {total_rows}")
    print(f"📦 分割数       : {total_parts} ファイル（{rows_per_file}行ごと）")
    print()

    generated_files = []
    for idx, chunk in enumerate(chunks, start=1):
        filename = f"{stem}_part{idx:03d}.md"
        out_path = out_dir / filename

        start_row = (idx - 1) * rows_per_file + 1
        end_row = min(idx * rows_per_file, total_rows)

        # ファイル先頭にメタ情報コメントを付加
        header_comment = (
            f"<!-- {stem} | Part {idx}/{total_parts} | "
            f"行 {start_row}〜{end_row} -->\n\n"
        )
        markdown = header_comment + build_markdown(headers, chunk)

        with open(out_path, "w", encoding="utf-8") as f:
            f.write(markdown)

        generated_files.append(out_path)
        print(f"✅ [{idx:03d}/{total_parts:03d}] {out_path}  ({len(chunk)}行)")

    print(f"\n🎉 完了: {total_parts} ファイルを '{out_dir}' に出力しました。")
    return generated_files


def main():
    if len(sys.argv) < 2:
        print("使い方: python csv_to_markdown.py input.csv [output_dir]")
        sys.exit(1)

    csv_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) >= 3 else None

    if not Path(csv_path).exists():
        print(f"エラー: ファイルが見つかりません → {csv_path}")
        sys.exit(1)

    csv_to_markdown_split(csv_path, output_dir)


if __name__ == "__main__":
    main()
