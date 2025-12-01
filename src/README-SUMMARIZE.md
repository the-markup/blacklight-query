# Summarizing Blacklight Query results

This branch includes a new script in this directory that lets you get human-readable summaries from blacklight query output. It will not be opened as a PR as it's a hack—Tomas installed the (private) lambda repo as a submodule so he could access its methods and data—but it is useful to quickly analyze a big batch of results.

## How to summarize

Follow the instructions in the main README to run a scan on a list of URLs. The results of the scan will be placed in the `outputs` folder.

To summarize the results, run the summarize script:

```bash
npm run summarize
```

This will step through each directory in the `outputs` folder, look for an `inspection.json` file, and output a human-readable summary of its contents to standard out that looks like this:

```
Scanned www.nj.gov, 1 page(s):
https://www.nj.gov/getcoverednj/

[X] 15 Ad trackers found on this site. - This is more than double the average of seven that we found on popular sites
Scripts detected belonging to: Alphabet, Inc.; Reddit Inc.; Facebook, Inc.; Amobee, Inc; Tapad, Inc.; Twitter, Inc.

[X] 21 Third-party cookies found. - This is more than the average of three that we found on popular sites
Cookies detected set for: Snap Inc.; Twitter, Inc.; Alphabet, Inc.; Amobee, Inc; Microsoft Corporation; Tapad, Inc.

[X] Canvas fingerprinting was detected on this website.

[ ] Blacklight did not detect the use of a session recorder.

[ ] We did not find this website capturing keystrokes.

[X] When you visit this site, it tells Facebook.

[ ] Google Analytics' "remarketing audiences" feature not found.

Some of the ad-tech companies this website interacted with:
Alphabet; LinkedIn
```

The script will also write a time-stamped CSV file with the details of all the scans it found so you can search, sort, and compare the results.
