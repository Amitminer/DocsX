# Get all docs
GET http://localhost:8080/api/docs
HTTP/1.1 200

[Asserts]
jsonpath "$" exists

# Create a doc (protected)
POST http://localhost:8080/api/docs/create
Authorization: Bearer {{jwt}}
Content-Type: application/json

{
  "title": "Test Doc",
  "content": "This is a test doc."
}
HTTP/1.1 201

[Captures]
id: jsonpath "$.id"

[Asserts]
jsonpath "$.id" exists

# Get the created doc by ID
GET http://localhost:8080/api/docs?id={{id}}
HTTP/1.1 200

[Asserts]
jsonpath "$.id" == "{{id}}"

# Update the doc (protected)
POST http://localhost:8080/api/docs/update?id={{id}}
Authorization: Bearer {{jwt}}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content."
}
HTTP/1.1 200

[Asserts]
jsonpath "$.title" == "Updated Title"

# Like the doc (protected)
POST http://localhost:8080/api/docs/like?id={{id}}
Authorization: Bearer {{jwt}}
HTTP/1.1 200

# Unlike the doc (protected)
POST http://localhost:8080/api/docs/unlike?id={{id}}
Authorization: Bearer {{jwt}}
HTTP/1.1 200

# Get likes
GET http://localhost:8080/api/docs/likes?id={{id}}
Authorization: Bearer {{jwt}}
HTTP/1.1 200

[Asserts]
jsonpath "$.likes" exists

# Delete the doc (protected)
DELETE http://localhost:8080/api/docs/delete?id={{id}}
Authorization: Bearer {{jwt}}
HTTP/1.1 200

[Asserts]
jsonpath "$.message" == "Document deleted successfully" 