# Marriage API Documentation

This document describes the marriage feature endpoints for the Family API.

## Base URL
All marriage endpoints are prefixed with `/api/marriage`

## Endpoints

### 1. Marry (Create Marriage)
**POST** `/api/marriage/marry`

Creates a marriage relationship between two persons.

#### Request Body
```json
{
  "personId1": "uuid-string",
  "personId2": "uuid-string",
  "startDate": "2024-01-15T00:00:00.000Z" // Optional, defaults to current date
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": [
    {
      "id": "relationship-id-1",
      "personId": "person-id-1",
      "relatedPersonId": "person-id-2",
      "type": "SPOUSE",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": null
    },
    {
      "id": "relationship-id-2",
      "personId": "person-id-2",
      "relatedPersonId": "person-id-1",
      "type": "SPOUSE",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": null
    }
  ],
  "message": "Marriage created successfully"
}
```

#### Error Responses
- **400 Bad Request**: Invalid input data, same person IDs, or validation errors
- **404 Not Found**: One or both persons don't exist
- **409 Conflict**: Person already married or same gender marriage attempted

### 2. Divorce (End Marriage)
**PUT** `/api/marriage/divorce?personId={uuid}`

Ends an existing marriage by setting an end date.

#### Query Parameters
- `personId` (required): UUID of the person to divorce

#### Request Body
```json
{
  "endDate": "2024-12-15T00:00:00.000Z" // Optional, defaults to current date
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "relationship-id-1",
      "personId": "person-id-1",
      "relatedPersonId": "person-id-2",
      "type": "SPOUSE",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-12-15T00:00:00.000Z"
    },
    {
      "id": "relationship-id-2",
      "personId": "person-id-2",
      "relatedPersonId": "person-id-1",
      "type": "SPOUSE",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-12-15T00:00:00.000Z"
    }
  ],
  "message": "Marriage ended successfully"
}
```

#### Error Responses
- **400 Bad Request**: Invalid personId or validation errors
- **404 Not Found**: Person doesn't exist
- **409 Conflict**: Person is not currently married

### 3. Cancel Marriage (Delete Marriage)
**DELETE** `/api/marriage/cancel?personId={uuid}`

Completely removes a marriage relationship from the database.

#### Query Parameters
- `personId` (required): UUID of the person whose marriage to cancel

#### Success Response (200)
```json
{
  "success": true,
  "data": [],
  "message": "Marriage cancelled successfully"
}
```

#### Error Responses
- **400 Bad Request**: Invalid personId or validation errors
- **404 Not Found**: Person doesn't exist
- **409 Conflict**: Person has no marriage to cancel

## Business Rules

1. **Gender Validation**: Persons must have different genders to marry
2. **Single Marriage**: A person can only be married to one person at a time
3. **Bidirectional Relationships**: Marriage creates two relationship records (person1→person2 and person2→person1)
4. **Custom Dates**: All operations support custom dates, defaulting to current date if not provided
5. **Data Integrity**: All operations use database transactions to ensure consistency

## Error Codes

- **400 BAD_REQUEST**: Invalid input data or validation failures
- **404 NOT_FOUND**: Requested person(s) not found
- **409 CONFLICT**: Business rule violations (already married, same gender, etc.)
- **500 INTERNAL_SERVER_ERROR**: Unexpected server errors

## Example Usage

### Create a Marriage
```bash
curl -X POST http://localhost:3000/api/marriage/marry \
  -H "Content-Type: application/json" \
  -d '{
    "personId1": "person-uuid-1",
    "personId2": "person-uuid-2",
    "startDate": "2024-01-15T00:00:00.000Z"
  }'
```

### End a Marriage (Divorce)
```bash
curl -X PUT "http://localhost:3000/api/marriage/divorce?personId=person-uuid-1" \
  -H "Content-Type: application/json" \
  -d '{
    "endDate": "2024-12-15T00:00:00.000Z"
  }'
```

### Cancel a Marriage
```bash
curl -X DELETE "http://localhost:3000/api/marriage/cancel?personId=person-uuid-1"
```

### Cancel Divorce (Restore Marriage)
```bash
curl -X PUT http://localhost:3000/api/marriage/cancel-divorce \
  -H "Content-Type: application/json" \
  -d '{
    "personId": "person-uuid-1"
  }'
```

### Get Persons by Status
```bash
# Get married couples
curl -X GET "http://localhost:3000/api/marriage/person/list?status=married"

# Get single persons
curl -X GET "http://localhost:3000/api/marriage/person/list?status=single"

# Get divorced couples
curl -X GET "http://localhost:3000/api/marriage/person/list?status=divorced"

# Get married couples with only men
curl -X GET "http://localhost:3000/api/marriage/person/list?status=married&gender=MAN"

# Get single women
curl -X GET "http://localhost:3000/api/marriage/person/list?status=single&gender=WOMAN"

# Get divorced couples with only women
curl -X GET "http://localhost:3000/api/marriage/person/list?status=divorced&gender=WOMAN"
```

### 4. Cancel Divorce (Restore Marriage)
**PUT** `/api/marriage/cancel-divorce`

Restores a divorced marriage by setting end_date back to null.

#### Request Body
```json
{
  "personId": "uuid-string"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "relationship-id-1",
      "personId": "person-id-1",
      "relatedPersonId": "person-id-2",
      "type": "SPOUSE",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": null
    },
    {
      "id": "relationship-id-2",
      "personId": "person-id-2",
      "relatedPersonId": "person-id-1",
      "type": "SPOUSE",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": null
    }
  ],
  "message": "Divorce cancelled successfully - marriage restored"
}
```

#### Error Responses
- **400 Bad Request**: Invalid personId or validation errors
- **404 Not Found**: Person doesn't exist
- **409 Conflict**: Person is not currently divorced

### 5. Get Persons by Status
**GET** `/api/marriage/person/list`

Retrieves persons based on their marriage status.

#### Query Parameters
- `status` (required): One of `married`, `single`, or `divorced`
- `gender` (optional): One of `MAN` or `WOMAN` to filter by gender

#### Success Response (200)

**For married status:**
```json
{
  "success": true,
  "data": [
    {
      "husband": {
        "id": "person-id-1",
        "name": "John Smith",
        "gender": "MAN",
        "birthDate": "1980-05-15T00:00:00.000Z",
        "deathDate": null,
        "bio": "Loves spending time with family and friends.",
        "profilePictureUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=JohnSmith",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      "wife": {
        "id": "person-id-2",
        "name": "Jane Doe",
        "gender": "WOMAN",
        "birthDate": "1982-08-20T00:00:00.000Z",
        "deathDate": null,
        "bio": "Enjoys outdoor activities and nature walks.",
        "profilePictureUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=JaneDoe",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  ],
  "message": "Found 1 married couples"
}
```

**For single status:**
```json
{
  "success": true,
  "data": [
    {
      "id": "person-id-3",
      "name": "Bob Johnson",
      "gender": "MAN",
      "birthDate": "1990-03-10T00:00:00.000Z",
      "deathDate": null,
      "bio": "Passionate about cooking and trying new recipes.",
      "profilePictureUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=BobJohnson",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Found 1 single persons"
}
```

**For divorced status:**
```json
{
  "success": true,
  "data": [
    {
      "husband": {
        "id": "person-id-4",
        "name": "Mike Wilson",
        "gender": "MAN",
        "birthDate": "1975-12-05T00:00:00.000Z",
        "deathDate": null,
        "bio": "Loves reading books and learning new things.",
        "profilePictureUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=MikeWilson",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      "wife": {
        "id": "person-id-5",
        "name": "Sarah Brown",
        "gender": "WOMAN",
        "birthDate": "1978-07-15T00:00:00.000Z",
        "deathDate": null,
        "bio": "Enjoys gardening and growing vegetables.",
        "profilePictureUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=SarahBrown",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  ],
  "message": "Found 1 divorced couples"
}
```

#### Error Responses
- **400 Bad Request**: Invalid or missing status parameter
