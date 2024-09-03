import { reportFailures } from '../src/utils';

const logSpy = jest.spyOn(console, 'log');

afterEach(() => {
    jest.clearAllMocks();
});

test('correctly outputs if all urls succeeded', () => {
    const failedUrls = [];
    reportFailures(failedUrls, 100);
    expect(logSpy).toHaveBeenCalledWith('All URLs were successfully scanned! 🎉');
});

test('correctly outputs when there are failed Urls', () => {
    const failedUrls = ['url1', 'url2'];
    const totalUrlNum = 5;
    reportFailures(failedUrls, totalUrlNum);
    expect(logSpy).toHaveBeenCalledTimes(4);
    expect(logSpy).toHaveBeenCalledWith(`${failedUrls.length} out of ${totalUrlNum} URLs failed`);
    expect(logSpy).toHaveBeenCalledWith('The following URLs failed:');
    expect(logSpy).toHaveBeenCalledWith(failedUrls[0]);
    expect(logSpy).toHaveBeenCalledWith(failedUrls[1]);
});