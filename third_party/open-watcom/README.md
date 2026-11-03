# Open Watcom C/C++ 工具链

此目录提供项目在 Windows x64 上运行自定义 C/C++ 数组函数所需的文件。项目直接使用这两份经过验证的编译器及对应的 Open Watcom 链接器、头文件和 32 位 Windows 运行库。

| 文件 | 来源 |
| --- | --- |
| `builder/build/binbuild/bwcc386.exe` | 团队本机使用 Open Watcom v2 源码自举构建的 C 编译器 |
| `owcpp/out/wpp386.exe` | 团队本机自举构建的 C++ 编译器，保留原 `bwpp386.exe` 的字节 |
| `owcpp/boot/binnt64/`、`owcpp/boot/h/`、`owcpp/boot/lib386/nt/` | 从本机已验证的 Open Watcom v2 官方 Windows 引导工具链中选取。链接器横幅为 2026-10-24 的 64 位构建 |

Open Watcom 的源码按 Sybase Open Watcom Public License 1.0 提供。使用、复制、修改或分发表示接受该许可证。请先阅读[随附许可证](owcpp/boot/license.txt)，不同意全部条款时请勿使用。源码获取见[上游源码](https://github.com/open-watcom/open-watcom-v2)和[对照的 2026-10-23 源码快照](https://github.com/open-watcom/open-watcom-v2/tree/009dc1f2e5044ace6e8f3876c8bbf86429be6183)。本机用于构建的源码及上游构建规则与该快照比对，8,569 个匹配文件在统一换行后内容一致。另有本机环境和构建包装脚本，相关步骤见下文。

## 构建记录

本机以官方 Windows x64 预编译包为引导工具链。构建时将 `OWROOT` 指向源码根目录，将 `WATCOM` 指向引导工具链，`OWTOOLS` 设为 `WATCOM`，`OWOBJDIR` 设为 `binbuild`。将引导工具链的 `binnt64`、`binnt` 加入 PATH，并使用其 `h`、`h/nt` 和 `lib386`、`lib386/nt` 作为头文件及库目录。调用源码中的 `cmnvars.bat`，在 `bld/wmake/binbuild` 运行 `wmake -m -f ..\wmake`，再到 `bld/builder/binbuild` 运行构建出的 `wmake -f ..\preboot`。最后在 `bld` 下运行 `builder boot`，得到 `build/binbuild/bwcc386.exe` 和 `build/binbuild/bwpp386.exe`。后者复制为应用使用的 `owcpp/out/wpp386.exe`。上游通用构建说明见 [Open Watcom Build](https://github.com/open-watcom/open-watcom-v2/wiki/Build)。

## 验证

在项目根目录运行 `node --test tests/custom-code.test.mjs`。Windows x64 上的两种语言测试会实际编译、链接、执行并检查回放步骤。
