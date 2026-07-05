#!/usr/bin/env bash
#
# backup.sh - Dumps MongoDB running in the kind cluster and uploads the
# archive to S3. Intended to run on the EC2 instance (via cron or manually).
#
set -euo pipefail

# ---- CONFIG (edit these or export as env vars before running) ----
NAMESPACE="${NAMESPACE:-mern-blog}"
MONGO_DEPLOYMENT="${MONGO_DEPLOYMENT:-mongodb}"
DB_NAME="${DB_NAME:-blog}"
S3_BUCKET="${S3_BUCKET:-s3://my-devops-mini-project-backups}"
KUBECONFIG_PATH="${KUBECONFIG_PATH:-/home/ec2-user/.kube/config}"
BACKUP_DIR="${BACKUP_DIR:-/home/ec2-user/backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="mongo-backup-${TIMESTAMP}.gz"

export KUBECONFIG="${KUBECONFIG_PATH}"
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Finding mongodb pod in namespace ${NAMESPACE}..."
POD_NAME=$(kubectl get pods -n "${NAMESPACE}" -l app=mongodb -o jsonpath='{.items[0].metadata.name}')

if [ -z "${POD_NAME}" ]; then
  echo "ERROR: no mongodb pod found in namespace ${NAMESPACE}" >&2
  exit 1
fi

echo "[$(date)] Found pod: ${POD_NAME}"
echo "[$(date)] Running mongodump inside the pod..."

# Dump the DB to a gzip archive inside the pod, then stream it out.
kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- \
  mongodump --db "${DB_NAME}" --archive --gzip > "${BACKUP_DIR}/${ARCHIVE_NAME}"

echo "[$(date)] Dump complete: ${BACKUP_DIR}/${ARCHIVE_NAME} ($(du -h "${BACKUP_DIR}/${ARCHIVE_NAME}" | cut -f1))"

echo "[$(date)] Uploading to ${S3_BUCKET}/${ARCHIVE_NAME}..."
aws s3 cp "${BACKUP_DIR}/${ARCHIVE_NAME}" "${S3_BUCKET}/${ARCHIVE_NAME}"

echo "[$(date)] Upload complete."

# Keep only the last 7 local backups to save disk space
echo "[$(date)] Pruning local backups older than the last 7..."
ls -1t "${BACKUP_DIR}"/mongo-backup-*.gz 2>/dev/null | tail -n +8 | xargs -r rm -f

echo "[$(date)] Backup finished: ${ARCHIVE_NAME}"
