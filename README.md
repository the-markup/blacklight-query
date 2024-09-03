# Blacklight Query

A command-line tool to fetch [Blacklight](https://themarkup.org/series/blacklight) scans for a list of urls.

## Prerequesites

- [`nvm`](https://www.linode.com/docs/guides/how-to-install-use-node-version-manager-nvm/)
- [`npm`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

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

### Collector Options

All of the [`blacklight-collector`](https://github.com/the-markup/blacklight-collector?tab=readme-ov-file#collector-configuration) options can be specified using this tool, by editing the `config` object in `main.ts`.

Out-of-the-box, this tool sets the following options:

- `headless: true`, this sets the collector to use a headless, behind-the-scenes browser
- `outDir: ./outputs/URL`, specifies which directory the collector should store it's results in. Makes use of the url being scanned
- `numPages: 0`, tells the collector not to scan an additional page. Setting this to 1, 2, or 3 scans that number of randomly-chosen pages that are accessible from the home page

Some other options you may find useful are:

- `emulateDevice`, this specifies which device the collector should scan as
- `headers`, allows you to set custom headers on the headless browser

Read the blacklight-collector README for a full list of options and their defaults.

## Outputs

All scans will be saved in the `outputs` folder, in sub-folders named for the hostname of the url being scanned.
