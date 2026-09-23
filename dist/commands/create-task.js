import { requireProject } from "../config/config.js";
import { UserError } from "../errors.js";
export const createTaskCommand = {
    name: "create-task",
    usage: "gh idd create-task <title> [--body TEXT | --body-file FILE] [-R OWNER/REPO]",
    summary: "Issueを作成し、設定されたProjectの初期ステータスへ追加する",
    dependencies: [
        { command: "gh project view", purpose: "作成前に設定されたProjectへのアクセスを検証" },
        { command: "gh issue create", purpose: "指定repositoryにIssueを作成" },
        { command: "gh project item-add", purpose: "作成したIssueをProjectへ追加" },
        { command: "gh project item-edit", purpose: "Project statusを設定された初期値に更新" },
    ],
    async execute(context) {
        const { positionals, title: titleOption, body, bodyFile } = context.args;
        const title = titleOption || positionals[0];
        if (!title?.trim() || positionals.length > (titleOption ? 0 : 1) || (body !== undefined && bodyFile !== undefined)) {
            throw new UserError(`Usage: ${createTaskCommand.usage}`);
        }
        const project = requireProject(context.config);
        context.github.assertProjectAccessible(project.owner, project.number);
        const url = context.github.createIssue(title.trim(), body, bodyFile);
        try {
            context.github.addProjectItem(url, project);
            context.github.setProjectStatus(url, project, project.status.todo);
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            throw new UserError(`Issue created: ${url}\nCould not finish Project ${project.owner}/${project.number} update: ${detail}`);
        }
        console.log(`Task created: ${url}\nProject: ${project.owner}/${project.number} (${project.status.todo})`);
    },
};
//# sourceMappingURL=create-task.js.map