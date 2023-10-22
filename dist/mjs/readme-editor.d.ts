export declare const startTokenFormat = "<!-- start %s -->";
export declare const endTokenFormat = "<!-- end %s -->";
export default class ReadmeEditor {
    private readonly filePath;
    private fileContent;
    constructor(filePath: string);
    getTokenIndexes(token: string): number[];
    updateSection(name: string, providedContent: string | string[], addNewlines?: boolean): void;
    dumpToFile(): Promise<void>;
}
