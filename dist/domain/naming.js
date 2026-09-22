const TYPES = new Map([
    ["fix", /\b(fix|bug|error|crash|broken|修正|不具合|バグ)\b/i],
    ["docs", /\b(doc|docs|documentation|readme|文書|ドキュメント)\b/i],
    ["chore", /\b(chore|maint|maintenance|deps|dependency|依存)\b/i],
    ["refactor", /\b(refactor|cleanup|リファクタ)\b/i],
    ["test", /\b(test|tests|testing|テスト)\b/i],
]);
export function issueType(title) {
    for (const [type, pattern] of TYPES)
        if (pattern.test(title))
            return type;
    return "feat";
}
export function slugify(title) {
    return title.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60).replace(/-$/g, "") || "issue";
}
export function branchName(issue, format, ai = "") {
    return format.replaceAll("{type}", issueType(issue.title)).replaceAll("{issue}", String(issue.number))
        .replaceAll("{slug}", slugify(issue.title)).replaceAll("{ai}", ai);
}
export function issueNumberFromBranch(branch) {
    const match = branch.match(/(?:^|[/_-])(\d+)(?:[/_-]|$)/);
    return match?.[1] ? Number(match[1]) : null;
}
//# sourceMappingURL=naming.js.map