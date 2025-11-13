"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformId = exports.Browsers = void 0;

const os = __importStar(require("os"));
const WAProto = __importStar(require("../../WAProto/index.js"));

/**
 * @deprecated Use `platform()` and `release()` from 'os' directly if needed
 */
const platform = os.platform;
const release = os.release;

const PLATFORM_MAP = {
    aix: 'AIX',
    darwin: 'Mac OS',
    win32: 'Windows',
    android: 'Android',
    freebsd: 'FreeBSD',
    openbsd: 'OpenBSD',
    sunos: 'Solaris',
    linux: undefined,
    haiku: undefined,
    cygwin: undefined,
    netbsd: undefined
};

/**
 * Browser configurations for different platforms
 */
exports.Browsers = {
    ubuntu: (browser) => ['Ubuntu', browser, '22.04.4'],
    macOS: (browser) => ['Mac OS', browser, '14.4.1'],
    baileys: (browser) => ['Baileys', browser, '6.5.0'],
    windows: (browser) => ['Windows', browser, '10.0.22631'],
    /**
     * The appropriate browser based on your OS & release
     */
    appropriate: (browser) => [
        PLATFORM_MAP[platform()] || 'Ubuntu',
        browser,
        release()
    ]
};

/**
 * Maps browser name to WhatsApp PlatformType enum ID
 * @param browser Browser name (e.g. 'Chrome', 'Firefox')
 * @returns PlatformType ID or 1 (Chrome) as fallback
 */
const getPlatformId = (browser) => {
    const platformType = WAProto.proto.DeviceProps.PlatformType[browser.toUpperCase()];
    return platformType !== undefined ? platformType.toString() : '1'; // Default: Chrome
};
exports.getPlatformId = getPlatformId;