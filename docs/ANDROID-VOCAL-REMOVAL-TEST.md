# ExoPlayer 相位抵消法去人声功能 - 测试与问题排查文档

## 📋 文档信息

- **项目名称**: LRC Player
- **功能模块**: ExoPlayer 相位抵消法去人声
- **测试日期**: 2026-04-18 ~ 2026-05-02
- **Android 版本**: Media3 (ExoPlayer) 1.5.1 → 计划升级到 1.10.0+
- **状态**: 🔄 **重新尝试** - 准备升级到 Media3 1.10.0+ 使用 buildAudioProcessors() 方法

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
| **方案 4: FFmpegKit / FFmpeg-Android** | 2026-05-02 | ❌ **依赖问题** | FFmpegKit 项目已归档，Maven Central 移除；FFmpeg-Android 异步执行不适合实时处理，需预处理文件 |
| **方案 9: 升级 Media3 1.10.0+ + buildAudioProcessors()** | 2026-05-02 | ❌ **API 不兼容** | Media3 1.10.0 API 发生重大变化，BaseAudioProcessor 被移除，无法实现 |
| **方案 10: Android Equalizer EQ 调节** | 2026-05-02 | ❌ **效果糟糕** | 使用 Android 原生 Equalizer API，尝试多种参数设置（V-curve、精准打击），但人声依然存在，伴奏也被破坏。已移除代码实现，仅保留 UI。 |

### ⏸️ 未尝试的方案

| 方案 | 说明 | 可行性评估 |
|------|------|-----------|

| **方案： Equalizer EQ 调节** | 使用 Android 原生 Equalizer 降低人声频段（300Hz-3kHz） | ⚠️ 只能削弱人声，无法完全去除，效果较差 |
| **方案： 服务端 AI 处理** | 使用 Spleeter/Demucs 等 AI 模型在服务端分离音轨 | ✅ 效果最好，但需要后端支持和网络传输 |

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

### 方案 4: FFmpegKit / FFmpeg-Android

#### 尝试 4.0: FFmpegKit 依赖问题

**背景**:
经过前三个方案的失败，决定尝试使用 FFmpeg 进行音频处理。FFmpeg 是业界标准的音频/视频处理工具，支持相位抵消算法。

**实施步骤**:

**步骤 1: 尝试 FFmpegKit (arthenica)**
修改 `android/app/build.gradle`:
```gradle
implementation 'com.arthenica:ffmpeg-kit-full-gpl:6.0-2'
```

修改 `android/build.gradle`:
```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://github.com/arthenica/ffmpeg-kit/releases/download/v6.0' }
    }
}
```

**编译结果**: ❌ **依赖无法下载**

**错误日志**:
```
Could not find com.arthenica:ffmpeg-kit-full-gpl:6.0-2.
Searched in the following locations:
- https://dl.google.com/dl/android/maven2/com/arthenica/ffmpeg-kit-full-gpl/6.0-2/...
- https://repo.maven.apache.org/maven2/com/arthenica/ffmpeg-kit-full-gpl/6.0-2/...
- https://github.com/arthenica/ffmpeg-kit/releases/download/v6.0/com/arthenica/ffmpeg-kit-full-gpl/6.0-2/...
```

**根本原因**:
根据网络搜索，FFmpegKit 项目已于 **2025年4月21日被归档**（archived），Maven Central 可能已经移除了该依赖。

---

#### 尝试 4.1: 切换到 FFmpeg-Android (JitPack)

**修改内容**:
改用 FFmpeg-Android 库（基于 JitPack）：

`android/app/build.gradle`:
```gradle
implementation 'com.github.yangfeng1994:FFmpeg-Android:v1.0.1'
```

`android/build.gradle`:
```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}
```

**编译结果**: ✅ **依赖可以下载**

**创建 VocalRemovalProcessor.java**:
```java
public class VocalRemovalProcessor {
    private FFmpeg ffmpeg;
    
    public void processAudioAsync(String inputPath, ProcessCallback callback) {
        String[] command = {
            "-i", inputPath,
            "-af", "pan=mono|c0=c0-c1,volume=2.0",  // 相位抵消 + 音量补偿
            "-y",
            outputPath
        };
        
        ffmpeg.execute(command, new ExecuteBinaryResponseHandler() {
            @Override
            public void onSuccess(String message) {
                callback.onComplete(outputPath);
            }
            
            @Override
            public void onFailure(String message) {
                callback.onError(message);
            }
        });
    }
}
```

**技术分析**:

✅ **优点**:
1. 依赖可以正常下载和编译
2. FFmpeg 功能强大，支持相位抵消算法
3. 异步执行，不会阻塞 UI 线程

❌ **缺点**:
1. **异步执行不适合实时处理** - ExoPlayer 需要立即播放，但 FFmpeg 处理需要等待
2. **需要预处理整个文件** - 用户点击“去人声”后需要等待 5-30 秒处理完成
3. **产生临时文件** - 每次处理都会生成 `_vocal_removed.mp3` 等文件，占用存储空间
4. **用户体验差** - 需要显示“处理中...”加载动画，切换歌曲时需要重新处理

**关键问题**:
```
ExoPlayer 播放流程:
1. 用户点击播放 → ExoPlayer 立即开始解码
2. 音频数据流式传输到 AudioTrack
3. 实时播放

FFmpeg 处理流程:
1. 用户点击“去人声” → 启动 FFmpeg 命令
2. 读取整个输入文件 → 执行相位抵消算法
3. 写入输出文件（耗时 5-30 秒）
4. 通知应用处理完成
5. ExoPlayer 才能播放处理后的文件
```

**结论**: ❌ **FFmpeg-Android 不适合实时去人声场景**

**适用场景**:
- ✅ 离线音频处理（如批量转换格式）
- ✅ 后台任务（不要求即时反馈）
- ❌ **实时音频效果**（如去人声、均衡器）

---

### 🛑 方案 8 最终决策：放弃

**放弃原因**:
1. ❌ **Media3 AudioSink API 过于复杂且不稳定**
   - 不同版本之间方法签名差异巨大（1.5.1 vs 1.10.0）
   - `handleBuffer()`、`configure()`、`reset()` 等方法在不同版本中变化
   - 即使升级到最新版本也无法保证兼容性

2. ❌ **AudioSink 是内部 API**
   - Media3 的 AudioSink 接口设计为框架内部使用
   - Google 不鼓励外部扩展此接口
   - 需要深入研究每个版本的源码才能正确实现

3. ❌ **维护成本过高**
   - 每次 Media3 升级都可能需要重写 AudioSink 实现
   - 编译错误频繁，调试困难
   - 投入产出比不合理

**尝试的版本**:
- Media3 1.5.1 - ❌ API 不兼容
- Media3 1.10.0 - ❌ API 仍然不兼容

**核心问题**:
```
Media3 AudioSink 接口方法签名在不同版本中变化：
- configure() 参数从 (int, int, int, int[], List) 变为 (Format, int, int[])
- handleBuffer() 方法签名可能不同
- reset()、stop()、getLatencyUs() 等方法存在性不确定
- disableTunneling() 等方法缺失
```

**经验教训**:
- 🔍 **不要扩展框架内部 API** - AudioSink 设计为黑盒，不鼓励外部扩展
- 📖 **优先使用公开稳定的 API** - AudioProcessor 是更好的选择（但之前已验证无法实现相位抵消）
- 💡 **快速转向成熟方案** - Web Audio API 已验证可行
- ⚠️ **评估长期维护成本** - 内部 API 变化频繁，升级风险大

**推荐替代方案**:
1. ✅ **Web Audio API** - 在 JavaScript 层实现（Web/PWA 版本），已在浏览器环境验证可行
2. ✅ **服务端 AI 处理** - 使用 Spleeter/Demucs 等模型分离音轨，效果最好但需要后端支持
3. ⚠️ **Android Equalizer** - 只能削弱人声频段（300Hz-3kHz），效果有限

---

### 方案 8: Java 层实时 PCM 处理（已尝试，失败）

**核心思路**:
不依赖 Media3 的 AudioProcessor 系统，而是通过自定义 AudioSink 拦截 ExoPlayer 输出的 PCM 音频数据，执行相位抵消算法。

**实现方式**:
1. ✅ 创建 `RealtimeVocalRemovalProcessor.java` - PCM 相位抵消处理器
2. ✅ 创建 `CustomAudioSink.java` - 包装 DefaultAudioSink，在 `handleBuffer()` 中拦截数据
3. ✅ 通过 `DefaultRenderersFactory.buildAudioSink()` 注入自定义 AudioSink
4. ✅ 升级 Media3 从 1.5.1 到 1.10.0

**测试结果**: ❌ **编译失败**

**失败原因**:
- Media3 AudioSink 接口在不同版本之间方法签名差异巨大
- 即使升级到 1.10.0，API 仍然不兼容
- AudioSink 是内部 API，Google 不鼓励外部扩展

**详细分析**: 见下方「🛑 方案 8 最终决策：放弃」章节

---

**最后更新**: 2026-05-02  
**测试结论**: 🛑 **已放弃 ExoPlayer AudioSink 方案** - Media3 API 过于复杂且不稳定，即使升级到 1.10.0 仍无法正确集成  
**优先级**: 🔴 高 - 建议改用 Web Audio API（Web/PWA）或服务端 AI 处理方案

---

### 方案 9: 升级 Media3 1.10.0+ + buildAudioProcessors() （当前方案）

#### 尝试 9.0: 升级到 Media3 1.10.0

**背景**:
经过前面的多次失败，发现关键问题是 Media3 1.2.0-1.5.1 不支持 `buildAudioProcessors()` 方法。根据官方文档和社区反馈，Media3 1.10.0+ 已经支持此方法，可以正确地将自定义处理器追加到默认处理器链中。

**核心优势**:
1. ✅ `buildAudioProcessors()` 方法允许在默认处理器链中插入自定义处理器
2. ✅ 不会替换默认的解码/格式转换处理器
3. ✅ 实时处理，无延迟
4. ✅ 官方推荐的扩展方式

**实施步骤**:

**步骤 1: 升级 Media3 版本**
修改 `android/app/build.gradle`:
```gradle
def media3_version = "1.10.0"  // 从 1.5.1 升级到 1.10.0

implementation "androidx.media3:media3-exoplayer:$media3_version"
implementation "androidx.media3:media3-ui:$media3_version"
implementation "androidx.media3:media3-session:$media3_version"
```

**步骤 2: 创建 VocalRemovalAudioProcessor**
继承 `BaseAudioProcessor`，实现相位抵消算法：

```java
package com.lrcplayer.app.plugins;

import androidx.annotation.Nullable;
import androidx.media3.common.C;
import androidx.media3.common.audio.AudioProcessor;
import androidx.media3.exoplayer.audio.BaseAudioProcessor;

import java.nio.ByteBuffer;
import java.nio.ShortBuffer;

/**
 * 基于相位抵消法的去人声音频处理器
 * 算法: Mono = (Left - Right) / 2
 */
public class VocalRemovalAudioProcessor extends BaseAudioProcessor {
    
    private static final String TAG = "VocalRemovalAP";
    private boolean isActive = false;
    
    /**
     * 激活/停用去人声功能
     */
    public void setActive(boolean active) {
        this.isActive = active;
        android.util.Log.d(TAG, "🎤 Vocal removal " + (active ? "enabled" : "disabled"));
    }
    
    /**
     * 获取当前状态
     */
    public boolean isActive() {
        return isActive;
    }
    
    @Override
    public void onConfigure(AudioProcessor.AudioFormat inputFormat) 
            throws UnhandledAudioFormatException {
        
        // 验证输入格式
        if (inputFormat.encoding != C.ENCODING_PCM_16BIT) {
            throw new UnhandledAudioFormatException(inputFormat);
        }
        
        if (inputFormat.channelCount != 2) {
            throw new UnhandledAudioFormatException(inputFormat);
        }
        
        android.util.Log.d(TAG, "✅ Configured: " + inputFormat.sampleRate + "Hz, " + 
                          inputFormat.channelCount + " channels, active=" + isActive);
    }
    
    @Override
    public void queueInput(ByteBuffer inputBuffer) {
        if (!isActive) {
            // 未激活时，直接透传原始数据
            ByteBuffer outputBuffer = replaceOutputBuffer(inputBuffer.remaining());
            outputBuffer.put(inputBuffer);
            return;
        }
        
        // 执行相位抵消算法
        int position = inputBuffer.position();
        int limit = inputBuffer.limit();
        int frameCount = (limit - position) / 4;  // 每个样本 2 字节，立体声 2 声道
        
        ShortBuffer inputShortBuffer = inputBuffer.asShortBuffer();
        ByteBuffer outputBuffer = replaceOutputBuffer(inputBuffer.remaining());
        ShortBuffer outputShortBuffer = outputBuffer.asShortBuffer();
        
        for (int i = 0; i < frameCount; i++) {
            short left = inputShortBuffer.get(i * 2);      // 左声道
            short right = inputShortBuffer.get(i * 2 + 1); // 右声道
            
            // 相位抵消: (L - R) / 2
            short mono = (short) ((left - right) / 2);
            
            // 输出到左右声道（单声道转立体声）
            outputShortBuffer.put(i * 2, mono);
            outputShortBuffer.put(i * 2 + 1, mono);
        }
        
        inputBuffer.position(limit);
        outputBuffer.position(outputBuffer.limit());
    }
}
```

**步骤 3: 修改 ExoPlayerPlugin**
通过自定义 `DefaultRenderersFactory` 注入处理器：

```java
// 在 initializeExoPlayer() 方法中
builder.setRenderersFactory(new DefaultRenderersFactory(context) {
    @Override
    protected AudioProcessor[] buildAudioProcessors() {
        // 获取默认处理器链
        AudioProcessor[] defaultProcessors = super.buildAudioProcessors();
        
        // 创建并配置去人声处理器
        vocalRemovalProcessor = new VocalRemovalAudioProcessor();
        vocalRemovalProcessor.setActive(false);  // 默认禁用
        
        // 将自定义处理器添加到链的末尾
        AudioProcessor[] processorsWithVocalRemoval = new AudioProcessor[defaultProcessors.length + 1];
        System.arraycopy(defaultProcessors, 0, processorsWithVocalRemoval, 0, defaultProcessors.length);
        processorsWithVocalRemoval[defaultProcessors.length] = vocalRemovalProcessor;
        
        Log.d(TAG, "✅ Added VocalRemovalAudioProcessor to chain, total: " + processorsWithVocalRemoval.length);
        return processorsWithVocalRemoval;
    }
});
```

**步骤 4: 实现 setVocalRemoval() 方法**

```java
@PluginMethod
public void setVocalRemoval(PluginCall call) {
    getActivity().runOnUiThread(() -> {
        try {
            Boolean enabled = call.getBoolean("enabled", false);
            
            if (vocalRemovalProcessor != null) {
                vocalRemovalProcessor.setActive(enabled);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("enabled", enabled);
                result.put("message", "Vocal removal " + (enabled ? "enabled" : "disabled"));
                call.resolve(result);
                
                Log.d(TAG, "🎤 Vocal removal set to: " + enabled);
            } else {
                call.reject("VocalRemovalProcessor not initialized");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to set vocal removal", e);
            call.reject("Failed: " + e.getMessage());
        }
    });
}
```

**编译结果**: ❌ **失败 - API 不兼容**

**错误分析**:
Media3 1.10.0 的 API 发生了重大变化：
1. ❌ `BaseAudioProcessor` 类已被移除
2. ❌ `buildAudioProcessors()` 方法在 `DefaultRenderersFactory` 中不存在
3. ❌ `UnhandledAudioFormatException` 类位置改变
4. ❌ `replaceOutputBuffer()` 方法不可用

**根本原因**:
Media3 1.10.0 重构了 AudioProcessor 系统，官方文档和示例代码与实际版本不匹配。

**结论**: ❌ **Media3 1.10.0 无法实现自定义 AudioProcessor**

**经验教训**:
- 🔍 **不要盲目相信官方文档的版本号** - 需要实际验证
- 📖 **Media3 API 仍在快速演进中** - 不同版本之间差异巨大
- 💡 **遇到框架限制时要果断转向** - 不要在死胡同里浪费时间

**预期结果**:
- ✅ 编译成功
- ✅ APK 部署成功
- ✅ 应用启动正常
- ✅ 播放音乐正常（去人声默认禁用）
- ✅ 点击按钮后实时启用/禁用去人声功能
- ✅ 启用后人声明显减弱或消失

**下一步**:
1. 升级 Media3 版本
2. 创建 VocalRemovalAudioProcessor.java
3. 修改 ExoPlayerPlugin.java
4. 编译并部署测试
5. 验证去人声效果

---

### 方案 10: Android Equalizer EQ 调节（当前方案）

#### 尝试 10.0: 实现基于均衡器的去人声功能

**背景**:
经过多次尝试自定义 AudioProcessor 失败后，决定采用更简单可靠的方案：使用 Android 原生的 `Equalizer` API 来削弱人声。

**核心原理**:
- 人声主要集中在 **300Hz - 3kHz** 频段
- 通过降低这些频段的增益（-15dB）来削弱人声
- 同时提升低频（+3dB）和高频（+2dB）以保持音质平衡
- 虽然无法完全去除人声，但可以明显削弱

**优势**:
1. ✅ 使用 Android 原生 API，稳定可靠
2. ✅ 实时处理，无延迟
3. ✅ 不需要修改 Media3 版本
4. ✅ 实现简单，维护成本低

**劣势**:
1. ⚠️ 只能削弱人声，无法完全去除
2. ⚠️ 可能影响其他乐器音色
3. ⚠️ 效果取决于音频内容和混音方式

**实施步骤**:

**步骤 1: 创建 VocalRemovalEqualizer.java**

```java
package com.lrcplayer.app.plugins;

import android.media.audiofx.Equalizer;
import android.util.Log;

public class VocalRemovalEqualizer {
    private static final String TAG = "VocalRemovalEQ";
    private Equalizer equalizer;
    private boolean isActive = false;
    
    public void initialize(int audioSessionId) {
        try {
            equalizer = new Equalizer(0, audioSessionId);
            equalizer.setEnabled(true);
            setActive(false);  // 默认禁用
            Log.d(TAG, "✅ Equalizer initialized");
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to initialize", e);
        }
    }
    
    public void setActive(boolean active) {
        this.isActive = active;
        if (equalizer == null) return;
        
        if (active) {
            applyVocalRemovalPreset();  // 应用去人声预设
        } else {
            applyFlatPreset();  // 恢复平坦响应
        }
    }
    
    private void applyVocalRemovalPreset() {
        short bands = equalizer.getNumberOfBands();
        
        for (short i = 0; i < bands; i++) {
            int[] freqRange = equalizer.getBandFreqRange(i);
            int centerFreq = (freqRange[0] + freqRange[1]) / 2 / 1000;  // Hz
            
            short gain;
            if (centerFreq >= 300 && centerFreq <= 3000) {
                gain = (short) -1500;  // 人声频段：-15dB
            } else if (centerFreq < 300) {
                gain = (short) 300;    // 低频：+3dB
            } else {
                gain = (short) 200;    // 高频：+2dB
            }
            
            equalizer.setBandLevel(i, gain);
        }
    }
    
    private void applyFlatPreset() {
        short bands = equalizer.getNumberOfBands();
        for (short i = 0; i < bands; i++) {
            equalizer.setBandLevel(i, (short) 0);  // 0dB
        }
    }
    
    public void release() {
        if (equalizer != null) {
            equalizer.release();
            equalizer = null;
        }
    }
}
```

**步骤 2: 修改 ExoPlayerPlugin.java**

1. 添加成员变量：
```java
private VocalRemovalEqualizer vocalRemovalEqualizer;
```

2. 在播放器监听器中添加音频会话变化监听：
```java
@Override
public void onAudioSessionIdChanged(int audioSessionId) {
    if (vocalRemovalEqualizer == null) {
        vocalRemovalEqualizer = new VocalRemovalEqualizer();
    }
    vocalRemovalEqualizer.initialize(audioSessionId);
}
```

3. 添加 setVocalRemoval() 和 getVocalRemovalStatus() 方法

4. 在 onDestroy() 中释放资源：
```java
if (vocalRemovalEqualizer != null) {
    vocalRemovalEqualizer.release();
}
```

**编译结果**: ✅ **BUILD SUCCESSFUL in 1m 25s**

**部署结果**: ✅ **APK 安装成功，应用启动正常**

**测试结果**: ⏳ **待用户验证**

**预期效果**:
- ✅ 播放音乐时点击“🎤 原唱模式 OFF”按钮
- ✅ 人声音量明显降低（约 -15dB）
- ✅ 伴奏和其他乐器保持清晰
- ✅ 可以实时切换开启/关闭

**下一步**:
1. 在手机上测试实际效果
2. 根据听感调整 EQ 参数
3. 优化频段划分和增益值

---

### ❌ 方案 10 失败总结

#### 尝试历史

**尝试 10.0**: 初始实现（-15dB / +3dB / +2dB）
- 结果：人声削弱不明显

**尝试 10.1**: V-curve 激进策略（-15dB / +15dB）
- 结果：人声依然很大，且背景音乐被严重破坏
- 原因：Band 1 (120-460Hz) 包含贝斯/鼓点，Band 3 (1800-7000Hz) 包含吉他/镲片

**尝试 10.2**: 精准打击策略（-15dB / -10dB / -5dB / +10dB / +8dB）
- 结果：人声依然存在，效果糟糕
- 原因：EQ 只能调节音量，无法分离音轨；人声和伴奏在同一频段重叠

#### 根本原因分析

1. **技术限制**:
   - Android Equalizer 只能调节各频段的音量增益
   - 无法实现真正的相位抵消或音轨分离
   - 人声和伴奏在频谱上高度重叠，无法通过简单 EQ 分离

2. **设备限制**:
   - 测试设备的 Equalizer 只有 5 个频段
   - 增益范围限制在 -15dB 到 +15dB
   - 频段划分不够精细，无法精准定位人声

3. **音频特性**:
   - 人声频率范围：85Hz - 8kHz（跨越多个频段）
   - 伴奏乐器也分布在相同频段
   - 降低人声频段必然影响伴奏音质

#### 最终结论

❌ **Android Equalizer EQ 方案无法实现有效的去人声功能**

- 人声依然清晰可闻
- 伴奏音质被破坏
- 用户体验差

**决策**: 移除所有代码实现，仅保留 UI 按钮（为未来可能的 AI 方案预留接口）

---
