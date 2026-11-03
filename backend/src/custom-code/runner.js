import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { compileSource } from './compile-source.js';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../../../third_party/open-watcom/', import.meta.url));
const boot = join(root, 'owcpp', 'boot');
const bin = join(boot, 'binnt64');
const compilers = {
  c: join(root, 'builder', 'build', 'binbuild', 'bwcc386.exe'),
  cpp: join(root, 'owcpp', 'out', 'wpp386.exe'),
};
const linker = join(bin, 'wcl386.exe');
const localHost = /^(?:127\.0\.0\.1|localhost)(?::\d{1,5})?$/i;
let running = false;

export class CodeRunError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function acceptsLocalCode(request) {
  const host = request.headers.host ?? '';
  const origin = request.headers.origin;
  return request.socket.localAddress === '127.0.0.1' &&
    request.socket.remoteAddress === '127.0.0.1' && localHost.test(host) &&
    (!origin || origin === 'http://' + host.toLowerCase());
}

export async function compilerAvailable(language) {
  if (process.platform !== 'win32' || process.arch !== 'x64') return false;
  const paths = language ? [compilers[language], linker] : [...Object.values(compilers), linker];
  try {
    await Promise.all(paths.map(path => access(path, constants.R_OK)));
    return true;
  } catch {
    return false;
  }
}

function nativeSource(program, array) {
  const values = array.map(value => value === -2147483648 ? '(-2147483647 - 1)' : String(value));
  return `#include <stdio.h>
#include <stdlib.h>
#include <limits.h>
static int data[] = {${values.join(', ') || '0'}};
static const int length = ${array.length};
static int line_no = ${program.firstLine}, operations = 0, frames = 0;
static void fail(int kind) { printf("E|%d|%d\\n", kind, line_no); exit(2); }
static void tick(int line) { line_no = line; if (++operations > 10000) fail(1); }
static void emit(char kind, int line, int index, int value) {
  if (++frames > 1200) fail(1);
  printf("%c|%d|%d|%d\\n", kind, line, index, value);
}
static int get(int index) {
  if (index < 0 || index >= length) fail(2);
  return data[index];
}
static void put(int index, int value, int line) {
  if (index < 0 || index >= length) fail(2);
  data[index] = value;
  emit('W', line, index, value);
}
static int observe(int value, int line) { emit('C', line, -1, value != 0); return value; }
static int bound(long long value) { if (value < INT_MIN || value > INT_MAX) fail(3); return (int)value; }
static int add(int a, int b) { return bound((long long)a + b); }
static int sub(int a, int b) { return bound((long long)a - b); }
static int mul(int a, int b) { return bound((long long)a * b); }
static int divide(int a, int b) { if (!b) fail(4); return bound((long long)a / b); }
static int remainder(int a, int b) { if (!b) fail(4); return bound((long long)a % b); }
static void user_sort(int n) ${program.body}
int main(void) { user_sort(length); return 0; }
`;
}

function traceError(error) {
  const match = /(?:^|\n)E\|(\d+)\|(\d+)/.exec(error.stdout ?? '');
  if (!match) return new CodeRunError(422, 'CODE_RUNTIME_ERROR', error.killed ? '运行超时。' : '程序无法正常运行。');
  const messages = { 1: '超过执行步数限制，请检查循环条件。', 2: '数组下标越界。', 3: '运算结果超出 32 位整数范围。', 4: '除数不能为零。' };
  return new CodeRunError(422, 'CODE_RUNTIME_ERROR', `第 ${match[2]} 行：${messages[match[1]] ?? '运行失败。'}`);
}

function makeTrace(stdout, array, program, language) {
  const state = [...array];
  const sourceVersion = `local-watcom-${language}-v1`;
  const sourceLines = program.lines.map((text, index) => ({ lineId: String(index + 1), text }));
  const steps = [];
  let writes = 0;
  function record(event, line, index, description) {
    steps.push({
      schemaVersion: '1.0', algorithm: 'custom-array', sourceVersion, event, lineId: String(line),
      stepIndex: steps.length, array: [...state], variables: { line, index, writes }, description,
      done: event === 'finished', result: event === 'finished' ? [...state] : null,
    });
  }
  record('init', program.firstLine, null, '开始运行你的代码。');
  for (const entry of stdout.trim().split(/\r?\n/).filter(Boolean)) {
    const [kind, rawLine, rawIndex, rawValue] = entry.split('|');
    const line = Number(rawLine), index = Number(rawIndex), value = Number(rawValue);
    if (kind === 'W') {
      const old = state[index];
      state[index] = value;
      writes++;
      record('write', line, index, `第 ${line} 行写入 A[${index}]：${old} → ${value}。`);
    } else {
      record('condition', line, null, `第 ${line} 行的条件结果为${value ? '真' : '假'}。`);
    }
  }
  record('finished', program.lastLine, null, '程序运行结束，显示实际得到的数组。');
  return { algorithm: 'custom-array', sourceVersion, sourceLines, steps, result: state };
}

export async function runCustomCode(input) {
  const { language, source, array } = input ?? {};
  if (typeof language !== 'string' || !Object.hasOwn(compilers, language) || typeof source !== 'string' || !source.trim() || source.length > 5000 ||
      !Array.isArray(array) || array.length > 24 || !array.every(value => Number.isInteger(value) && value >= -2147483648 && value <= 2147483647)) {
    throw new CodeRunError(400, 'INVALID_INPUT', '请输入 C 或 C++ 代码，以及最多 24 个 32 位整数。代码上限为 5000 字符。');
  }
  let program;
  try {
    program = compileSource(source);
  } catch (error) {
    throw new CodeRunError(422, 'UNSUPPORTED_CODE', error.message);
  }
  if (!(await compilerAvailable(language))) {
    throw new CodeRunError(503, 'COMPILER_UNAVAILABLE', '未找到本机 Windows Open Watcom 工具链。');
  }
  if (running) throw new CodeRunError(429, 'COMPILER_BUSY', '本机编译器正在运行，请稍后再试。');
  running = true;
  const tempRoot = resolve(tmpdir());
  let cwd;
  try {
    cwd = await mkdtemp(join(tempRoot, 'algorithm-run-'));
    const systemRoot = process.env.SystemRoot || 'C:\\Windows';
    const baseEnv = { SystemRoot: systemRoot, WINDIR: systemRoot, TEMP: cwd, TMP: cwd };
    const compilerEnv = {
      ...baseEnv, WATCOM: boot,
      PATH: [bin, join(boot, 'binnt'), join(systemRoot, 'System32')].join(delimiter),
      INCLUDE: [join(boot, 'h'), join(boot, 'h', 'nt')].join(delimiter),
      LIB: [join(boot, 'lib386'), join(boot, 'lib386', 'nt')].join(delimiter),
    };
    compilerEnv.LIBPATH = compilerEnv.LIB;
    const options = { cwd, windowsHide: true, timeout: 6000, maxBuffer: 128 * 1024 };
    const filename = 'program.' + language;
    await writeFile(join(cwd, filename), nativeSource(program, array), 'ascii');
    try {
      const flags = language === 'cpp' ? ['-xs'] : ['-za99'];
      await exec(compilers[language], [...flags, '-bt=nt', '-q', '-fo=program.obj', filename], { ...options, env: compilerEnv });
      await exec(linker, ['-l=nt', '-q', '-fe=program.exe', 'program.obj'], { ...options, env: compilerEnv });
    } catch (error) {
      const diagnostics = (error.stdout || error.stderr || '').trim().split(/\r?\n/).filter(row => /Error|Fatal/i.test(row)).slice(0, 2).join(' ');
      throw new CodeRunError(422, 'COMPILE_ERROR', `编译或链接失败。${diagnostics ? ' ' + diagnostics : ''}`);
    }
    try {
      const { stdout } = await exec(join(cwd, 'program.exe'), [], { ...options, env: baseEnv, timeout: 3000 });
      return makeTrace(stdout, array, program, language);
    } catch (error) {
      throw traceError(error);
    }
  } finally {
    try {
      if (cwd && resolve(cwd).startsWith(tempRoot + sep + 'algorithm-run-')) {
        await rm(cwd, { recursive: true, force: true, maxRetries: 2 });
      }
    } finally {
      running = false;
    }
  }
}
