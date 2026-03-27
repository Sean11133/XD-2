#!/usr/bin/env bash
# setup-python.sh
# 安裝腳本 #41 | 將 ai-loop 引擎複製到 Python 專案
# Usage: ./scripts/setup-python.sh [TARGET_PROJECT_PATH]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AILOOP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_PATH="${1:-}"

if [ -z "$TARGET_PATH" ]; then
    echo "Usage: $0 <target-project-path>"
    echo "Example: $0 /path/to/wec_py"
    exit 1
fi

if [ ! -d "$TARGET_PATH" ]; then
    echo "❌ Target directory not found: $TARGET_PATH"
    exit 1
fi

# 驗證是 Python 專案
if [ ! -f "$TARGET_PATH/requirements.txt" ] && [ ! -f "$TARGET_PATH/pyproject.toml" ]; then
    echo "❌ Not a Python project (no requirements.txt or pyproject.toml): $TARGET_PATH"
    exit 1
fi

install_file() {
    local src="$1"
    local dest_dir="$2"
    local dest_file="$3"
    mkdir -p "$TARGET_PATH/$dest_dir"
    local dest="$TARGET_PATH/$dest_dir/$dest_file"
    if [ -f "$dest" ]; then
        echo "⏭️  SKIP: $dest_dir/$dest_file"
    else
        cp "$src" "$dest"
        echo "✅ INSTALLED: $dest_dir/$dest_file"
    fi
}

echo "=== Installing ai-loop engine to Python project ==="
echo "Source : $AILOOP_ROOT"
echo "Target : $TARGET_PATH"
echo ""

echo "--- Core Engine ---"
CORE_SRC="$AILOOP_ROOT/.github/ai-loop/core"
for f in loop-orchestrator.md loop-state.schema.yaml context-budget.md spec-template.yaml escape-hatch.md; do
    install_file "$CORE_SRC/$f" ".github/ai-loop/core" "$f"
done

echo ""
echo "--- Agent Prompts ---"
PROMPTS_SRC="$AILOOP_ROOT/.github/prompts"
for f in ai-loop.prompt.md ai-loop-dev.prompt.md ai-loop-test.prompt.md ai-loop-review.prompt.md; do
    install_file "$PROMPTS_SRC/$f" ".github/prompts" "$f"
done

echo ""
echo "--- Skill ---"
install_file "$AILOOP_ROOT/.github/skills/ai-loop/SKILL.md" ".github/skills/ai-loop" "SKILL.md"

echo ""
echo "--- Instructions ---"
INSTR_SRC="$AILOOP_ROOT/.github/instructions"
for f in ai-loop-protocols.instructions.md ai-loop-error-taxonomy.instructions.md ai-loop-anti-oscillation.instructions.md; do
    install_file "$INSTR_SRC/$f" ".github/instructions" "$f"
done

echo ""
echo "--- Adapter Interface + Registry ---"
ADAPTER_SRC="$AILOOP_ROOT/.github/ai-loop/adapters"
install_file "$ADAPTER_SRC/adapter-interface.md" ".github/ai-loop/adapters" "adapter-interface.md"
install_file "$ADAPTER_SRC/adapter-registry.md"  ".github/ai-loop/adapters" "adapter-registry.md"

echo ""
echo "--- Python Adapter ---"
PY_SRC="$ADAPTER_SRC/python"
for f in detector.md commands.yaml error-parser.md review-dimensions.md; do
    install_file "$PY_SRC/$f" ".github/ai-loop/adapters/python" "$f"
done

echo ""
echo "--- Templates ---"
TMPL_SRC="$AILOOP_ROOT/.github/ai-loop/templates"
for f in progress-output.md diagnostic-report.md loop-summary.md; do
    install_file "$TMPL_SRC/$f" ".github/ai-loop/templates" "$f"
done

echo ""
echo "--- Engine Test Cases ---"
TEST_SRC="$AILOOP_ROOT/.github/ai-loop/tests"
for f in loop-state.test.md adapter-detection.test.md; do
    install_file "$TEST_SRC/$f" ".github/ai-loop/tests" "$f"
done

mkdir -p "$TARGET_PATH/.github/ai-loop/specs"
echo "✅ CREATED: .github/ai-loop/specs/"

echo ""
echo "============================================="
echo "✅ ai-loop engine installed to Python project"
echo "   $TARGET_PATH"
echo ""
echo "Lint tool detection:"
if [ -f "$TARGET_PATH/pylintrc" ]; then
    echo "  ⚠️  pylintrc detected → default lint: pylint"
    echo "     To use ruff instead, add to spec constraints: 'use_ruff: true'"
elif [ -f "$TARGET_PATH/pyproject.toml" ] && grep -q "\[tool.ruff\]" "$TARGET_PATH/pyproject.toml" 2>/dev/null; then
    echo "  ✅ ruff config in pyproject.toml detected → lint: ruff check ."
fi
echo ""
echo "Next steps:"
echo "  1. Create a spec: .github/ai-loop/specs/your-task.yaml"
echo "  2. In VS Code Copilot Chat: @ai-loop .github/ai-loop/specs/your-task.yaml"
echo "============================================="
