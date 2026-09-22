import path from "node:path";
import { saveLocalProject } from "../config/config.js";
import { chooseProject, parseProjectReference } from "../ui/selectors.js";
export const setProjectCommand = {
    name: "set-project",
    usage: "gh idd set-project [OWNER/NUMBER|URL]",
    summary: "gh iddが操作するGitHub Projectをrepository local configへ保存する",
    dependencies: [
        { command: "gh api user", purpose: "対話選択時に現在のuserを解決" },
        { command: "gh project list", purpose: "対話選択用Project一覧を取得" },
        { command: "gh project view", purpose: "指定Projectへのアクセスを検証" },
    ],
    async execute(context) {
        const project = parseProjectReference(context.args.positionals[0], context.github.owner) || await chooseProject(context.github);
        context.github.assertProjectAccessible(project.owner, project.number);
        const file = saveLocalProject(context.repoRoot, project.owner, project.number);
        console.log(`Project set to ${project.owner}/${project.number}\nSaved to ${path.relative(context.repoRoot, file)}`);
    },
};
//# sourceMappingURL=set-project.js.map