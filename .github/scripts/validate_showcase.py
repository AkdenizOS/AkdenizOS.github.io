#!/usr/bin/env python3
"""Validate showcase.json on a pull request.

Catches the entries that would render as a broken card: a repo that does
not exist, is private, is a fork, or a colour outside the palette. Also
checks the entry belongs to the person opening the pull request, since
the showcase is meant to list your own work.

Fails with one message per problem rather than stopping at the first, so
a contributor sees everything to fix in a single run.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request

PALETTE = {"navy", "sea", "teal", "moss", "amber", "sun", "rust", "plum"}
REQUIRED = ("repo", "title", "blurb", "color")
REPO_RE = re.compile(r"^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$")
MAX_BLURB = 160

errors = []
notes = []


def api(path):
    request = urllib.request.Request(
        f"https://api.github.com{path}",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {os.environ['GH_TOKEN']}",
            "User-Agent": "akdenizos-showcase-validator",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def main():
    try:
        with open("showcase.json", encoding="utf-8") as handle:
            data = json.load(handle)
    except json.JSONDecodeError as exc:
        print(f"::error file=showcase.json::Not valid JSON — {exc}")
        return 1

    projects = data.get("projects")
    if not isinstance(projects, list):
        print('::error file=showcase.json::Expected a "projects" array')
        return 1

    author = os.environ.get("PR_AUTHOR", "").lower()
    seen = {}

    for index, project in enumerate(projects):
        label = project.get("repo") or f"entry {index}"

        if not isinstance(project, dict):
            errors.append(f"{label}: entry must be an object")
            continue

        missing = [field for field in REQUIRED if not project.get(field)]
        if missing:
            errors.append(f"{label}: missing {', '.join(missing)}")
            continue

        repo = project["repo"]
        if not REPO_RE.match(repo):
            errors.append(f'{label}: "repo" must look like owner/name')
            continue

        if project["color"] not in PALETTE:
            errors.append(
                f"{repo}: colour '{project['color']}' is not in the palette "
                f"({', '.join(sorted(PALETTE))})"
            )

        if len(project["blurb"]) > MAX_BLURB:
            errors.append(
                f"{repo}: blurb is {len(project['blurb'])} characters, "
                f"keep it under {MAX_BLURB}"
            )

        key = repo.lower()
        if key in seen:
            errors.append(f"{repo}: already listed at entry {seen[key]}")
            continue
        seen[key] = index

        url = project.get("url")
        if url is not None:
            if not isinstance(url, str) or not url.startswith("https://"):
                errors.append(f'{repo}: "url" must be an https:// address')
            else:
                try:
                    req = urllib.request.Request(
                        url, method="GET",
                        headers={"User-Agent": "akdenizos-showcase-validator"})
                    with urllib.request.urlopen(req, timeout=20) as resp:
                        if resp.status >= 400:
                            errors.append(f"{repo}: url returned {resp.status}")
                except urllib.error.HTTPError as exc:
                    errors.append(f"{repo}: url returned {exc.code}")
                except urllib.error.URLError as exc:
                    errors.append(f"{repo}: url unreachable — {exc.reason}")

        tags = project.get("tags", [])
        if not isinstance(tags, list) or any(not isinstance(t, str) for t in tags):
            errors.append(f"{repo}: tags must be a list of strings")
        elif len(tags) > 4:
            errors.append(f"{repo}: at most 4 tags, found {len(tags)}")

        try:
            info = api(f"/repos/{repo}")
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                errors.append(f"{repo}: no such public repository")
            else:
                errors.append(f"{repo}: GitHub returned {exc.code}")
            continue
        except urllib.error.URLError as exc:
            errors.append(f"{repo}: could not reach GitHub — {exc.reason}")
            continue

        if info.get("private"):
            errors.append(f"{repo}: repository is private")
        if info.get("fork"):
            errors.append(f"{repo}: forks are not listed — showcase your own work")
        if info.get("archived"):
            notes.append(f"{repo}: repository is archived")

        owner = (info.get("owner") or {}).get("login", "").lower()
        if author and owner != author:
            notes.append(
                f"{repo}: owned by @{owner} but this pull request is from "
                f"@{author} — a maintainer should confirm this is intended"
            )

    for note in notes:
        print(f"::warning file=showcase.json::{note}")
    for error in errors:
        print(f"::error file=showcase.json::{error}")

    if errors:
        print(f"\n{len(errors)} problem(s) found in showcase.json")
        return 1

    print(f"showcase.json is valid — {len(projects)} project(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
