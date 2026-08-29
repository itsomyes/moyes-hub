"""Scrape Instagram posts for a username via apify/instagram-scraper.

Set APIFY_API_TOKEN before running.
Usage: python apify_example.py <instagram_username>
"""
import os
import sys

from apify_client import ApifyClient


def main():
    if len(sys.argv) != 2:
        print("Usage: python apify_example.py <instagram_username>")
        sys.exit(1)

    username = sys.argv[1]
    client = ApifyClient(os.environ["APIFY_API_TOKEN"])

    run = client.actor('apify/instagram-scraper').call(run_input={
        'directUrls': [f'https://www.instagram.com/{username}/'],
        'resultsType': 'posts',
        'resultsLimit': 30,
    })

    for item in client.dataset(run['defaultDatasetId']).iterate_items():
        print(item)


if __name__ == '__main__':
    main()
