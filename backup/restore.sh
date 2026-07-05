#!/usr/bin/env bash
#
# restore.sh - Disaster Recovery test: pulls the most recent backup from S3
# (or a specific one passed as $1) and restores it into the mongodb pod.
#
# Usage:
#   ./restore.sh                         # restores the latest backup in S3
#   ./restore.sh mongo-backup-XXXX.gz    # restores a specific backup file
#
set -euo pipefail

NAMESPACE="${NAMESPACE:-mern-blog}"
DB_NAME="${DB_NAME:-blog}"
S3_BUCKET="${S3_BUCKET:-s3://my-devops-mini-project-backups}"
KUBECONFIG_PATH="${KUBECONFIG_PATH:-/home/ec2-user/.kube/config}"
BACKUP_DIR="${BACKUP_DIR:-/home/ec2-user/backups}"
RESTORE_DB_NAME="${RESTORE_DB_NAME:-blog_restore_test}"  # restore into a separate DB by default, to avoid clobbering prod data during a DR test

export KUBECONFIG="${KUBECONFIG_PATH}"
mkdir -p "${BACKUP_DIR}"

if [ $# -ge 1 ]; then
  ARCHIVE_NAME="$1"
else
  echo "[$(date)] No file specified, finding latest backup in ${S3_BUCKET}..."
  ARCHIVE_NAME=$(aws s3 ls "${S3_BUCKET}/" | sort | tail -n 1 | awk '{print $4}')
fi

if [ -z "${ARCHIVE_NAME}" ]; then
  echo "ERROR: could not determine a backup file to restore" >&2
  exit 1
fi

echo "[$(date)] Restoring from: ${ARCHIVE_NAME}"

echo "[$(date)] Downloading from S3..."
aws s3 cp "${S3_BUCKET}/${ARCHIVE_NAME}" "${BACKUP_DIR}/${ARCHIVE_NAME}"

echo "[$(date)] Locating mongodb pod..."
POD_NAME=$(kubectl get pods -n "${NAMESPACE}" -l app=mongodb -o jsonpath='{.items[0].metadata.name}')

if [ -z "${POD_NAME}" ]; then
  echo "ERROR: no mongodb pod found in namespace ${NAMESPACE}" >&2
  exit 1
fi

echo "[$(date)] Streaming archive into pod ${POD_NAME} and restoring into DB '${RESTORE_DB_NAME}'..."
# --nsFrom / --nsTo remaps the dumped DB name to a test DB, so a DR test
# never overwrites live data. Drop --nsFrom/--nsTo and add --drop if you
# intend to do a real production restore over the original DB.
cat "${BACKUP_DIR}/${ARCHIVE_NAME}" | kubectl exec -i -n "${NAMESPACE}" "${POD_NAME}" -- \
  mongorestore --archive --gzip \
    --nsFrom="${DB_NAME}.*" \
    --nsTo="${RESTORE_DB_NAME}.*"

echo "[$(date)] Restore complete. Verifying document count..."
kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- \
  mongo "${RESTORE_DB_NAME}" --quiet --eval "db.getCollectionNames().forEach(c => print(c + ': ' + db.getCollection(c).countDocuments()))"

echo "[$(date)] DR restore test finished successfully."
