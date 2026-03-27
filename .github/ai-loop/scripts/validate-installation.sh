#!/usr/bin/env bash
# validate-installation.sh
# 安裝腳本 #42 | 驗證 ai-loop 引擎已正確安裝
# Usage: ./scripts/validate-installation.sh [TARGET_PROJECT_PATH]

set -euo pipefail

TARGET_PATH="${1:-.}"  # 預設為當前目錄

if [ ! -d "$TARGET_PATH" ]; then
    echo "❌ Target directory not found: $TARGET_PATH"
    exit 1
fi

ERRORS=0
WARNINGS=0

check_file() {
    local path="$1"
    local required="${2:-required}"
    if [ -f "$TARGET_PATH/$path" ]; then
        echo "  ✅ $path"
    else
        if [ "$required" = "required" ]; then
            echo "  ❌ MISSING: $path"
            ERRORS=$((ERRORS + 1))
        else
            echo "  ⚠️  OPTIONAL MISSING: $path"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
}

check_frontmatter() {
    local path="$1"
    local required_field="$2"
    if [ -f "$TARGET_PATH/$path" ]; then
        if head -5 "$TARGET_PATH/$path" | grep -q "^---"; then
            if head -20 "$TARGET_PATH/$path" | grep -q "$required_field"; then
                echo "  ✅ Frontmatter: $path ($required_field found)"
            else
                echo "  ⚠️  Missing '$required_field' in frontmatter: $path"
                WARNINGS=$((WARNINGS + 1))
            fi
        else
            echo "  ❌ Missing frontmatter: $path"
            ERRORS=$((ERRORS + 1))
        fi
    fi
}

check_yaml_syntax() {
    local path="$1"
    if [ -f "$TARGET_PATH/$path" ]; then
        if command -v python3 &>/dev/null; then
            if python3 -c "import yaml; yaml.safe_load(open('$TARGET_PATH/$path'))" 2>/dev/null; then
                echo "  ✅ YAML syntax: $path"
            else
                echo "  ❌ YAML syntax error: $path"
                ERRORS=$((ERRORS + 1))
            fi
        else
            echo "  ⏭️  YAML check skipped (python3 not available)"
        fi
    fi
}

echo "========================================================"
echo "  AI Agent Software Factory — Installation Validator v2"
echo "  Target: $TARGET_PATH"
echo "========================================================"

# =====================================================
echo ""
echo "[1/10] Foundation Files"
# =====================================================
check_file ".github/copilot-instructions.md"
check_file ".github/README.md"

# =====================================================
echo ""
echo "[2/10] Instructions Layer (6 files)"
# =====================================================
check_file ".github/instructions/csharp.instructions.md"
check_file ".github/instructions/angular.instructions.md"
check_file ".github/instructions/python.instructions.md"
check_file ".github/instructions/ai-loop-protocols.instructions.md"
check_file ".github/instructions/ai-loop-error-taxonomy.instructions.md"
check_file ".github/instructions/ai-loop-anti-oscillation.instructions.md"

echo ""
echo "  Instructions applyTo check:"
check_frontmatter ".github/instructions/csharp.instructions.md" "applyTo:"
check_frontmatter ".github/instructions/angular.instructions.md" "applyTo:"
check_frontmatter ".github/instructions/python.instructions.md" "applyTo:"
check_frontmatter ".github/instructions/ai-loop-protocols.instructions.md" "applyTo:"
check_frontmatter ".github/instructions/ai-loop-error-taxonomy.instructions.md" "applyTo:"
check_frontmatter ".github/instructions/ai-loop-anti-oscillation.instructions.md" "applyTo:"

# =====================================================
echo ""
echo "[3/10] Standards (7 files)"
# =====================================================
check_file ".github/standards/clean-architecture.md"
check_file ".github/standards/ddd-guidelines.md"
check_file ".github/standards/solid-principles.md"
check_file ".github/standards/design-patterns.md"
check_file ".github/standards/coding-standard-csharp.md"
check_file ".github/standards/coding-standard-angular.md"
check_file ".github/standards/coding-standard-python.md"

# =====================================================
echo ""
echo "[4/10] AI Loop Core Engine (5 files)"
# =====================================================
check_file ".github/ai-loop/core/loop-orchestrator.md"
check_file ".github/ai-loop/core/loop-state.schema.yaml"
check_file ".github/ai-loop/core/context-budget.md"
check_file ".github/ai-loop/core/spec-template.yaml"
check_file ".github/ai-loop/core/escape-hatch.md"

echo ""
echo "  YAML syntax check:"
check_yaml_syntax ".github/ai-loop/core/loop-state.schema.yaml"
check_yaml_syntax ".github/ai-loop/core/spec-template.yaml"

# =====================================================
echo ""
echo "[5/10] AI Loop Adapters (14 files)"
# =====================================================
check_file ".github/ai-loop/adapters/adapter-interface.md"
check_file ".github/ai-loop/adapters/adapter-registry.md"

# 偵測框架類型
FRAMEWORK="unknown"
if [ -f "$TARGET_PATH/angular.json" ]; then
    FRAMEWORK="angular-wec"
elif ls "$TARGET_PATH"/*.sln "$TARGET_PATH"/*.csproj 2>/dev/null | grep -q .; then
    FRAMEWORK="dotnet"
elif [ -f "$TARGET_PATH/requirements.txt" ] || [ -f "$TARGET_PATH/pyproject.toml" ]; then
    FRAMEWORK="python"
fi

echo ""
echo "  Detected framework: $FRAMEWORK"
if [ "$FRAMEWORK" != "unknown" ]; then
    check_file ".github/ai-loop/adapters/$FRAMEWORK/detector.md"
    check_file ".github/ai-loop/adapters/$FRAMEWORK/commands.yaml"
    check_file ".github/ai-loop/adapters/$FRAMEWORK/error-parser.md"
    check_file ".github/ai-loop/adapters/$FRAMEWORK/review-dimensions.md"
    echo ""
    echo "  YAML syntax check:"
    check_yaml_syntax ".github/ai-loop/adapters/$FRAMEWORK/commands.yaml"
    check_yaml_syntax ".github/ai-loop/core/loop-state.schema.yaml"
fi

# =====================================================
echo ""
echo "[6/10] AI Loop Templates (3 files)"
# =====================================================
check_file ".github/ai-loop/templates/progress-output.md"
check_file ".github/ai-loop/templates/diagnostic-report.md"
check_file ".github/ai-loop/templates/loop-summary.md"

# =====================================================
echo ""
echo "[7/10] Prompts (5 files)"
# =====================================================
check_file ".github/prompts/ai-loop.prompt.md"
check_file ".github/prompts/ai-loop-dev.prompt.md"
check_file ".github/prompts/ai-loop-test.prompt.md"
check_file ".github/prompts/ai-loop-review.prompt.md"
check_file ".github/prompts/final-report.prompt.md"

echo ""
echo "  Frontmatter check:"
check_frontmatter ".github/prompts/ai-loop.prompt.md" "description:"
check_frontmatter ".github/prompts/ai-loop-dev.prompt.md" "description:"
check_frontmatter ".github/prompts/ai-loop-test.prompt.md" "description:"
check_frontmatter ".github/prompts/ai-loop-review.prompt.md" "description:"
check_frontmatter ".github/prompts/final-report.prompt.md" "description:"

# =====================================================
echo ""
echo "[8/10] Skills (3 files)"
# =====================================================
check_file ".github/skills/pm/SKILL.md"
check_file ".github/skills/architect/SKILL.md"
check_file ".github/skills/ai-loop/SKILL.md"

# =====================================================
echo ""
echo "[9/10] Agents (5 files)"
# =====================================================
check_file ".github/agents/pm.agent.md"
check_file ".github/agents/architect.agent.md"
check_file ".github/agents/dev.agent.md"
check_file ".github/agents/reviewer.agent.md"
check_file ".github/agents/reporter.agent.md"

echo ""
echo "  Agent frontmatter check:"
check_frontmatter ".github/agents/pm.agent.md" "name:"
check_frontmatter ".github/agents/architect.agent.md" "name:"
check_frontmatter ".github/agents/dev.agent.md" "name:"
check_frontmatter ".github/agents/reviewer.agent.md" "name:"
check_frontmatter ".github/agents/reporter.agent.md" "name:"

# =====================================================
echo ""
echo "[10/10] Templates (3 files)"
# =====================================================
check_file ".github/templates/spec.md"
check_file ".github/templates/plan.md"
check_file ".github/templates/final-report.md"

# =====================================================
echo ""
echo "========================================================"
echo "  VALIDATION SUMMARY"
echo "========================================================"
TOTAL_FILES=45
echo "  Checked: $TOTAL_FILES expected files"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "  ✅ ALL CHECKS PASSED"
    echo "  AI Agent Software Factory is ready!"
    echo ""
    echo "  Quick start: Describe a requirement to @pm"
    echo "  Full flow:   @pm → @architect → @dev → @reviewer → @reporter"
elif [ $ERRORS -eq 0 ]; then
    echo "  ✅ PASSED with $WARNINGS warning(s)"
    echo "  Core engine functional. Review warnings above."
else
    echo "  ❌ FAILED: $ERRORS error(s), $WARNINGS warning(s)"
    echo "  Run the setup script for your framework to install missing files:"
    echo "    .github/ai-loop/scripts/setup-dotnet.sh [TARGET_PATH]"
    echo "    .github/ai-loop/scripts/setup-angular.sh [TARGET_PATH]"
    echo "    .github/ai-loop/scripts/setup-python.sh [TARGET_PATH]"
    exit 1
fi
echo "========================================================"
