# .NET / C# (iMX Framework) E2E 範例

# 檔案 #37 | 完整的 Inner Auto Loop 執行演示

## 情境

在 `imxframework` 的 `iMX.Core` 中新增一個 Repository 介面與實作，
提供執行緒安全的快取機制。

---

## Step 1：撰寫 Spec

建立檔案 `imxframework/.github/ai-loop/specs/cached-repository.yaml`：

```yaml
spec_version: "1.0"
title: "CachedUserRepository"

scope:
  framework: dotnet
  targets:
    - path: src/iMX.Core/

acceptance_criteria:
  - "建立 ICachedRepository<T> 介面，定義 GetAsync / SetAsync / InvalidateAsync"
  - "實作 CachedUserRepository，使用 Interlocked 確保執行緒安全計數"
  - "所有 xUnit 測試通過（GetAsync cache hit/miss, InvalidateAsync）"
  - "dotnet format 無格式化違規"

constraints:
  - "所有 async 方法必須使用 ConfigureAwait(false)"
  - "實作 IDisposable，正確釋放 CancellationTokenSource"
  - "禁止 PowerShell Set-Content 不指定 Encoding（若有 PowerShell 腳本）"

loop_config:
  max_rounds: 3
```

---

## Step 2：觸發 Loop

```
@ai-loop .github/ai-loop/specs/cached-repository.yaml
```

---

## Step 3：預期的 Developer 輸出（Round 1）

**建立的 `ICachedRepository.cs`**：

```csharp
// ✅ AC-1: 介面定義
namespace iMX.Core.Repositories;

public interface ICachedRepository<T> where T : class
{
    Task<T?> GetAsync(string key, CancellationToken cancellationToken = default);
    Task SetAsync(string key, T value, TimeSpan? expiry = null,
                  CancellationToken cancellationToken = default);
    Task InvalidateAsync(string key, CancellationToken cancellationToken = default);
}
```

**建立的 `CachedUserRepository.cs`**：

```csharp
namespace iMX.Core.Repositories;

// ✅ D3.1: IDisposable 實作
public class CachedUserRepository : ICachedRepository<User>, IDisposable
{
    private readonly IMemoryCache _cache;
    private int _hitCount = 0;          // ✅ AC-2: Interlocked 計數器
    private bool _disposed = false;

    public CachedUserRepository(IMemoryCache cache)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
    }

    public async Task<User?> GetAsync(string key,
        CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(key, out User? user))
        {
            Interlocked.Increment(ref _hitCount);     // ✅ AC-2: 執行緒安全
            return user;
        }
        return await Task.FromResult<User?>(null)
            .ConfigureAwait(false);                   // ✅ ConfigureAwait(false)
    }

    public async Task SetAsync(string key, User value,
        TimeSpan? expiry = null,
        CancellationToken cancellationToken = default)
    {
        var options = new MemoryCacheEntryOptions();
        if (expiry.HasValue)
            options.AbsoluteExpirationRelativeToNow = expiry;

        _cache.Set(key, value, options);
        await Task.CompletedTask.ConfigureAwait(false); // ✅ ConfigureAwait(false)
    }

    public async Task InvalidateAsync(string key,
        CancellationToken cancellationToken = default)
    {
        _cache.Remove(key);
        await Task.CompletedTask.ConfigureAwait(false); // ✅ ConfigureAwait(false)
    }

    // ✅ D3.1: 完整 Dispose 模式
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            // managed resources cleanup
            _disposed = true;
        }
    }
}
```

---

## Step 4：Tester Agent（Round 1）

**若 xUnit 測試通過**：

```
╔══════════════════════════════════════════════════════╗
║  🧪 TESTER  Round 1 / 3                             ║
╠══════════════════════════════════════════════════════╣
║  STEP RESULTS                                        ║
║  Lint   : ✅ PASS (dotnet format --verify-no-changes) ║
║  Test   : ✅ PASS (xUnit: 6 passed, 0 failed)        ║
║  Build  : ✅ PASS                                    ║
║  RESULT : ✅ PASS                                    ║
╚══════════════════════════════════════════════════════╝
```

**若 dotnet format 失敗（Fast-Fail 範例）**：

```
╔══════════════════════════════════════════════════════╗
║  🧪 TESTER  Round 1 / 3                             ║
╠══════════════════════════════════════════════════════╣
║  STEP RESULTS                                        ║
║  Lint   : ❌ FAIL                                    ║
║  Test   : ⏭️ SKIPPED (Lint failed → Fast-Fail)      ║
║  Build  : ⏭️ SKIPPED                                ║
╠══════════════════════════════════════════════════════╣
║  BLOCK ERRORS                                        ║
║  🔴 [dotnet-format-violations]                       ║
║     Formatting violations found: CachedUserRepository.cs  ║
║     File: src/iMX.Core/Repositories/CachedUserRepository.cs ║
║  RESULT : ❌ FAIL                                    ║
╚══════════════════════════════════════════════════════╝
```

---

## Step 5：Reviewer Agent 輸出

```
╔══════════════════════════════════════════════════════╗
║  🔍 REVIEWER  Round 1 / 3                           ║
╠══════════════════════════════════════════════════════╣
║  REVIEW DIMENSIONS                                   ║
║  D0 Spec Compliance  : ✅ All 4 AC satisfied        ║
║  D1 iMX SSoT         : ✅ Core 層正確，無跨層依賴    ║
║  D2 Thread Safety    : ✅ Interlocked.Increment 使用 ║
║  D3 Resource Mgmt    : ✅ IDisposable 完整實作       ║
║  D4 UTF-8 Safety     : ✅ 無 PowerShell Set-Content  ║
║  RESULT              : ✅ PASS                      ║
╚══════════════════════════════════════════════════════╝
```
