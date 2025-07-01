# DocsX Backend API Usage

## Get All Documents

```bash
curl http://localhost:8080/api/docs
```

## Create a Document (Requires Auth)

```bash
curl -X POST http://localhost:8080/api/docs/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Tutorial","description":"A great tutorial","content":"# Hello World"}'
```

## Get a Specific Document

```bash
curl http://localhost:8080/api/docs?id=DOCUMENT_UUID
```

## More Endpoints

- `/api/assets` – Manage document assets
- `/api/slugs` – Custom URL slugs for docs

> For full details, see the source code in `src/api/` I'm Lazzy lmao. 