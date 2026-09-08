#!/bin/sh
set -eu

mc alias set local "${MINIO_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"
mc mb --ignore-existing local/caab-quarantine
mc mb --ignore-existing local/caab-private
mc mb --ignore-existing local/caab-public
mc anonymous set none local/caab-quarantine
mc anonymous set none local/caab-private
mc anonymous set download local/caab-public
