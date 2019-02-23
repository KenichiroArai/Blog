-- 005_更新フォーマット
UPDATE
    company_table
SET
    company_cd = 'TEST2'
,   company_name = 'テスト2'
WHERE
    company_cd = 'TEST'
    AND company_name = 'テスト'
