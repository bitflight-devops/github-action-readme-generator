import { Context } from '@actions/github/lib/context';
export declare function wrapText(text: string | undefined, content: string[], prepend?: string): string[];
export interface Repo {
    owner: string;
    repo: string;
}
export declare function repositoryFinder(inputRepo: string | undefined | null, context: Context | undefined | null): Repo | null;
