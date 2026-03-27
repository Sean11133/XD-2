# Tests

Engine-level test cases are located at:

```
.github/ai-loop/tests/
├── loop-state.test.md        # TC-LS-01~10: Loop State Protocol
└── adapter-detection.test.md # TC-DET-01~10: Adapter Detection (CoR)
```

These are Markdown-based specification tests executed by the AI agent during engine validation.
To validate them, run:

```bash
./scripts/validate-installation.sh .
```
