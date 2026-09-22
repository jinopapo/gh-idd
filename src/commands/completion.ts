import type { CommandDefinition } from "../core/command.js";
import { UserError } from "../errors.js";
import { renderFishCompletion } from "../completion.js";
import { COMMANDS } from "./registry.js";

export const completionCommand: CommandDefinition = {
  name: "completion",
  usage: "gh idd completion fish",
  summary: "fish用の補完スクリプトを出力する",
  dependencies: [],
  async executeStandalone(args) {
    if (args.positionals.length !== 1 || args.positionals[0] !== "fish") {
      throw new UserError("Usage: gh idd completion fish");
    }
    console.log(renderFishCompletion(COMMANDS));
  },
};
