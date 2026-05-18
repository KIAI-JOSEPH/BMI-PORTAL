/// <reference path="../pb_data/types.d.ts" />
/**
 * BMI UMS — Transcript Verification Audit Log Collection
 *
 * Every verification attempt (valid, invalid, tampered, revoked, not_found)
 * is logged here for security audit purposes.  Mirrors the existing
 * verification_logs collection used for certificates.
 */
migrate((db) => {
  const collection = new Collection({
    "id": "bmi_tr_verify_logs_v1",
    "name": "transcript_verification_logs",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "tvl_serial",
        "name": "transcript_serial",
        "type": "text",
        "required": true,
        "options": { "min": null, "max": 60, "pattern": "" }
      },
      {
        "id": "tvl_result",
        "name": "result",
        "type": "select",
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["valid", "invalid", "revoked", "tampered", "not_found"]
        }
      },
      {
        "id": "tvl_ip",
        "name": "ip_address",
        "type": "text",
        "required": false,
        "options": { "min": null, "max": 45, "pattern": "" }
      },
      {
        "id": "tvl_timestamp",
        "name": "timestamp",
        "type": "text",
        "required": true,
        "options": { "min": null, "max": null, "pattern": "" }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_tvl_serial ON transcript_verification_logs (transcript_serial)",
      "CREATE INDEX idx_tvl_timestamp ON transcript_verification_logs (timestamp)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("bmi_tr_verify_logs_v1");
  return dao.deleteCollection(collection);
});
