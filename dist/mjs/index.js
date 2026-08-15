import * as fs from "node:fs";
import { accessSync, existsSync, promises, readFileSync } from "node:fs";
import * as path$1 from "node:path";
import path from "node:path";
import * as core from "@actions/core";
import { context } from "@actions/github";
import { Provider } from "nconf";
import YAML from "yaml";
import * as feather from "feather-icons";
import { icons } from "feather-icons";
import chalkPkg from "chalk";
import { execFileSync, execSync } from "node:child_process";
import { EOL } from "node:os";
import { format } from "prettier";
import { SVG, registerWindow } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
//#region src/constants.ts
/**
* Represents the icons object from 'feather-icons' library.
*/
/**
* Represents the sections of the README.
*/
const README_SECTIONS = [
	"title",
	"branding",
	"description",
	"usage",
	"inputs",
	"outputs",
	"contents",
	"badges"
];
/**
* Represents the file name for the configuration file.
*/
const configFileName = ".ghadocs.json";
/**
* Represents the default brand color.
*/
const DEFAULT_BRAND_COLOR = "blue";
/**
* Represents the default brand icon.
*/
const DEFAULT_BRAND_ICON = "activity";
/**
* Represents the set of icons that are omitted in GitHub Actions branding.
*/
const GITHUB_ACTIONS_OMITTED_ICONS = /* @__PURE__ */ new Set([
	"coffee",
	"columns",
	"divide-circle",
	"divide-square",
	"divide",
	"frown",
	"hexagon",
	"key",
	"meh",
	"mouse-pointer",
	"smile",
	"tool",
	"x-octagon"
]);
/**
* Represents the set of icons available for GitHub Actions branding.
*/
const GITHUB_ACTIONS_BRANDING_ICONS = new Set(Object.keys(icons).filter((item) => !GITHUB_ACTIONS_OMITTED_ICONS.has(item)));
/**
* Represents the available colors for GitHub Actions branding.
*/
const GITHUB_ACTIONS_BRANDING_COLORS = [
	"white",
	"yellow",
	"blue",
	"green",
	"orange",
	"red",
	"purple",
	"gray-dark"
];
/**
* Checks if the given icon is valid for GitHub Actions branding.
* The value comes from an unvalidated action.yml, so it is an arbitrary
* string until this guard narrows it — `Partial<FeatherIconNames>` was a
* misuse of `Partial` on a string-literal union (it doesn't express
* "optional"/"unvalidated" the way it does for object types).
* @param {string} icon - The icon to validate.
* @returns A boolean indicating if the icon is valid.
*/
function isValidIcon(icon) {
	return GITHUB_ACTIONS_BRANDING_ICONS.has(icon);
}
/**
* Checks if the given color is valid for GitHub Actions branding.
* The value comes from an unvalidated action.yml, so it is an arbitrary
* string until this guard narrows it — see {@link isValidIcon}.
* @param {string} color - The color to validate.
* @returns A boolean indicating if the color is valid.
*/
function isValidColor(color) {
	return GITHUB_ACTIONS_BRANDING_COLORS.includes(color);
}
//#endregion
//#region src/util.ts
function notEmpty(str) {
	return typeof str === "string" ? str.trim().length > 0 : false;
}
//#endregion
//#region src/logtask/index.ts
const { bgRedBright, cyan, green, greenBright, whiteBright, yellow, yellowBright } = chalkPkg;
function inGitHubActions() {
	return notEmpty(process.env.GITHUB_ACTIONS) && process.env.GITHUB_ACTIONS === "true";
}
function highlightMessage(step, message) {
	let failed = false;
	const ci = inGitHubActions();
	let desc;
	switch (step) {
		case "START":
			desc = `${message}`;
			break;
		case "INFO":
			desc = green(`${message}`);
			break;
		case "WARN":
			desc = yellow(`${message}`);
			break;
		case "SUCCESS":
			desc = greenBright(`${message}`);
			break;
		case "FAILURE":
			desc = ci ? message : yellow.bold(`${message}`);
			failed = true;
			break;
		case "ERROR":
			desc = ci ? message : yellow(`${message}`);
			break;
		case "#####":
			desc = cyan(`${message}`);
			break;
		default: desc = message;
	}
	return {
		desc,
		failed
	};
}
function highlightStep(step, message) {
	let msg;
	const ci = inGitHubActions();
	switch (step) {
		case "START":
			msg = yellowBright(message);
			break;
		case "SUCCESS":
			msg = whiteBright(message);
			break;
		case "FAILURE":
		case "ERROR":
			msg = ci ? message : bgRedBright(message);
			break;
		default: msg = message;
	}
	return msg;
}
function handleOutput(startGroup, msg, originalString) {
	const ci = inGitHubActions();
	switch (startGroup) {
		case 1:
			if (ci && originalString) core.startGroup(originalString);
			else core.info(msg);
			break;
		case 2:
			if (ci) core.endGroup();
			break;
		case 3:
			core.error(msg);
			break;
		case 4:
			core.setFailed(msg);
			break;
		default: core.info(msg);
	}
}
/**
* Represents a logging task with various log step methods.
*/
var LogTask = class LogTask {
	/**
	* Map of ingroup settings per task name.
	*/
	static ingroupSettings = /* @__PURE__ */ new Map();
	/**
	* The width of the indentation for log messages.
	*/
	static indentWidth = 5;
	/**
	* Checks if debug mode is enabled.
	* @returns A boolean indicating if debug mode is enabled.
	*/
	static isDebug() {
		return core.isDebug() || notEmpty(process.env.DEBUG) && process.env.DEBUG === "true";
	}
	/**
	* The name of the task.
	*/
	name;
	/**
	* Creates a new instance of the LogTask class.
	* @param name - The name of the task.
	*/
	constructor(name) {
		this.name = name?.trim();
	}
	/**
	* Gets the ingroup setting for the task.
	*/
	get ingroup() {
		return LogTask.ingroupSettings.get(this.name) ?? false;
	}
	/**
	* Sets the ingroup setting for this task.
	*/
	set ingroup(value) {
		LogTask.ingroupSettings.set(this.name, value);
	}
	getMessageString(step, desc, emojiStr) {
		let msg;
		if (this.ingroup) msg = `${" ".repeat(LogTask.indentWidth)}   ${emojiStr}: ${this.name} > ${desc}`;
		else msg = `[${step.padEnd(LogTask.indentWidth, " ")}][${this.name.padEnd(11, " ")}] ${emojiStr}: ${desc}`;
		return highlightStep(step, msg);
	}
	/**
	* Logs a step with the given emoji, type, message and group.
	* @param emojiStr - The emoji string to display.
	* @param step - The step type.
	* @param message - The message of the step.
	* @param startGroup - The start group type.
	*/
	logStep(emojiStr, step, message, startGroup = 0) {
		if (step.length > LogTask.indentWidth) LogTask.indentWidth = step.length;
		const { desc } = highlightMessage(step, message);
		handleOutput(startGroup, this.getMessageString(step, desc, emojiStr), message);
	}
	/**
	* Logs a debug message.
	* @param message - The message of the debug message.
	*/
	debug(message = "") {
		if (LogTask.isDebug() && message !== "") this.logStep("🐞", "DEBUG", message);
	}
	/**
	* Logs a start message.
	* @param message - The message of the start message.
	*/
	start(message = "") {
		const desc = message === "" ? `Starting ${this.name}...` : message;
		this.logStep("🚀", "START", desc, 1);
	}
	/**
	* Logs an info message.
	* @param message - The message of the info message.
	*/
	info(message = "") {
		this.logStep("✨", "INFO", message);
	}
	/**
	* Logs a warning message.
	* @param message - The message of the warning message.
	*/
	warn(message = "") {
		this.logStep("⚠️", "WARN", message);
	}
	/**
	* Logs a success message.
	* @param message - The message of the success message.
	* @param ingroup - Indicates whether the success message is in a group.
	*/
	success(message = "", ingroup = true) {
		const desc = message === "" ? `Completed ${this.name}.` : message;
		if (ingroup) {
			this.ingroup = false;
			if (process.env.GITHUB_ACTIONS) core.endGroup();
		}
		this.logStep("✅", "SUCCESS", desc);
	}
	/**
	* Logs a failure message.
	* @param message - The message of the failure message.
	* @param ingroup - Indicates whether the failure message is in a group.
	*/
	fail(message = "", ingroup = true) {
		const desc = message === "" ? `Failed ${this.name}.` : message;
		if (ingroup) {
			this.ingroup = false;
			if (process.env.GITHUB_ACTIONS) core.endGroup();
		}
		const msgtype = process.env.GITHUB_ACTIONS ? 4 : 3;
		this.logStep("❌", "FAILURE", desc, msgtype);
	}
	/**
	* Logs an error message.
	* @param message - The message of the error message.
	*/
	error(message = "") {
		this.logStep("🔴", "ERROR", message, 3);
	}
	/**
	* Logs a title message.
	* @param message - The message of the title message.
	*/
	title(message = "") {
		this.logStep("📓", "#####", message, 5);
	}
};
//#endregion
//#region src/Action.ts
/**
* This class represents the metadata of a GitHub action defined in the action.yml file.
* It provides properties and methods for accessing and manipulating the metadata.
* [Further reading on the metadata can be found here](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs)
*/
/**
* Parses and represents metadata from action.yml.
*/
var Action = class Action {
	static validate(obj) {
		if (typeof obj !== "object" || obj === null) return false;
		const record = obj;
		if ("name" in record && "description" in record && "runs" in record) {
			const runs = record.runs;
			if (runs && "using" in runs) return typeof record.name === "string" && typeof record.description === "string" && typeof runs.using === "string";
		}
		return false;
	}
	log;
	/** Name of the action */
	name;
	author;
	/** Description of the action */
	description;
	/** Branding information */
	branding;
	/** Input definitions */
	inputs;
	/** Output definitions */
	outputs;
	/** How the action is run */
	runs;
	/** Path to the action */
	path;
	/** the original file content */
	rawYamlString = "";
	/**
	* Creates a new instance of the Action class by loading and parsing action.yml.
	*
	* @param actionPath The path to the action.yml file.
	*/
	constructor(actionPath, log) {
		this.log = log ?? new LogTask(actionPath);
		this.path = actionPath;
		let actionYaml;
		this.log.debug(`Constucting ${actionPath}`);
		try {
			actionYaml = this.loadActionFrom(actionPath);
		} catch (error) {
			throw new Error(`Failed to load ${actionPath}. ${String(error)}`);
		}
		this.log.debug(`Action YAML: ${JSON.stringify(actionYaml)}`);
		this.name = actionYaml.name;
		this.author = actionYaml.author;
		this.description = actionYaml.description;
		this.branding = {
			color: actionYaml.branding?.color ?? "blue",
			icon: actionYaml.branding?.icon ?? "activity"
		};
		this.inputs = actionYaml.inputs;
		this.outputs = actionYaml.outputs;
		this.runs = actionYaml.runs;
	}
	loadActionFrom(actionPath) {
		const actionDir = path$1.dirname(path$1.resolve(actionPath));
		this.log.debug(`Load ${actionPath} from ${actionDir}`);
		if (!fs.existsSync(actionPath)) throw new Error(`${actionPath} does not exist in ${actionDir}`);
		if (!fs.statSync(actionPath).isFile()) throw new Error(`${actionPath} is not a file type at ${actionDir}`);
		this.rawYamlString = fs.readFileSync(actionPath, "utf8");
		this.log.debug(`Parse ${actionPath} from ${actionDir}`);
		const actionObj = YAML.parse(this.rawYamlString);
		if (Action.validate(actionObj)) return actionObj;
		throw new Error(`Invalid action metadata syntax in ${actionPath}.`);
	}
	/**
	* Gets the value of an input.
	}
	
	/**
	* Gets the default value for an input.
	*
	* @param inputName The name of the input.
	* @returns The default value if defined,or undefined
	*/
	inputDefault(inputName) {
		if (this.inputs) return this.inputs[inputName]?.default ?? void 0;
	}
	/**
	* Stringifies the action back to YAML.
	*
	* @returns The YAML string for debugging.
	*/
	stringify() {
		try {
			return YAML.stringify(this);
		} catch (error) {
			this.log.error(`Failed to stringify Action. ${String(error)}`);
			return "";
		}
	}
};
//#endregion
//#region src/unicode-word-match.ts
const unicodeWordMatch = /(?:[\dA-Za-z\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF1E]|\uD838[\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A])\S*/g;
//#endregion
//#region src/helpers.ts
/**
* Returns the input value if it is not empty, otherwise returns undefined.
* @param value - The input value to check.
* @returns The input value if it is not empty, otherwise undefined.
*/
function undefinedOnEmpty(value) {
	if (!value || value === "") return;
	return value;
}
/**
* Converts the given text to title case.
* @param text - The text to convert.
* @returns The text converted to title case.
* @throws {TypeError} If the input is not a string.
*/
function titlecase(text) {
	if (!text) return;
	if (typeof text !== "string") throw new TypeError(`Invalid argument type provided to titlecase(): ${typeof text}`);
	return text.replaceAll(unicodeWordMatch, (txt) => txt[0] ? txt[0].toUpperCase() + txt.slice(1).toLowerCase() : txt);
}
function readFile(filename) {
	try {
		return readFileSync(filename, "utf8");
	} catch (error) {
		throw new Error(`Cannot read file ${filename}: ${String(error)}`);
	}
}
function repoObjFromRepoName(repository, log, from) {
	if (notEmpty(repository)) {
		const [owner, repo] = repository.split("/");
		if (owner && repo) {
			log.debug(`repoObjFromRepoName using ${from} and returns ${JSON.stringify({
				owner,
				repo
			})}`);
			return {
				owner,
				repo
			};
		}
	}
}
const remoteGitUrlPattern = /url\s*=\s*.*github\.com[/:](?<owner>[^/\s]+)\/(?<repo>[^\s]+)/;
/**
* Finds the repository information from the input, context, environment variables, or git configuration.
* @param inputRepo - The input repository string.
* @param context - The GitHub context object.
* @param baseDir - Optional base directory to look for .git/config (defaults to CWD).
* @returns The repository information (owner and repo) or null if not found.
*/
function repositoryFinder(inputRepo, context, baseDir) {
	const log = new LogTask("repositoryFinder");
	/**
	* Attempt to get git user and repo from input
	*/
	const repoObj = repoObjFromRepoName(inputRepo, log, "inputRepo");
	if (repoObj) return repoObj;
	/**
	* When baseDir is provided, prioritize .git/config from that directory
	* This is critical for external repos where GITHUB_REPOSITORY points to
	* the workflow repo, not the target repo being documented
	*/
	if (baseDir) try {
		const gitConfigPath = path$1.join(baseDir, ".git", "config");
		const fileContent = readFile(gitConfigPath);
		log.debug(`Reading git config from: ${gitConfigPath}`);
		const results = remoteGitUrlPattern.exec(fileContent);
		if (results?.groups?.owner && results?.groups?.repo) {
			const repo = results.groups.repo.replace(/\.git$/, "");
			log.debug(`repositoryFinder using '${gitConfigPath}' and returns ${JSON.stringify({
				owner: results.groups.owner,
				repo
			})}`);
			return {
				owner: results.groups.owner,
				repo
			};
		} else log.debug(`No remote URL found in ${gitConfigPath}`);
	} catch (error) {
		log.debug(`Couldn't read .git/config from baseDir ${baseDir}: ${String(error)}`);
	}
	/**
	* Attempt to get git user and repo from GitHub context,
	* which includes checking for GITHUB_REPOSITORY environment variable
	*/
	if (context) try {
		const result = { ...context.repo };
		if (result.owner && result.repo) {
			log.debug(`repositoryFinder using GitHub context and returns ${JSON.stringify(result)}`);
			return result;
		}
	} catch (error) {
		log.debug(`repositoryFinder using GitHub context gives error ${JSON.stringify(error)}`);
	}
	/**
	* Fallback: Try to parse GITHUB_REPOSITORY environment variable directly
	* This handles cases where the Context class doesn't pick up the value
	*/
	const githubRepo = process.env.GITHUB_REPOSITORY;
	if (githubRepo) {
		const repoFromEnv = repoObjFromRepoName(githubRepo, log, "GITHUB_REPOSITORY env");
		if (repoFromEnv) return repoFromEnv;
	}
	/**
	* Last resort: Attempt to get git user and repo from .git/config in CWD
	*/
	try {
		const fileContent = readFile(".git/config");
		log.debug("Reading git config from: .git/config");
		const results = remoteGitUrlPattern.exec(fileContent);
		if (results?.groups?.owner && results?.groups?.repo) {
			const repo = results.groups.repo.replace(/\.git$/, "");
			log.debug(`repositoryFinder using '.git/config' and returns ${JSON.stringify({
				owner: results.groups.owner,
				repo
			})}`);
			return {
				owner: results.groups.owner,
				repo
			};
		} else log.debug("No remote URL found in .git/config");
	} catch (error) {
		log.error(`Couldn't retrieve owner or repo in .git/config file: ${String(error)}`);
	}
	throw new Error("No owner or repo found");
}
/**
* Formats the given value as a column header.
* @param value - The value to format.
* @returns The formatted column header.
*/
function columnHeader(value) {
	if (!value) return "";
	let text = value.replaceAll(/\*\*(.*?)\*\*/g, "$1");
	text = text.replaceAll(/\*(.*?)\*/g, "$1");
	text = text.replaceAll(/~~(.*?)~~/g, "$1");
	const normalisedHeader = titlecase(text.trim());
	if (normalisedHeader) return `${normalisedHeader}`;
	return "";
}
/**
* Formats the given value as a row header in HTML.
*
* Removes formatting from the string and converts it to bold code style.
*
* @param value - The string to format as a header
* @returns The formatted row header string wrapped in bold and code tags
*/
function rowHeader(value) {
	if (!value) return "";
	let text = value;
	text = text.replaceAll(/\*\*(.*?)\*\*/g, "$1");
	text = text.replaceAll(/\*(.*?)\*/g, "$1");
	text = text.replaceAll(/~~(.*?)~~/g, "$1");
	text = text.trim();
	return `<b><code>${text}</code></b>`;
}
const versionTagPattern = /^v?\d+(?:\.\d+)*$/;
/**
* Picks the most specific tag out of several tags pointing at the same commit.
*
* A release typically carries both an exact tag (`v1.11.0`) and a floating
* major tag (`v1`) on the same commit, and `git describe --tags --abbrev=0`'s
* tie-break between tags at zero distance isn't guaranteed to prefer the
* exact one. Restrict to version-shaped tags first (an unrelated co-located
* tag with more dots, e.g. `z.release.2026.08`, must never outrank a real
* version tag), then sort by dot-separated segment count, then by length, so
* `v1.11.0` outranks `v1`.
*/
function mostSpecificTag(tags) {
	const versionTags = tags.filter((tag) => versionTagPattern.test(tag));
	const candidates = versionTags.length > 0 ? versionTags : tags;
	const specificity = (tag) => tag.replace(/^v/, "").split(".").length;
	return [...candidates].sort((a, b) => specificity(b) - specificity(a) || b.length - a.length)[0];
}
/**
* Gets the version from git tags.
*/
function getVersionFromGitTag(actionDir, log) {
	try {
		const nearestTag = execSync("git describe --tags --abbrev=0 2>/dev/null || git tag -l \"v*\" --sort=-v:refname | head -1", {
			cwd: actionDir,
			encoding: "utf8"
		}).trim();
		let gitVersion = nearestTag;
		if (nearestTag) {
			const tagsOnSameCommit = execFileSync("git", [
				"tag",
				"--points-at",
				nearestTag
			], {
				cwd: actionDir,
				encoding: "utf8"
			}).trim().split("\n").filter(Boolean);
			if (tagsOnSameCommit.length > 0) gitVersion = mostSpecificTag(tagsOnSameCommit);
		}
		if (gitVersion) {
			const version = gitVersion.replace(/^v/, "");
			log.debug(`version from git tags: ${version}`);
			return version;
		}
	} catch {
		log.debug(`Could not get version from git tags in ${actionDir}`);
	}
}
/**
* Gets the current git branch name.
*/
function getVersionFromGitBranch(actionDir, log) {
	try {
		const branch = execSync("git rev-parse --abbrev-ref HEAD", {
			cwd: actionDir,
			encoding: "utf8"
		}).trim();
		if (branch && branch !== "HEAD") {
			log.debug(`version from git branch: ${branch}`);
			return branch;
		}
	} catch {
		log.debug(`Could not get branch name in ${actionDir}`);
	}
}
/**
* Gets the current git commit SHA (short form).
*/
function getVersionFromGitSha(actionDir, log) {
	try {
		const sha = execSync("git rev-parse --short HEAD", {
			cwd: actionDir,
			encoding: "utf8"
		}).trim();
		if (sha) {
			log.debug(`version from git sha: ${sha}`);
			return sha;
		}
	} catch {
		log.debug(`Could not get commit SHA in ${actionDir}`);
	}
}
/**
* Gets the version from package.json.
*/
function getVersionFromPackageJson(actionDir, log) {
	const packageJsonPath = path$1.join(actionDir, "package.json");
	log.debug(`Looking for package.json at: ${packageJsonPath}`);
	try {
		accessSync(packageJsonPath);
		const version = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;
		log.debug(`version from package.json: ${version ?? "not found"}`);
		return version;
	} catch {
		log.debug(`package.json not found at ${packageJsonPath}`);
	}
}
function getCurrentVersionString(inputs) {
	let versionString = "";
	const log = new LogTask("getCurrentVersionString");
	const versioningEnabled = inputs.config.get("versioning:enabled");
	if (versioningEnabled === void 0 || versioningEnabled === true || versioningEnabled === "true") {
		log.debug("version string in generated example is enabled");
		const override = inputs.config.get("versioning:override");
		const versionSource = inputs.config.get("versioning:source") ?? "git-tag";
		const actionDir = path$1.dirname(inputs.action.path);
		log.debug(`version source: ${versionSource}`);
		let detectedVersion;
		if (versionSource === "explicit") if (override && override.length > 0) {
			detectedVersion = override;
			log.debug(`using explicit version override: ${detectedVersion}`);
		} else {
			log.debug("explicit mode but no version_override set, falling back to 0.0.0");
			detectedVersion = "0.0.0";
		}
		else {
			switch (versionSource) {
				case "git-branch":
					detectedVersion = getVersionFromGitBranch(actionDir, log);
					break;
				case "git-sha":
					detectedVersion = getVersionFromGitSha(actionDir, log);
					break;
				case "package-json":
					detectedVersion = getVersionFromPackageJson(actionDir, log);
					break;
				default:
					detectedVersion = getVersionFromGitTag(actionDir, log);
					if (!detectedVersion) detectedVersion = getVersionFromPackageJson(actionDir, log);
					if (!detectedVersion) {
						detectedVersion = process.env.npm_package_version;
						log.debug(`Falling back to env:npm_package_version: ${detectedVersion ?? "not found"}`);
					}
			}
			if (override && override.length > 0) {
				detectedVersion = override;
				log.debug(`using version override: ${detectedVersion}`);
			}
		}
		versionString = detectedVersion ?? "0.0.0";
		const prefix = inputs.config.get("versioning:prefix") ?? "v";
		if (versionSource !== "git-branch" && versionSource !== "git-sha" && versionString && !versionString.startsWith(prefix)) versionString = `${prefix}${versionString}`;
	} else versionString = undefinedOnEmpty(inputs.config.get("versioning:branch")) ?? "main";
	log.debug(`version to use in generated example is ${versionString}`);
	return versionString;
}
function indexOfRegex(str, providedRegex) {
	const regex = providedRegex.global ? providedRegex : new RegExp(providedRegex.source, `${providedRegex.flags}g`);
	let index = -1;
	let match = regex.exec(str);
	while (match) {
		index = match.index;
		match = regex.exec(str);
	}
	return index;
}
function lastIndexOfRegex(str, providedRegex) {
	const regex = providedRegex.global ? providedRegex : new RegExp(providedRegex.source, `${providedRegex.flags}g`);
	let index = -1;
	let match = regex.exec(str);
	while (match) {
		index = match.index + match[0].length;
		match = regex.exec(str);
	}
	return index;
}
//#endregion
//#region src/prettier.ts
/**
* This TypeScript code exports three functions: `formatYaml`, `formatMarkdown`, and `wrapDescription`.
*
* - `formatYaml` takes a YAML string and an optional filepath as parameters and uses the `prettier` library to format the YAML code. It returns the formatted YAML string.
* - `formatMarkdown` takes a Markdown string and an optional filepath as parameters and uses the `prettier` library to format the Markdown code. It returns the formatted Markdown string.
* - `wrapDescription` takes a string value, an array of content, and an optional prefix as parameters. It wraps the description text with the specified prefix and formats it using `prettier`. It returns the updated content array with the formatted description lines.
*
* The code utilizes the `prettier` library for code formatting and the `LogTask` class for logging purposes.
*/
const log$1 = new LogTask("prettier");
/**
* Formats a Markdown string using `prettier`.
* @param {string} value - The Markdown string to format.
* @param {string} [filepath] - The optional filepath.
* @returns {Promise<string>} A promise that resolves with the formatted Markdown string.
*/
async function formatMarkdown(value, filepath) {
	return await format(value, {
		semi: false,
		parser: "markdown",
		embeddedLanguageFormatting: "auto",
		...filepath ? { filepath } : {}
	});
}
/**
* Wraps a description text with a prefix and formats it using `prettier`.
* @param {string | undefined} value - The description text to wrap and format.
* @param {string[]} content - The array of content to update.
* @param {string} [prefix='    # '] - The optional prefix to wrap the description lines.
* @returns {Promise<string[]>} A promise that resolves with the updated content array.
*/
async function wrapDescription(value, content, prefix = "    # ") {
	if (!value) return content ?? [];
	let formattedString = "";
	try {
		formattedString = await format(value, {
			semi: false,
			parser: "markdown",
			proseWrap: "always"
		});
	} catch (error) {
		log$1.error(`${String(error)}`);
	}
	content.push(...formattedString.split("\n").map((line) => prefix + line.replace(prefix, "")));
	return content;
}
//#endregion
//#region src/readme-editor.ts
/**
* This TypeScript code imports the necessary modules and defines a class named `ReadmeEditor`.
* The class represents an editor for modifying a README file.
* It has methods to update specific sections within the file and dump the modified content back to the file.
*/
/**
* The format for the start token of a section.
*/
const startTokenFormat = "(^|[^`\\\\])<!--\\s+start\\s+%s\\s+-->";
/**
* The format for the end token of a section.
*/
const endTokenFormat = "(^|[^`\\\\])<!--\\s+end\\s+%s\\s+-->";
var ReadmeEditor = class {
	log = new LogTask("ReadmeEditor");
	/**
	* The path to the README file.
	*/
	filePath;
	fileContent;
	/**
	* Creates a new instance of `ReadmeEditor`.
	* @param {string} filePath - The path to the README file.
	*/
	constructor(filePath) {
		this.filePath = filePath;
		try {
			fs.accessSync(filePath);
			this.fileContent = fs.readFileSync(filePath, "utf8");
			if (process.env.GITHUB_ACTIONS) core.setOutput("readme_before", this.fileContent);
		} catch (error) {
			this.log.fail(`Readme at '${filePath}' does not exist.`);
			throw error;
		}
	}
	/**
	* Gets the current README content.
	* @returns {string} - The README file content.
	*/
	getReadmeContent() {
		return this.fileContent;
	}
	/**
	* Gets the indexes of the start and end tokens for a given section.
	* @param {string} token - The section token.
	* @returns {number[]} - The indexes of the start and end tokens.
	*/
	getTokenIndexes(token, logTask) {
		const log = logTask ?? new LogTask("getTokenIndexes");
		const startRegExp = new RegExp(startTokenFormat.replace("%s", token));
		const stopRegExp = new RegExp(endTokenFormat.replace("%s", token));
		const startIndex = lastIndexOfRegex(this.fileContent, startRegExp);
		if (startIndex === -1) {
			log.debug(`No start token found for section '${token}'. Skipping`);
			return [];
		}
		const stopIndex = indexOfRegex(this.fileContent, stopRegExp);
		if (stopIndex === -1) {
			log.debug(`No start or end token found for section '${token}'. Skipping`);
			return [];
		}
		return [startIndex, stopIndex];
	}
	/**
	* Updates a specific section in the README file with the provided content.
	* @param {string} name - The name of the section.
	* @param {string | string[]} providedContent - The content to update the section with.
	* @param {boolean} addNewlines - Whether to add newlines before and after the content.
	*/
	updateSection(name, providedContent, addNewlines = true) {
		const log = new LogTask(name);
		const content = (Array.isArray(providedContent) ? providedContent.join(EOL) : providedContent ?? "").trim();
		log.info(`Looking for the ${name} token in ${this.filePath}`);
		const [startIndex, stopIndex] = this.getTokenIndexes(name, log);
		if (startIndex && stopIndex) {
			const beforeContent = this.fileContent.slice(0, startIndex);
			const afterContent = this.fileContent.slice(stopIndex);
			this.fileContent = addNewlines ? `${beforeContent}\n\n${content}\n${afterContent}` : `${beforeContent}${content}${afterContent}`;
		}
	}
	/**
	* Dumps the modified content back to the README file.
	* @returns {Promise<void>}
	*/
	async dumpToFile() {
		const content = await formatMarkdown(this.fileContent);
		if (process.env.GITHUB_ACTIONS) core.setOutput("readme_after", content);
		return fs.promises.writeFile(this.filePath, content, "utf8");
	}
};
//#endregion
//#region src/inputs.ts
/**
* This class handles input configuration and manipulation.
* It imports various modules and packages for file operations, configuration parsing, and logging.
* The class has methods for initializing the input configuration, setting default values, and converting the configuration to a string.
* It also has properties for storing the configuration values, sections, readme path, action instance, and readme editor instance.
*/
const Context = context.constructor;
/**
* Represents the command line argument options for the application.
*/
const argvOptions = {};
/**
* Save option configuration.
* @property {string} alias - Alias for the save option.
* @property {string} describe - Description for the save option.
* @property {boolean} parseValues - Specifies whether to parse values for the save option.
* @property {string} type - Type of the save option.
*/
argvOptions["save"] = {
	alias: "save",
	describe: `Save this config to ${configFileName}`,
	parseValues: true,
	type: "boolean"
};
/**
* Paths action option configuration.
* @property {string | string[]} alias - Alias(es) for the pathsAction option.
* @property {string} type - Type of the pathsAction option.
* @property {string} describe - Description for the pathsAction option.
*/
argvOptions["paths:action"] = {
	alias: ["pathsAction", "action"],
	type: "string",
	describe: "Path to the action.yml"
};
/**
* Paths readme option configuration.
* @property {string | string[]} alias - Alias(es) for the pathsReadme option.
* @property {string} type - Type of the pathsReadme option.
* @property {string} describe - Description for the pathsReadme option.
*/
argvOptions["paths:readme"] = {
	alias: ["pathsReadme", "readme"],
	type: "string",
	describe: "Path to the README file"
};
/**
* Branding SVG path option configuration.
* @property {string} alias - Alias for the svg option.
* @property {string} type - Type of the svg option.
* @property {string} describe - Description for the svg option.
*/
argvOptions["branding_svg_path"] = {
	alias: "svg",
	type: "string",
	describe: "Save and load the branding svg image in the README from this path"
};
/**
* Branding as title prefix option configuration.
* @property {string} alias - Alias for the branding_prefix option.
* @property {string} type - Type of the branding_prefix option.
* @property {boolean} parseValues - Specifies whether to parse values for the branding_prefix option.
* @property {string} describe - Description for the branding_prefix option.
*/
argvOptions["branding_as_title_prefix"] = {
	alias: "branding_prefix",
	type: "boolean",
	parseValues: true,
	describe: "Use the branding svg as a prefix for the README title"
};
/**
* Owner option configuration.
* @property {string} alias - Alias for the owner option.
* @property {string} type - Type of the owner option.
* @property {string} describe - Description for the owner option.
*/
argvOptions["owner"] = {
	alias: "owner",
	type: "string",
	describe: "The GitHub Action repository owner. i.e: `bitflight-devops`"
};
/**
* Repo option configuration.
* @property {string} alias - Alias for the repo option.
* @property {string} type - Type of the repo option.
* @property {string} describe - Description for the repo option.
*/
argvOptions["repo"] = {
	alias: "repo",
	type: "string",
	describe: "The GitHub Action repository name. i.e: `github-action-readme-generator`"
};
/**
* Prettier option configuration.
* @property {string | string[]} alias - Alias(es) for the prettier option.
* @property {string} type - Type of the prettier option.
* @property {boolean} parseValues - Specifies whether to parse values for the prettier option.
* @property {string} describe - Description for the prettier option.
*/
argvOptions["prettier"] = {
	alias: ["pretty", "prettier"],
	type: "boolean",
	parseValues: true,
	describe: "Format the markdown using prettier formatter"
};
/**
* Versioning enabled option configuration.
* @property {string | string[]} alias - Alias(es) for the versioning_enabled option.
* @property {string} describe - Description for the versioning_enabled option.
* @property {boolean} parseValues - Specifies whether to parse values for the versioning_enabled option.
* @property {string} type - Type of the versioning_enabled option.
*/
argvOptions["versioning:enabled"] = {
	alias: ["versioning", "versioning_enabled"],
	describe: "Enable the update of the usage version to match the latest version in the package.json file",
	parseValues: true,
	type: "boolean"
};
/**
* Versioning override option configuration.
* @property {string | string[]} alias - Alias(es) for the versioning_override option.
* @property {string} describe - Description for the versioning_override option.
* @property {boolean} parseValues - Specifies whether to parse values for the versioning_override option.
*/
argvOptions["versioning:override"] = {
	alias: [
		"setversion",
		"versioning_override",
		"version_override"
	],
	describe: "Set a specific version to display in the README.md",
	parseValues: true
};
/**
* Versioning prefix option configuration.
* @property {string | string[]} alias - Alias(es) for the version_prefix option.
* @property {string} describe - Description for the version_prefix option.
* @property {boolean} parseValues - Specifies whether to parse values for the version_prefix option.
*/
argvOptions["versioning:prefix"] = {
	alias: ["vp", "version_prefix"],
	describe: "Prefix the version with this value (if it isn't already prefixed)",
	parseValues: true
};
/**
* Versioning branch option configuration.
* @property {string | string[]} alias - Alias(es) for the versioning_default_branch option.
* @property {string} describe - Description for the versioning_default_branch option.
* @property {boolean} parseValues - Specifies whether to parse values for the versioning_default_branch option.
*/
argvOptions["versioning:branch"] = {
	alias: ["branch", "versioning_default_branch"],
	describe: "If versioning is disabled show this branch instead",
	parseValues: true
};
/**
* Versioning source option configuration.
* @property {string | string[]} alias - Alias(es) for the version_source option.
* @property {string} describe - Description for the version_source option.
* @property {boolean} parseValues - Specifies whether to parse values for the version_source option.
* @property {string} type - Type of the version_source option.
*/
argvOptions["versioning:source"] = {
	alias: [
		"version-source",
		"version_source",
		"versioning_source"
	],
	describe: "How to detect the action version (git-tag, git-branch, git-sha, package-json, explicit)",
	parseValues: true,
	type: "string"
};
/**
* Include GitHub version badge option configuration.
* @property {string | string[]} alias - Alias(es) for the include_github_version_badge option.
* @property {string} describe - Description for the include_github_version_badge option.
* @property {boolean} parseValues - Specifies whether to parse values for the include_github_version_badge option.
* @property {string} type - Type of the include_github_version_badge option.
*/
argvOptions["versioning:badge"] = {
	alias: [
		"version-badge",
		"versioning_badge",
		"include_github_version_badge"
	],
	describe: "Display the current version as a badge",
	parseValues: true,
	type: "boolean"
};
/**
* Title prefix option configuration.
* @property {string | string[]} alias - Alias(es) for the title_prefix option.
* @property {string} describe - Description for the title_prefix option.
* @property {boolean} parseValues - Specifies whether to parse values for the title_prefix option.
*/
argvOptions["title_prefix"] = {
	alias: ["prefix", "title_prefix"],
	describe: "Add a prefix to the README title",
	parseValues: true
};
/**
* Debug Nconf option configuration.
* @property {string} describe - Description for the debugNconf option.
* @property {boolean} parseValues - Specifies whether to parse values for the debugNconf option.
* @property {string} type - Type of the debugNconf option.
*/
argvOptions["debug:nconf"] = {
	alias: ["debug_nconf"],
	describe: "Print out the resolved nconf object with all values",
	parseValues: true,
	type: "boolean"
};
/**
* Debug Config option configuration.
* @property {string} describe - Description for the debugConfig option.
* @property {boolean} parseValues - Specifies whether to parse values for the debugConfig option.
* @property {string} type - Type of the debugConfig option.
*/
argvOptions["debug:config"] = {
	alias: ["debug_config"],
	describe: "Print out the resolved nconf object with all values",
	parseValues: true,
	type: "boolean"
};
/**
* README sections option configuration.
* Declaring this as an array keeps a single `--sections=usage` value consistent
* with the array shape used by `.ghadocs.json` and repeated CLI arguments.
*/
argvOptions.sections = {
	alias: "sections",
	describe: "Only generate the named README section (repeat for multiple sections)",
	type: "array"
};
/**
* Configuration inputs from the github action don't
* all match the input names when running on cli.
* This maps the action inputs to the cli.
*/
const ConfigKeysInputsMap = {
	save: "save",
	action: "paths:action",
	readme: "paths:readme",
	branding_svg_path: "branding_svg_path",
	branding_as_title_prefix: "branding_as_title_prefix",
	versioning_enabled: "versioning:enabled",
	version_prefix: "versioning:prefix",
	versioning_default_branch: "versioning:branch",
	version_override: "versioning:override",
	version_source: "versioning:source",
	include_github_version_badge: "versioning:badge",
	owner: "owner",
	repo: "repo",
	title_prefix: "title_prefix",
	pretty: "prettier"
};
function transformGitHubInputsToArgv(log, _config, obj) {
	/** The obj.key is always in lowercase, but it checks for it without case sensitivity */
	if (/^(INPUT|input)_[A-Z_a-z]\w*$/.test(obj.key)) {
		log.debug(`Parsing input: ${obj.key} with ith value: ${obj.value}`);
		const keyParsed = obj.key.replace(/^(INPUT|input)_/, "").toLocaleLowerCase();
		const key = ConfigKeysInputsMap[keyParsed] || keyParsed;
		if ((key === "owner" || key === "repo") && (!obj.value || obj.value === "")) {
			log.debug(`Ignoring empty ${key} input to allow auto-detection`);
			return;
		}
		log.debug(`New input is ${key} with the value ${obj.value}`);
		return {
			key,
			value: obj.value
		};
	}
	log.debug(`Ignoring input: ${obj.key} with ith value: ${obj.value}`);
}
/**
* Sets config value from action file default
*
* @param {Action} actionInstance - The action instance
* @param {string} inputName - The input name
* @returns {string | boolean | undefined} The default value
*/
function setConfigValueFromActionFileDefault(log, actionInstance, inputName) {
	if (ConfigKeysInputsMap[inputName] === void 0) {
		log.error(`${inputName} from ${actionInstance.path} does not match a known input. Known inputs are: ${Object.keys(ConfigKeysInputsMap).join(", ")}`);
		return;
	}
	const configName = ConfigKeysInputsMap[inputName];
	const defaultValue = actionInstance.inputDefault(inputName);
	log.debug(`Default Value for action.yml: ${inputName} CLI: ${configName} = ${defaultValue}`);
	return defaultValue;
}
/**
* Collects all default values from action file
*
* @returns {IOptions} The default values object
*/
function collectAllDefaultValuesFromAction(log, providedMetaActionPath, providedDefaults = {}) {
	log.debug("Collecting default values from action.yml");
	const thisActionPath = path$1.join(import.meta.dirname, providedMetaActionPath ?? "../../action.yml");
	try {
		const defaultValues = {};
		const thisAction = new Action(thisActionPath);
		const defaults = {
			...thisAction.inputs,
			...providedDefaults
		};
		if (defaults) for (const key of Object.keys(defaults)) {
			const mappedKey = ConfigKeysInputsMap[key] ?? key;
			defaultValues[mappedKey] = setConfigValueFromActionFileDefault(log, thisAction, key);
		}
		log.debug(JSON.stringify(defaultValues, null, 2));
		return defaultValues;
	} catch (error) {
		log.debug(`Could not load defaults from this tool's action.yml at ${thisActionPath}: ${String(error)}`);
		log.debug("Continuing without default values from action.yml");
		return {};
	}
}
/**
* Loads the configuration
*
* @returns {ProviderInstance} The configuration instance
*/
function loadConfig(log, providedConfig, configFilePath) {
	log.debug("Loading config from env and argv");
	const config = providedConfig ?? new Provider();
	if (process.env.GITHUB_ACTION === "true") log.info("Running in GitHub action");
	if (configFilePath) if (fs.existsSync(configFilePath)) {
		log.info(`Config file found: ${configFilePath}`);
		config.file(configFilePath);
	} else log.debug(`Config file not found: ${configFilePath}`);
	config.env({
		lowerCase: true,
		parseValues: true,
		transform: (obj) => {
			return transformGitHubInputsToArgv(log, config, obj);
		}
	}).argv(argvOptions);
	return config;
}
/**
* Loads the default configuration
*
* @param {ProviderInstance} config - The config instance
* @returns {ProviderInstance} The updated config instance
*/
function loadDefaultConfig(log, config, providedContext) {
	log.debug("Loading default config");
	const defaultValues = collectAllDefaultValuesFromAction(log);
	const context = providedContext ?? new Context();
	const ownerFromConfig = config.get("owner");
	const repoFromConfig = config.get("repo");
	const ownerInput = ownerFromConfig ?? process.env.INPUT_OWNER ?? "";
	const repoInput = repoFromConfig ?? process.env.INPUT_REPO ?? "";
	const actionPath = config.get("paths:action");
	const actionDir = actionPath ? path$1.dirname(path$1.resolve(actionPath)) : void 0;
	log.debug(`Action directory for repository detection: ${actionDir ?? "not specified"}`);
	const repositoryDetail = repositoryFinder(`${ownerInput}/${repoInput}`, context, actionDir);
	log.debug(`repositoryDetail: ${JSON.stringify(repositoryDetail)}`);
	return config.defaults({
		...defaultValues,
		owner: repositoryDetail?.owner,
		repo: repositoryDetail?.repo,
		sections: [...README_SECTIONS]
	});
}
/**
* Represents the required inputs for the action.
*/
const RequiredInputs = [
	"paths:action",
	"paths:readme",
	"owner",
	"repo"
];
/**
* Loads the required configuration
*
* @param {ProviderInstance} config - The config instance
* @returns {ProviderInstance} The updated config instance
*/
function loadRequiredConfig(log, config, requiredInputs = RequiredInputs) {
	log.debug("Loading required config");
	return config.required([...requiredInputs]);
}
/**
*
*/
function loadAction(log, actionPath) {
	log.debug(`Loading action from: ${actionPath}`);
	if (actionPath) return new Action(path$1.resolve(actionPath));
	throw new Error(`Action path not found: ${actionPath}`);
}
/**
* Main Inputs class that handles configuration
*/
var Inputs = class {
	/**
	* The configuration instance
	*/
	config;
	/**
	* The readme sections
	*/
	sections;
	/**
	* The readme file path
	*/
	readmePath;
	/**
	* The config file path
	*/
	configPath;
	/**
	* The action instance
	*/
	action;
	/**
	* The readme editor instance
	*/
	readmeEditor;
	/**
	* The repository owner
	*/
	owner;
	/**
	* The repository name
	*/
	repo;
	/** The logger for this instance */
	log;
	/**
	* Initializes a new instance of the Inputs class.
	*/
	constructor(providedInputContext = {}, log = new LogTask("inputs")) {
		this.log = log ?? new LogTask("inputs");
		this.log.debug("Initializing Inputs");
		const inputContext = providedInputContext ?? {};
		this.configPath = inputContext.configPath ?? path$1.resolve(".ghadocs.json");
		this.config = inputContext.config ?? new Provider();
		loadConfig(log, this.config, this.configPath);
		loadDefaultConfig(log, this.config);
		loadRequiredConfig(log, this.config);
		this.action = inputContext.action ?? loadAction(log, this.config.get("paths:action"));
		this.config.set("sections", inputContext.sections ?? this.config.get("sections"));
		this.sections = this.config.get("sections");
		this.readmePath = inputContext.readmePath ?? path$1.resolve(this.config.get("paths:readme"));
		this.readmeEditor = inputContext.readmeEditor ?? new ReadmeEditor(this.readmePath);
		/**
		* Output the readme path that is being parsed
		*/
		if (process.env.GITHUB_ACTIONS) core.setOutput("readme", this.readmePath);
		/**
		* owner is required, and if it doesn't exist it is handled by nconf which throws an error
		*/
		this.owner = inputContext.owner ?? this.config.get("owner");
		/**
		* repo is required, and if it doesn't exist it is handled by nconf which throws an error
		*/
		this.repo = inputContext.repo ?? this.config.get("repo");
	}
	stringify() {
		if (this?.config) try {
			return YAML.stringify(this.config.get());
		} catch (error) {
			this.log.error(`${String(error)}`);
		}
		return "";
	}
};
//#endregion
//#region src/sections/update-badges.ts
/**
* Generate GitHub badges.
* @returns {IBadge[]} - The array of GitHub badges.
*/
function githubBadges(owner, repo) {
	const repoUrl = `https://github.com/${owner}/${repo}`;
	return [
		{
			img: `https://img.shields.io/github/v/release/${owner}/${repo}?display_name=tag&sort=semver&logo=github&style=flat-square`,
			alt: "Release by tag",
			url: `${repoUrl}/releases/latest`
		},
		{
			img: `https://img.shields.io/github/release-date/${owner}/${repo}?display_name=tag&sort=semver&logo=github&style=flat-square`,
			alt: "Release by date",
			url: `${repoUrl}/releases/latest`
		},
		{
			img: `https://img.shields.io/github/last-commit/${owner}/${repo}?logo=github&style=flat-square`,
			alt: "Commit"
		},
		{
			img: `https://img.shields.io/github/issues/${owner}/${repo}?logo=github&style=flat-square`,
			alt: "Open Issues",
			url: `${repoUrl}/issues`
		},
		{
			img: `https://img.shields.io/github/downloads/${owner}/${repo}/total?logo=github&style=flat-square`,
			alt: "Downloads"
		}
	];
}
/**
* Generates a badge HTML markup.
* @param {IBadge} item - The badge object.
* @returns {string} - The HTML markup for the badge.
*/
function generateBadge(item, log) {
	const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
	const badgeTemplate = `<img src="${escapeAttribute(item.img)}" alt="${escapeAttribute(item.alt)}" />`;
	log.info(`Generating badge ${item.alt}`);
	if (item.url) return `<a href="${escapeAttribute(item.url)}">${badgeTemplate}</a>`;
	return badgeTemplate;
}
/**
* Generates all badges HTML markup.
* @param {IBadge} badges - The array of badge objects
* @param log - A LogTask instance
* @returns {string[]} - The array of HTML markup for all badges.
*/
function generateBadges(badges, log) {
	const badgeArray = [];
	for (const b of badges) badgeArray.push(generateBadge(b, log));
	log.debug(`Total badges: ${badgeArray.length}`);
	return badgeArray;
}
function updateBadges(sectionToken, inputs) {
	const log = new LogTask(sectionToken);
	const config = inputs.config.get();
	const enableVersioning = config ? config.versioning?.badge : false;
	log.info(`Versioning badge: ${enableVersioning}`);
	log.start();
	let content = "";
	if (enableVersioning) {
		content = generateBadges(githubBadges(inputs.owner, inputs.repo), log).join("");
		inputs.readmeEditor.updateSection(sectionToken, content);
	}
	log.success();
	const ret = {};
	ret[sectionToken] = content;
	return ret;
}
//#endregion
//#region src/svg-editor.mts
/**
* This TypeScript code imports necessary modules and defines a class named 'SVGEditor' for generating SVG images.
* The class has methods for initializing the SVG window, generating SVG content, and writing SVG files.
* It utilizes various packages such as 'fs', 'path', '@svgdotjs/svg.js', 'feather-icons', and 'svgdom' for SVG manipulation and file operations.
* The class also defines interfaces for badges and brand colors.
*/
/**
* Utility class for generating SVG images.
*/
var SVGEditor = class {
	log;
	window;
	canvas;
	document;
	/**
	* Initializes a new SVGEditor instance.
	*/
	constructor() {
		this.log = new LogTask("SVGEditor");
	}
	/**
	* Initializes the SVG window, document, and canvas if not already set up.
	*/
	initSVG() {
		if (!this.window) {
			this.window = createSVGWindow();
			const { document } = this.window;
			registerWindow(this.window, document);
			if (!this.canvas) this.canvas = SVG(document.documentElement);
		}
	}
	/**
	* Generates a branded SVG image.
	* @param {string | undefined} svgPath - Path to write the generated SVG file to.
	* @param {string} icon - Name of the icon to use (validated against FeatherIconNames below).
	* @param {string} bgcolor - Background color for the image (validated against BrandColors below).
	* @returns {void}
	*/
	generateSvgImage(svgPath, icon = DEFAULT_BRAND_ICON, bgcolor = DEFAULT_BRAND_COLOR) {
		if (!svgPath || svgPath.length === 0) {
			this.log.debug("No svgPath provided");
			return;
		}
		if (!isValidIcon(icon)) {
			this.log.error(`Valid Branding Icon Names: ${[...GITHUB_ACTIONS_BRANDING_ICONS].join(", ")}`);
			this.log.fail(`Invalid icon name: ${icon}`);
			return;
		}
		if (!isValidColor(bgcolor)) {
			this.log.error(`Valid Branding Colors: ${GITHUB_ACTIONS_BRANDING_COLORS.join(", ")}`);
			this.log.fail("Invalid branding color");
			return;
		}
		this.log.info(`SVG to generate ${icon} at ${svgPath} with color ${bgcolor}.`);
		this.initSVG();
		const svgContent = this.generateSVGContent(icon, bgcolor);
		this.writeSVGFile(svgPath, svgContent);
		this.log.debug("SVG image generated successfully");
	}
	/**
	* Writes the SVG xml to disk.
	* @param {string} svgPath - File path to save the SVG to.
	* @param {string} svgContent - The XML for the SVG file.
	*/
	writeSVGFile(svgPath, svgContent) {
		fs.mkdirSync(path$1.dirname(svgPath), { recursive: true });
		this.log.debug(`Writing SVG file to ${svgPath}`);
		fs.writeFile(svgPath, svgContent, "utf8", () => {
			return this.log.debug(`SVG image generated: ${svgPath}`);
		});
	}
	/**
	* Generates the SVG content for the branding image.
	* @param {FeatherIconNames} icon - Name of the icon to use.
	* @param {BrandColors} color - Background color for the image.
	* @param {number} outerViewBox - Size of the canvas for the image.
	* @returns {string} The generated SVG content.
	*/
	generateSVGContent(icon, color, outerViewBox = 100) {
		const { canvas, log } = this;
		if (!canvas) {
			log.fail("Canvas not initialized");
			return "";
		}
		const svgData = feather.icons[icon];
		log.debug(`SVG data to ingest: ${svgData.toSvg()}`);
		canvas.clear();
		canvas.size(50, 50).viewbox(`0 0 ${outerViewBox} ${outerViewBox}`).fill("none");
		const circleSize = outerViewBox / 2;
		canvas.circle("50%").fill(color).radius(circleSize).cx(circleSize).cy(circleSize).stroke({ width: 0 });
		const iconsvgOuter = canvas.nested();
		iconsvgOuter.attr("overflow", "visible").height("50%").width("50%").x("25%").y("25%");
		const iconsvg = iconsvgOuter.nested();
		iconsvg.id("icon").svg(svgData.contents);
		for (const attr of Object.keys(svgData.attrs)) iconsvg.attr(attr, svgData.attrs[attr]);
		iconsvg.stroke(color.startsWith("white") ? "white" : "black");
		iconsvg.attr("overflow", "visible");
		iconsvg.viewbox(iconsvg.bbox());
		iconsvg.height("auto").width("auto");
		return [
			"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>",
			canvas.svg(),
			"\n"
		].join("\n");
	}
};
//#endregion
//#region src/sections/update-branding.ts
/**
* Generates a svg branding image.
* example:
* ```ts
* generateSvgImage('/path/to/file.svg', 'home', 'red')
* ```
*
* @param svgPath - The path to where the svg file will be saved
* @param icon - The icon name from the feather-icons list
* @param bgcolor - The background color of the circle behind the icon
*/
function generateSvgImage(svgPath, icon, bgcolor) {
	new SVGEditor().generateSvgImage(svgPath, icon, bgcolor);
}
/**
* This function returns a valid icon name based on the provided branding.
* If the branding is undefined or not a valid icon name, an error is thrown.
* It checks if the branding icon is present in the GITHUB_ACTIONS_BRANDING_ICONS set,
* and if so, returns the corresponding feather icon key array.
* If the branding icon is present in the GITHUB_ACTIONS_OMITTED_ICONS set,
* an error is thrown specifying that the icon is part of the omitted icons list.
* If the branding icon is not a valid icon from the feather-icons list, an error is thrown.
* @param brand - The branding object
* @returns The corresponding feather icon key array
* @throws Error if the branding icon is undefined, not a valid icon name, or part of the omitted icons list
*/
function getValidIconName(icon) {
	if (!icon) throw new Error(`No valid branding icon name found: action.yml branding is undefined`);
	if (isValidIcon(icon)) return icon;
	if (GITHUB_ACTIONS_OMITTED_ICONS.has(icon)) throw new Error(`No valid branding icon name found: ${icon} is part of the list of omitted icons. `);
	throw new Error(`No valid branding icon name found: ${icon} is not a valid icon from the feather-icons list`);
}
/**
* This function returns a valid branding color based on the provided value.
* If the color is undefined or not one of the supported branding colors, an error is thrown.
* @param color - The branding color from action.yml
* @returns The corresponding validated brand color
* @throws Error if the color is undefined or not a valid branding color
*/
function getValidBrandColor(color) {
	if (!color) throw new Error(`No valid branding color found: action.yml branding is undefined`);
	if (isValidColor(color)) return color;
	throw new Error(`No valid branding color found: ${color} is not one of: ${GITHUB_ACTIONS_BRANDING_COLORS.join(", ")}`);
}
/**
* This function generates an HTML image markup with branding information.
* It takes inputs and an optional width parameter.
* If the branding_svg_path is provided, it generates an action.yml branding image for the specified icon and color.
* Otherwise, it returns an error message.
*
* @param inputs - The inputs instance with data for the function.
* @param width - The width of the image (default is '15%').
* @returns The HTML image markup with branding information or an error message.
*/
function generateImgMarkup(inputs, width = "15%") {
	const log = new LogTask("generateImgMarkup");
	if (!inputs.action.branding) {
		log.info("No branding section");
		return "";
	}
	const { icon, color } = inputs.action.branding;
	const iconName = getValidIconName(icon);
	const brandColor = getValidBrandColor(color);
	const svgPath = inputs.config.get("branding_svg_path");
	const result = `<img src="${svgPath}" width="${width}" align="center" alt="branding<icon:${iconName} color:${brandColor}>" />`;
	if (svgPath) {
		log.info(`Generating action.yml branding image for ${iconName}`);
		const svg = inputs.config.get("image_generated");
		const hash = `${iconName}${brandColor}`;
		if (!svg || hash.localeCompare(svg) !== 0 || !existsSync(svgPath)) {
			generateSvgImage(svgPath, iconName, brandColor);
			inputs.config.set("image_generated", hash);
		}
		return result;
	}
	log.error(`No branding_svg_path provided or it is empty string, can't create the file!`);
	return `<!-- ERROR: no branding path found = ${result} -->`;
}
/**
* This is a TypeScript function named "updateBranding" that takes in a sectionToken string and an object of inputs.
* It exports the function as the default export.
* The function logs the brand details from the inputs, starts a log task, generates image markup,
* updates a section in the readme editor using the sectionToken and content, and logs success or failure messages.
*
* @param sectionToken - The sectionToken string that is used to identify the section in the readme editor.
* @param inputs - The inputs object that contains data for the function.
*/
function updateBranding(sectionToken, inputs) {
	const log = new LogTask(sectionToken);
	log.info(`Brand details: ${JSON.stringify(inputs.action.branding)}`);
	log.start();
	const content = generateImgMarkup(inputs, "15%");
	inputs.readmeEditor.updateSection(sectionToken, content);
	if (content && content !== "") log.success("branding svg successfully created");
	else log.fail("branding svg failed to be created");
	const ret = {};
	ret[sectionToken] = content;
	return ret;
}
//#endregion
//#region src/sections/update-contents.ts
/**
* Converts a header text to a GitHub-compatible anchor link.
* @param {string} text - The header text to convert.
* @returns {string} The anchor link.
*/
function headerToAnchor(text) {
	return text.toLowerCase().replaceAll(/[^\w\s-]/g, "").replaceAll(/\s+/g, "-").replaceAll(/-+/g, "-").replaceAll(/^-|-$/g, "");
}
/**
* Extracts headers from markdown content, excluding those in code blocks.
* @param {string} content - The markdown content.
* @returns {Array<{level: number, text: string}>} Array of header objects.
*/
function extractHeaders(content) {
	const headers = [];
	const lines = content.split("\n");
	let inCodeBlock = false;
	for (const line of lines) {
		if (line.trim().startsWith("```")) {
			inCodeBlock = !inCodeBlock;
			continue;
		}
		if (inCodeBlock) continue;
		const headerMatch = /^(#{2,6})\s+(.+)$/.exec(line);
		if (headerMatch) {
			const level = headerMatch[1].length;
			let text = headerMatch[2].trim();
			text = text.replaceAll(/<img[^>]*>/g, "").trim();
			text = text.replaceAll(/\[([^\]]+)]\([^)]+\)/g, "$1");
			if (text) headers.push({
				level,
				text
			});
		}
	}
	return headers;
}
function updateContents(sectionToken, inputs) {
	const log = new LogTask(sectionToken);
	log.start();
	const content = [];
	const tocHeaders = extractHeaders(inputs.readmeEditor.getReadmeContent()).filter((h) => h.level >= 2 && !h.text.toLowerCase().includes("contents"));
	if (tocHeaders.length === 0) log.info("No headers found for table of contents");
	else {
		log.info(`Generating table of contents with ${tocHeaders.length} entries`);
		const minLevel = Math.min(...tocHeaders.map((h) => h.level));
		const anchorCounts = /* @__PURE__ */ new Map();
		content.push("## Table of Contents", "");
		for (const header of tocHeaders) {
			const indent = "  ".repeat(header.level - minLevel);
			const baseAnchor = headerToAnchor(header.text);
			const count = anchorCounts.get(baseAnchor) ?? 0;
			anchorCounts.set(baseAnchor, count + 1);
			const anchor = count === 0 ? baseAnchor : `${baseAnchor}-${count}`;
			content.push(`${indent}- [${header.text}](#${anchor})`);
		}
	}
	inputs.readmeEditor.updateSection(sectionToken, content);
	log.success();
	const ret = {};
	ret[sectionToken] = content.join("\n");
	return ret;
}
//#endregion
//#region src/sections/update-description.ts
function updateDescription(sectionToken, inputs) {
	const log = new LogTask(sectionToken);
	const content = [];
	if (inputs?.action?.description) {
		log.start();
		const desc = inputs.action.description.trim().replaceAll("\r\n", "\n").replaceAll(/ +/g, " ").replaceAll(" \n", "\n").replaceAll("\n\n", "<br />");
		log.info(`Writing ${desc.length} characters to the description section`);
		content.push(desc);
		inputs.readmeEditor.updateSection(sectionToken, content);
		log.success();
	}
	const ret = {};
	ret[sectionToken] = content.join("\n");
	return ret;
}
//#endregion
//#region src/markdowner/index.ts
/**
* Escapes special Markdown characters in a string.
*
* @param text - The text to escape.
* @returns The escaped text.
*/
function markdownEscapeTableCell(text) {
	return text.replaceAll("\n", "<br />").replaceAll("|", "\\|");
}
/**
* Escapes inline code blocks in a Markdown string.
*
* @param content - Markdown string.
* @returns String with escaped inline code blocks.
*/
function markdownEscapeInlineCode(content) {
	return content.replaceAll(/`([^`]*)`/g, "<code>$1</code>").replaceAll("><!--", ">\\<!--");
}
/**
* Clones a 2D array.
*
* @param arr - Array to clone.
* @returns Cloned array.
*/
function cloneArray(arr) {
	return arr.map((innerArr) => [...innerArr]);
}
/**
* Gets max and min column counts from 2D array.
*
* @param data - 2D string array.
* @returns Object with max and min cols.
*/
function getColumnCounts(data) {
	let maxCols = 0;
	let minCols = 0;
	for (const e of data) {
		const numCols = e.length;
		maxCols = Math.max(maxCols, numCols);
		minCols = minCols === 0 ? numCols : Math.min(minCols, numCols);
	}
	return {
		maxCols,
		minCols
	};
}
/**
* Pads 2D array rows to equal length.
*
* @param data - 2D array to pad.
* @param maxCols - Number of columns to pad to.
* @returns Padded 2D array.
*/
function padArrayRows(data, maxCols) {
	return data.map((row) => {
		const padding = Array.from({ length: maxCols - row.length }).fill("");
		return [...row, ...padding];
	});
}
/**
* Converts a 2D array of strings to a Markdown table.
*
* @param data - 2D string array.
* @returns Markdown table string.
*/
function ArrayOfArraysToMarkdownTable(providedTableContent) {
	const clonedData = cloneArray(providedTableContent);
	const { maxCols } = getColumnCounts(clonedData);
	const paddedData = padArrayRows(clonedData, maxCols);
	const markdownArrayRowsLength = paddedData.length + 1;
	const markdownArrayEntriesLength = maxCols * 2 + 1;
	const markdownArrays = Array.from({ length: markdownArrayRowsLength }, () => Array.from({ length: markdownArrayEntriesLength }, () => "|"));
	const outputStrings = [];
	let i = 0;
	for (const row of markdownArrays) {
		let col = 0;
		const dataRow = paddedData[i > 1 ? i - 1 : 0];
		for (let j = 0; j < row.length; j++) {
			let content = markdownEscapeTableCell(dataRow[col] ?? "");
			content = markdownEscapeInlineCode(content);
			if (j % 2 === 1) {
				if (i === 0) markdownArrays[i][j] = ` **${content.trim()}** `;
				else if (i === 1) markdownArrays[i][j] = "---";
				else markdownArrays[i][j] = ` ${content.trim()} `;
				col += 1;
			}
		}
		outputStrings.push(`${markdownArrays[i].join("")}\n`);
		i += 1;
	}
	return outputStrings.join("");
}
//#endregion
//#region src/sections/update-inputs.ts
function updateInputs(sectionToken, inputs) {
	const log = new LogTask(sectionToken);
	const content = [];
	const markdownArray = [];
	const titleArray = [
		"Input",
		"Description",
		"Default",
		"Required"
	];
	const titles = [];
	for (const t of titleArray) titles.push(columnHeader(t));
	markdownArray.push(titles);
	const vars = inputs.action.inputs;
	const tI = vars ? Object.keys(vars).length : 0;
	if (vars && tI > 0) {
		log.start();
		for (const key of Object.keys(vars)) {
			const values = vars[key];
			let description = values?.description ?? "";
			const matches = /(.*?)\n\n([Ss]*)/.exec(description);
			if (matches && matches.length >= 2) description = matches[1] || description;
			description = description.trim().replace("\n", "<br />");
			const row = [
				rowHeader(key),
				description,
				values?.default ? `<code>${values.default}</code>` : "",
				values?.required ? "**true**" : "__false__"
			];
			log.debug(JSON.stringify(row));
			markdownArray.push(row);
		}
		content.push(ArrayOfArraysToMarkdownTable(markdownArray));
		log.info(`Action has ${tI} total ${sectionToken}`);
		inputs.readmeEditor.updateSection(sectionToken, content);
		log.success();
	} else log.debug(`Action has no ${sectionToken}`);
	const ret = {};
	ret[sectionToken] = content.join("\n");
	return ret;
}
//#endregion
//#region src/sections/update-outputs.ts
function updateOutputs(sectionToken, inputs) {
	const log = new LogTask(sectionToken);
	const content = [];
	const markdownArray = [];
	const titleArray = [
		"Output",
		"Description",
		"Value"
	];
	const titles = [];
	for (const t of titleArray) titles.push(columnHeader(t));
	markdownArray.push(titles);
	const vars = inputs.action.outputs;
	const tI = vars ? Object.keys(vars).length : 0;
	if (vars && tI > 0) {
		log.start();
		for (const key of Object.keys(vars)) {
			const values = vars[key];
			let description = values?.description ?? "";
			const matches = /(.*?)\n\n([Ss]*)/.exec(description);
			if (matches && matches.length >= 2) description = matches[1] || description;
			description = description.trim().replace("\n", "<br />");
			const value = values?.value ? `\`${values.value}\`` : "";
			const row = [
				rowHeader(key),
				description,
				value
			];
			log.debug(JSON.stringify(row));
			markdownArray.push(row);
		}
		content.push(ArrayOfArraysToMarkdownTable(markdownArray));
		log.info(`Action has ${tI} total ${sectionToken}`);
		inputs.readmeEditor.updateSection(sectionToken, content);
		log.success();
	} else log.debug(`Action has no ${sectionToken}`);
	const ret = {};
	ret[sectionToken] = content.join("\n");
	return ret;
}
//#endregion
//#region src/sections/update-title.ts
function updateTitle(sectionToken, inputs) {
	const log = new LogTask(sectionToken);
	const content = [];
	let name = "";
	let svgInline = "";
	if (inputs.action.name) {
		log.start();
		name = inputs.action.name;
		if (inputs.config.get("branding_as_title_prefix")) svgInline = `${generateImgMarkup(inputs, "60px")} `;
		log.info(`Writing ${name.length} characters to the title`);
		const title = `# ${svgInline}${inputs.config.get("title_prefix")}${inputs.action.name}`;
		log.info(`Title: ${title}`);
		content.push(title);
		inputs.readmeEditor.updateSection(sectionToken, content, true);
		log.success();
	}
	const ret = {};
	ret[sectionToken] = content.join("\n");
	return ret;
}
//#endregion
//#region src/sections/update-usage.ts
async function updateUsage(sectionToken, inputs) {
	const log = new LogTask(sectionToken);
	log.start();
	const actionName = `${inputs.owner}/${inputs.repo}`;
	log.info(`Action name: ${actionName}`);
	const versionString = getCurrentVersionString(inputs);
	log.info(`Version string: ${versionString}`);
	const actionReference = `${actionName}@${versionString}`;
	const indent = "    # ";
	const content = [];
	content.push("```yaml", `- uses: ${actionReference}`, "  with:");
	const inp = inputs.action.inputs;
	let firstInput = true;
	const descriptionPromises = {};
	if (inp) {
		for (const key of Object.keys(inp)) {
			const input = inp[key];
			if (input !== void 0) descriptionPromises[key] = wrapDescription(`Description: ${input.description}`, [], indent);
		}
		const descriptions = {};
		const kvArray = await Promise.all(Object.keys(descriptionPromises).map(async (key) => {
			return {
				key,
				value: await descriptionPromises[key]
			};
		}));
		for (const e of kvArray) {
			descriptions[e.key] = e.value;
			log.debug(`${e.key}: ${descriptions[e.key].join("\n")}`);
		}
		for (const key of Object.keys(inp)) {
			const input = inp[key];
			if (input !== void 0) {
				if (!firstInput) content.push("");
				content.push(...descriptions[key]);
				if (input.default !== void 0) content.push(`${indent}Default: ${input.default}`);
				content.push(`    ${key}: ''`);
				firstInput = false;
			}
		}
	}
	content.push("```\n");
	inputs.readmeEditor.updateSection(sectionToken, content);
	log.success();
	const ret = {};
	ret[sectionToken] = content.join("\n");
	return ret;
}
//#endregion
//#region src/sections/index.ts
const log = new LogTask("updateSection");
async function updateSection(section, inputs) {
	const [startToken, stopToken] = inputs.readmeEditor.getTokenIndexes(section);
	if (startToken === -1 || stopToken === -1) return {};
	switch (section) {
		case "branding": return updateBranding(section, inputs);
		case "badges": return updateBadges(section, inputs);
		case "usage": return await updateUsage(section, inputs);
		case "title": return updateTitle(section, inputs);
		case "description": return updateDescription(section, inputs);
		case "inputs": return updateInputs(section, inputs);
		case "outputs": return updateOutputs(section, inputs);
		case "contents": return updateContents(section, inputs);
		default:
			log.debug(`unknown section found <!-- start ${String(section)} -->. No updates were made.`);
			return {};
	}
}
//#endregion
//#region src/readme-generator.ts
/**
* This TypeScript code imports various modules and defines a function named 'generateDocs'.
* The function is responsible for generating documentation for the README.md file based on the provided inputs.
* It iterates through each section defined in the 'inputs.sections' array and calls the 'updateSection' function to update the corresponding section in the README.md file.
* If an error occurs during the update of a section, it logs the error message and stops the process.
* Finally, it saves the updated README.md file and calls the 'save' function.
*/
/**
* Class for managing README generation.
*/
var ReadmeGenerator = class {
	/**
	* The Inputs instance.
	*/
	inputs;
	/**
	* The Logger instance.
	*/
	log;
	/**
	* Initializes the ReadmeGenerator.
	*
	* @param inputs - The Inputs instance
	* @param log - The Logger instance
	*/
	constructor(inputs, log) {
		this.inputs = inputs;
		this.log = log;
	}
	/**
	* Updates the README sections.
	*
	* @param sections - The sections array
	* @returns Promise array of section KV objects
	*/
	updateSections(sections) {
		const promises = [];
		for (const section of sections) promises.push(updateSection(section, this.inputs));
		return promises;
	}
	/**
	* Resolves the section update promises.
	*
	* @param promises - The promise array
	* @returns Promise resolving to combined sections KV
	*/
	async resolveUpdates(promises) {
		this.log.debug("Resolving updates");
		const results = await Promise.all(promises);
		const sections = {};
		for (const result of results) Object.assign(sections, result);
		return sections;
	}
	/**
	* Outputs the sections KV to GitHub output.
	*
	* @param sections - The sections KV
	*/
	outputSections(sections) {
		if (process.env.GITHUB_ACTIONS) {
			this.log.debug("Outputting sections");
			core.setOutput("sections", JSON.stringify(sections, null, 2));
		} else this.log.debug("Not outputting sections");
	}
	/**
	* Generates the README documentation.
	*
	* @returns Promise resolving when done
	*/
	async generate(providedSections = this.inputs.sections) {
		const sectionPromises = this.updateSections(providedSections);
		const sections = await this.resolveUpdates(sectionPromises);
		this.outputSections(sections);
		return this.inputs.readmeEditor.dumpToFile();
	}
};
//#endregion
//#region src/config.ts
/**
* This TypeScript code imports the necessary modules and defines two interfaces: `Versioning` and `Paths`.
* It also defines a class named `GHActionDocsConfig` that represents the configuration for generating GitHub Actions documentation.
* The class has properties that correspond to the configuration options and a method `loadInputs` to load the configuration from the provided `Inputs` object.
* The class also has a method `save` to save the configuration to a file.
*/
/**
* Represents the configuration for generating GitHub Actions documentation.
*/
var GHActionDocsConfig = class {
	owner;
	repo;
	title_prefix;
	title;
	paths;
	branding_svg_path;
	image_generated;
	versioning;
	prettier;
	/**
	* Loads the configuration from the provided `Inputs` object.
	* @param {Inputs} inputs - The `Inputs` object containing the configuration values.
	*/
	loadInputs(inputs) {
		const config = inputs.config.get();
		this.owner = config.owner;
		this.repo = config.repo;
		this.title_prefix = config.title_prefix;
		this.title = config.title;
		this.paths = config.paths;
		this.branding_svg_path = config.branding_svg_path;
		this.image_generated = config.image_generated;
		this.versioning = config.versioning;
		this.prettier = config.prettier;
	}
	/**
	* Saves the configuration to a file. If the file exists, it will be overwritten.
	* @param {string} configPath - The path to the configuration file.
	*/
	async save(configPath) {
		const log = new LogTask("config:save");
		const directory = path.dirname(configPath);
		try {
			await promises.mkdir(directory, { recursive: true });
		} catch (error) {
			log.error(`Error creating directory: ${directory}.`);
			throw error;
		}
		try {
			await promises.writeFile(configPath, JSON.stringify(this, null, 2));
			log.info(`Config file written to: ${configPath}`);
		} catch (error) {
			log.error(`Error writing config file: ${configPath}.`);
			throw error;
		}
	}
};
//#endregion
//#region src/save.ts
/**
* This code exports a function named 'save' which takes an instance of the 'Inputs' class as its parameter.
* The function reads the configuration inputs from the 'inputs' parameter and uses them to create a new instance of the 'GHActionDocsConfig' class.
* If the 'save' property is set to true in the configuration inputs, the function saves the configuration to the file specified in the 'configPath' property of the 'inputs' parameter.
* This script is used to update the usage section in the README.md file to match the contents of the action.yml file.
*/
/**
* This script rebuilds the usage section in the README.md to be consistent with the action.yml
* @param {Inputs} inputs - the inputs class
*/
async function save(inputs, log) {
	const docsConfig = new GHActionDocsConfig();
	docsConfig.loadInputs(inputs);
	if (inputs.config.get().save === true) try {
		await docsConfig.save(inputs.configPath);
	} catch (error) {
		log.error(`${String(error)}`);
	}
}
//#endregion
//#region src/index.ts
/**
* Creates a ReadmeGenerator instance and generates docs.
*/
async function generateReadme() {
	const log = new LogTask("Generate Documentation");
	const inputs = new Inputs();
	await new ReadmeGenerator(inputs, log).generate();
	return save(inputs, log);
}
await generateReadme();
//#endregion
export { generateReadme };
