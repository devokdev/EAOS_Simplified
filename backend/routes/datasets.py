import csv
import io
from fastapi import APIRouter, File, HTTPException, UploadFile
from ..database import get_db
from ..models.dataset import ContactInput, ContactUpdate, CsvImportOut, DatasetContactOut, DatasetCreate, DatasetOut

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


def _dataset_row_to_out(row) -> DatasetOut:
    return DatasetOut(
        id=str(row["id"]),
        name=row["name"],
        source_filename=row.get("source_filename", ""),
        created_at=row["created_at"],
        contact_count=row.get("contact_count", 0),
    )


def _contact_row_to_out(row) -> DatasetContactOut:
    return DatasetContactOut(
        id=str(row["id"]),
        dataset_id=str(row["dataset_id"]),
        name=row.get("name", ""),
        email=row["email"],
        created_at=row["created_at"],
    )


@router.get("/", response_model=list[DatasetOut])
async def list_datasets():
    async with get_db().acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT d.*, COUNT(c.id)::int AS contact_count
            FROM datasets d
            LEFT JOIN dataset_contacts c ON c.dataset_id = d.id
            GROUP BY d.id
            ORDER BY d.created_at DESC
            """
        )
    return [_dataset_row_to_out(row) for row in rows]


@router.post("/", response_model=DatasetOut, status_code=201)
async def create_dataset(data: DatasetCreate):
    async with get_db().acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO datasets (name)
            VALUES ($1)
            RETURNING id, name, source_filename, created_at, 0::int AS contact_count
            """,
            data.name.strip(),
        )
    return _dataset_row_to_out(row)


@router.post("/upload", response_model=CsvImportOut, status_code=201)
async def upload_dataset(name: str, file: UploadFile = File(...)):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    imported = 0
    skipped = 0

    async with get_db().acquire() as conn:
        dataset = await conn.fetchrow(
            """
            INSERT INTO datasets (name, source_filename)
            VALUES ($1, $2)
            RETURNING id, name, source_filename, created_at
            """,
            name.strip(),
            file.filename or "",
        )

        for row in reader:
            normalized = {str(key).strip().lower(): (value or "").strip() for key, value in row.items()}
            email = normalized.get("email") or normalized.get("mail") or normalized.get("email address")
            if not email:
                skipped += 1
                continue
            contact_name = normalized.get("name") or normalized.get("full name") or email.split("@")[0]
            status = await conn.execute(
                """
                INSERT INTO dataset_contacts (dataset_id, name, email)
                VALUES ($1, $2, LOWER($3))
                ON CONFLICT (dataset_id, email) DO NOTHING
                """,
                dataset["id"],
                contact_name,
                email,
            )
            if status == "INSERT 0 1":
                imported += 1
            else:
                skipped += 1

        dataset_with_count = await conn.fetchrow(
            """
            SELECT d.*, COUNT(c.id)::int AS contact_count
            FROM datasets d
            LEFT JOIN dataset_contacts c ON c.dataset_id = d.id
            WHERE d.id = $1
            GROUP BY d.id
            """,
            dataset["id"],
        )

    return CsvImportOut(dataset=_dataset_row_to_out(dataset_with_count), imported=imported, skipped=skipped)


@router.get("/{dataset_id}", response_model=DatasetOut)
async def get_dataset(dataset_id: str):
    async with get_db().acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT d.*, COUNT(c.id)::int AS contact_count
            FROM datasets d
            LEFT JOIN dataset_contacts c ON c.dataset_id = d.id
            WHERE d.id = $1::uuid
            GROUP BY d.id
            """,
            dataset_id,
        )
    if not row:
        raise HTTPException(404, "Dataset not found")
    return _dataset_row_to_out(row)


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    async with get_db().acquire() as conn:
        status = await conn.execute("DELETE FROM datasets WHERE id = $1::uuid", dataset_id)
    if status == "DELETE 0":
        raise HTTPException(404, "Dataset not found")
    return {"message": "Dataset deleted"}


@router.delete("/")
async def reset_datasets():
    async with get_db().acquire() as conn:
        await conn.execute("TRUNCATE TABLE activity_logs, email_logs, dataset_contacts, datasets RESTART IDENTITY CASCADE")
    return {"message": "All datasets and related activity deleted"}


@router.get("/{dataset_id}/contacts", response_model=list[DatasetContactOut])
async def list_dataset_contacts(dataset_id: str):
    async with get_db().acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT * FROM dataset_contacts
            WHERE dataset_id = $1::uuid
            ORDER BY created_at DESC
            """,
            dataset_id,
        )
    return [_contact_row_to_out(row) for row in rows]


@router.post("/{dataset_id}/contacts", response_model=DatasetContactOut, status_code=201)
async def add_contact(dataset_id: str, data: ContactInput):
    async with get_db().acquire() as conn:
        dataset = await conn.fetchrow("SELECT id FROM datasets WHERE id = $1::uuid", dataset_id)
        if not dataset:
            raise HTTPException(404, "Dataset not found")
        try:
            row = await conn.fetchrow(
                """
                INSERT INTO dataset_contacts (dataset_id, name, email)
                VALUES ($1::uuid, $2, LOWER($3))
                RETURNING *
                """,
                dataset_id,
                data.name.strip(),
                data.email.strip(),
            )
        except Exception as exc:
            raise HTTPException(400, "This email already exists in the dataset") from exc
    return _contact_row_to_out(row)


@router.put("/contacts/{contact_id}", response_model=DatasetContactOut)
async def update_contact(contact_id: str, data: ContactUpdate):
    payload = data.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(400, "No changes provided")
    updates = []
    values = [contact_id]
    for index, (key, value) in enumerate(payload.items(), start=2):
        updates.append(f"{key} = ${index}")
        values.append(value.strip().lower() if key == "email" else value.strip())
    async with get_db().acquire() as conn:
        try:
            row = await conn.fetchrow(
                f"UPDATE dataset_contacts SET {', '.join(updates)} WHERE id = $1::uuid RETURNING *",
                *values,
            )
        except Exception as exc:
            raise HTTPException(400, "Unable to update contact") from exc
    if not row:
        raise HTTPException(404, "Contact not found")
    return _contact_row_to_out(row)


@router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    async with get_db().acquire() as conn:
        status = await conn.execute("DELETE FROM dataset_contacts WHERE id = $1::uuid", contact_id)
    if status == "DELETE 0":
        raise HTTPException(404, "Contact not found")
    return {"message": "Contact deleted"}
