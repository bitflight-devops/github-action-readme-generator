export declare const startTokenFormat = "<!-- start %s -->";
export declare const endTokenFormat = "<!-- end %s -->";
export default class ReadmeEditor {
    private readonly filePath;
    private fileContent;
    constructor(filePath: string);
    updateSection(name: string, providedContent: string | string[]): void;
    dumpToFile(): Promise<void>;
}
