-- 002_テーブル作成フォーマット

-- 会社テーブル
IF object_id('company_table') IS NOT NULL
DROP TABLE company_table;

CREATE TABLE company_table (
    company_cd      NVARCHAR(100) NOT NULL
,   company_name    NVARCHAR(100) NOT NULL
);

-- 会社テーブルのコメント
EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社テーブル'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'company_table'

-- 会社テーブルのカラムのコメント
EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社コード'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'company_table'
,   @level2type = N'COLUMN'
,   @level2name = N'company_cd'

EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社名'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'company_table'
,   @level2type = N'COLUMN'
,   @level2name = N'company_name'


-- 部門テーブル
IF object_id('department_table') IS NOT NULL
DROP TABLE department_table;

CREATE TABLE department_table (
    company_cd      NVARCHAR(100) NOT NULL
,   department_cd      NVARCHAR(100) NOT NULL
,   department_name    NVARCHAR(100) NOT NULL
);

-- 部門テーブルのコメント
EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社テーブル'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'department_table'

-- 部門テーブルのカラムのコメント
EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社コード'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'department_table'
,   @level2type = N'COLUMN'
,   @level2name = N'company_cd'

EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社コード'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'department_table'
,   @level2type = N'COLUMN'
,   @level2name = N'department_cd'

EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社名'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'department_table'
,   @level2type = N'COLUMN'
,   @level2name = N'department_name'


-- ユーザーテーブル
IF object_id('user_table') IS NOT NULL
DROP TABLE user_table;

CREATE TABLE user_table (
    company_cd      NVARCHAR(100) NOT NULL
,   department_cd      NVARCHAR(100) NOT NULL
,   user_cd      NVARCHAR(100) NOT NULL
,   user_name    NVARCHAR(100) NOT NULL
);

-- ユーザーテーブルのコメント
EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社テーブル'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'user_table'

-- ユーザーテーブルのカラムのコメント
EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社コード'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'user_table'
,   @level2type = N'COLUMN'
,   @level2name = N'company_cd'

EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社コード'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'user_table'
,   @level2type = N'COLUMN'
,   @level2name = N'department_cd'

EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社コード'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'user_table'
,   @level2type = N'COLUMN'
,   @level2name = N'user_cd'

EXEC sys.sp_addextendedproperty
    @name       = N'MS_Description'
,   @value      = N'会社名'
,   @level0type = N'SCHEMA'
,   @level0name = N'dbo'
,   @level1type = N'TABLE'
,   @level1name = N'user_table'
,   @level2type = N'COLUMN'
,   @level2name = N'user_name'

