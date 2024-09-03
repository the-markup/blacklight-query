export function reportFailures(failedUrls:string[], totalUrlNum:number) {
    if (!failedUrls.length) {
        console.log("All URLs were successfully scanned! 🎉")
    } else {
        console.log(`${failedUrls.length} out of ${totalUrlNum} URLs failed`);
        console.log("The following URLs failed:");
        for (let url of failedUrls) {
            console.log(url);
        }
    }
}