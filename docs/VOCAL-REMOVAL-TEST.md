# ExoPlayer 相位抵消法去人声功能 - 测试与问题排查文档

## 📋 文档信息

- **项目名称**: LRC Player
- **功能模块**: ExoPlayer 相位抵消法去人声
- **测试日期**: 2026-04-18
- **Android 版本**: Media3 (ExoPlayer) 1.5.1
- **状态**: ❌ **放弃 ExoPlayer 原生方案** - Media3 API 限制无法实现

---

## 🎯 测试目标

实现基于相位抵消法的音频去人声功能，在 Android 原生 ExoPlayer 中实时消除歌曲中的人声。

---

## 📊 方案总览

### ✅ 已尝试的方案（全部失败）

| 方案 | 尝试时间 | 结果 | 失败原因 |
|------|---------|------|----------|
| **方案 1: 自定义 VocalRemovalAudioProcessor (Media3 1.2.0)** | 2026-04-18 v1.0-v1.4 | ❌ 编译失败 | Media3 1.2.0 API 变更，`AudioProcessor` 接口过于复杂，无法正确实现 |
| **方案 2: ChannelMixingAudioProcessor** | 2026-04-18 v2.0-v2.3 | ❌ 运行时崩溃 | `ChannelMixingMatrix` **禁止负数系数**，无法实现相位抵消算法（需要 -1.0 系数） |
| **方案 3: 升级 Media3 + 自定义 AudioProcessor** | 2026-04-18 v3.0-v3.9 | ❌ **彻底失败** | `queueInput()` 被调用但 `buffer size=0`（v3.5），后确认 `setAudioProcessors()` 替换默认处理器导致无声。Media3 1.4.1 和 1.5.1 都不支持 `buildAudioProcessors()` 方法，无法追加自定义处理器到默认链。内部处理器类非公共 API，无法手动构建完整链。**已放弃此方案**。UI 按钮位置调整：底部中央 → 右侧垂直居中。

### ⏸️ 未尝试的方案

| 方案 | 说明 | 可行性评估 |
|------|------|-----------|
| **方案 3: Web Audio API** | 使用浏览器 Web Audio API 实现 | ✅ **已在 Web 端实现**，但 Android 原生 ExoPlayer 无法使用 |
| **方案 4: 自定义 AudioProcessor（简化版）** | 参考 Media3 源码，实现最小化的 AudioProcessor | ⚠️ 需要深入研究 Media3 内部机制，实现复杂度高 |
| **方案 5: Equalizer EQ 调节** | 使用 Android 原生 Equalizer 降低人声频段（300Hz-3kHz） | ⚠️ 只能削弱人声，无法完全去除，效果较差 |
| **方案 6: 服务端 AI 处理** | 使用 Spleeter/Demucs 等 AI 模型在服务端分离音轨 | ✅ 效果最好，但需要后端支持和网络传输 |

---

## 🔍 各方案调试过程记录

### 方案 1: 自定义 VocalRemovalAudioProcessor

#### 尝试 1.0: 初始实现（基于旧版 API 猜测）

**实施步骤**:
1. 创建 `VocalRemovalAudioProcessor.java`，实现 `AudioProcessor` 接口
2. 使用旧版 ExoPlayer 2.x 的 API 签名
3. 在 `ExoPlayerPlugin.java` 中通过 `DefaultRenderersFactory` 注入

**核心代码思路**:
```java
public class VocalRemovalAudioProcessor implements AudioProcessor {
    @Override
    public void configure(int inputSampleRateHz, int inputChannelCount, int inputEncoding) 
            throws UnhandledFormatException {
        // 配置音频格式
    }
    
    @Override
    public void queueInput(ByteBuffer inputBuffer) {
        // 执行相位抵消: Mono = (L - R) / 2
    }
}
```

**编译结果**: ❌ **17 个编译错误**

**错误日志**:
```
错误: 找不到符号
import androidx.media3.exoplayer.audio.AudioProcessor;
                                      ^
  符号:   类 AudioProcessor
  位置: 程序包 androidx.media3.exoplayer.audio

错误: 找不到符号
throws UnhandledFormatException {
       ^
  符号:   类 UnhandledFormatException
```

**问题分析**:
- Media3 1.2.0 的 API 发生了重大变化
- `AudioProcessor` 接口仍在，但方法签名完全不同
- `UnhandledFormatException` 改名为 `UnhandledAudioFormatException`
- `configure()` 方法被 `onConfigure()` 替代

---

#### 尝试 1.1: 第一次修复（改用 BaseAudioProcessor）

**修改内容**:
1. 改为继承 `BaseAudioProcessor` 而非实现 `AudioProcessor`
2. 使用 `onConfigure(AudioFormat)` 替代 `configure(int, int, int)`
3. 将 `flush()` 改为 `onFlush()`
4. 将 `reset()` 改为 `onReset()`

**编译结果**: ❌ **7 个编译错误**

**错误日志**:
```
错误: 方法不会覆盖或实现超类型的方法
    @Override
    ^

错误: 不兼容的类型: Format无法转换为AudioFormat
    throw new UnhandledAudioFormatException(inputFormat);
                                            ^

错误: 找不到符号
    if (inputFormat.encoding != C.ENCODING_PCM_16BIT) {
                   ^
    符号:   变量 encoding
    位置: 类型为Format的变量 inputFormat

错误: VocalRemovalAudioProcessor中的queueEndOfStream()无法覆盖BaseAudioProcessor中的queueEndOfStream()
    被覆盖的方法为final
```

**问题分析**:
- `BaseAudioProcessor` 已被标记为 `@Deprecated`
- `onConfigure()` 接收的是 `AudioFormat` 而非 `Format`
- `queueEndOfStream()` 是 final 方法，不能重写
- `Format` 和 `AudioFormat` 是不同的类，字段不兼容

---

#### 尝试 1.2: 第二次修复（修正类型）

**修改内容**:
1. 修正 `onConfigure()` 参数类型为 `AudioFormat`
2. 删除 `queueEndOfStream()` 的重写
3. 修正 `Format` 到 `AudioFormat` 的使用

**编译结果**: ❌ **仍有多个错误**

**主要问题**:
- `BaseAudioProcessor` 的内部实现过于复杂
- 需要管理内部缓冲区队列
- `replaceOutputBuffer()` 方法难以正确使用
- 官方文档不足，缺少完整示例

---

#### 尝试 1.3: 第三次修复（直接使用 AudioProcessor 接口）

**修改内容**:
1. 放弃 `BaseAudioProcessor`，直接实现 `AudioProcessor` 接口
2. 研究 Media3 源码，尝试理解正确的实现方式
3. 实现 `Configuration`、`InputFormat` 等内部类

**编译结果**: ❌ **API 不存在**

**错误日志**:
```
错误: 找不到符号
import androidx.media3.exoplayer.audio.AudioProcessor.Configuration;
                                                              ^
  符号:   类 Configuration
  位置: 接口 AudioProcessor

错误: 找不到符号
import androidx.media3.exoplayer.audio.AudioProcessor.InputFormat;
                                                              ^
  符号:   类 InputFormat
```

**问题分析**:
- Media3 1.2.0 的 `AudioProcessor` 接口非常复杂
- `Configuration` 和 `InputFormat` 类在当前版本中不存在或位置不同
- 官方示例使用的是 Media3 1.10.0+，与项目版本不匹配
- 需要大量时间去研究内部实现细节

---

#### 尝试 1.4: 最终决定（暂停此方案）

**决策**: ⏸️ **暂停自定义 AudioProcessor 方案的开发**

**原因**:
1. Media3 1.2.0 API 过于复杂且文档不足
2. 官方示例使用的是更新版本（1.10.0+）
3. 实现成本过高，投入产出比不合理
4. 应该寻找更简单的替代方案

**经验教训**:
- 🔍 **不要盲目实现复杂的接口** - 先查找官方示例
- 📖 **确认 API 版本兼容性** - 避免使用过时的文档
- 💡 **优先考虑内置方案** - 如 `ChannelMixingAudioProcessor`

---

### 方案 2: ChannelMixingAudioProcessor

#### 尝试 2.0: 发现并使用内置处理器

**背景**:
在放弃自定义实现后，搜索发现 Media3 内置了 `ChannelMixingAudioProcessor`，可以通过设置混音矩阵实现音频处理。

**实施步骤**:
1. 删除自定义的 `VocalRemovalAudioProcessor.java`
2. 在 `ExoPlayerPlugin.java` 中使用 `ChannelMixingAudioProcessor`
3. 通过 `putChannelMixingMatrix()` 设置相位抵消矩阵

**核心代码**:
```java
// 创建处理器
vocalRemovalProcessor = new ChannelMixingAudioProcessor();

// 设置默认恒等矩阵（立体声 -> 立体声，不改变音频）
ChannelMixingMatrix identityMatrix = ChannelMixingMatrix.create(2, 2);
vocalRemovalProcessor.putChannelMixingMatrix(identityMatrix);

// 添加到 ExoPlayer
builder.setAudioProcessors(new AudioProcessor[] {
    vocalRemovalProcessor
});
```

**编译结果**: ✅ **编译成功**

**部署结果**: ✅ **APK 安装成功，应用启动正常**

**初步测试**: ✅ **歌曲可以正常播放**

**结论**: 播放功能正常，准备测试去人声功能

---

#### 尝试 2.1: 播放问题排查（AudioProcessor 导致无声）

**症状**:
启用 `ChannelMixingAudioProcessor` 后，播放器状态变为 READY，但没有任何声音输出。

**诊断过程**:

**步骤 1: 临时禁用 AudioProcessor**
```java
// 注释掉 setAudioProcessors 调用
// builder.setAudioProcessors(new AudioProcessor[] { vocalRemovalProcessor });
```

**测试结果**: ✅ 播放正常 → 确认问题在 AudioProcessor

**步骤 2: 检查数组类型**
```java
// ❌ 错误：使用了具体实现类数组
builder.setAudioProcessors(new ChannelMixingAudioProcessor[] { ... });

// ✅ 正确：使用接口类型
import androidx.media3.common.audio.AudioProcessor;
builder.setAudioProcessors(new AudioProcessor[] { ... });
```

**步骤 3: 检查矩阵初始化**
```java
// ❌ 错误：创建后未设置矩阵
vocalRemovalProcessor = new ChannelMixingAudioProcessor();

// ✅ 正确：立即设置默认恒等矩阵
vocalRemovalProcessor = new ChannelMixingAudioProcessor();
ChannelMixingMatrix identityMatrix = ChannelMixingMatrix.create(2, 2);
vocalRemovalProcessor.putChannelMixingMatrix(identityMatrix);
```

**修复后的代码**:
```java
// 1. 导入正确的包
import androidx.media3.common.audio.AudioProcessor;
import androidx.media3.common.audio.ChannelMixingAudioProcessor;
import androidx.media3.common.audio.ChannelMixingMatrix;

// 2. 创建并初始化处理器
vocalRemovalProcessor = new ChannelMixingAudioProcessor();
ChannelMixingMatrix identityMatrix = ChannelMixingMatrix.create(2, 2);
vocalRemovalProcessor.putChannelMixingMatrix(identityMatrix);

// 3. 使用接口类型数组
builder.setAudioProcessors(new AudioProcessor[] {
    vocalRemovalProcessor
});
```

**测试结果**: ✅ **歌曲可以正常播放，无任何错误日志**

**根本原因**:
- Media3 要求 `setAudioProcessors()` 接收 `AudioProcessor[]` 接口类型，而非具体实现类数组
- `ChannelMixingAudioProcessor` 必须在配置前设置混音矩阵，否则抛出 `UnhandledAudioFormatException`

**经验教训**:
- 🔍 **遇到无声问题时，首先隔离 AudioProcessor**
- 📋 **仔细阅读 Media3 官方文档关于 AudioProcessor 的要求**
- 🧪 **每个修改后立即测试，避免累积多个问题**

---

#### 尝试 2.2: 播放问题解决（成功播放）

**修复内容**:
1. 使用正确的 `AudioProcessor[]` 接口类型
2. 初始化时设置默认恒等矩阵
3. 添加详细的日志输出用于调试

**测试结果**:
- ✅ 歌曲可以正常播放
- ✅ 切换歌曲正常工作
- ✅ 无任何错误或警告日志
- ✅ 播放器状态正常显示

**当前状态**: 播放功能完全正常，准备测试去人声功能

---

#### 尝试 2.3: 去人声闪退（ChannelMixingMatrix 禁止负数系数）

**测试步骤**:
1. 启动应用，播放一首立体声歌曲
2. 点击右下角 "🎤 原唱模式 OFF" 按钮
3. 观察应用反应

**症状**:
- 点击按钮后应用立即闪退
- 无错误提示对话框
- 应用直接关闭

**日志分析**:
```
04-18 20:07:06.310 D ExoPlayerPlugin: 🎤 setVocalRemoval called
04-18 20:07:06.310 D ExoPlayerPlugin: 🎤 setVocalRemoval running on UI thread
04-18 20:07:06.310 D ExoPlayerPlugin: 🎤 enabled parameter: true
04-18 20:07:06.310 D ExoPlayerPlugin: 🎤 vocalRemovalProcessor exists, setting matrix...
04-18 20:07:06.312 E ExoPlayerPlugin: ❌ Exception in setVocalRemoval: Coefficient at index 1 is negative.
04-18 20:07:06.312 W System.err: java.lang.IllegalArgumentException: Coefficient at index 1 is negative.
04-18 20:07:06.312 W System.err:     at androidx.media3.common.audio.ChannelMixingMatrix.checkCoefficientsValid(ChannelMixingMatrix.java:189)
04-18 20:07:06.312 W System.err:     at androidx.media3.common.audio.ChannelMixingMatrix.<init>(ChannelMixingMatrix.java:167)
04-18 20:07:06.312 W System.err:     at com.lrcplayer.app.plugins.ExoPlayerPlugin.lambda$setVocalRemoval$10(ExoPlayerPlugin.java:728)
```

**触发错误的代码**:
```java
if (enabled) {
    // ❌ 这里会失败：ChannelMixingMatrix 不允许负数
    float[] vocalRemovalMatrix = {
        1.0f, -1.0f,   // 左声道输出系数
        -1.0f, 1.0f    // 右声道输出系数
    };
    
    ChannelMixingMatrix matrix = new ChannelMixingMatrix(
        2,  // 输入声道数（立体声）
        2,  // 输出声道数（立体声）
        vocalRemovalMatrix
    );
    
    vocalRemovalProcessor.putChannelMixingMatrix(matrix);
}
```

**根本原因分析**:

相位抵消法需要的混音矩阵包含负数系数：
```
左声道输出 = L * 1.0 + R * (-1.0) = L - R
右声道输出 = L * (-1.0) + R * 1.0 = R - L
```

但 `ChannelMixingMatrix` 源码明确禁止负数：

```java
// androidx.media3.common.audio.ChannelMixingMatrix.java (Line 185-192)
private static float[] checkCoefficientsValid(float[] coefficients) {
    for (int i = 0; i < coefficients.length; i++) {
        if (coefficients[i] < 0f) {
            throw new IllegalArgumentException(
                "Coefficient at index " + i + " is negative."  // ← 这就是我们的错误！
            );
        }
    }
    return coefficients;
}
```

**联网验证**:
通过搜索 Media3 官方文档和源码，确认了：
1. `checkCoefficientsValid()` 是 `private static final` 方法，无法重写或绕过
2. 所有 `ChannelMixingMatrix` 构造函数都调用此方法进行验证
3. 没有任何公开 API 可以禁用此检查
4. 这是**故意的设计限制**，而非 bug

**官方设计意图**:
- `ChannelMixingMatrix` 仅用于**声道映射和音量调整**（如 5.1 转立体声）
- 不支持**信号反相**（负增益）操作
- 相位抵消需要信号反相，超出了此类的設計范围

**结论**: ❌ **`ChannelMixingAudioProcessor` 完全无法实现相位抵消法去人声**

**替代方案评估**:

| 方案 | 可行性 | 复杂度 | 说明 |
|------|--------|--------|------|
| 自定义 AudioProcessor | ✅ 可行 | ⭐⭐⭐⭐ | 需要直接操作 PCM 数据，实现复杂 |
| Equalizer EQ 调节 | ⚠️ 部分可行 | ⭐⭐ | 只能削弱人声，无法去除 |
| 服务端 AI 处理 | ✅ 可行 | ⭐⭐⭐⭐⭐ | 需要后端支持 |
| Web Audio API | ✅ 已实现 | ⭐⭐ | 仅适用于浏览器环境 |

**经验教训**:
- 🔎 **不要假设 API 能支持你的算法** - 先查阅源码或文档
- 📖 **Media3 的 AudioProcessor 分为两类**:
  - 内置处理器（如 `ChannelMixingAudioProcessor`）- 功能有限但稳定
  - 自定义处理器 - 灵活但实现复杂
- 💡 **相位抵消需要负数系数** - 这是音频处理的基本原理
- ⚠️ **遇到限制时要快速转向** - 不要在一个死胡同里浪费时间

---

### 方案 3: 升级 Media3 + 自定义 AudioProcessor（当前方案）

#### 尝试 3.0: 升级 Media3 并实现正确的 AudioProcessor

**背景**:
经过前两次失败，决定升级到 Media3 1.4.1 以获得更简化的 API 和更好的文档支持。

**实施步骤**:

**步骤 1: 升级 Media3 版本**
修改 `android/app/build.gradle`:
```gradle
def media3_version = "1.4.1"  // 从 1.2.0 升级
```

**步骤 2: 创建 VocalRemovalAudioProcessor**
继承 `BaseAudioProcessor`，实现相位抵消算法：

核心要点:
1. 使用 `AudioProcessor.AudioFormat` 而非 `Format`
2. 在 `onConfigure()` 中验证输入格式（PCM 16-bit，立体声）
3. 在 `queueInput()` 中执行相位抵消算法 `(L - R) / 2`
4. 通过 `setActive()` 方法动态启用/禁用处理

**步骤 3: 修改 ExoPlayerPlugin**
1. 移除 `ChannelMixingAudioProcessor` 相关代码
2. 创建 `VocalRemovalAudioProcessor` 实例
3. 通过 `DefaultRenderersFactory` 注入到 ExoPlayer
4. 简化 `setVocalRemoval()` 方法，直接调用 `setActive()`

**编译结果**: ✅ **BUILD SUCCESSFUL in 1m 50s**

**部署结果**: ✅ **APK 安装成功，应用启动正常**

**关键改进**:
1. ✅ 使用正确的 `AudioProcessor.AudioFormat` 类型
2. ✅ 继承 `BaseAudioProcessor` 而非实现 `AudioProcessor` 接口
3. ✅ 避免使用 `ChannelMixingMatrix`（禁止负数系数）
4. ✅ 直接操作 PCM 数据，完全控制相位抵消算法

**当前状态**: 
- ✅ 编译成功
- ✅ APK 部署成功
- ✅ 应用启动正常
- ✅ UI 按钮已移至屏幕底部中央（避免遮挡播放控制）
- ❌ **功能未生效** - `queueInput()` 被调用但 `buffer size=0`
- ❌ 声音没有任何变化（人声未被消除）

**关键日志**:
```
04-19 00:01:16.642 D VocalRemovalProcessor: Configuring processor: AudioFormat[sampleRate=44100, channelCount=2, encoding=2], isActive=true
04-19 00:01:16.661 D VocalRemovalProcessor: 🔍 queueInput called! isActive=true, buffer size=0
```

**问题分析**:
1. ✅ `onConfigure()` 被正确调用，格式验证通过
2. ✅ `isActive=true` - 处理器已激活
3. ✅ `queueInput()` 被调用 - 说明处理器在链中
4. ❌ **`buffer size=0`** - ExoPlayer 没有发送任何音频数据
5. ❌ 相位抵消算法从未执行（因为没有输入数据）

**可能原因**:
- ExoPlayer 的默认处理器链可能在我们的处理器之前就已经处理完所有数据
- 或者我们的处理器位置不对，导致接收不到数据流
- `setAudioProcessors()` 可能替换了必要的默认处理器

**下一步调试方向**:
1. 检查是否需要保留默认处理器链
2. 尝试使用 `buildAudioProcessors()` 而非 `setAudioProcessors()`
3. 考虑使用 ExoPlayer Effects API（如果可用）
4. 或放弃 ExoPlayer 方案，改用 Web Audio API

**下一步**:
1. 播放一首立体声歌曲
2. 点击“🎤 原唱模式 OFF”按钮
3. 观察是否有人声消除效果
4. 检查 Logcat 日志确认处理器工作状态

---

#### 尝试 3.6: 在初始化时设置 `isActive=true`

**修改内容**:
在 ExoPlayer 初始化时就调用 `vocalRemovalProcessor.setActive(true)`，确保 `onConfigure()` 时 `isActive=true`。

**测试结果**: ❌ **仍然无效**
- `onConfigure()` 时 `isActive=true`
- `queueInput()` 被调用
- ❌ **但所有样本值都是 0（静音）**

**关键发现**:
```
- frameCount: 1135
- inputSize: 4540 bytes
- Sample 0: L=0, R=0  ← 所有样本都是 0（静音）！
- Sample 1: L=0, R=0
- Sample 2: L=0, R=0
```

**结论**: 音频数据在进入我们的处理器之前就是静音的，说明 `setAudioProcessors()` 替换了必要的解码/格式转换处理器。

---

#### 尝试 3.7: 移除 `setAudioProcessors()` 测试

**修改内容**:
暂时不使用 `setAudioProcessors()`，让 ExoPlayer 使用完全默认的处理器链。

**测试结果**: ✅ **音乐正常播放**

**确认**: `setAudioProcessors()` 确实会替换所有默认处理器，导致无声。

---

#### 尝试 3.8: 升级 Media3 到 1.5.1

**修改内容**:
将 Media3 从 1.4.1 升级到 1.5.1，希望新版本支持 `buildAudioProcessors()` 方法。

**编译结果**: ❌ **`buildAudioProcessors()` 方法不存在**

**错误日志**:
```
错误: 方法不会覆盖或实现超类型的方法
    @Override
    ^

错误: 找不到符号
    AudioProcessor[] defaultProcessors = super.buildAudioProcessors();
                                            ^
  符号: 方法 buildAudioProcessors()
```

**结论**: Media3 1.5.1 仍然不支持 `buildAudioProcessors()` 方法。

---

#### 尝试 3.9: 手动构建完整处理器链

**修改内容**:
尝试手动创建所有默认处理器（`ToFloatPcmAudioProcessor`, `ChannelMappingAudioProcessor` 等），并在中间插入我们的处理器。

**编译结果**: ❌ **内部类非公共 API**

**错误日志**:
```
错误: ToFloatPcmAudioProcessor在androidx.media3.exoplayer.audio中不是公共的; 无法从外部程序包中对其进行访问
错误: ChannelMappingAudioProcessor在androidx.media3.exoplayer.audio中不是公共的; 无法从外部程序包中对其进行访问
```

**最终结论**: ❌ **Media3 不允许外部代码手动构建处理器链**

---

### 🛑 方案 3 最终决策：放弃

**放弃原因**:
1. ❌ Media3 1.4.1 和 1.5.1 都不支持 `buildAudioProcessors()` 方法
2. ❌ `setAudioProcessors()` 会替换所有默认处理器，导致无声
3. ❌ 默认处理器类（如 `ToFloatPcmAudioProcessor`）不是公共 API，无法手动构建链
4. ❌ 投入大量时间调试，但受限于 Media3 API 设计，无法突破

**经验教训**:
- 🔍 **不要假设可以扩展闭源框架的内部机制**
- 📖 **仔细阅读官方文档关于 API 限制的说明**
- 💡 **遇到框架限制时要快速转向其他方案**
- ⚠️ **Media3 的 AudioProcessor 系统设计为“黑盒”，不鼓励外部扩展**

**推荐替代方案**:
1. ✅ **Web Audio API** - 在 JavaScript 层实现，已在 Web 端验证可行
2. ✅ **服务端 AI 处理** - 使用 Spleeter/Demucs 等模型分离音轨
3. ⚠️ **Android Equalizer** - 只能削弱人声频段，效果有限

---

### 🧹 最终清理（2026-04-19）

**清理内容**:

#### Android 原生层（Java）
- ❌ 删除文件：`VocalRemovalAudioProcessor.java`
- ✅ 清理 `ExoPlayerPlugin.java`：
  - 移除导入：5个相关类（`VocalRemovalAudioProcessor`, `DefaultRenderersFactory`, `AudioSink`, `DefaultAudioSink`, `AudioProcessor`）
  - 移除成员变量：2个（`vocalRemovalProcessor`, `vocalRemovalEnabled`）
  - 移除方法：2个（`setVocalRemoval()`, `getVocalRemovalStatus()`）
  - 移除监听器：`onAudioSessionIdChanged()`
  - 简化日志：移除 `play()` 方法中的详细调试信息
  - 恢复 ExoPlayer 初始化：使用默认构造器，不再自定义 RenderersFactory

#### Web 前端层（TypeScript/React）
- ✅ 清理 `player.tsx`：
  - 移除导入：`setVocalRemoval`, `getVocalRemovalStatus`
  - 移除状态：`vocalRemovalEnabled`, `debugInfo`
  - 移除函数：`toggleVocalRemoval()`, `addDebugLog()`
  - 移除 UI：整个按钮容器和调试面板（65行代码）
  - 移除初始化逻辑：检查去人声状态的 useEffect

#### 编译部署
- ✅ Web 构建成功
- ✅ Android 编译成功
- ✅ APK 部署成功

**当前状态**：应用已完全恢复到干净状态，无任何去人声相关代码、UI 或功能。

---

## 📝 总结

### 当前状态

🛑 **已放弃 ExoPlayer 原生方案**

- **方案 1**（自定义 AudioProcessor - Media3 1.2.0）: ❌ 编译失败，API 过于复杂
- **方案 2**（ChannelMixingAudioProcessor）: ❌ 运行时崩溃，禁止负数系数
- **方案 3**（升级 Media3 1.5.1 + 自定义 AudioProcessor）: ❌ **彻底失败** - `setAudioProcessors()` 替换默认处理器导致无声，且无法通过其他方式注入处理器

### 🔑 关键技术发现

#### 1. Media3 AudioProcessor API 版本差异

| Media3 版本 | `buildAudioProcessors()` | `setAudioProcessors()` | 结论 |
|------------|------------------------|----------------------|------|
| 1.2.0 | ❌ 不存在 | ✅ 存在但替换所有处理器 | 无法使用 |
| 1.4.1 | ❌ 不存在 | ✅ 存在但替换所有处理器 | 无法使用 |
| 1.5.1 | ❌ 不存在 | ✅ 存在但替换所有处理器 | 无法使用 |
| 1.10.0+ | ✅ 存在（官方示例） | ✅ 存在 | 未测试 |

**关键发现**：Media3 1.x 系列（至少到 1.5.1）**不支持** `buildAudioProcessors()` 方法，这是官方文档中提到的扩展方式，但在实际版本中不可用。

#### 2. `setAudioProcessors()` 的副作用

**问题**：调用 `setAudioProcessors([customProcessor])` 会**完全替换**默认的处理器链，包括：
- `ToFloatPcmAudioProcessor` - PCM 格式转换
- `ChannelMappingAudioProcessor` - 声道映射
- `SilenceSkippingAudioProcessor` - 静音跳过
- `SonicAudioProcessor` - 变速变调

**后果**：缺少这些必要的处理器会导致音频数据无法正常解码和播放，表现为**无声**或**样本全为 0**。

#### 3. 内部类非公共 API

**问题**：Media3 的默认处理器类（如 `ToFloatPcmAudioProcessor`、`ChannelMappingAudioProcessor`）被标记为**包私有**（package-private），无法从外部代码访问。

**错误信息**：
```
错误: ToFloatPcmAudioProcessor在androidx.media3.exoplayer.audio中不是公共的; 
无法从外部程序包中对其进行访问
```

**后果**：无法手动构建完整的默认处理器链，也就无法在中间插入自定义处理器。

#### 4. ChannelMixingMatrix 的设计限制

**问题**：`ChannelMixingMatrix` 明确禁止负数系数，通过 `checkCoefficientsValid()` 方法进行验证。

**源码**：
```java
private static float[] checkCoefficientsValid(float[] coefficients) {
    for (int i = 0; i < coefficients.length; i++) {
        if (coefficients[i] < 0f) {
            throw new IllegalArgumentException(
                "Coefficient at index " + i + " is negative."
            );
        }
    }
    return coefficients;
}
```

**设计意图**：该类仅用于**声道映射和音量调整**，不支持**信号反相**（负增益）操作。相位抵消算法需要负数系数，因此无法使用此类实现。

### 核心障碍

1. **Media3 API 限制**: 1.4.1 和 1.5.1 都不支持 `buildAudioProcessors()` 方法
2. **`setAudioProcessors()` 副作用**: 会替换所有默认处理器，导致无声
3. **内部类非公共**: 默认处理器类（如 `ToFloatPcmAudioProcessor`）不是公共 API，无法手动构建链
4. **框架设计限制**: Media3 的 AudioProcessor 系统设计为“黑盒”，不鼓励外部扩展

### 最终建议

1. ✅ **短期方案**: 使用 Web Audio API（Web/PWA 版本），已在浏览器环境验证可行
2. ✅ **长期方案**: 服务端 AI 处理（Spleeter/Demucs），效果最好但需要后端支持
3. ⚠️ **降级方案**: Android Equalizer 调节人声频段（300Hz-3kHz），只能削弱无法去除

---

## 💡 经验教训总结

### 1. 框架扩展性评估

**教训**：在开始实现前，应该先评估框架的扩展性。

**正确做法**：
1. 查阅官方文档关于扩展机制的说明
2. 检查是否有公开的 API 可以注入自定义逻辑
3. 查看源码确认内部类是否可访问
4. 搜索社区是否有成功案例

**本次失误**：
- ❌ 直接开始实现，未先确认 Media3 是否支持自定义 AudioProcessor
- ❌ 花费大量时间调试后才发现问题根源是框架限制

### 2. 版本兼容性验证

**教训**：官方文档可能针对最新版本，与项目使用的版本不匹配。

**正确做法**：
1. 确认官方示例使用的版本
2. 检查当前版本是否有相同的 API
3. 如果版本差异大，考虑升级或寻找替代方案

**本次发现**：
- 官方文档提到 `buildAudioProcessors()` 方法
- 但 Media3 1.2.0、1.4.1、1.5.1 都不支持此方法
- 可能需要升级到 1.10.0+ 才能使用

### 3. 快速失败原则

**教训**：遇到框架限制时应该快速转向，而不是持续调试。

**正确做法**：
1. 设定调试时间上限（如 2-3 小时）
2. 如果超过时间仍未解决，重新评估方案可行性
3. 考虑替代方案，不要在一个死胡同里浪费时间

**本次表现**：
- ✅ 方案 1 和 2 快速失败，及时转向
- ⚠️ 方案 3 调试时间过长（尝试 3.0-3.9），应该更早放弃

### 4. 文档记录的重要性

**教训**：详细的测试记录可以帮助后续决策和知识传承。

**本次优点**：
- ✅ 记录了每个尝试的步骤、结果和原因
- ✅ 保存了关键错误日志和代码片段
- ✅ 总结了技术发现和替代方案

**价值**：
- 避免重复踩坑
- 为团队提供决策依据
- 作为技术债务的记录

---

**最后更新**: 2026-04-19  
**测试结论**: 🛑 **已放弃 ExoPlayer 原生方案** - Media3 API 限制无法实现自定义音频处理器  
**优先级**: 🟢 低 - 改用 Web Audio API 或服务端 AI 处理方案
