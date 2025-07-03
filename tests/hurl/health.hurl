# Health check
GET http://localhost:8080/api/health
HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok" 