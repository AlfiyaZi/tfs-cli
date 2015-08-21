/// <reference path="../../definitions/tsd.d.ts" />

import _ = require('lodash');
import cm = require('./common');
import Q = require('q');
import fs = require('fs');
var osHomedir = require('os-homedir');
var path = require('path');
var shell = require('shelljs');
var trace = require('./trace');

export class DiskCache {
    constructor(appName: string) {
        this.appName = appName;
    }

    public appName: string;

    private getFilePath(store: string, name: string): string {
        var storeFolder = path.join(osHomedir(), '.' + this.appName, store);
        shell.mkdir('-p', storeFolder);
        return path.join(storeFolder, '.' + name);
    }

    public itemExists(store: string, name: string): Q.Promise<boolean> {
        var defer = Q.defer<boolean>();

        fs.exists(this.getFilePath(store, name), (exists: boolean) => {
            defer.resolve(exists);
        });

        return <Q.Promise<boolean>>defer.promise;        
    }

    public getItem(store: string, name: string): Q.Promise<string> {
        trace.debug('cache.getItem');
        var defer = Q.defer<string>();
        var fp = this.getFilePath(store, name);
        trace.debugArea('read: ' + store + ':' + name, 'CACHE');
        trace.debugArea(fp, 'CACHE');
        fs.readFile(fp, (err: Error, contents: Buffer) => {
            if (err) {
                defer.reject(err);
                return;
            }

            var str = contents.toString();
            trace.debugArea(str, 'CACHE');
            defer.resolve(str);
        });

        return <Q.Promise<string>>defer.promise;
    }

    public setItem(store: string, name: string, data:string): Q.Promise<void> {
        trace.debug('cache.setItem');
        var defer = Q.defer<void>();
        var fp = this.getFilePath(store, name);
        trace.debugArea('write: ' + store + ':' + name + ':' + data, 'CACHE');
        trace.debugArea(fp, 'CACHE');
        fs.writeFile(fp, data, {flag: 'w'}, (err: Error) => {
            if (err) {
                defer.reject(err);
                return;
            }
            trace.debugArea('written', 'CACHE');
            defer.resolve(null);
        });

        return <Q.Promise<void>>defer.promise;
    }

    public deleteItem(store: string, name: string): Q.Promise<void> {
        // TODO
        var defer = Q.defer<void>();
        defer.reject(new Error('Not implemented'));
        return <Q.Promise<void>>defer.promise;
    }
}

export function saveOptions(cliOptions: cm.IStringIndexer, settingsPath: string): Q.Promise<any> {
    trace.info("Saving CLI options to %s.", settingsPath);
    return Q.Promise((resolve, reject, notify) => {
        try {
            fs.exists(settingsPath, (exists: boolean) => {
                resolve(exists);
            });
        } catch (err) {
            reject(err);
        }
    }).then((exists: boolean) => {
        if (exists) {
            trace.debug("Settings file exists. Merging settings.");
            return Q.nfcall<string>(fs.readFile, settingsPath, "utf8").then(content => content.replace(/^\uFEFF/, ""));
        } else {
            trace.debug("Settings file does not exist. Writing file.");
            return "{}";
        }
    }).then((settingsStr: string) => {
        let settings = JSON.parse(settingsStr);
        _.merge(settings, cliOptions);
        if (Object.keys(settings).length > 0) {
            let fileContents = JSON.stringify(settings, null, 4);
            trace.debug("Content: %s", fileContents);
            return Q.nfcall(fs.writeFile, settingsPath, fileContents, "utf8");
        } else {
            return;
        }
    });
}

export function parseSettingsFile(settingsPath: string, noWarn: boolean): Q.Promise<cm.IStringIndexer> {
    trace.debug("diskcache.parseSettings");
    trace.debug("reading settings from %s", settingsPath);
    return Q.Promise<cm.IStringIndexer>((resolve, reject, notify) => {
        try {
            if (fs.existsSync(settingsPath)) {
                let settingsStr = fs.readFileSync(settingsPath, "utf8").replace(/^\uFEFF/, "");
                let settingsJSON;
                try {
                    resolve(JSON.parse(settingsStr)) 
                } catch (err) {
                    trace.warn("Could not parse settings file as JSON. No settings were read from %s.", settingsPath);
                    resolve({});
                }
            } else {
                if (!noWarn) {
                    trace.warn("No settings file found at %s.", settingsPath);
                }
                resolve({});
            }
        } catch (err) {
            reject(err);
        }
    });
}
