#!/usr/bin/env bash
set -euo pipefail

: "${DIRECTADMIN_FTP_HOST:?Set the DIRECTADMIN_FTP_HOST secret}"
: "${DIRECTADMIN_FTP_USER:?Set the DIRECTADMIN_FTP_USER secret}"
: "${DIRECTADMIN_FTP_PASSWORD:?Set the DIRECTADMIN_FTP_PASSWORD secret}"
: "${DIRECTADMIN_FTP_PATH:?Set the DIRECTADMIN_FTP_PATH variable}"

if [[ ! "$DIRECTADMIN_FTP_HOST" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo 'DIRECTADMIN_FTP_HOST must be a hostname without a protocol or port.' >&2
  exit 1
fi
if [[ ! "$DIRECTADMIN_FTP_PATH" =~ ^/?[A-Za-z0-9._/-]+$ || "$DIRECTADMIN_FTP_PATH" == *..* || "$DIRECTADMIN_FTP_PATH" == '/' ]]; then
  echo 'DIRECTADMIN_FTP_PATH must be an existing directory under the FTP account.' >&2
  exit 1
fi

test -f dist/index.html
test -f dist/api/index.php
test -f dist/.htaccess

# Never upload the local placeholder or a developer's real database password.
mkdir -p .directadmin-upload
rsync -a --delete --exclude='.db-password' dist/ .directadmin-upload/
test ! -e .directadmin-upload/api/.db-password

# DirectAdmin's HTTPS API is used because some hosts reject GitHub runner IPs
# on FTP port 21. The archive is kept outside public_html during extraction.
archive=.directadmin-deploy.tar.gz
remote_path="/${DIRECTADMIN_FTP_PATH#/}"
tar -C .directadmin-upload -czf "$archive" .

api="https://${DIRECTADMIN_FTP_HOST}:2222/CMD_API_FILE_MANAGER"
upload_response=$(curl --fail --silent --show-error --retry 2 \
  --user "$DIRECTADMIN_FTP_USER:$DIRECTADMIN_FTP_PASSWORD" \
  -H 'X-DirectAdmin-File-Upload: yes' \
  -H "X-DirectAdmin-File-Name: $archive" \
  --data-binary "@$archive" \
  "$api?path=/&action=upload")

if [[ "$upload_response" == *'error=1'* || "$upload_response" == *'"error"'* ]]; then
  echo "DirectAdmin rejected the upload: $upload_response" >&2
  exit 1
fi

extract_response=$(curl --fail --silent --show-error --retry 2 \
  --user "$DIRECTADMIN_FTP_USER:$DIRECTADMIN_FTP_PASSWORD" \
  --data-urlencode 'action=extract' \
  --data-urlencode 'page=2' \
  --data-urlencode "path=/$archive" \
  --data-urlencode "directory=$remote_path" \
  "$api")

if [[ "$extract_response" == *'error=1'* || "$extract_response" == *'"error"'* ]]; then
  echo "DirectAdmin rejected the extraction: $extract_response" >&2
  exit 1
fi

echo 'DirectAdmin upload and extraction completed.'
