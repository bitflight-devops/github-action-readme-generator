/**
 * This TypeScript code imports necessary modules and defines a function named 'updateBadges' which takes a token (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the badges section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes.
 */
import LogTask from '../logtask/index.js';
export default function updateBadges(token, inputs) {
    const log = new LogTask(token);
    const enableVersioning = inputs.config.get('versioning:badges');
    const badges = [];
    const repos = {
        owner: inputs.config.get('owner'),
        repo: inputs.config.get('repo'),
    };
    /**
     * Generate GitHub badges.
     * @returns {IBadge[]} - The array of GitHub badges.
     */
    function githubBadges() {
        const repoUrl = `https://github.com/${repos.owner}/${repos.repo}`;
        return [
            {
                img: `https://img.shields.io/github/v/release/${repos.owner}/${repos.repo}?display_name=tag&sort=semver&logo=github&style=flat-square`,
                alt: 'Release',
                url: `${repoUrl}/releases/latest`,
            },
            {
                img: `https://img.shields.io/github/release-date/${repos.owner}/${repos.repo}?display_name=tag&sort=semver&logo=github&style=flat-square`,
                alt: 'Release',
                url: `${repoUrl}/releases/latest`,
            },
            {
                img: `https://img.shields.io/github/last-commit/${repos.owner}/${repos.repo}?logo=github&style=flat-square`,
                alt: 'Commit',
            },
            {
                img: `https://img.shields.io/github/issues/${repos.owner}/${repos.repo}?logo=github&style=flat-square`,
                alt: 'Open Issues',
                url: `${repoUrl}/issues`,
            },
            {
                img: `https://img.shields.io/github/downloads/${repos.owner}/${repos.repo}/total?logo=github&style=flat-square`,
                alt: 'Downloads',
            },
        ];
    }
    /**
     * Generates a badge HTML markup.
     * @param {IBadge} item - The badge object.
     * @returns {string} - The HTML markup for the badge.
     */
    function generateBadge(item) {
        const badgeTemplate = `<img src="${item.img}" alt="${item.alt || ''}" />`;
        if (item.url) {
            return `<a href="${item.url}">${badgeTemplate}</a>`;
        }
        return badgeTemplate;
    }
    /**
     * Generates all badges HTML markup.
     * @returns {string[]} - The array of HTML markup for all badges.
     */
    function generateBadges() {
        const badgeArray = [];
        for (const b of badges) {
            badgeArray.push(generateBadge(b));
        }
        return [badgeArray.join('')];
    }
    log.start();
    // Add GitHub badges
    if (enableVersioning) {
        badges.push(...githubBadges());
    }
    const content = generateBadges();
    inputs.readmeEditor.updateSection(token, content);
    log.success();
}
//# sourceMappingURL=update-badges.js.map