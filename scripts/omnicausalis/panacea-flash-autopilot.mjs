#!/usr/bin/env node
const fs = require("fs");
const cp = require("child_process");

console.log("\n================================================================================");
console.log("  PANACEAMED INFINITY — LOCAL FLASH AUTOPILOT & VERIFICATION RUNNER");
console.log("================================================================================\n");

const ckptPath = "docs/governance/checkpoints/OMNICAUSALIS_RECOVERY_CHECKPOINT.json";
if (fs.existsSync(ckptPath)) {
  const ckpt = JSON.parse(fs.readFileSync(ckptPath, "utf8"));
  console.log("Active Branch          :", ckpt.activeBranch);
  console.log("Baseline SHA           :", ckpt.baselineSha);
  console.log("Competitive Anime Bots :", ckpt.competitiveAnimeBots.join(", "));
  console.log("Release Gates          : G_pre =", ckpt.releaseGates.G_pre, "| G_release =", ckpt.releaseGates.G_release);
}

console.log("\n[READY FOR GEMINI FLASH]: Baca docs/governance/checkpoints/FLASH_CONTINUATION_HANDOFF.md");
console.log("Untuk menjalankan Gemini CLI lokal dengan model Flash, gunakan:");
console.log("  gemini -m gemini-2.5-flash -p \"Baca docs/governance/checkpoints/FLASH_CONTINUATION_HANDOFF.md dan lanjutkan implementasi NEXT-1, NEXT-2, dan NEXT-3 secara non-destruktif.\"\n");