# Blacklight Query

A command-line tool to fetch [Blacklight](https://themarkup.org/series/blacklight) scans for a list of urls.

## Getting Started

- `nvm use`
- `npm install`
- Create `urls.txt` file, with newline-separated absolute URLs to scan
- `npm run main`

## Inputs

Write all URLs you wish to scan as **absolute URLs** (including protocol, domain, and path) in a file named `urls.txt` in the root directory. Separate urls by newline.

### Sample urls.txt file

```text
https://www.themarkup.org
https://www.calmaterrs.org
```

## Outputs

All scans will be saved in the `outputs` folder, in sub-folders named for the hostname of the url being scanned.
