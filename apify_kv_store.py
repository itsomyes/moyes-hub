"""Download all records from an Apify key-value store.

Set APIFY_API_TOKEN before running.
Usage: python apify_kv_store.py <store_id> [output_dir]
"""
import json
import os
import sys

from apify_client import ApifyClient


def main():
    if len(sys.argv) < 2:
        print("Usage: python apify_kv_store.py <store_id> [output_dir]")
        sys.exit(1)

    store_id = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "kv_store_output"
    os.makedirs(output_dir, exist_ok=True)

    client = ApifyClient(os.environ["APIFY_API_TOKEN"])
    store = client.key_value_store(store_id)

    exclusive_start_key = None
    while True:
        page = store.list_keys(exclusive_start_key=exclusive_start_key)
        for item in page['items']:
            key = item['key']
            record = store.get_record(key)
            value = record['value']
            path = os.path.join(output_dir, key)

            if isinstance(value, bytes):
                with open(path, 'wb') as f:
                    f.write(value)
            elif isinstance(value, str):
                with open(path, 'w') as f:
                    f.write(value)
            else:
                with open(path, 'w') as f:
                    json.dump(value, f, indent=2)

            print(f"Saved {key} -> {path}")

        if not page.get('isTruncated'):
            break
        exclusive_start_key = page.get('nextExclusiveStartKey')


if __name__ == '__main__':
    main()
