#!/usr/bin/env bash
# setup-angular.sh
# 安裝腳本 #39 | 將 ai-loop 引擎複製到 Angular/WEC 專案
# Usage: ./scripts/setup-angular.sh [TARGET_PROJECT_PATH]

set -euo pipefail

# =====================================================
# 配置
# =====================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AILOOP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

TARGET_PATH="${1:-}"

# =====================================================
# 驗證
# =====================================================
if [ -z "$TARGET_PATH" ]; then
    echo "Usage: $0 <target-project-path>"
    echo "Example: $0 /path/to/wec-main"
    exit 1
fi

if [ ! -d "$TARGET_PATH" ]; then
    echo "❌ Target directory not found: $TARGET_PATH"
    exit 1
fi

if [ ! -f "$TARGET_PATH/angular.json" ]; then
    echo "❌ Not an Angular project (angular.json not found): $TARGET_PATH"
    echo "   For .NET projects, use setup-dotnet.sh"
    echo "   For Python projects, use setup-python.sh"
    exit 1
fi

# =====================================================
# 安裝函式
# =====================================================
install_file() {
    local src="$1"
    local dest_dir="$2"
    local dest_file="$3"

    mkdir -p "$TARGET_PATH/$dest_dir"
    local dest="$TARGET_PATH/$dest_dir/$dest_file"

    if [ -f "$dest" ]; then
        echo "⏭️  SKIP (already exists): $dest_dir/$dest_file"
    else
        cp "$src" "$dest"
        echo "✅ INSTALLED: $dest_dir/$dest_file"
    fi
}

echo "=== Installing ai-loop engine to Angular/WEC project ==="
echo "Source : $AILOOP_ROOT"
echo "Target : $TARGET_PATH"
echo ""

# =====================================================
# Core 檔案
# =====================================================
echo "--- Core Engine ---"
CORE_SRC="$AILOOP_ROOT/.github/ai-loop/core"
install_file "$CORE_SRC/loop-orchestrator.md"   ".github/ai-loop/core"  "loop-orchestrator.md"
install_file "$CORE_SRC/loop-state.schema.yaml" ".github/ai-loop/core"  "loop-state.schema.yaml"
install_file "$CORE_SRC/context-budget.md"      ".github/ai-loop/core"  "context-budget.md"
install_file "$CORE_SRC/spec-template.yaml"     ".github/ai-loop/core"  "spec-template.yaml"
install_file "$CORE_SRC/escape-hatch.md"        ".github/ai-loop/core"  "escape-hatch.md"

# =====================================================
# Prompts
# =====================================================
echo ""
echo "--- Agent Prompts ---"
PROMPTS_SRC="$AILOOP_ROOT/.github/prompts"
install_file "$PROMPTS_SRC/ai-loop.prompt.md"        ".github/prompts"  "ai-loop.prompt.md"
install_file "$PROMPTS_SRC/ai-loop-dev.prompt.md"    ".github/prompts"  "ai-loop-dev.prompt.md"
install_file "$PROMPTS_SRC/ai-loop-test.prompt.md"   ".github/prompts"  "ai-loop-test.prompt.md"
install_file "$PROMPTS_SRC/ai-loop-review.prompt.md" ".github/prompts"  "ai-loop-review.prompt.md"

# =====================================================
# SKILL
# =====================================================
echo ""
echo "--- Skill ---"
SKILL_SRC="$AILOOP_ROOT/.github/skills/ai-loop"
install_file "$SKILL_SRC/SKILL.md" ".github/skills/ai-loop" "SKILL.md"

# =====================================================
# Instructions
# =====================================================
echo ""
echo "--- Instructions ---"
INSTR_SRC="$AILOOP_ROOT/.github/instructions"
install_file "$INSTR_SRC/ai-loop-protocols.instructions.md"        ".github/instructions"  "ai-loop-protocols.instructions.md"
install_file "$INSTR_SRC/ai-loop-error-taxonomy.instructions.md"   ".github/instructions"  "ai-loop-error-taxonomy.instructions.md"
install_file "$INSTR_SRC/ai-loop-anti-oscillation.instructions.md" ".github/instructions"  "ai-loop-anti-oscillation.instructions.md"

# =====================================================
# Adapter Interface + Registry
# =====================================================
echo ""
echo "--- Adapter Interface + Registry ---"
ADAPTER_SRC="$AILOOP_ROOT/.github/ai-loop/adapters"
install_file "$ADAPTER_SRC/adapter-interface.md" ".github/ai-loop/adapters" "adapter-interface.md"
install_file "$ADAPTER_SRC/adapter-registry.md"  ".github/ai-loop/adapters" "adapter-registry.md"

# =====================================================
# Angular-WEC Adapter（主要 Adapter）
# =====================================================
echo ""
echo "--- Angular-WEC Adapter ---"
ANG_SRC="$ADAPTER_SRC/angular-wec"
install_file "$ANG_SRC/detector.md"          ".github/ai-loop/adapters/angular-wec" "detector.md"
install_file "$ANG_SRC/commands.yaml"        ".github/ai-loop/adapters/angular-wec" "commands.yaml"
install_file "$ANG_SRC/error-parser.md"      ".github/ai-loop/adapters/angular-wec" "error-parser.md"
install_file "$ANG_SRC/review-dimensions.md" ".github/ai-loop/adapters/angular-wec" "review-dimensions.md"

# =====================================================
# Templates
# =====================================================
echo ""
echo "--- Templates ---"
TMPL_SRC="$AILOOP_ROOT/.github/ai-loop/templates"
install_file "$TMPL_SRC/progress-output.md"   ".github/ai-loop/templates" "progress-output.md"
install_file "$TMPL_SRC/diagnostic-report.md" ".github/ai-loop/templates" "diagnostic-report.md"
install_file "$TMPL_SRC/loop-summary.md"      ".github/ai-loop/templates" "loop-summary.md"

# =====================================================
# Engine Test Cases
# =====================================================
echo ""
echo "--- Engine Test Cases ---"
TEST_SRC="$AILOOP_ROOT/.github/ai-loop/tests"
install_file "$TEST_SRC/loop-state.test.md"        ".github/ai-loop/tests" "loop-state.test.md"
install_file "$TEST_SRC/adapter-detection.test.md" ".github/ai-loop/tests" "adapter-detection.test.md"

# =====================================================
# 建立 specs 目錄
# =====================================================
echo ""
echo "--- Specs Directory ---"
mkdir -p "$TARGET_PATH/.github/ai-loop/specs"
echo "✅ CREATED: .github/ai-loop/specs/ (place your spec.yaml files here)"

# =====================================================
# 完成
# =====================================================
echo ""
echo "============================================="
echo "✅ ai-loop engine installed to Angular project"
echo "   $TARGET_PATH"
echo ""
echo "Next steps:"
echo "  1. Create a spec file: .github/ai-loop/specs/your-task.yaml"
echo "  2. In VS Code Copilot Chat: @ai-loop .github/ai-loop/specs/your-task.yaml"
echo ""
echo "Validate installation: ./scripts/validate-installation.sh $TARGET_PATH"
echo "============================================="
