-- 001_共通フォーマット
SELECT
    ct.company_cd       AS 会社コード
,   ut.user_cd          AS ユーザーコード
FROM
    company_table               AS ct       -- 会社テーブル
  INNER JOIN department_table   AS dt       -- 部門テーブル
    ON  dt.company_cd = ct.company_cd
  INNER JOIN user_table         AS ut       -- ユーザーテーブル
    ON  ut.company_cd = dt.company_cd
    AND ut.department_cd = dt.department_cd
WHERE
    ct.company_cd = 'TEST'
    AND ut.user_cd = '1000'
ORDER BY
    ct.company_cd
,   ut.user_cd       DESC
