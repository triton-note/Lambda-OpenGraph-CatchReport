# Lambda-OpenGraph-CatchReport
AWS Lambda to get properties of catch report, and, by API Gateway, Display it for HTML format.

## 呼び出し方
---
JSON を Base64 + URLEncode して url のサブパスとして渡します。

``例) https://api.fathens.org/triton-note/open_graph/catch_report/<base64data>``

---
JSON 内のプロパティ

|property|description|
|:--|:--|
|url|パラメータを除いたURL|
|appId|Facebook でのアプリケーションID|
|appName|Facebook でのアプリケーション名|
|objectName|Facebook での CatchReport のOpenGraphオプジェクト名|
|region|DynamoDB のリージョン名|
|bucketName|設定ファイルが置かれている AWS S3 のバケット名|
|table_report|Report のテーブル名|
|table_catch|Catch のテーブル名|
|cognitoId|対象となる CatchReport のユーザの Cognito ID|
|reportId|対象となる CatchReport の ID|

