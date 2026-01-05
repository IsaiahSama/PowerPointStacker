"use strict";
/**
 * PowerPoint Stacker - Shared Type Definitions
 *
 * This file contains all TypeScript interfaces and types shared between
 * the main process and renderer process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.ErrorCode = exports.AppMode = exports.NavigationDirection = void 0;
/**
 * Navigation direction enum
 */
var NavigationDirection;
(function (NavigationDirection) {
    NavigationDirection["NEXT"] = "next";
    NavigationDirection["PREVIOUS"] = "previous";
    NavigationDirection["NEXT_PRESENTATION"] = "next_presentation";
    NavigationDirection["PREVIOUS_PRESENTATION"] = "previous_presentation";
    NavigationDirection["FIRST_SLIDE"] = "first_slide";
    NavigationDirection["LAST_SLIDE"] = "last_slide";
})(NavigationDirection || (exports.NavigationDirection = NavigationDirection = {}));
/**
 * Application mode enum
 */
var AppMode;
(function (AppMode) {
    AppMode["SETUP"] = "setup";
    AppMode["PRESENTING"] = "presenting";
})(AppMode || (exports.AppMode = AppMode = {}));
/**
 * Standard error codes for the application
 */
var ErrorCode;
(function (ErrorCode) {
    // File errors
    ErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ErrorCode["FILE_READ_ERROR"] = "FILE_READ_ERROR";
    ErrorCode["INVALID_FILE_FORMAT"] = "INVALID_FILE_FORMAT";
    ErrorCode["FILE_CORRUPTED"] = "FILE_CORRUPTED";
    // Presentation errors
    ErrorCode["PRESENTATION_NOT_FOUND"] = "PRESENTATION_NOT_FOUND";
    ErrorCode["SLIDE_NOT_FOUND"] = "SLIDE_NOT_FOUND";
    ErrorCode["PARSE_ERROR"] = "PARSE_ERROR";
    // State errors
    ErrorCode["INVALID_STATE"] = "INVALID_STATE";
    ErrorCode["NO_PRESENTATIONS_LOADED"] = "NO_PRESENTATIONS_LOADED";
    // Navigation errors
    ErrorCode["NAVIGATION_BLOCKED"] = "NAVIGATION_BLOCKED";
    // General errors
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Application error class with error code support
 */
class AppError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
//# sourceMappingURL=types.js.map